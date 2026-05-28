// Netlify Function: recebe webhook de depósito da MisticPay e libera Linkwans.
// Para crédito automático, configure também FIREBASE_SERVICE_ACCOUNT_JSON no Netlify.

const admin = require('firebase-admin');

function response(statusCode, data){
  return { statusCode, headers:{'Content-Type':'application/json'}, body: JSON.stringify(data) };
}

function initAdmin(){
  if (admin.apps.length) return admin.firestore();
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON não configurado no Netlify. O webhook recebeu o pagamento, mas não consegue creditar automaticamente.');
  const serviceAccount = JSON.parse(raw);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  return admin.firestore();
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return response(405, { error: 'Method not allowed' });
  try {
    const payload = JSON.parse(event.body || '{}');
    const rawStatus = String(payload.status || payload.transactionState || payload.data?.status || payload.data?.transactionState || '').toLowerCase();
    const paid = ['paid','approved','completed','complete','confirmed','aprovado','pago','completo','concluido','concluído'].includes(rawStatus);
    if (!paid) return response(200, { ok:true, ignored:'not_paid', status: rawStatus });

    const orderId = String(payload.transactionId || payload.data?.transactionId || payload.e2e || payload.data?.e2e || '').trim();
    if (!orderId) return response(400, { error:'transactionId ausente no webhook', payload });

    const db = initAdmin();
    const orderRef = db.collection('paymentRequests').doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) {
      await db.collection('paymentWebhookPending').doc(orderId).set({ payload, receivedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge:true });
      return response(200, { ok:true, savedPending:true, reason:'pedido ainda não encontrado no Firestore' });
    }

    const order = orderSnap.data() || {};
    if (order.status === 'paid' || order.credited === true) return response(200, { ok:true, duplicated:true });

    const uid = order.uid;
    const linkwans = Number(order.coins || order.linkwans || 0);
    if (!uid || !linkwans) return response(400, { error:'uid/linkwans ausente no pedido salvo', order });

    await db.runTransaction(async tx => {
      tx.set(orderRef, {
        status: 'paid',
        credited: true,
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        misticWebhook: payload
      }, { merge:true });
      tx.set(db.collection('users').doc(uid), {
        coins: admin.firestore.FieldValue.increment(linkwans),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge:true });
    });

    return response(200, { ok:true, credited: linkwans, orderId });
  } catch (e) {
    return response(500, { error:e.message });
  }
};
