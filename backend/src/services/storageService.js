import path from 'path';
import fs from 'fs';
import { randomBytes } from 'crypto';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

let _client = null;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const IS_VERCEL = process.env.VERCEL === '1';

/** Local audio directory — /tmp on Vercel (ephemeral), public/audio locally. */
const LOCAL_AUDIO_DIR = IS_VERCEL
  ? path.join('/tmp', 'audio')
  : path.resolve(__dirname, '..', '..', 'public', 'audio');

function getClient() {
  if (_client) return _client;
  if (!process.env.STORAGE_ACCESS_KEY_ID) return null;

  const config = {
    region: process.env.STORAGE_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
      secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
    },
  };
  if (process.env.STORAGE_ENDPOINT_URL) {
    config.endpoint = process.env.STORAGE_ENDPOINT_URL;
    config.forcePathStyle = true;
  }
  _client = new S3Client(config);
  return _client;
}

/**
 * Upload a buffer to S3/R2 and return the public URL, or null if not configured.
 * Falls back to local file storage when no S3/R2 credentials are set.
 * @param {Buffer} buffer
 * @param {string} originalFilename
 * @param {string} prefix
 * @returns {Promise<string|null>}
 */
export async function uploadFile(buffer, originalFilename, prefix = 'uploads') {
  const client = getClient();
  const ext = path.extname(originalFilename);

  if (client) {
    const key = `${prefix}/${randomBytes(16).toString('hex')}${ext}`;
    const bucket = process.env.STORAGE_BUCKET_NAME || 'ai-teacher-assets';

    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer }));

    const base = process.env.STORAGE_PUBLIC_BASE_URL;
    return base ? `${base.replace(/\/$/, '')}/${key}` : `s3://${bucket}/${key}`;
  }

  // ── Local fallback ──────────────────────────────────────────────────────
  const filename = prefix === 'audio'
    ? `audio-${randomBytes(12).toString('hex')}${ext}`
    : `${prefix}-${randomBytes(12).toString('hex')}${ext}`;
  const dir = prefix === 'audio'
    ? LOCAL_AUDIO_DIR
    : (IS_VERCEL ? path.join('/tmp', prefix) : path.resolve(__dirname, '..', '..', 'public', prefix));

  try {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, filename), buffer);
  } catch (err) {
    console.warn(`[storage] Local write failed (${IS_VERCEL ? 'Vercel' : 'local'}):`, err.message);
    return null;
  }

  // Construct an absolute URL pointing to the backend (not root-relative),
  // because the frontend runs on a different port and would resolve a
  // root-relative path against its own origin, causing a 404.
  const port = process.env.PORT || 8000;
  const backendUrlOverride = process.env.BACKEND_PUBLIC_URL;
  const baseUrl = backendUrlOverride
    ? backendUrlOverride.replace(/\/$/, '')
    : `http://localhost:${port}`;
  return `${baseUrl}/audio/${filename}`;
}

/**
 * Upload audio bytes with an mp3 extension.
 * @param {Buffer} audioBuffer
 * @param {string} partId
 * @returns {Promise<string|null>}
 */
export async function uploadAudio(audioBuffer, partId) {
  return uploadFile(audioBuffer, `${partId}.mp3`, 'audio');
}

