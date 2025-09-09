import { YoutubeTranscript } from 'youtube-transcript';
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
 * Parse YouTube caption XML into transcript segments
 */
function parseYouTubeCaptionXML(xmlContent: string): TranscriptSegment[] {
  console.log('🔍 XML Parser Debug - Content length:', xmlContent.length);
  console.log('🔍 XML contains <text tags:', xmlContent.includes('<text'));
  
  const segments: TranscriptSegment[] = [];
  
  // Multiple regex patterns to handle different XML formats
  const patterns = [
    // Standard YouTube format: <text start="123.45" dur="2.34">Text content</text>
    /<text[^>]*start="([^"]*)"[^>]*dur="([^"]*)"[^>]*>(.*?)<\/text>/g,
    
    // Alternative format: <text start="123.45" duration="2.34">Text content</text>  
    /<text[^>]*start="([^"]*)"[^>]*duration="([^"]*)"[^>]*>(.*?)<\/text>/g,
    
    // Without closing tag: <text start="123.45" dur="2.34">Text content
    /<text[^>]*start="([^"]*)"[^>]*dur="([^"]*)"[^>]*>([^<]*)/g,
    
    // Simple format with just text: <text>Content</text>
    /<text[^>]*>(.*?)<\/text>/g,
    
    // Self-closing format: <text start="123" dur="2" text="Content"/>
    /<text[^>]*start="([^"]*)"[^>]*dur="([^"]*)"[^>]*text="([^"]*)"/g
  ];
  
  let totalMatches = 0;
  
  for (let i = 0; i < patterns.length; i++) {
    const regex = patterns[i];
    let match;
    let matchCount = 0;
    
    console.log(`🔍 Trying pattern ${i + 1}:`, regex.toString());
    
    while ((match = regex.exec(xmlContent)) !== null) {
      matchCount++;
      totalMatches++;
      
      let startTime = 0;
      let duration = 3000; // Default 3 seconds
      let text = '';
      
      if (match.length === 4) {
        // Has start, dur, and text
        startTime = parseFloat(match[1]) * 1000;
        duration = parseFloat(match[2]) * 1000;
        text = cleanXMLText(match[3]);
      } else if (match.length === 2) {
        // Just text content
        text = cleanXMLText(match[1]);
        startTime = segments.length * 3000; // Estimate timing
      }
      
      if (text.length > 0) {
        segments.push({
          text,
          offset: startTime,
          duration
        });
        
        if (matchCount <= 3) {
          console.log(`📝 Sample match ${matchCount}:`, { text: text.substring(0, 50), startTime, duration });
        }
      }
    }
    
    console.log(`🔍 Pattern ${i + 1} found ${matchCount} matches`);
    
    if (segments.length > 0) {
      console.log(`✅ Success with pattern ${i + 1}! Found ${segments.length} segments total`);
      break; // Stop at first successful pattern
    }
  }
  
  console.log(`📊 XML Parser Results: ${segments.length} segments from ${totalMatches} total matches`);
  
  if (segments.length === 0) {
    console.log('❌ No segments extracted. Raw XML sample:');
    console.log(xmlContent.substring(0, 1000));
  }
  
  return segments;
}

/**
 * Clean XML text content
 */
function cleanXMLText(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
 * Extract transcript from YouTube video using multiple robust fallback methods
 */
async function extractTranscript(videoId: string): Promise<TranscriptSegment[]> {
  console.log('🚀 Starting transcript extraction for video ID:', videoId);
  
  const strategies = [
    // Strategy 1: Modern @danielxceron/youtube-transcript with Innertube API fallback
    async () => {
      console.log('🚀 Strategy 1: Modern youtube-transcript with Innertube API fallback');
      try {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const transcriptData = await ModernYoutubeTranscript.fetchTranscript(videoUrl);
        
        if (!transcriptData || !Array.isArray(transcriptData) || transcriptData.length === 0) {
          throw new Error('No transcript data returned from modern API');
        }

        console.log(`✅ Successfully extracted ${transcriptData.length} transcript segments using modern API`);
        console.log(`📝 First segment sample: "${transcriptData[0].text?.substring(0, 100)}..."`);
        
        // Convert to our format
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const segments: TranscriptSegment[] = transcriptData.map((item: any) => ({
          text: item.text || '',
          offset: parseFloat(item.offset?.toString() || '0'),
          duration: parseFloat(item.duration?.toString() || '0')
        }));

        return segments;
      } catch (error) {
        console.warn('❌ Modern youtube-transcript strategy failed:', error);
        throw error;
      }
    },

    // Strategy 2: Direct YouTube timedtext API call
    async () => {
      console.log('📡 Strategy 2: Direct YouTube timedtext API');
      try {
        // First get video page to extract caption data
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const pageResponse = await fetch(videoUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (!pageResponse.ok) {
          throw new Error(`Failed to fetch video page: ${pageResponse.status}`);
        }
        
        const html = await pageResponse.text();
        console.log('✅ Got video page, extracting caption info...');
        
        // Extract caption tracks from player response
        const playerResponseMatch = html.match(/var ytInitialPlayerResponse = ({.*?});/);
        if (!playerResponseMatch) {
          throw new Error('Could not find player response in page');
        }
        
        const playerResponse = JSON.parse(playerResponseMatch[1]);
        const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
        
        if (!captionTracks || captionTracks.length === 0) {
          throw new Error('No caption tracks found in player response');
        }
        
        console.log(`🎯 Found ${captionTracks.length} caption tracks`);
        
        // Prefer English, fallback to first available
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const englishTrack = captionTracks.find((track: any) => 
          track.languageCode === 'en' || track.languageCode?.startsWith('en')
        );
        const selectedTrack = englishTrack || captionTracks[0];
        
        console.log(`📝 Using track: ${selectedTrack.name?.simpleText || selectedTrack.languageCode}`);
        
        // Get caption content
        const captionUrl = selectedTrack.baseUrl;
        const captionResponse = await fetch(captionUrl);
        
        if (!captionResponse.ok) {
          throw new Error(`Failed to fetch captions: ${captionResponse.status}`);
        }
        
        const xmlContent = await captionResponse.text();
        console.log('✅ Got caption XML, parsing...');
        
        // DEBUG: Log actual XML content to see structure
        console.log('🔍 XML Sample (first 500 chars):', xmlContent.substring(0, 500));
        console.log('🔍 XML Sample (last 500 chars):', xmlContent.substring(Math.max(0, xmlContent.length - 500)));
        
        return parseYouTubeCaptionXML(xmlContent);
        
      } catch (error) {
        console.warn('❌ Direct API strategy failed:', error);
        throw error;
      }
    },
    
    // Strategy 2: youtube-transcript with custom config
    async () => {
      console.log('📚 Strategy 2: youtube-transcript (enhanced)');
      try {
        // Try with different language configurations - the logs show 'en' is available!
        const configs = [
          undefined, // Auto-detect first (this often works best)
          { lang: 'en' },
          { lang: '' }, // Any language
          { lang: 'en-US' }, 
          { lang: 'en-GB' }
        ];
        
        for (const config of configs) {
          try {
            console.log(`🔄 Trying config:`, config || 'auto-detect');
            const transcript = await YoutubeTranscript.fetchTranscript(videoId, config);
            
            console.log(`📊 Raw transcript result:`, {
              hasData: !!transcript,
              isArray: Array.isArray(transcript),
              length: transcript?.length,
              firstItem: transcript?.[0]
            });
            
            if (transcript && transcript.length > 0) {
              console.log(`✅ Success with config ${JSON.stringify(config)}: ${transcript.length} segments`);
              console.log(`📝 First few segments:`, transcript.slice(0, 3));
              
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const processedSegments = transcript.map((item: any) => ({
                text: String(item.text || '').trim(),
                offset: typeof item.offset === 'number' ? item.offset : 
                       typeof item.start === 'number' ? item.start * 1000 : 0, // Convert to ms
                duration: typeof item.duration === 'number' ? item.duration : 
                         typeof item.dur === 'number' ? item.dur * 1000 : 3000 // Convert to ms
              })).filter(segment => segment.text.length > 0);
              
              console.log(`🎯 Processed segments:`, processedSegments.length);
              console.log(`📝 Sample processed:`, processedSegments.slice(0, 2));
              
              return processedSegments;
            }
          } catch (configError) {
            console.log(`⚠️ Config ${JSON.stringify(config)} failed:`, (configError as Error).message);
            continue;
          }
        }
        
        throw new Error('All youtube-transcript configurations failed');
      } catch (error) {
        console.warn('❌ youtube-transcript strategy failed:', error);
        throw error;
      }
    },
    
    // Strategy 3: Alternative API approach with video metadata
    async () => {
      console.log('🔍 Strategy 3: Alternative metadata extraction');
      try {
        // Try to get video info from oEmbed and cross-reference with transcript APIs
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const oembedResponse = await fetch(oembedUrl);
        
        if (!oembedResponse.ok) {
          throw new Error('Video not accessible via oEmbed');
        }
        
        const oembedData = await oembedResponse.json();
        console.log(`📹 Video confirmed: "${oembedData.title}" by ${oembedData.author_name}`);
        
        // Now try to get captions using a different approach
        const timedTextUrl = `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}`;
        const timedTextResponse = await fetch(timedTextUrl);
        
        if (timedTextResponse.ok) {
          const xmlContent = await timedTextResponse.text();
          console.log('✅ Got timedtext XML, parsing...');
          
          // DEBUG: Log actual XML content
          console.log('🔍 Timedtext XML Sample (first 500 chars):', xmlContent.substring(0, 500));
          
          return parseYouTubeCaptionXML(xmlContent);
        }
        
        throw new Error('No accessible caption endpoints found');
      } catch (error) {
        console.warn('❌ Alternative metadata strategy failed:', error);
        throw error;
      }
    },
    
    // Strategy 4: Last resort with ytdl-core (might fail in serverless)
    async () => {
      console.log('🔧 Strategy 4: ytdl-core (last resort)');
      try {
        const ytdl = await import('ytdl-core');
        const info = await ytdl.default.getInfo(`https://www.youtube.com/watch?v=${videoId}`);
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const captionTracks = (info as any).player_response?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
        if (!captionTracks?.length) {
          throw new Error('No caption tracks in ytdl response');
        }
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const selectedTrack = captionTracks.find((track: any) => 
          track.languageCode === 'en' || track.languageCode?.startsWith('en')
        ) || captionTracks[0];
        
        const captionResponse = await fetch(selectedTrack.baseUrl);
        const xmlContent = await captionResponse.text();
        
        return parseYouTubeCaptionXML(xmlContent);
      } catch (error) {
        console.warn('❌ ytdl-core strategy failed:', error);
        throw error;
      }
    }
  ];

  let lastError: Error | null = null;
  const startTime = Date.now();
  
  // Try each strategy with detailed logging
  for (let i = 0; i < strategies.length; i++) {
    const strategyStartTime = Date.now();
    console.log(`\n🎯 Attempting strategy ${i + 1}/${strategies.length}...`);
    
    try {
      const transcript = await strategies[i]();
      const strategyDuration = Date.now() - strategyStartTime;
      
      console.log(`⏱️ Strategy ${i + 1} took ${strategyDuration}ms`);
      console.log(`📊 Result:`, { 
        hasTranscript: !!transcript, 
        isArray: Array.isArray(transcript), 
        length: transcript?.length || 0,
        sampleText: transcript?.[0]?.text?.substring(0, 50) || 'N/A'
      });

      if (transcript && Array.isArray(transcript) && transcript.length > 0) {
        // Validate and clean segments
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const validSegments = transcript.filter((item: any) => 
          item && typeof item.text === 'string' && item.text.trim().length > 0
        );
        
        if (validSegments.length > 0) {
          const totalDuration = Date.now() - startTime;
          console.log(`\n🎉 SUCCESS! Strategy ${i + 1} extracted ${validSegments.length} segments in ${totalDuration}ms`);
          console.log(`📝 Sample text: "${validSegments[0].text.substring(0, 100)}..."`);
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return validSegments.map((item: any) => ({
            text: String(item.text).trim(),
            offset: typeof item.offset === 'number' ? item.offset : 
                    typeof item.start === 'number' ? item.start : 0,
            duration: typeof item.duration === 'number' ? item.duration : 
                     typeof item.dur === 'number' ? item.dur : 0
          }));
        }
        
        console.log(`⚠️ Strategy ${i + 1}: Got ${transcript.length} items but no valid text content`);
      }
      
      // Empty array might mean no captions available
      if (Array.isArray(transcript) && transcript.length === 0) {
        throw new Error('Video has no captions available');
      }
      
      throw new Error('Invalid transcript format received');
      
    } catch (error) {
      const strategyDuration = Date.now() - strategyStartTime;
      console.warn(`❌ Strategy ${i + 1} failed after ${strategyDuration}ms:`, (error as Error).message);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Brief pause before next strategy
      if (i < strategies.length - 1) {
        console.log('⏸️ Waiting 200ms before next strategy...');
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  }
  
  // If all strategies failed, provide detailed feedback
  const totalDuration = Date.now() - startTime;
  console.error(`\n💥 ALL STRATEGIES FAILED after ${totalDuration}ms`);
  console.error('Last error:', lastError?.message);
  
  // Determine if video likely has no captions vs extraction failure
  const noCaptionsIndicators = [
    'no captions',
    'no caption tracks',
    'captions disabled',
    'transcript is disabled'
  ];
  
  const isNoCaptions = noCaptionsIndicators.some(indicator => 
    lastError?.message?.toLowerCase().includes(indicator)
  );
  
  if (isNoCaptions) {
    throw new Error('This video does not have captions/subtitles enabled. Please try a different video with captions or use manual transcript input.');
  }
  
  // Technical extraction failure
  throw new Error(`Failed to extract transcript from this video after trying ${strategies.length} different methods. This could be due to:
• Video privacy restrictions
• Captions in unsupported format
• YouTube API limitations
• Network connectivity issues

Please try:
1. A different video with confirmed captions
2. Manual transcript input
3. Refresh and try again`);
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