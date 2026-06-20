import { GoogleGenAI, Type } from '@google/genai';
import { ProductBrief, Platform, OutputType, GenerationResponse } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const MODEL = 'gemini-2.5-flash';

// Convert a File into the inlineData part Gemini expects.
const fileToImagePart = (file: File): Promise<{ inlineData: { mimeType: string; data: string } }> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // strip the "data:<mime>;base64," prefix
      const base64 = result.split(',')[1];
      resolve({ inlineData: { mimeType: file.type, data: base64 } });
    };
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    recommendation: {
      type: Type.OBJECT,
      description: 'Which framework(s) you chose and why.',
      properties: {
        frameworks: {
          type: Type.ARRAY,
          description: 'One or more of: AIDA, PAS, BAB, HSO. Combine 2+ only when it clearly helps.',
          items: { type: Type.STRING },
        },
        rationale: {
          type: Type.STRING,
          description: 'A short, concrete explanation of why these framework(s) fit this product + audience.',
        },
      },
      required: ['frameworks', 'rationale'],
    },
    outputs: {
      type: Type.ARRAY,
      description: 'One entry per selected platform. Only include the output fields that were requested.',
      items: {
        type: Type.OBJECT,
        properties: {
          platform: { type: Type.STRING },
          framework: {
            type: Type.STRING,
            description: 'The single framework used for THIS piece (from the recommended set).',
          },
          videoScript: {
            type: Type.ARRAY,
            description: 'Framework-structured spoken script. Each segment label = a framework stage (e.g. Hook, Problem).',
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                text: { type: Type.STRING },
              },
              required: ['label', 'text'],
            },
          },
          caption: { type: Type.STRING, description: 'Ready-to-post caption.' },
          hashtags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Hashtags WITHOUT the # symbol.',
          },
          adCopy: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING },
              body: { type: Type.STRING },
              cta: { type: Type.STRING },
            },
            required: ['headline', 'body', 'cta'],
          },
        },
        required: ['platform', 'framework'],
      },
    },
  },
  required: ['recommendation', 'outputs'],
};

const buildPrompt = (brief: ProductBrief, platforms: Platform[], outputs: OutputType[]): string => {
  const points = brief.sellingPoints.filter((p) => p.trim()).map((p) => `- ${p}`).join('\n');
  const wantScript = outputs.includes(OutputType.VideoScript);
  const wantCaption = outputs.includes(OutputType.Caption);
  const wantAd = outputs.includes(OutputType.AdCopy);

  const requested: string[] = [];
  if (wantScript) requested.push('`videoScript` (a framework-structured spoken script)');
  if (wantCaption) requested.push('`caption` + `hashtags`');
  if (wantAd) requested.push('`adCopy` (headline, body, cta)');

  return `You are an elite direct-response copywriter and short-form video strategist.

The user has uploaded up to 5 product photos (attached) plus this brief:
- Target audience: ${brief.targetAudience || '(infer from product + images)'}
- Product name: ${brief.productName}
- Product description: ${brief.productDescription}
- Main selling points:
${points || '(infer the strongest benefits from the description and images)'}
- Desired call-to-action: ${brief.callToAction || '(choose the most fitting CTA)'}

STEP 1 — Look closely at the attached product images. Use what you SEE (materials, use-case, mood, who it's for) together with the brief.

STEP 2 — Choose the best copywriting framework(s) for THIS product and audience:
- AIDA: Attention → Interest → Desire → Action (broad ads)
- PAS: Problem → Agitate → Solution (pain-point, high-converting)
- BAB: Before → After → Bridge (transformation stories)
- HSO: Hook → Story → Offer (storytelling / personal brand)
Recommend a single framework when one clearly wins, or COMBINE 2+ only when blending them clearly produces stronger copy. Explain your choice in 'recommendation'.

STEP 3 — For EACH of these platforms, write content: ${platforms.join(', ')}.
For every platform, produce ONLY these output fields: ${requested.join(', ')}.
${wantScript ? '- For videoScript, each segment label must be the framework stage it represents (e.g. "Hook", "Problem", "Before", "Attention").\n' : ''}${wantCaption ? '- Hashtags must NOT include the # symbol and should match the platform\'s norms (e.g. Instagram 15-20, TikTok 4-6, X 2-3).\n' : ''}- Match each platform\'s tone, length, and culture. LinkedIn = professional; TikTok = punchy & casual; etc.
- Always lead with a scroll-stopping hook and end on the call-to-action.
- Set each output's 'framework' field to the single framework you used for that piece.

Return ONLY valid JSON matching the provided schema. Do not include any field that was not requested.`;
};

export const generateContent = async (
  brief: ProductBrief,
  images: File[],
  platforms: Platform[],
  outputs: OutputType[],
): Promise<GenerationResponse> => {
  if (images.length === 0) throw new Error('Please upload at least one product image.');
  if (!brief.productName.trim()) throw new Error('Please enter a product name.');
  if (!brief.productDescription.trim()) throw new Error('Please describe what the product is/does.');
  if (platforms.length === 0) throw new Error('Please select at least one platform.');
  if (outputs.length === 0) throw new Error('Please select at least one output type.');

  const imageParts = await Promise.all(images.map(fileToImagePart));
  const prompt = buildPrompt(brief, platforms, outputs);

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: 'user', parts: [...imageParts, { text: prompt }] }],
    config: {
      responseMimeType: 'application/json',
      responseSchema,
      temperature: 0.9,
    },
  });

  const text = response.text;
  if (!text) throw new Error('The model returned an empty response. Please try again.');

  let parsed: GenerationResponse;
  try {
    parsed = JSON.parse(text) as GenerationResponse;
  } catch {
    throw new Error('Could not parse the AI response. Please try again.');
  }

  if (!parsed.outputs || parsed.outputs.length === 0) {
    throw new Error('No content was generated. Please try again.');
  }
  return parsed;
};
