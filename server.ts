import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to simulate receiving and processing an email
  app.post('/api/process-email', async (req, res) => {
    try {
      const { emailContent, tone } = req.body;
      
      if (!emailContent) {
        return res.status(400).json({ error: 'Email content is required' });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: emailContent,
        config: {
          systemInstruction: getSystemPrompt(tone),
          responseMimeType: 'application/json',
          temperature: 0.1,
        }
      });

      const jsonText = response.text;
      if (!jsonText) {
        throw new Error('Gemini returned empty response');
      }

      let parsedData;
      try {
        parsedData = JSON.parse(jsonText);
      } catch (parseError) {
        console.error("Failed to parse JSON", jsonText);
        throw new Error('Failed to parse Gemini output as JSON');
      }

      res.json(parsedData);
    } catch (error: any) {
      console.error('Error processing email:', error);
      res.status(500).json({ error: 'Failed to process email' });
    }
  });

  // API Route to generate bulk message using AI
  app.post('/api/generate-bulk-message', async (req, res) => {
    try {
      const { leads, customPrompt, companyName, companyProducts, customApiKey, catalogUrl, reviewUrl, tone } = req.body;
      
      if (!leads || leads.length === 0) {
        return res.status(400).json({ error: 'Leads are required' });
      }

      // If user provided a custom key, use it. Otherwise use the env default.
      const aiClient = customApiKey 
        ? new GoogleGenAI({ apiKey: customApiKey }) 
        : ai;

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

Return ONLY the plain text content of the generated message. Do not use markdown blocks like \`\`\`. Use formatting supported by WhatsApp (like *bold* or _italic_). Use placeholders like {{Name}} if you want to make it generic, or write the message in a way that feels personal yet applicable to all.
`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptContext,
        config: {
          temperature: 0.7,
        }
      });

      res.json({ message: response.text?.trim() });
    } catch (error: any) {
      console.error('Error generating bulk message:', error);
      res.status(500).json({ error: error.message || 'Failed to generate bulk message' });
    }
  });

  // API Route to generate single review message
  app.post('/api/generate-review-message', async (req, res) => {
    try {
      const { lead, companyName, reviewUrl, customApiKey, tone } = req.body;
      
      const aiClient = customApiKey 
        ? new GoogleGenAI({ apiKey: customApiKey }) 
        : ai;

      const promptContext = `
You are an expert customer relations assistant for a B2B company named ${companyName || 'our company'}.

Persona/Tone: ${tone || 'Professional, B2B, welcoming'}
Write a short, polite WhatsApp message thanking the customer (${lead.customerName}) for their inquiry about "${lead.requirements}".
Keep it warm and professional. At the end of the message, ask them to spare a moment to rate their experience with us.
Include this EXACT link at the very end of the message: ${reviewUrl}
Sign off with ${companyName || 'our team'}.

Return ONLY the plain text content of the generated message. Do not use markdown blocks like \`\`\`. Use formatting supported by WhatsApp (like *bold*).
`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptContext,
        config: {
          temperature: 0.5,
        }
      });

      res.json({ message: response.text?.trim() });
    } catch (error: any) {
      console.error('Error generating review message:', error);
      res.status(500).json({ error: error.message || 'Failed to generate review message' });
    }
  });

  // Expose the prompt so the frontend can read it
  app.get('/api/prompt', (req, res) => {
    const tone = req.query.tone as string || 'Professional, B2B, welcoming';
    res.json({ prompt: getSystemPrompt(tone).trim().replace(/^/gm, '') });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
