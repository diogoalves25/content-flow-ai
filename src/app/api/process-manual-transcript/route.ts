import { NextRequest, NextResponse } from 'next/server';
import { analyzeTranscript } from '@/lib/transcript-analyzer';

export async function POST(request: NextRequest) {
  try {
    const { transcript, metadata } = await request.json();

    // Validate input
    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: 'Transcript content is required' },
        { status: 400 }
      );
    }

    const cleanedTranscript = transcript.trim();
    
    if (cleanedTranscript.length < 50) {
      return NextResponse.json(
        { error: 'Transcript is too short. Please provide at least 50 characters.' },
        { status: 400 }
      );
    }

    console.log('📝 Processing manual transcript:', {
      title: metadata?.title,
      author: metadata?.author,
      length: cleanedTranscript.length,
      wordCount: cleanedTranscript.split(/\s+/).length
    });

    // Create mock extracted content structure to match existing flow
    const extractedContent = {
      videoId: 'manual-input',
      url: 'manual://transcript-input',
      metadata: {
        title: metadata?.title || 'Manual Transcript Input',
        author: metadata?.author || 'Unknown Author',
        duration: 'Unknown'
      },
      transcript: [{
        text: cleanedTranscript,
        offset: 0,
        duration: 0
      }],
      fullTranscript: cleanedTranscript
    };

    // Analyze transcript with AI
    let analysis = null;
    try {
      console.log('🤖 Starting AI analysis of manual transcript...');
      analysis = await analyzeTranscript(cleanedTranscript);
      console.log('✅ AI analysis completed successfully');
    } catch (analysisError) {
      console.warn('⚠️ AI analysis failed:', analysisError);
      // Continue without analysis - still provide the transcript
    }

    return NextResponse.json({
      success: true,
      data: {
        content: extractedContent,
        analysis: analysis,
        message: 'Manual transcript processed successfully'
      }
    });

  } catch (error) {
    console.error('Error processing manual transcript:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process transcript',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}