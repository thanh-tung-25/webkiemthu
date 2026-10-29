import { mkdir, writeFile } from 'node:fs/promises';

// Chỉ thử trên bản demo local. Tạo khách/đơn thật, không tự xóa hay đặt lại kho.
const origin = 'http://localhost:4200';
async function request(path, body, token) {
  const response = await fetch(`${origin}/api${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });
  const json = await response.json();
  return { status: response.status, ...json };
}
function requireData(result) {
  if (!result.success || !result.data) throw new Error(JSON.stringify(result));
  return result.data;
}
const slug = '/products/slug/demo-ao-thun-1';
const product = requireData(await request(slug));
const variant = product.variants.find(v => v.sku === 'DEMO-1-DEN-M');
if (!variant || variant.stockQuantity !== 1) {
  throw new Error('Can ton kho DEMO-1-DEN-M = 1. Dieu chinh bang phieu nhap kho trong admin truoc khi thu.');
}
const runId = Date.now();
const customers = [];
for (let i = 0; i < 8; i++) {
  const auth = requireData(await request('/auth/register', {
    fullName: `Khach kiem thu ${i}`, email: `race.${runId}.${i}@example.com`,
    password: 'Test@123456', confirmPassword: 'Test@123456', captchaToken: 'XXXX.DUMMY.TOKEN.XXXX',
  }));
  const address = requireData(await request('/addresses', {
    receiverName: `Khach kiem thu ${i}`, receiverPhone: '0901234567',
    addressDetail: '16 Duong kiem thu', province: 'Ho Chi Minh', isDefault: true,
  }, auth.accessToken));
  customers.push({ token: auth.accessToken, addressId: address.addressId });
}
const results = await Promise.all(customers.map(async customer => {
  const result = await request('/orders', {
    addressId: customer.addressId, paymentMethod: 'COD',
    buyNowItem: { variantId: variant.variantId, quantity: 1 }, note: `Concurrency ${runId}`,
  }, customer.token);
  return { status: result.status, success: result.success, message: result.message, orderId: result.data?.orderId };
}));
const after = requireData(await request(slug)).variants.find(v => v.variantId === variant.variantId);
const successfulOrders = results.filter(r => r.success).length;
const report = {
  runId, timestamp: new Date().toISOString(), variantId: variant.variantId,
  requests: customers.length, stockBefore: variant.stockQuantity, stockAfter: after.stockQuantity,
  successfulOrders, expectedStockAfter: variant.stockQuantity - successfulOrders,
  oversold: successfulOrders > variant.stockQuantity,
  inventoryMismatch: after.stockQuantity !== variant.stockQuantity - successfulOrders,
  results,
};
await mkdir('test-results', { recursive: true });
await writeFile(`test-results/concurrency-${runId}.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
if (!report.oversold && !report.inventoryMismatch) console.log('Chua tai hien loi trong lan nay; khong dong nghia da sua duoc loi.');
