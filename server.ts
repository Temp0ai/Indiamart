import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { google } from 'googleapis';
import 'dotenv/config';

// ── Gemini ──
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) console.error('⚠️  GEMINI_API_KEY is not set.');
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// ── Gmail OAuth2 ──
const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID || '';
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || '';
const GMAIL_REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/api/gmail/callback';

let gmailTokens: any = null;
let gmailUserEmail = '';

function getOAuth2Client() {
  return new google.auth.OAuth2(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REDIRECT_URI);
}

// ── System Prompt ──
const getSystemPrompt = (tone: string = 'Professional, B2B, welcoming') => `
**System Identity & Objective**
You are an automated sales processing AI specializing in B2B lead management. Your objective is to read Indiamart inquiry emails forwarded from Gmail, extract vital contact and requirement data, and structure it for immediate communication via Call, SMS, and WhatsApp Business API.

**Step 1: Data Extraction & Validation**
Analyze the incoming Indiamart email text. Extract the following exact fields:
- Customer Name
- Phone Number (Validate and format to international standard, e.g., +91)
- Email ID
- Specific Requirements (Summarize the requested product and quantity)
- Location/City (if available)

**Step 2: Classification & Segmentation**
Analyze the "Specific Requirements" and classify the inquiry into ONE of the following strict categories based on closest match:
- Premix
- Vending Machine
- Jaggery
- Ice Tea
- Lemon Tea
- Other

**Step 3: AI Follow-Up Generation**
Generate a professional, persuasive WhatsApp follow-up message tailored to the requirement.
- Persona/Tone: ${tone}
- Structure: Personalized greeting, acknowledgment of the specific product requirement, a related offer or value proposition, placeholder for a promotional photo (e.g., [Attach: Vending Machine Brochure]), and a clear Call-to-Action.

**Step 4: Output Formatting**
Output the final extracted data strictly as a JSON object matching this schema:
{
  "customerName": "string",
  "phoneNumber": "string",
  "email": "string",
  "requirements": "string",
  "category": "string",
  "whatsAppTemplate": "string",
  "location": "string"
}
Ensure the JSON is ready to be parsed by the webhook sending data to the WhatsApp Business API. Preserve data privacy by not sharing this information outside the designated pipeline.
`;

// ── Helper: Gemini JSON call ──
async function callGeminiJson(prompt: string, config: Record<string, any> = {}) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config,
  });
  const text = response.text;
  if (!text) throw new Error('Gemini returned empty response');
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) return JSON.parse(match[1].trim());
    throw new Error('Failed to parse Gemini output as JSON');
  }
}

// ── Helper: decode base64url ──
function decodeBase64Url(data: string): string {
  const b64 = data.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(b64, 'base64').toString('utf-8');
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '1mb' }));

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  // ── Health ──
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', hasApiKey: !!apiKey, gmailConnected: !!gmailTokens });
  });

  // ══════════════════════════════════════════
  //  GMAIL OAUTH
  // ══════════════════════════════════════════

  // Step 1: Get OAuth URL
  app.get('/api/gmail/auth-url', (_req, res) => {
    if (!GMAIL_CLIENT_ID || !GMAIL_CLIENT_SECRET) {
      return res.status(500).json({
        error: 'GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET must be set in .env.local',
      });
    }
    const oauth2 = getOAuth2Client();
    const url = oauth2.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
    });
    res.json({ url });
  });

  // Step 2: OAuth callback
  app.get('/api/gmail/callback', async (req, res) => {
    const code = req.query.code as string;
    if (!code) return res.status(400).send('Missing code');
    try {
      const oauth2 = getOAuth2Client();
      const { tokens } = await oauth2.getToken(code);
      gmailTokens = tokens;
      oauth2.setCredentials(tokens);

      // Get user email
      const oauth2Api = google.oauth2({ version: 'v2', auth: oauth2 });
      const userInfo = await oauth2Api.userinfo.get();
      gmailUserEmail = userInfo.data.email || '';

      // Redirect back to app
      res.redirect('/?gmail=connected');
    } catch (err: any) {
      console.error('Gmail OAuth error:', err.message);
      res.status(500).send(`OAuth failed: ${err.message}`);
    }
  });

  // Step 3: Gmail status
  app.get('/api/gmail/status', (_req, res) => {
    res.json({
      connected: !!gmailTokens,
      email: gmailUserEmail,
    });
  });

  // Step 4: Disconnect
  app.post('/api/gmail/disconnect', (_req, res) => {
    gmailTokens = null;
    gmailUserEmail = '';
    res.json({ ok: true });
  });

  // Step 5: Fetch Indiamart emails
  app.post('/api/gmail/sync', async (req, res) => {
    if (!gmailTokens) {
      return res.status(401).json({ error: 'Gmail not connected. Please link your account first.' });
    }
    try {
      const oauth2 = getOAuth2Client();
      oauth2.setCredentials(gmailTokens);
      const gmail = google.gmail({ version: 'v1', auth: oauth2 });

      // Search for Indiamart emails from the last 7 days
      const query = req.body.query || 'from:indiamart.com newer_than:7d';
      const listRes = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 20,
      });

      const messages = listRes.data.messages || [];
      if (messages.length === 0) {
        return res.json({ emails: [], count: 0 });
      }

      // Fetch each email
      const emails: any[] = [];
      for (const msg of messages.slice(0, 10)) {
        try {
          const msgRes = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id!,
            format: 'full',
          });

          const headers = msgRes.data.payload?.headers || [];
          const subject = headers.find((h) => h.name === 'Subject')?.value || '';
          const from = headers.find((h) => h.name === 'From')?.value || '';
          const date = headers.find((h) => h.name === 'Date')?.value || '';

          // Extract body
          let body = '';
          const payload = msgRes.data.payload;

          function extractBody(part: any): string {
            if (part.body?.data) return decodeBase64Url(part.body.data);
            if (part.parts) {
              for (const p of part.parts) {
                if (p.mimeType === 'text/plain' && p.body?.data) return decodeBase64Url(p.body.data);
                if (p.parts) {
                  const nested = extractBody(p);
                  if (nested) return nested;
                }
              }
              // Fallback to text/html
              for (const p of part.parts) {
                if (p.mimeType === 'text/html' && p.body?.data) {
                  const html = decodeBase64Url(p.body.data);
                  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                }
              }
            }
            return '';
          }

          body = extractBody(payload);

          emails.push({
            id: msg.id,
            subject,
            from,
            date,
            body: body.substring(0, 5000), // Limit body size
            snippet: msgRes.data.snippet || '',
          });
        } catch (msgErr: any) {
          console.error(`Failed to fetch message ${msg.id}:`, msgErr.message);
        }
      }

      // Update tokens if refreshed
      if (oauth2.credentials.access_token !== gmailTokens.access_token) {
        gmailTokens = oauth2.credentials;
      }

      res.json({ emails, count: emails.length });
    } catch (err: any) {
      console.error('Gmail sync error:', err.message);
      if (err.code === 401) {
        gmailTokens = null;
        return res.status(401).json({ error: 'Gmail token expired. Please reconnect.' });
      }
      res.status(500).json({ error: err.message });
    }
  });

  // ══════════════════════════════════════════
  //  EMAIL PROCESSING
  // ══════════════════════════════════════════

  app.post('/api/process-email', async (req, res) => {
    try {
      const { emailContent, tone } = req.body;
      if (!emailContent || typeof emailContent !== 'string') {
        return res.status(400).json({ error: 'Email content is required (string)' });
      }
      const data = await callGeminiJson(emailContent, {
        systemInstruction: getSystemPrompt(tone),
        responseMimeType: 'application/json',
        temperature: 0.1,
      });
      res.json(data);
    } catch (error: any) {
      console.error('Error processing email:', error);
      res.status(500).json({ error: error.message || 'Failed to process email' });
    }
  });

  // ══════════════════════════════════════════
  //  BULK MESSAGE
  // ══════════════════════════════════════════

  app.post('/api/generate-bulk-message', async (req, res) => {
    try {
      const { leads, customPrompt, companyName, companyProducts, customApiKey, catalogUrl, reviewUrl, tone } = req.body;
      if (!leads || !Array.isArray(leads) || leads.length === 0) {
        return res.status(400).json({ error: 'Leads array is required' });
      }
      const client = customApiKey ? new GoogleGenAI({ apiKey: customApiKey }) : ai;
      const promptContext = `
You are an expert B2B sales assistant.
Company Name: ${companyName || 'Not specified'}
Products/Services: ${companyProducts || 'Not specified'}

Your task is to generate a conversational, professional, and engaging bulk WhatsApp message template that can be sent to the following leads.
Persona/Tone: ${tone || 'Professional, B2B, welcoming'}
If a specific prompt is provided, follow it carefully.

Target Leads Audience Summary:
${leads.map((l: any) => `- ${l.customerName} (Interested in: ${l.requirements || l.category})`).join('\n')}

Custom Prompt: ${customPrompt || 'Create a general promotional update or check-in message.'}

${catalogUrl ? `Crucial: Always include our WhatsApp Catalog link in the message and encourage them to view our products: ${catalogUrl}` : ''}
${reviewUrl ? `Crucial: If appropriate, politely ask for a review, and if you do, include our Google Business link: ${reviewUrl}` : ''}

Return ONLY the plain text content of the generated message. Do not use markdown blocks. Use formatting supported by WhatsApp (like *bold* or _italic_). Use placeholders like {{Name}} if you want to make it generic, or write the message in a way that feels personal yet applicable to all.
`;
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptContext,
        config: { temperature: 0.7 },
      });
      res.json({ message: response.text?.trim() });
    } catch (error: any) {
      console.error('Error generating bulk message:', error);
      res.status(500).json({ error: error.message || 'Failed to generate bulk message' });
    }
  });

  // ══════════════════════════════════════════
  //  REVIEW MESSAGE
  // ══════════════════════════════════════════

  app.post('/api/generate-review-message', async (req, res) => {
    try {
      const { lead, companyName, reviewUrl, customApiKey, tone } = req.body;
      if (!lead?.customerName) return res.status(400).json({ error: 'Lead with customerName is required' });
      if (!reviewUrl) return res.status(400).json({ error: 'reviewUrl is required' });

      const client = customApiKey ? new GoogleGenAI({ apiKey: customApiKey }) : ai;
      const promptContext = `
You are an expert customer relations assistant for a B2B company named ${companyName || 'our company'}.
Persona/Tone: ${tone || 'Professional, B2B, welcoming'}
Write a short, polite WhatsApp message thanking the customer (${lead.customerName}) for their inquiry about "${lead.requirements}".
Keep it warm and professional. At the end of the message, ask them to spare a moment to rate their experience with us.
Include this EXACT link at the very end of the message: ${reviewUrl}
Sign off with ${companyName || 'our team'}.

Return ONLY the plain text content of the generated message. Do not use markdown blocks. Use formatting supported by WhatsApp (like *bold*).
`;
      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptContext,
        config: { temperature: 0.5 },
      });
      res.json({ message: response.text?.trim() });
    } catch (error: any) {
      console.error('Error generating review message:', error);
      res.status(500).json({ error: error.message || 'Failed to generate review message' });
    }
  });

  // ── Expose prompt ──
  app.get('/api/prompt', (req, res) => {
    const tone = (req.query.tone as string) || 'Professional, B2B, welcoming';
    res.json({ prompt: getSystemPrompt(tone).trim() });
  });

  // ── Vite / static ──
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`   Gemini API: ${apiKey ? '✅' : '❌'}`);
    console.log(`   Gmail OAuth: ${GMAIL_CLIENT_ID ? '✅' : '❌ (set GMAIL_CLIENT_ID)'}`);
  });
}

startServer();
