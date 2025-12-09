
export enum Platform {
  TikTok = 'TikTok',
  Instagram = 'Instagram (Reels)',
  Facebook = 'Facebook',
  YouTube = 'YouTube Shorts',
  Twitter = 'Twitter (X)',
  LinkedIn = 'LinkedIn'
}

export interface GeneratedPlatformContent {
  platform: string;
  captions: string[];
  hashtags: string[];
}

export interface GenerationResponse {
  results: GeneratedPlatformContent[];
}

export interface AnalysisRequest {
  videoFile: File;
  context?: string;
  platforms: Platform[];
}
