import { NextRequest, NextResponse } from 'next/server';
import { extractYouTubeContent, isValidYouTubeUrl } from '@/lib/youtube-extractor';
import { analyzeTranscript } from '@/lib/transcript-analyzer';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { url, userId, title } = await request.json();

    // Validate input
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'YouTube URL is required' },
        { status: 400 }
      );
    }

    if (!isValidYouTubeUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL format' },
        { status: 400 }
      );
    }

    // Extract content from YouTube
    console.log('Extracting YouTube content for:', url);
    const extractedContent = await extractYouTubeContent(url);

    // Analyze transcript if extraction was successful and transcript exists
    let analysis = null;
    if (extractedContent.fullTranscript && extractedContent.fullTranscript.length > 100) {
      console.log('Analyzing transcript with AI...');
      try {
        analysis = await analyzeTranscript(extractedContent.fullTranscript);
        console.log('✅ Transcript analysis completed');
      } catch (analysisError) {
        console.warn('⚠️ Failed to analyze transcript:', analysisError);
        // Continue without analysis - it's not critical
      }
    }

    // Save to database if userId is provided
    let project = null;
    if (userId) {
      project = await prisma.project.create({
        data: {
          userId,
          title: title || extractedContent.metadata.title,
          sourceUrl: url,
          sourceType: 'youtube',
          content: JSON.stringify({
            transcript: extractedContent.transcript,
            fullTranscript: extractedContent.fullTranscript,
            analysis: analysis
          }),
          metadata: JSON.stringify(extractedContent.metadata),
          status: 'completed'
        }
      });

      // Track usage
      await prisma.usage.create({
        data: {
          userId,
          action: 'extract',
          credits: 1,
          metadata: JSON.stringify({
            sourceType: 'youtube',
            videoId: extractedContent.videoId,
            duration: extractedContent.metadata.duration
          })
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        projectId: project?.id,
        content: extractedContent,
        analysis: analysis,
        message: 'YouTube content extracted successfully'
      }
    });

  } catch (error) {
    console.error('Error processing YouTube URL:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    // Check if this is a transcript disabled error
    if (errorMessage.includes('Transcript is disabled')) {
      return NextResponse.json(
        { 
          error: 'Transcript not available',
          details: 'This video does not have captions/transcripts enabled. Please try a different video or use the manual transcript input option.',
          transcriptDisabled: true
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to process YouTube video',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    );
  }

  if (!isValidYouTubeUrl(url)) {
    return NextResponse.json(
      { error: 'Invalid YouTube URL format' },
      { status: 400 }
    );
  }

  try {
    // Just validate and extract basic metadata without saving
    const extractedContent = await extractYouTubeContent(url);
    
    // Analyze transcript for validation requests too
    let analysis = null;
    if (extractedContent.fullTranscript && extractedContent.fullTranscript.length > 100) {
      console.log('Analyzing transcript for validation...');
      try {
        analysis = await analyzeTranscript(extractedContent.fullTranscript);
        console.log('✅ Validation transcript analysis completed');
      } catch (analysisError) {
        console.warn('⚠️ Failed to analyze transcript during validation:', analysisError);
        // Continue without analysis
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        videoId: extractedContent.videoId,
        metadata: extractedContent.metadata,
        fullTranscript: extractedContent.fullTranscript,
        transcript: extractedContent.transcript,
        analysis: analysis,
        transcriptLength: extractedContent.fullTranscript.length,
        isValid: true
      }
    });

  } catch (error) {
    console.error('Error validating YouTube URL:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check if this is a transcript disabled error
    if (errorMessage.includes('Transcript is disabled')) {
      return NextResponse.json(
        { 
          error: 'Transcript not available',
          details: 'This video does not have captions/transcripts enabled. Please try a different video or use the manual transcript input option.',
          transcriptDisabled: true
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to validate YouTube video',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}