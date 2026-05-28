// Netlify Function: cria cobrança PIX na MisticPay.
// Configure no Netlify: MISTIC_CLIENT_ID, MISTIC_CLIENT_SECRET, MISTIC_PIX_ENDPOINT.
// O endpoint exato vem da documentação da MisticPay. Não coloque o client secret no script.js.
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  try {
    const body = JSON.parse(event.body || '{}');
    const endpoint = process.env.MISTIC_PIX_ENDPOINT;
    const clientId = process.env.MISTIC_CLIENT_ID;
    const clientSecret = process.env.MISTIC_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Configure MISTIC_CLIENT_ID e MISTIC_CLIENT_SECRET no Netlify.' }) };
    }
    if (!endpoint) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Falta MISTIC_PIX_ENDPOINT da documentação MisticPay para criar cobrança automática.' }) };
    }
    const payload = {
      amount: Number(body.amount || 0),
      description: body.description || 'Recarga Dlinky Linkwans',
      external_id: body.orderId,
      customer: { email: body.email || '', name: body.name || '' },
      metadata: { uid: body.uid || '', linkwans: Number(body.linkwans || 0), orderId: body.orderId || '' },
      webhook_url: process.env.MISTIC_WEBHOOK_URL || `${process.env.URL || ''}/.netlify/functions/mistic-webhook`
    };
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Id': clientId,
        'Client-Secret': clientSecret,
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { statusCode: res.status, body: JSON.stringify({ error: 'Erro MisticPay', details: data }) };
    return { statusCode: 200, body: JSON.stringify({
      orderId: body.orderId,
      raw: data,
      qrCode: data.qrCode || data.qrcode || data.qr_code || data.pixQrCode || data.pix_qr_code || '',
      pixCopyPaste: data.pixCopyPaste || data.copyPaste || data.copiaECola || data.pix_code || data.emv || ''
    }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
