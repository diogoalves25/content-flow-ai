import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Debug environment information
    const nodeVersion = process.version;
    const platform = process.platform;
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    
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
    
    console.log('🧪 Testing extraction with InnerTube method...');
    
    // Try InnerTube method first (more reliable on Vercel)
    let result;
    try {
      result = await YoutubeTranscript.fetchTranscriptWithInnerTube(testUrl);
      console.log(`✅ InnerTube method: ${result?.length || 0} segments`);
    } catch (innerTubeError) {
      console.log('⚠️ InnerTube failed, trying default:', innerTubeError.message);
      result = await YoutubeTranscript.fetchTranscript(testUrl);
      console.log(`✅ Default method: ${result?.length || 0} segments`);
    }
    
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