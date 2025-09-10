import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔬 EXACT VideoAuddy.io approach on Vercel...');
    
    const { YoutubeTranscript } = await import('@danielxceron/youtube-transcript');
    
    console.log('📹 Testing video: https://www.youtube.com/watch?v=Hym02GyEI6Q');
    
    // EXACT same call that works locally
    const result = await YoutubeTranscript.fetchTranscript('https://www.youtube.com/watch?v=Hym02GyEI6Q');
    
    console.log('✅ SUCCESS on Vercel!');
    console.log('Segments:', result?.length);
    console.log('First segment:', result?.[0]);
    
    return NextResponse.json({
      success: true,
      segments: result?.length || 0,
      firstSegment: result?.[0] || null,
      sampleText: result?.map((s: { text: string }) => s.text).join(' ').substring(0, 200),
      message: 'VideoAuddy.io approach works on Vercel!'
    });
    
  } catch (error) {
    console.log('❌ FAILED on Vercel - DETAILED ERROR:');
    console.log('Error type:', typeof error);
    console.log('Error name:', error instanceof Error ? error.constructor?.name : 'Unknown');
    console.log('Error message:', error instanceof Error ? error.message : 'Unknown');
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      errorType: typeof error,
      errorName: error instanceof Error ? error.constructor?.name : 'Unknown',
      message: 'This exact code works locally but fails on Vercel - finding real bug'
    });
  }
}