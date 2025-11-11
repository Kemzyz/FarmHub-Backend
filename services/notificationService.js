const { sendEmail } = require('./emailService');
const { sendSms } = require('./smsService');

function safe(val, fallback = '') {
  return val || fallback;
}

function formatCurrency(amount) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(amount || 0));
  } catch (e) {
    return `$${Number(amount || 0).toFixed(2)}`;
  }
}

async function maybeSendEmail(to, subject, html, text) {
  if (!to) return;
  try {
    await sendEmail({ to, subject, html, text });
  } catch (e) {
    // avoid breaking main flow
    console.error('Email send failed:', e.message);
  }
}

async function maybeSendSms(to, body) {
  if (!to) return;
  try {
    await sendSms({ to, body });
  } catch (e) {
    console.error('SMS send failed:', e.message);
  }
}

function orderSummaryLines(order) {
  const lines = order.items.map((it) => {
    const name = it.product?.name || 'Item';
    const qty = it.quantity;
    const price = formatCurrency(it.unitPrice);
    return `- ${name} x${qty} @ ${price}`;
  });
  lines.push(`Subtotal: ${formatCurrency(order.subtotal)}`);
  return lines.join('\n');
}

exports.notifyOrderCreated = async (order) => {
  const buyerEmail = order.buyer?.email;
  const farmerEmail = order.farmer?.email;
  const buyerPhone = order.buyer?.phone;
  const farmerPhone = order.farmer?.phone;

  const subject = `Order Request #${order._id}`;
  const summary = orderSummaryLines(order);
  const buyerMsg = `Your order request has been sent to the farmer.\n${summary}`;
  const farmerMsg = `You have a new order request from ${safe(order.buyer?.name, 'a buyer')}.\n${summary}`;

  await maybeSendEmail(buyerEmail, subject, `<p>${buyerMsg.replace(/\n/g, '<br/>')}</p>`, buyerMsg);
  await maybeSendEmail(farmerEmail, subject, `<p>${farmerMsg.replace(/\n/g, '<br/>')}</p>`, farmerMsg);
  await maybeSendSms(buyerPhone, buyerMsg);
  await maybeSendSms(farmerPhone, farmerMsg);
};

exports.notifyOrderAccepted = async (order) => {
  const buyerEmail = order.buyer?.email;
  const buyerPhone = order.buyer?.phone;
  const subject = `Order Accepted #${order._id}`;
  const msg = `Your order was accepted by ${safe(order.farmer?.name, 'the farmer')}.\n${orderSummaryLines(order)}`;
  await maybeSendEmail(buyerEmail, subject, `<p>${msg.replace(/\n/g, '<br/>')}</p>`, msg);
  await maybeSendSms(buyerPhone, msg);
};

exports.notifyOrderStarted = async (order) => {
  const buyerEmail = order.buyer?.email;
  const buyerPhone = order.buyer?.phone;
  const subject = `Order In Progress #${order._id}`;
  const msg = `Your order is now in progress.\n${orderSummaryLines(order)}`;
  await maybeSendEmail(buyerEmail, subject, `<p>${msg.replace(/\n/g, '<br/>')}</p>`, msg);
  await maybeSendSms(buyerPhone, msg);
};

exports.notifyOrderCancelled = async (order) => {
  const buyerEmail = order.buyer?.email;
  const buyerPhone = order.buyer?.phone;
  const farmerEmail = order.farmer?.email;
  const farmerPhone = order.farmer?.phone;
  const subject = `Order Cancelled #${order._id}`;
  const reason = safe(order.cancellationReason, 'No reason provided');
  const msg = `Order was cancelled by ${order.cancelledByRole}. Reason: ${reason}.`;
  await maybeSendEmail(buyerEmail, subject, `<p>${msg}</p>`, msg);
  await maybeSendEmail(farmerEmail, subject, `<p>${msg}</p>`, msg);
  await maybeSendSms(buyerPhone, msg);
  await maybeSendSms(farmerPhone, msg);
};

exports.notifyOrderCompleted = async (order) => {
  const buyerEmail = order.buyer?.email;
  const farmerEmail = order.farmer?.email;
  const buyerPhone = order.buyer?.phone;
  const farmerPhone = order.farmer?.phone;
  const subject = `Order Completed #${order._id}`;
  const msg = `Order has been marked completed.\n${orderSummaryLines(order)}`;
  await maybeSendEmail(buyerEmail, subject, `<p>${msg.replace(/\n/g, '<br/>')}</p>`, msg);
  await maybeSendEmail(farmerEmail, subject, `<p>${msg.replace(/\n/g, '<br/>')}</p>`, msg);
  await maybeSendSms(buyerPhone, msg);
  await maybeSendSms(farmerPhone, msg);
};

// Payments
exports.notifyPaymentSuccessful = async (payment) => {
  const order = payment.order || {};
  const subject = `Payment Successful #${payment._id}`;
  const amountLine = `Amount: ${formatCurrency(payment.amount)} ${payment.currency}`;
  const summary = order.items ? orderSummaryLines(order) : amountLine;
  const buyerMsg = `Your payment was successful.\n${summary}`;
  const farmerMsg = `A buyer completed payment for your order.\n${summary}`;
  const buyerEmail = order.buyer?.email || payment.buyer?.email;
  const farmerEmail = order.farmer?.email || payment.farmer?.email;
  const buyerPhone = order.buyer?.phone || payment.buyer?.phone;
  const farmerPhone = order.farmer?.phone || payment.farmer?.phone;

  await maybeSendEmail(buyerEmail, subject, `<p>${buyerMsg.replace(/\n/g, '<br/>')}</p>`, buyerMsg);
  await maybeSendEmail(farmerEmail, subject, `<p>${farmerMsg.replace(/\n/g, '<br/>')}</p>`, farmerMsg);
  await maybeSendSms(buyerPhone, buyerMsg);
  await maybeSendSms(farmerPhone, farmerMsg);
};

exports.notifyPaymentFailed = async (payment) => {
  const order = payment.order || {};
  const subject = `Payment Failed #${payment._id}`;
  const amountLine = `Amount: ${formatCurrency(payment.amount)} ${payment.currency}`;
  const msg = `Payment failed or was not completed.\n${amountLine}`;
  const buyerEmail = order.buyer?.email || payment.buyer?.email;
  const buyerPhone = order.buyer?.phone || payment.buyer?.phone;
  await maybeSendEmail(buyerEmail, subject, `<p>${msg.replace(/\n/g, '<br/>')}</p>`, msg);
  await maybeSendSms(buyerPhone, msg);
};