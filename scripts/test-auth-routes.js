const http = require('http');

const urls = [
  '/login',
  '/signup',
  '/auth/teddy_gift.png',
  '/auth/rainbow_gifts.png',
  '/auth/astronaut_rocket.png',
  '/auth/unicorn_gifts.png',
  '/auth/giftbox_heart.png',
  '/auth/gift_logo_icon.png',
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    http.get(`http://localhost:5173${url}`, (res) => {
      console.log(`[${res.statusCode}] ${url} (${res.headers['content-type']})`);
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
