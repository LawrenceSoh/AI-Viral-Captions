
import { Platform, Framework, OutputType } from './types';

export const SUPPORTED_PLATFORMS = [
  { id: Platform.TikTok, label: 'TikTok', color: 'from-pink-500 to-cyan-500', hashtagCount: '4-6' },
  { id: Platform.Instagram, label: 'Instagram', color: 'from-purple-500 to-orange-500', hashtagCount: '15-20' },
  { id: Platform.Facebook, label: 'Facebook', color: 'from-blue-600 to-blue-400', hashtagCount: '3-5' },
  { id: Platform.YouTube, label: 'YouTube Shorts', color: 'from-red-600 to-red-500', hashtagCount: '3-5' },
  { id: Platform.Twitter, label: 'X (Twitter)', color: 'from-gray-700 to-black', hashtagCount: '2-3' },
  { id: Platform.LinkedIn, label: 'LinkedIn', color: 'from-blue-700 to-blue-500', hashtagCount: '3-5' },
];

export const OUTPUT_TYPES = [
  {
    id: OutputType.VideoScript,
    label: 'Video Script',
    description: 'Spoken script for short-form video, structured by the framework.',
  },
  {
    id: OutputType.Caption,
    label: 'Caption + Hashtags',
    description: 'Ready-to-post caption with platform-tuned hashtags.',
  },
  {
    id: OutputType.AdCopy,
    label: 'Full Ad Copy',
    description: 'Headline + body + CTA for paid or organic ads.',
  },
];

// Reference data for the copywriting frameworks (used in the UI + docs).
export const FRAMEWORKS = [
  {
    id: Framework.AIDA,
    label: 'AIDA',
    flow: 'Attention → Interest → Desire → Action',
    bestFor: 'Broad, top-of-funnel ads',
  },
  {
    id: Framework.PAS,
    label: 'PAS',
    flow: 'Problem → Agitate → Solution',
    bestFor: 'Pain-point driven, high-converting',
  },
  {
    id: Framework.BAB,
    label: 'BAB',
    flow: 'Before → After → Bridge',
    bestFor: 'Transformation / results stories',
  },
  {
    id: Framework.HSO,
    label: 'HSO',
    flow: 'Hook → Story → Offer',
    bestFor: 'Storytelling & personal brand',
  },
];

export const MAX_IMAGES = 5;
export const MAX_IMAGE_SIZE_MB = 8; // per image, client-side base64 safety margin

export const LOADING_MESSAGES = [
  'Studying your product photos...',
  'Reading the room (your audience)...',
  'Weighing AIDA vs PAS vs BAB vs HSO...',
  'Picking the highest-converting angle...',
  'Writing scroll-stopping hooks...',
  'Tuning copy for each platform...',
  'Polishing your call-to-action...',
];
