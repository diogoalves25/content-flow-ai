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
    console.warn('Failed to fetch video metadata:', error);
    return {
      title: 'Unknown Title',
      author: 'Unknown Author',
      duration: 'Unknown'
    };
  }
}


/**
 * Extract transcript from YouTube video using multiple fallback methods
 */
async function extractTranscript(videoId: string): Promise<TranscriptSegment[]> {
  console.log('Extracting transcript for video ID:', videoId);
  
  // Multiple extraction strategies to try
  const strategies = [
    // Strategy 1: Default English
    async () => {
      console.log('Trying strategy 1: Default English');
      return await YoutubeTranscript.fetchTranscript(videoId);
    },
    
    // Strategy 2: Explicit English with config
    async () => {
      console.log('Trying strategy 2: Explicit English with config');
      return await YoutubeTranscript.fetchTranscript(videoId, {
        lang: 'en'
      });
    },
    
    // Strategy 3: Auto-generated English
    async () => {
      console.log('Trying strategy 3: Auto-generated English');
      return await YoutubeTranscript.fetchTranscript(videoId, {
        lang: 'en-US'
      });
    },
    
    // Strategy 4: Any available language
    async () => {
      console.log('Trying strategy 4: Any available language');
      return await YoutubeTranscript.fetchTranscript(videoId, {
        lang: ''
      });
    }
  ];

  let lastError: Error | null = null;
  
  // Try each strategy
  for (let i = 0; i < strategies.length; i++) {
    try {
      const transcript = await strategies[i]();
      
      if (transcript && Array.isArray(transcript) && transcript.length > 0) {
        // Convert to our format
        const segments: TranscriptSegment[] = transcript.map((item: { 
          text?: string; 
          offset?: number; 
          duration?: number;
          start?: number;
        }) => ({
          text: String(item.text || '').trim(),
          offset: typeof item.offset === 'number' ? item.offset : 
                  typeof item.start === 'number' ? item.start : 0,
          duration: typeof item.duration === 'number' ? item.duration : 0
        })).filter(segment => segment.text.length > 0);
        
        if (segments.length > 0) {
          console.log(`Successfully extracted ${segments.length} transcript segments using strategy ${i + 1}`);
          return segments;
        }
      }
      
      throw new Error('Empty or invalid transcript data');
      
    } catch (error) {
      console.warn(`Strategy ${i + 1} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Wait a bit before trying next strategy
      if (i < strategies.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  
  // If all strategies failed, throw the last error
  console.error('All transcript extraction strategies failed. Last error:', lastError);
  throw new Error(
    lastError?.message?.includes('Could not retrieve') 
      ? 'This video does not have captions enabled or transcripts are not available'
      : 'Failed to extract transcript. The video may not have captions enabled.'
  );
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
    // Always try to get metadata first
    const metadata = await getVideoMetadata(videoId);
    
    // Try to extract transcript, but don't fail if it's not available
    let transcriptSegments: TranscriptSegment[] = [];
    let fullTranscript = '';
    
    try {
      console.log(`Starting transcript extraction for video: ${metadata.title}`);
      transcriptSegments = await extractTranscript(videoId);
      fullTranscript = combineTranscript(transcriptSegments);
      console.log(`✅ Successfully extracted transcript with ${transcriptSegments.length} segments (${fullTranscript.length} characters)`);
    } catch (transcriptError) {
      console.warn('❌ All transcript extraction methods failed:', transcriptError);
      
      // Provide detailed fallback message with instructions
      const errorMessage = transcriptError instanceof Error ? transcriptError.message : 'Unknown error';
      fullTranscript = `[Automatic transcript extraction failed: ${errorMessage}

To get high-quality content generation, please:
1. Go to the YouTube video
2. Click the "..." menu below the video  
3. Select "Show transcript"
4. Copy the full transcript
5. Paste it in the manual input area below

This will ensure the best possible content generation results.]`;
      
      transcriptSegments = [{
        text: fullTranscript,
        offset: 0,
        duration: 0
      }];
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