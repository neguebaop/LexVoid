// Netlify Function: cria cobrança PIX REAL na MisticPay.
// Variáveis obrigatórias no Netlify:
// MISTIC_CLIENT_ID=ci_...
// MISTIC_CLIENT_SECRET=cs_...
// Opcional: MISTIC_DEFAULT_DOCUMENT=CPF sem pontos, MISTIC_WEBHOOK_URL=url completa do webhook

const API_URL = 'https://api.misticpay.com/api/transactions/create';

function json(statusCode, data){
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    },
    body: JSON.stringify(data)
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const body = JSON.parse(event.body || '{}');
    const clientId = process.env.MISTIC_CLIENT_ID;
    const clientSecret = process.env.MISTIC_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return json(500, { error: 'Configure MISTIC_CLIENT_ID e MISTIC_CLIENT_SECRET no Netlify e faça redeploy.' });
    }

    const amount = Number(body.amount || 0);
    if (!amount || amount < 1) return json(400, { error: 'Valor inválido para gerar PIX.' });

    const siteUrl = (process.env.URL || 'https://lexvoids.netlify.app').replace(/\/$/, '');
    const webhookUrl = process.env.MISTIC_WEBHOOK_URL || `${siteUrl}/.netlify/functions/mistic-webhook`;
    const orderId = String(body.orderId || ('DLK-' + Date.now().toString(36).toUpperCase()));

    const payerDocument = String(
      body.payerDocument ||
      body.document ||
      process.env.MISTIC_DEFAULT_DOCUMENT ||
      '12345678909'
    ).replace(/\D/g, '').slice(0, 14);

    const payload = {
      amount,
      payerName: String(body.name || body.payerName || body.email || 'Cliente Dlinky').slice(0, 80),
      payerDocument,
      transactionId: orderId,
      description: String(body.description || `Recarga Dlinky - ${body.linkwans || ''} Linkwans`).slice(0, 120),
      projectWebhook: webhookUrl
    };

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ci': clientId,
        'cs': clientSecret
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) return json(res.status, { error: 'Erro ao criar PIX na MisticPay', details: data, sent: payload });

    const d = data.data || data;
    const base64 = d.qrCodeBase64 || d.qrcodeBase64 || d.qr_code_base64 || '';
    const qrCodeImage = base64
      ? (String(base64).startsWith('data:') ? base64 : `data:image/png;base64,${base64}`)
      : '';

    return json(200, {
      ok: true,
      orderId,
      transactionId: d.transactionId || orderId,
      status: d.transactionState || d.status || 'PENDENTE',
      qrCodeImage,
      qrCodeUrl: d.qrcodeUrl || d.qrCodeUrl || d.qrcodeURL || d.qr_code_url || '',
      pixCopyPaste: d.copyPaste || d.pixCopyPaste || d.copiaECola || d.qrCodeText || '',
      raw: data
    });
  } catch (e) {
    return json(500, { error: e.message });
  }
};
