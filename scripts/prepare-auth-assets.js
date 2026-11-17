const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const src = 'C:/Users/Hi/.gemini/antigravity/brain/41489be0-481b-4fe5-93ba-5dd8ec3c045a/.user_uploaded/media_1794862519290_02aa7c74.jpg';
const outDir = path.join(__dirname, '../public/auth');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function processAll() {
  console.log('Processing auth assets...');

  // 1. High quality crops of individual 3D elements
  // We can scale them up 2x so they look ultra-crisp on retina screens
  const assets = [
    { name: 'teddy_gift.png', left: 160, top: 145, width: 90, height: 110 },
    { name: 'rainbow_gifts.png', left: 10, top: 510, width: 245, height: 115 },
    { name: 'astronaut_rocket.png', left: 320, top: 460, width: 170, height: 160 },
    { name: 'unicorn_gifts.png', left: 515, top: 495, width: 245, height: 130 },
    { name: 'giftbox_heart.png', left: 770, top: 495, width: 245, height: 130 },
    { name: 'gift_logo_icon.png', left: 110, top: 90, width: 45, height: 45 },
    { name: 'purple_sky_bg.jpg', left: 0, top: 0, width: 1024, height: 682 }
  ];

  for (const a of assets) {
    await sharp(src)
      .extract({ left: a.left, top: a.top, width: a.width, height: a.height })
      .toFile(path.join(outDir, a.name));
    console.log('Extracted asset:', a.name);
  }

  // 2. Extract full phone backgrounds
  const phones = [
    { name: 'phone_1_login.png', left: 10, top: 60, width: 245, height: 565 },
    { name: 'phone_2_otp.png', left: 262, top: 60, width: 245, height: 565 },
    { name: 'phone_3_signup.png', left: 517, top: 60, width: 245, height: 565 },
    { name: 'phone_4_code.png', left: 770, top: 60, width: 245, height: 565 },
  ];

  for (const p of phones) {
    await sharp(src)
      .extract({ left: p.left, top: p.top, width: p.width, height: p.height })
      .toFile(path.join(outDir, p.name));
    console.log('Extracted phone:', p.name);
  }

  console.log('All assets ready in public/auth!');
}

processAll().catch(console.error);
