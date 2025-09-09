// Modern YouTube transcript extraction using Innertube API
import { YoutubeTranscript as ModernYoutubeTranscript } from '@danielxceron/youtube-transcript';

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
 * Extract transcript using modern Innertube API
 */
async function extractTranscript(videoId: string): Promise<TranscriptSegment[]> {
  console.log('🚀 MODERN EXTRACTION for video ID:', videoId);
  
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  console.log('🚀 Using modern @danielxceron/youtube-transcript with Innertube API');
  
  const transcriptData = await ModernYoutubeTranscript.fetchTranscript(videoUrl);
  
  if (!transcriptData || !Array.isArray(transcriptData) || transcriptData.length === 0) {
    throw new Error('No transcript data returned from modern API');
  }

  console.log(`✅ SUCCESS: Extracted ${transcriptData.length} transcript segments using modern API`);
  console.log(`📝 First segment sample: "${transcriptData[0].text?.substring(0, 100)}..."`);
  
  // Convert to our format
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const segments: TranscriptSegment[] = transcriptData.map((item: any) => ({
    text: item.text || '',
    offset: parseFloat(item.offset?.toString() || '0'),
    duration: parseFloat(item.duration?.toString() || '0')
  }));

  return segments;
}

/**
 * Extract basic video metadata from YouTube page
 */
async function extractVideoMetadata(videoId: string): Promise<VideoMetadata> {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  try {
    const response = await fetch(videoUrl);
    const html = await response.text();
    
    // Extract basic metadata
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    const title = titleMatch?.[1]?.replace(' - YouTube', '') || 'Unknown Title';
    
    const authorMatch = html.match(/"ownerChannelName":"([^"]*)"/) || 
                      html.match(/"author":"([^"]*)"/) ||
                      html.match(/<meta name="author" content="([^"]*)">/);
    const author = authorMatch?.[1] || 'Unknown Author';
    
    return {
      title,
      author,
      duration: 'Unknown',
      thumbnails: [`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`]
    };
  } catch (error) {
    console.warn('Failed to extract metadata:', error);
    return {
      title: 'Unknown Title',
      author: 'Unknown Author', 
      duration: 'Unknown',
      thumbnails: [`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`]
    };
  }
}

/**
 * Main function to extract YouTube content
 */
export async function extractYouTubeContent(url: string): Promise<ExtractedContent> {
  console.log('🎯 Starting YouTube content extraction for:', url);

  // Extract video ID
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL provided');
  }

  // Extract metadata and transcript in parallel
  const [metadata, transcriptSegments] = await Promise.all([
    extractVideoMetadata(videoId),
    extractTranscript(videoId)
  ]);

  // Create full transcript text
  const fullTranscript = transcriptSegments.map(segment => segment.text).join(' ');

  console.log('✅ Successfully extracted YouTube content:', {
    videoId,
    segmentCount: transcriptSegments.length,
    transcriptLength: fullTranscript.length
  });

  return {
    videoId,
    url,
    metadata,
    transcript: transcriptSegments,
    fullTranscript,
  };
}