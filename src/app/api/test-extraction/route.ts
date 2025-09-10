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
    
    // Test EXACT same video that works on VideoAuddy.io
    const testUrl = 'https://www.youtube.com/watch?v=Hym02GyEI6Q';
    
    console.log('🧪 DEBUGGING VideoAuddy.io video...');
    console.log('📹 Video URL:', testUrl);
    console.log('📹 Video ID extracted:', testUrl.match(/v=([^&]+)/)?.[1]);
    
    // Test with detailed error logging
    let result;
    let errorDetails;
    
    try {
      console.log('🚀 Calling YoutubeTranscript.fetchTranscript...');
      result = await YoutubeTranscript.fetchTranscript(testUrl);
      console.log('✅ Raw result type:', typeof result);
      console.log('✅ Raw result isArray:', Array.isArray(result));
      console.log('✅ Raw result length:', result?.length);
      console.log('✅ Raw result sample:', result?.[0]);
      
    } catch (error) {
      console.error('❌ DETAILED ERROR ANALYSIS:');
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      console.error('Error message:', (error as any)?.message);
      console.error('Error stack (first 3 lines):', (error as any)?.stack?.split('\n').slice(0, 3));
      console.error('Error keys:', Object.keys(error || {}));
      
      errorDetails = {
        type: typeof error,
        constructor: error?.constructor?.name,
        message: (error as any)?.message,
        keys: Object.keys(error || {})
      };
      
      throw error;
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
      libraryLoaded: true, // Library loads fine, extraction fails
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        isVercel: !!process.env.VERCEL
      },
      videoDetails: {
        url: 'https://www.youtube.com/watch?v=Hym02GyEI6Q',
        videoId: 'Hym02GyEI6Q'
      },
      errorDetails: errorDetails || {
        type: typeof error,
        constructor: error?.constructor?.name,
        message: error?.message
      },
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Library loaded but extraction failed - debugging why VideoAuddy.io works but this doesn\'t'
    });
  }
}