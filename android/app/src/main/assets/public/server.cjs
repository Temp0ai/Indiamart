var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var ai = new import_genai.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
var getSystemPrompt = (tone = "Professional, B2B, welcoming") => `
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
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.post("/api/process-email", async (req, res) => {
    try {
      const { emailContent, tone } = req.body;
      if (!emailContent) {
        return res.status(400).json({ error: "Email content is required" });
      }
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: emailContent,
        config: {
          systemInstruction: getSystemPrompt(tone),
          responseMimeType: "application/json",
          temperature: 0.1
        }
      });
      const jsonText = response.text;
      if (!jsonText) {
        throw new Error("Gemini returned empty response");
      }
      let parsedData;
      try {
        parsedData = JSON.parse(jsonText);
      } catch (parseError) {
        console.error("Failed to parse JSON", jsonText);
        throw new Error("Failed to parse Gemini output as JSON");
      }
      res.json(parsedData);
    } catch (error) {
      console.error("Error processing email:", error);
      res.status(500).json({ error: "Failed to process email" });
    }
  });
  app.post("/api/generate-bulk-message", async (req, res) => {
    try {
      const { leads, customPrompt, companyName, companyProducts, customApiKey, catalogUrl, reviewUrl, tone } = req.body;
      if (!leads || leads.length === 0) {
        return res.status(400).json({ error: "Leads are required" });
      }
      const aiClient = customApiKey ? new import_genai.GoogleGenAI({ apiKey: customApiKey }) : ai;
      const promptContext = `
You are an expert B2B sales assistant.
Company Name: ${companyName || "Not specified"}
Products/Services: ${companyProducts || "Not specified"}

Your task is to generate a conversational, professional, and engaging bulk WhatsApp message template that can be sent to the following leads.
Persona/Tone: ${tone || "Professional, B2B, welcoming"}
If a specific prompt is provided, follow it carefully.

Target Leads Audience Summary:
${leads.map((l) => `- ${l.customerName} (Interested in: ${l.requirements || l.category})`).join("\n")}

Custom Prompt: ${customPrompt || "Create a general promotional update or check-in message."}

${catalogUrl ? `Crucial: Always include our WhatsApp Catalog link in the message and encourage them to view our products: ${catalogUrl}` : ""}
${reviewUrl ? `Crucial: If appropriate, politely ask for a review, and if you do, include our Google Business link: ${reviewUrl}` : ""}

Return ONLY the plain text content of the generated message. Do not use markdown blocks like \`\`\`. Use formatting supported by WhatsApp (like *bold* or _italic_). Use placeholders like {{Name}} if you want to make it generic, or write the message in a way that feels personal yet applicable to all.
`;
      const response = await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: promptContext,
        config: {
          temperature: 0.7
        }
      });
      res.json({ message: response.text?.trim() });
    } catch (error) {
      console.error("Error generating bulk message:", error);
      res.status(500).json({ error: error.message || "Failed to generate bulk message" });
    }
  });
  app.post("/api/generate-review-message", async (req, res) => {
    try {
      const { lead, companyName, reviewUrl, customApiKey, tone } = req.body;
      const aiClient = customApiKey ? new import_genai.GoogleGenAI({ apiKey: customApiKey }) : ai;
      const promptContext = `
You are an expert customer relations assistant for a B2B company named ${companyName || "our company"}.

Persona/Tone: ${tone || "Professional, B2B, welcoming"}
Write a short, polite WhatsApp message thanking the customer (${lead.customerName}) for their inquiry about "${lead.requirements}".
Keep it warm and professional. At the end of the message, ask them to spare a moment to rate their experience with us.
Include this EXACT link at the very end of the message: ${reviewUrl}
Sign off with ${companyName || "our team"}.

Return ONLY the plain text content of the generated message. Do not use markdown blocks like \`\`\`. Use formatting supported by WhatsApp (like *bold*).
`;
      const response = await aiClient.models.generateContent({
        model: "gemini-2.5-flash",
        contents: promptContext,
        config: {
          temperature: 0.5
        }
      });
      res.json({ message: response.text?.trim() });
    } catch (error) {
      console.error("Error generating review message:", error);
      res.status(500).json({ error: error.message || "Failed to generate review message" });
    }
  });
  app.get("/api/prompt", (req, res) => {
    const tone = req.query.tone || "Professional, B2B, welcoming";
    res.json({ prompt: getSystemPrompt(tone).trim().replace(/^/gm, "") });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
