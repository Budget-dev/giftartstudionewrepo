const http = require('http');

const urls = [
  '/admin/dashboard',
  '/admin/products',
  '/admin/orders',
  '/admin/payments',
  '/admin/coupons',
  '/admin/customized-orders',
  '/admin/rto',
  '/admin/seo',
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    http.get(`http://localhost:5173${url}`, (res) => {
      console.log(`[${res.statusCode}] ${url}`);
      resolve({ url, status: res.statusCode });
    }).on('error', (err) => {
      console.error(`[FAIL] ${url}: ${err.message}`);
      resolve({ url, status: 500, error: err.message });
    });
  });
}

async function run() {
  for (const url of urls) {
    await checkUrl(url);
  }
}

run();
