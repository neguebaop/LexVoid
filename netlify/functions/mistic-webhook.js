// Netlify Function: recebe confirmação da MisticPay.
// Para liberar Linkwans automaticamente no Firestore, configure FIREBASE_SERVICE_ACCOUNT_JSON.
const admin = require('firebase-admin');
function initAdmin(){
  if (admin.apps.length) return admin.firestore();
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON não configurado');
  const serviceAccount = JSON.parse(raw);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  return admin.firestore();
}
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  try {
    const payload = JSON.parse(event.body || '{}');
    const status = String(payload.status || payload.payment_status || payload.data?.status || '').toLowerCase();
    const paid = ['paid','approved','completed','confirmed','aprovado','pago'].includes(status);
    const meta = payload.metadata || payload.data?.metadata || {};
    const uid = meta.uid || payload.uid || payload.data?.uid;
    const linkwans = Number(meta.linkwans || payload.linkwans || payload.data?.linkwans || 0);
    const orderId = meta.orderId || payload.external_id || payload.orderId || payload.data?.external_id || '';
    if (!paid) return { statusCode: 200, body: JSON.stringify({ ok:true, ignored:'not_paid' }) };
    if (!uid || !linkwans) return { statusCode: 400, body: JSON.stringify({ error:'uid/linkwans ausente no metadata' }) };
    const db = initAdmin();
    const orderRef = db.collection('payments').doc(String(orderId || Date.now()));
    const already = await orderRef.get();
    if (already.exists && already.data().credited) return { statusCode: 200, body: JSON.stringify({ ok:true, duplicated:true }) };
    await db.runTransaction(async tx => {
      tx.set(orderRef, { payload, uid, linkwans, credited:true, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge:true });
      tx.set(db.collection('users').doc(uid), { coins: admin.firestore.FieldValue.increment(linkwans) }, { merge:true });
    });
    return { statusCode: 200, body: JSON.stringify({ ok:true, credited:linkwans }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error:e.message }) };
  }
};
