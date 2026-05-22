import path from 'path';
import { getAgentRouterConfig } from './agentRouterConfig.js';

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
  const activeAI = aiProvider || process.env.ACTIVE_LLM || 'blaze';
  const b64 = buffer.toString('base64');

  // DeepSeek v4 Pro via AgentRouter (OpenAI-compatible vision)
  const agentRouter = getAgentRouterConfig();
  if (activeAI === 'deepseek' && agentRouter.apiKey) {
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({
      apiKey: agentRouter.apiKey,
      baseURL: agentRouter.baseURL,
    });
    const model = analysisModel || process.env.DEEPSEEK_MODEL || 'deepseek-v4-pro';
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

  // BlazeAI (OpenAI-compatible vision)
  if (activeAI === 'blaze' && process.env.BLAZE_API_KEY) {
    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({
      apiKey: process.env.BLAZE_API_KEY,
      baseURL: process.env.BLAZE_BASE_URL || 'https://blazeai.boxu.dev/api',
    });
    const model = analysisModel || process.env.BLAZE_MODEL || 'qwen3.6-plus';
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
