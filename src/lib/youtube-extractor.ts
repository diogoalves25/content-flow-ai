import { YoutubeTranscript } from 'youtube-transcript';
import ytdl from 'ytdl-core';

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
    // First try oEmbed API
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl);
    
    if (!response.ok) {
      throw new Error('oEmbed failed, trying alternative method...');
    }

    const data = await response.json();
    
    return {
      title: data.title || 'Unknown Title',
      author: data.author_name || 'Unknown Author',
      duration: 'Unknown', // oEmbed doesn't provide duration
      thumbnails: [data.thumbnail_url].filter(Boolean)
    };
  } catch (error) {
    console.warn('oEmbed failed, trying ytdl-core...', error);
    
    // Fallback to ytdl-core
    try {
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const info = await ytdl.getBasicInfo(videoUrl);
      
      return {
        title: info.videoDetails.title || 'Unknown Title',
        author: info.videoDetails.author?.name || 'Unknown Author',
        duration: info.videoDetails.lengthSeconds ? 
          formatDuration(parseInt(info.videoDetails.lengthSeconds)) : 'Unknown',
        views: info.videoDetails.viewCount,
        uploadDate: info.videoDetails.uploadDate,
        description: info.videoDetails.shortDescription?.substring(0, 500),
        thumbnails: info.videoDetails.thumbnails?.map(t => t.url) || []
      };
    } catch (ytdlError) {
      console.warn('ytdl-core also failed:', ytdlError);
      return {
        title: 'Unknown Title',
        author: 'Unknown Author',
        duration: 'Unknown'
      };
    }
  }
}

/**
 * Format duration from seconds to human readable
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Extract transcript from YouTube video
 */
async function extractTranscript(videoId: string): Promise<TranscriptSegment[]> {
  try {
    console.log('Fetching transcript for video ID:', videoId);
    
    // Try multiple approaches to get transcripts
    let transcript = null;
    
    try {
      // First try: Default approach
      transcript = await YoutubeTranscript.fetchTranscript(videoId);
      console.log('Default fetch - transcript segments:', transcript?.length || 0);
    } catch (error) {
      console.log('Default fetch failed, trying with language options...');
      
      try {
        // Second try: With language options
        transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
        console.log('Language-specific fetch - transcript segments:', transcript?.length || 0);
      } catch (error2) {
        console.log('Language-specific fetch failed, trying any available language...');
        
        // Third try: Get any available transcript
        transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: '' });
        console.log('Any language fetch - transcript segments:', transcript?.length || 0);
      }
    }
    
    if (!transcript || transcript.length === 0) {
      throw new Error('No transcript segments returned from YouTube after trying multiple methods');
    }
    
    return transcript.map((item: { text: string; offset: number; duration: number }) => ({
      text: item.text,
      offset: item.offset,
      duration: item.duration
    }));
  } catch (error) {
    console.error('Failed to extract transcript for video ID:', videoId, error);
    throw new Error(
      'Failed to extract transcript. The video may not have captions available, ' +
      'or the video might be private/restricted. Error: ' + (error instanceof Error ? error.message : String(error))
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
    // Get metadata first
    const metadata = await getVideoMetadata(videoId);
    
    // Try to get transcript, but don't fail if it's not available
    let transcriptSegments: TranscriptSegment[] = [];
    let fullTranscript = '';
    
    try {
      transcriptSegments = await extractTranscript(videoId);
      fullTranscript = combineTranscript(transcriptSegments);
    } catch (transcriptError) {
      console.warn('Transcript extraction failed, continuing with metadata only:', transcriptError);
      // Set fullTranscript to empty so the fallback logic below kicks in
      fullTranscript = '';
    }

    if (!fullTranscript || fullTranscript.length < 10) {
      console.warn('No transcript available, but video metadata was fetched successfully');
      // Instead of throwing an error, return basic info with note about transcript
      return {
        videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        metadata: {
          ...metadata,
          duration: metadata.duration || 'Unknown'
        },
        transcript: [],
        fullTranscript: `[No transcript available for this video]

Video Title: ${metadata.title}
Author: ${metadata.author}
Duration: ${metadata.duration}

This video does not have accessible captions/subtitles. You can still generate content based on the title and description, but transcript-based content generation won't be available.

To get better results, try videos with:
• Auto-generated captions enabled
• Manual subtitles/closed captions  
• Educational or tutorial content (typically has better caption availability)`,
        summary: `Video: "${metadata.title}" by ${metadata.author}. No transcript available, but you can still generate content based on the title and video metadata.`
      };
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