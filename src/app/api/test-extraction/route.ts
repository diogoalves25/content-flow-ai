import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Test if the modern library can be imported
    const { YoutubeTranscript } = await import('@danielxceron/youtube-transcript');
    
    // Test a simple extraction
    const testUrl = 'https://www.youtube.com/watch?v=Hym02GyEI6Q';
    const result = await YoutubeTranscript.fetchTranscript(testUrl);
    
    return NextResponse.json({
      success: true,
      libraryLoaded: true,
      extractedSegments: result?.length || 0,
      firstSegment: result?.[0] || null,
      message: `Modern library working! Extracted ${result?.length || 0} segments`
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      libraryLoaded: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Modern library failed to load or extract'
    });
  }
}