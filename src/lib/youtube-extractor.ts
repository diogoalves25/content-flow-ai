import { YoutubeTranscript } from 'youtube-transcript';

export interface VideoMetadata {
  title: string;
  author: string;
  duration: string;
  views?: string;
  uploadDate?: string;
  description?: string;
  thumbnails?: string[];
}

export interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
}

export interface ExtractedContent {
  videoId: string;
  url: string;
  metadata: VideoMetadata;
  transcript: TranscriptSegment[];
  fullTranscript: string;
  summary?: string;
}

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractVideoId(url: string): string | null {
  const regexes = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];

  for (const regex of regexes) {
    const match = url.match(regex);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Validate YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  return extractVideoId(url) !== null;
}

/**
 * Get video metadata using YouTube oEmbed API (no API key required)
 */
async function getVideoMetadata(videoId: string): Promise<VideoMetadata> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl);
    
    if (!response.ok) {
      throw new Error('Failed to fetch video metadata');
    }

    const data = await response.json();
    
    return {
      title: data.title || 'Unknown Title',
      author: data.author_name || 'Unknown Author',
      duration: 'Unknown', // oEmbed doesn't provide duration
      thumbnails: [data.thumbnail_url].filter(Boolean)
    };
  } catch (error) {
    console.warn('Failed to fetch metadata:', error);
    return {
      title: 'Unknown Title',
      author: 'Unknown Author',
      duration: 'Unknown'
    };
  }
}

/**
 * Extract transcript from YouTube video
 */
async function extractTranscript(videoId: string): Promise<TranscriptSegment[]> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    
    return transcript.map((item: { text: string; offset: number; duration: number }) => ({
      text: item.text,
      offset: item.offset,
      duration: item.duration
    }));
  } catch (error) {
    console.error('Failed to extract transcript:', error);
    throw new Error(
      'Failed to extract transcript. The video may not have captions available, ' +
      'or the video might be private/restricted.'
    );
  }
}

/**
 * Combine transcript segments into full text
 */
function combineTranscript(segments: TranscriptSegment[]): string {
  return segments
    .map(segment => segment.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Main function to extract complete content from YouTube URL
 */
export async function extractYouTubeContent(url: string): Promise<ExtractedContent> {
  const videoId = extractVideoId(url);
  
  if (!videoId) {
    throw new Error('Invalid YouTube URL format');
  }

  try {
    // Extract both metadata and transcript in parallel
    const [metadata, transcriptSegments] = await Promise.all([
      getVideoMetadata(videoId),
      extractTranscript(videoId)
    ]);

    const fullTranscript = combineTranscript(transcriptSegments);

    if (!fullTranscript || fullTranscript.length < 10) {
      throw new Error('Transcript is too short or empty. Video may not have proper captions.');
    }

    return {
      videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      metadata,
      transcript: transcriptSegments,
      fullTranscript
    };
  } catch (error) {
    console.error('Error extracting YouTube content:', error);
    throw error;
  }
}

/**
 * Get transcript duration in human-readable format
 */
export function getTranscriptDuration(segments: TranscriptSegment[]): string {
  if (segments.length === 0) return '0:00';
  
  const lastSegment = segments[segments.length - 1];
  const totalSeconds = Math.round((lastSegment.offset + lastSegment.duration) / 1000);
  
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Chunk transcript for better processing
 */
export function chunkTranscript(
  fullTranscript: string, 
  maxChunkLength: number = 2000
): string[] {
  if (fullTranscript.length <= maxChunkLength) {
    return [fullTranscript];
  }

  const sentences = fullTranscript.split(/[.!?]+/).filter(s => s.trim());
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;

    const potentialChunk = currentChunk 
      ? `${currentChunk}. ${trimmedSentence}`
      : trimmedSentence;

    if (potentialChunk.length <= maxChunkLength) {
      currentChunk = potentialChunk;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = trimmedSentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(chunk => chunk.length > 0);
}