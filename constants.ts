
import { Platform } from './types';

export const SUPPORTED_PLATFORMS = [
  { id: Platform.TikTok, label: 'TikTok', color: 'from-pink-500 to-cyan-500', hashtagCount: '4-6' },
  { id: Platform.Instagram, label: 'Instagram', color: 'from-purple-500 to-orange-500', hashtagCount: '15-20' },
  { id: Platform.Facebook, label: 'Facebook', color: 'from-blue-600 to-blue-400', hashtagCount: '3-5' },
  { id: Platform.YouTube, label: 'YouTube Shorts', color: 'from-red-600 to-red-500', hashtagCount: '3-5' },
  { id: Platform.Twitter, label: 'X (Twitter)', color: 'from-gray-700 to-black', hashtagCount: '2-3' },
  { id: Platform.LinkedIn, label: 'LinkedIn', color: 'from-blue-700 to-blue-500', hashtagCount: '3-5' },
];

export const MAX_VIDEO_SIZE_MB = 45; // Client-side base64 limit safety margin

export const LOADING_MESSAGES = [
  "Watching your video...",
  "Listening to the audio track...",
  "Analyzing the vibe...",
  "Detecting trending topics...",
  "Crafting perfect hooks...",
  "Optimizing for algorithms...",
  "Finalizing hashtags..."
];
