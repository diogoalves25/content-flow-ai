import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // EXACT minimal implementation Alex would use
    const { YoutubeTranscript } = await import('@danielxceron/youtube-transcript');
    
    console.log('🔬 MINIMAL TEST - Exactly like Alex would code it');
    
    // Just call the package exactly as shown in documentation
    const transcript = await YoutubeTranscript.fetchTranscript('https://www.youtube.com/watch?v=Hym02GyEI6Q');
    
    console.log('Result:', transcript);
    
    return NextResponse.json({
      success: true,
      transcriptLength: transcript?.length || 0,
      firstSegment: transcript?.[0] || null,
      message: 'Minimal implementation test'
    });
    
  } catch (error) {
    console.error('Minimal test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}