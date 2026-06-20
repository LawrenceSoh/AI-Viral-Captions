
export enum Platform {
  TikTok = 'TikTok',
  Instagram = 'Instagram (Reels)',
  Facebook = 'Facebook',
  YouTube = 'YouTube Shorts',
  Twitter = 'X (Twitter)',
  LinkedIn = 'LinkedIn',
}

export enum Framework {
  AIDA = 'AIDA',
  PAS = 'PAS',
  BAB = 'BAB',
  HSO = 'HSO',
}

export enum OutputType {
  VideoScript = 'Video Script',
  Caption = 'Caption + Hashtags',
  AdCopy = 'Full Ad Copy',
}

// The product brief the user fills in (raw material for the copy).
export interface ProductBrief {
  targetAudience: string;
  productName: string;
  productDescription: string;
  sellingPoints: string[];
  callToAction: string;
}

// One stage of a framework-structured video script, e.g. { label: "Hook", text: "..." }.
export interface ScriptSegment {
  label: string;
  text: string;
}

export interface AdCopy {
  headline: string;
  body: string;
  cta: string;
}

// One generated piece for a single platform.
export interface PlatformOutput {
  platform: string;
  framework: string; // framework actually used for this piece
  videoScript?: ScriptSegment[];
  caption?: string;
  hashtags?: string[];
  adCopy?: AdCopy;
}

export interface FrameworkRecommendation {
  frameworks: string[]; // e.g. ["PAS", "AIDA"]
  rationale: string;
}

export interface GenerationResponse {
  recommendation: FrameworkRecommendation;
  outputs: PlatformOutput[];
}
