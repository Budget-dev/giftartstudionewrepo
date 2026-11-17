const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

// Path to firebase-tools lib
const FB_TOOLS_LIB = 'C:/Users/Hi/AppData/Roaming/npm/node_modules/firebase-tools/lib';
const api = require(path.join(FB_TOOLS_LIB, 'api.js'));
const apiv2 = require(path.join(FB_TOOLS_LIB, 'apiv2.js'));
const { v4: uuidv4 } = require('C:/Users/Hi/AppData/Roaming/npm/node_modules/firebase-tools/node_modules/uuid');

const STATE_FILE = path.join(__dirname, '.auth-state.json');
const CONFIGSTORE_FILE = 'C:/Users/Hi/.config/configstore/firebase-tools.json';

function urlsafeBase64(d) {
  return d.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeJwt(token) {
  const parts = token.split('.');
  if (parts.length < 2) return {};
  const payload = Buffer.from(parts[1], 'base64').toString('utf8');
  return JSON.parse(payload);
}

async function generateUrl(emailHint = 'rohanswakkargiftartstudio@gmail.com') {
  const authProxyClient = new apiv2.Client({
    urlPrefix: api.authProxyOrigin(),
    auth: false,
  });

  const sessionId = uuidv4();
  const codeVerifier = crypto.randomBytes(32).toString('hex');
  const codeChallenge = urlsafeBase64(
    crypto.createHash('sha256').update(codeVerifier).digest('base64')
  );

  const attestRes = await authProxyClient.post('/attest', {
    session_id: sessionId,
  });

  const attestToken = attestRes.body.token;
  const loginUrl = `${api.authProxyOrigin()}/login?code_challenge=${codeChallenge}&session=${sessionId}&attest=${attestToken}&userHint=${encodeURIComponent(emailHint)}`;

  // Save session state
  fs.writeFileSync(
    STATE_FILE,
    JSON.stringify({
      sessionId,
      codeVerifier,
      emailHint,
      createdAt: Date.now(),
    }, null, 2)
  );

  return {
    sessionId: sessionId.substring(0, 5).toUpperCase(),
    loginUrl,
  };
}

async function verifyCode(authCode) {
  if (!fs.existsSync(STATE_FILE)) {
    throw new Error('No active auth session found. Please generate auth link first.');
  }

  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  const cleanCode = authCode.trim();

  // Exchange code for token
  const form = new URLSearchParams();
  form.append('code', cleanCode);
  form.append('client_id', api.clientId());
  form.append('client_secret', api.clientSecret());
  form.append('redirect_uri', `${api.authProxyOrigin()}/complete`);
  form.append('grant_type', 'authorization_code');
  form.append('code_verifier', state.codeVerifier);

  const res = await fetch('https://accounts.google.com/o/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });

  const tokenData = await res.json();

  if (tokenData.error) {
    throw new Error(`Google OAuth Error: ${tokenData.error_description || tokenData.error}`);
  }

  const user = decodeJwt(tokenData.id_token);
  const userEmail = user.email || state.emailHint;

  // Read and update configstore
  let config = {};
  if (fs.existsSync(CONFIGSTORE_FILE)) {
    config = JSON.parse(fs.readFileSync(CONFIGSTORE_FILE, 'utf8'));
  }

  const tokenRecord = {
    expires_at: Date.now() + (tokenData.expires_in || 3600) * 1000,
    refresh_token: tokenData.refresh_token,
    scopes: [],
    access_token: tokenData.access_token,
    expires_in: tokenData.expires_in,
    scope: tokenData.scope || 'https://www.googleapis.com/auth/firebase https://www.googleapis.com/auth/cloud-platform openid https://www.googleapis.com/auth/userinfo.email',
    token_type: tokenData.token_type || 'Bearer',
    id_token: tokenData.id_token,
  };

  const accountRecord = {
    user,
    tokens: tokenRecord,
  };

  // Set as global default user & tokens
  config.user = user;
  config.tokens = tokenRecord;

  // Add to additionalAccounts list
  config.additionalAccounts = config.additionalAccounts || [];
  const existingIdx = config.additionalAccounts.findIndex(
    (a) => a.user && a.user.email?.toLowerCase() === userEmail.toLowerCase()
  );
  if (existingIdx >= 0) {
    config.additionalAccounts[existingIdx] = accountRecord;
  } else {
    config.additionalAccounts.push(accountRecord);
  }

  // Set active account for this repo
  config.activeAccounts = config.activeAccounts || {};
  config.activeAccounts['d:\\giftmart'] = userEmail;
  config.activeAccounts['D:\\giftmart'] = userEmail;

  fs.writeFileSync(CONFIGSTORE_FILE, JSON.stringify(config, null, 2));

  // Clean up state
  try {
    fs.unlinkSync(STATE_FILE);
  } catch {}

  return {
    email: userEmail,
    name: user.name || userEmail,
  };
}

// CLI Interface
const command = process.argv[2];
const arg = process.argv[3];

if (command === 'generate') {
  generateUrl(arg || 'rohanswakkargiftartstudio@gmail.com')
    .then((result) => {
      console.log('JSON_OUTPUT:' + JSON.stringify(result));
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
} else if (command === 'verify') {
  if (!arg) {
    console.error('Error: Please provide the authorization code as argument');
    process.exit(1);
  }
  verifyCode(arg)
    .then((result) => {
      console.log('JSON_OUTPUT:' + JSON.stringify(result));
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
} else {
  console.log('Usage: node firebase-auth-helper.js generate [emailHint]');
  console.log('       node firebase-auth-helper.js verify <authCode>');
}
