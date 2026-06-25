// libs/vnpay.js
import crypto from 'crypto';

const VNPAY_CONFIG = {
  tmnCode:    process.env.VNPAY_TMN_CODE    || 'DEMO1234',
  hashSecret: process.env.VNPAY_HASH_SECRET || 'SECRETKEY1234',
  url:        'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  returnUrl:  process.env.VNPAY_RETURN_URL  || 'http://localhost:3000/api/payments/vnpay-return',
};

export const createPaymentUrl = ({ bookingId, amount, orderInfo, ipAddr, locale = 'vn', returnUrl }) => {
  const date = new Date();
  const createDate = formatDate(date);
  const orderId = `BK${bookingId}-${Date.now()}`;

  const cleanIp = (ipAddr || '127.0.0.1').replace(/^::ffff:/, '');

  const cleanOrderInfo = (orderInfo || `Thanh toan don dat ve ${bookingId}`)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .replace(/ /g, '+');

  const finalReturnUrl = returnUrl || VNPAY_CONFIG.returnUrl;
  const encodedReturnUrl = encodeURIComponent(finalReturnUrl);

  const params = {
    vnp_Amount:     String(Math.round(amount * 100)),
    vnp_Command:    'pay',
    vnp_CreateDate: createDate,
    vnp_CurrCode:   'VND',
    vnp_IpAddr:     cleanIp,
    vnp_Locale:     locale,
    vnp_OrderInfo:  cleanOrderInfo,
    vnp_OrderType:  'other',
    vnp_ReturnUrl:  encodedReturnUrl,
    vnp_TmnCode:    VNPAY_CONFIG.tmnCode,
    vnp_TxnRef:     orderId,
    vnp_Version:    '2.1.0',
  };

  const sortedParams = sortObject(params);
  const signData = Object.entries(sortedParams).map(([k, v]) => `${k}=${v}`).join('&');

  const hmac = crypto.createHmac('sha512', VNPAY_CONFIG.hashSecret);
  const secureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  const paymentUrl = `${VNPAY_CONFIG.url}?${signData}&vnp_SecureHash=${secureHash}`;
  return { paymentUrl, orderId };
};

// rawQueryString: req.originalUrl.split('?')[1] — chuỗi chưa bị Express decode
export const verifyReturnUrl = (rawQueryString) => {
  // Parse thủ công để giữ nguyên + (không decode)
  const pairs = rawQueryString.split('&');
  const query = {};
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    const key = pair.substring(0, idx);
    const val = pair.substring(idx + 1);
    query[key] = val;
  }

  const secureHash = query['vnp_SecureHash'];
  delete query['vnp_SecureHash'];
  delete query['vnp_SecureHashType'];

  const sortedParams = sortObject(query);
  const signData = Object.entries(sortedParams)
    .filter(([k]) => k.startsWith('vnp_'))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  const hmac = crypto.createHmac('sha512', VNPAY_CONFIG.hashSecret);
  const checkHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  if (checkHash !== secureHash) {
    console.error('Hash mismatch — signData:', signData);
    console.error('got:     ', checkHash);
    console.error('expected:', secureHash);
    return { valid: false, message: 'Chữ ký không hợp lệ.' };
  }

  // Decode + → space cho các field cần hiển thị
  const decode = v => v.replace(/\+/g, ' ');
  const responseCode = query['vnp_ResponseCode'];
  const success = responseCode === '00';

  return {
    valid: true,
    success,
    txnRef:        decode(query['vnp_TxnRef'] || ''),
    amount:        parseInt(query['vnp_Amount']) / 100,
    responseCode,
    transactionNo: query['vnp_TransactionNo'],
    bankCode:      query['vnp_BankCode'],
    payDate:       query['vnp_PayDate'],
    message: success ? 'Thanh toán thành công' : `Thanh toán thất bại (code: ${responseCode})`,
  };
};

function sortObject(obj) {
  const sorted = {};
  Object.keys(obj).sort().forEach(key => { sorted[key] = obj[key]; });
  return sorted;
}

function formatDate(date) {
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth()+1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}
