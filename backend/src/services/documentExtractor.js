import path from 'path';
import { getBlazeConfig, resolveBlazeModel } from './blazeConfig.js';

/**
 * Extract plain text from an uploaded file buffer.
 * @param {Buffer} buffer
 * @param {string} filename
 * @returns {Promise<string>}
 */
export async function extractText(buffer, filename, aiProvider = null, analysisModel = null) {
  const ext = path.extname(filename).toLowerCase();

  if (ext === '.pdf') return extractPdf(buffer);
  if (ext === '.docx' || ext === '.doc') return extractDocx(buffer);
  if (ext === '.txt' || ext === '.md') return buffer.toString('utf-8');
  if (['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff'].includes(ext))
    return extractImage(buffer, aiProvider, analysisModel);

  // Fallback: try UTF-8
  return buffer.toString('utf-8');
}

async function extractPdf(buffer) {
  const pdfParse = (await import('pdf-parse')).default;
  const result = await pdfParse(buffer);
  return result.text;
}

async function extractDocx(buffer) {
  const mammoth = (await import('mammoth')).default;
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

async function extractImage(buffer, aiProvider = null, analysisModel = null) {
  const requestedAI = String(aiProvider || process.env.ACTIVE_LLM || 'blaze').trim().toLowerCase();
  const activeAI = requestedAI === 'deepseek' || requestedAI === 'blazeai'
    ? 'blaze'
    : (requestedAI || 'blaze');
  const b64 = buffer.toString('base64');

  // BlazeAI (OpenAI-compatible vision)
  const blaze = getBlazeConfig();
  if (activeAI === 'blaze' && blaze.apiKey) {
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({
      apiKey: blaze.apiKey,
      baseURL: blaze.baseURL,
    });
    const model = resolveBlazeModel(analysisModel, blaze.defaultModel);
    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract all text and describe all diagrams, equations, and visual content from this educational image. Be thorough.' },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}` } },
          ],
        },
      ],
      max_tokens: 2048,
    });
    return response.choices[0].message.content || '';
  }

  if (activeAI === 'openai' && process.env.OPENAI_API_KEY) {
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract all text and describe all diagrams, equations, and visual content from this educational image. Be thorough.',
            },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}` } },
          ],
        },
      ],
      max_tokens: 2048,
    });
    return response.choices[0].message.content || '';
  }

  if (activeAI === 'gemini' && process.env.GEMINI_API_KEY) {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent([
      'Extract all text and describe all diagrams from this educational image.',
      { inlineData: { mimeType: 'image/jpeg', data: b64 } },
    ]);
    return result.response.text();
  }

  return '[Image content — configure an AI key to enable OCR]';
}
