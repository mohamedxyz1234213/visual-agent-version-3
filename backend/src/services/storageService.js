import path from 'path';
import { randomBytes } from 'crypto';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

let _client = null;

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
 * @param {Buffer} buffer
 * @param {string} originalFilename
 * @param {string} prefix
 * @returns {Promise<string|null>}
 */
export async function uploadFile(buffer, originalFilename, prefix = 'uploads') {
  const client = getClient();
  if (!client) return null;

  const ext = path.extname(originalFilename);
  const key = `${prefix}/${randomBytes(16).toString('hex')}${ext}`;
  const bucket = process.env.STORAGE_BUCKET_NAME || 'ai-teacher-assets';

  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer }));

  const base = process.env.STORAGE_PUBLIC_BASE_URL;
  return base ? `${base.replace(/\/$/, '')}/${key}` : `s3://${bucket}/${key}`;
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
