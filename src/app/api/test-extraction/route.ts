import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Debug environment information
    const nodeVersion = process.version;
    const platform = process.platform;
    
    console.log('🐛 Environment Debug:', {
      nodeVersion,
      platform,
      isVercel: !!process.env.VERCEL,
      environment: process.env.NODE_ENV
    });

    // Test if the modern library can be imported
    const { YoutubeTranscript } = await import('@danielxceron/youtube-transcript');
    
    // Test a simple extraction with browser headers
    const testUrl = 'https://www.youtube.com/watch?v=Hym02GyEI6Q';
    
    console.log('🧪 Testing extraction with timeout handling...');
    
    // Add timeout for Vercel functions
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 8000)
    );
    
    const result = await Promise.race([
      YoutubeTranscript.fetchTranscript(testUrl),
      timeoutPromise
    ]);
    
    return NextResponse.json({
      success: true,
      libraryLoaded: true,
      environment: {
        nodeVersion,
        platform,
        isVercel: !!process.env.VERCEL
      },
      extractedSegments: result?.length || 0,
      firstSegment: result?.[0] || null,
      message: `Library working! Extracted ${result?.length || 0} segments`
    });
    
  } catch (error) {
    console.error('❌ Test extraction failed:', error);
    
    return NextResponse.json({
      success: false,
      libraryLoaded: false,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        isVercel: !!process.env.VERCEL
      },
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Library failed to load or extract'
    });
  }
}