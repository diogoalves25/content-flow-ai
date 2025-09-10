// YouTube transcript extraction with alternative approach
import { YoutubeTranscript } from '@danielxceron/youtube-transcript';

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
 * Extract transcript using direct YouTube API approach (like VideoBuddy.io)
 */
async function extractTranscript(videoId: string): Promise<TranscriptSegment[]> {
  console.log('📹 Direct YouTube API approach for video ID:', videoId);
  
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  try {
    // Step 1: Get the YouTube page with proper headers
    console.log('🔄 Fetching YouTube page...');
    const response = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch video page: ${response.status}`);
    }
    
    const html = await response.text();
    console.log('✅ Got YouTube page HTML');
    
    // Step 2: Extract caption track URLs from the page
    let captionsData = null;
    
    // Look for playerCaptionsTracklistRenderer in the HTML
    const captionTrackRegex = /"playerCaptionsTracklistRenderer":\{"captionTracks":\[(.*?)\]/;
    const captionMatch = html.match(captionTrackRegex);
    
    if (captionMatch) {
      try {
        const captionTracksJson = `[${captionMatch[1]}]`;
        captionsData = JSON.parse(captionTracksJson);
        console.log(`✅ Found ${captionsData.length} caption tracks`);
      } catch (parseError) {
        console.log('❌ Failed to parse caption tracks JSON:', parseError);
      }
    }
    
    if (!captionsData || captionsData.length === 0) {
      // Try alternative extraction method
      const altCaptionRegex = /"captionTracks":\[(.*?)\]/;
      const altMatch = html.match(altCaptionRegex);
      
      if (altMatch) {
        try {
          const altCaptionJson = `[${altMatch[1]}]`;
          captionsData = JSON.parse(altCaptionJson);
          console.log(`✅ Found ${captionsData.length} caption tracks (alt method)`);
        } catch (parseError) {
          console.log('❌ Failed to parse alt caption tracks:', parseError);
        }
      }
    }
    
    if (!captionsData || captionsData.length === 0) {
      throw new Error('No caption tracks found in video page');
    }
    
    // Step 3: Find English caption track
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const englishTrack = captionsData.find((track: any) => 
      track.languageCode === 'en' || 
      track.languageCode === 'en-US' || 
      track.languageCode === 'en-GB' ||
      track.vssId?.includes('en')
    ) || captionsData[0]; // Fallback to first track
    
    if (!englishTrack?.baseUrl) {
      throw new Error('No suitable caption track found');
    }
    
    console.log(`📝 Using caption track: ${englishTrack.name?.simpleText || 'Unknown'}`);
    
    // Step 4: Fetch the caption XML
    const captionResponse = await fetch(englishTrack.baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      }
    });
    
    if (!captionResponse.ok) {
      throw new Error(`Failed to fetch captions: ${captionResponse.status}`);
    }
    
    const captionXml = await captionResponse.text();
    console.log(`✅ Got caption XML (${captionXml.length} characters)`);
    
    // Step 5: Parse the XML
    const segments: TranscriptSegment[] = [];
    const textRegex = /<text start="([^"]*)" dur="([^"]*)"[^>]*>(.*?)<\/text>/g;
    let match;
    
    while ((match = textRegex.exec(captionXml)) !== null) {
      const text = match[3]
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .trim();
      
      if (text) {
        segments.push({
          text,
          offset: parseFloat(match[1]),
          duration: parseFloat(match[2])
        });
      }
    }
    
    console.log(`✅ SUCCESS: Got ${segments.length} transcript segments`);
    console.log(`📝 First segment: "${segments[0]?.text}"`);
    console.log(`📝 Sample text: "${segments[0]?.text?.substring(0, 100)}..."`);
    
    if (segments.length === 0) {
      throw new Error('No transcript segments extracted from XML');
    }
    
    return segments;
    
  } catch (error) {
    console.error('❌ Direct API extraction failed:', error);
    
    // Fallback to @danielxceron/youtube-transcript as backup
    try {
      console.log('🔄 Falling back to @danielxceron/youtube-transcript...');
      const transcript = await YoutubeTranscript.fetchTranscript(videoUrl);
      
      if (transcript && transcript.length > 0) {
        console.log(`✅ FALLBACK SUCCESS: Got ${transcript.length} transcript segments`);
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const segments: TranscriptSegment[] = transcript.map((item: any) => ({
          text: item.text || '',
          offset: parseFloat(item.offset?.toString() || '0'),
          duration: parseFloat(item.duration?.toString() || '0')
        }));
        
        return segments;
      }
    } catch (fallbackError) {
      console.log('❌ Fallback also failed:', fallbackError);
    }
    
    throw error;
  }
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
  console.log('🎯 Starting direct API YouTube content extraction (VideoBuddy.io style) for:', url);

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