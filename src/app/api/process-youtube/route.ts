import { NextRequest, NextResponse } from 'next/server';
import { extractYouTubeContent, isValidYouTubeUrl } from '@/lib/youtube-extractor';
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
            fullTranscript: extractedContent.fullTranscript
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
        message: 'YouTube content extracted successfully'
      }
    });

  } catch (error) {
    console.error('Error processing YouTube URL:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
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
    
    return NextResponse.json({
      success: true,
      data: {
        videoId: extractedContent.videoId,
        metadata: extractedContent.metadata,
        fullTranscript: extractedContent.fullTranscript,
        transcript: extractedContent.transcript,
        transcriptLength: extractedContent.fullTranscript.length,
        isValid: true
      }
    });

  } catch (error) {
    console.error('Error validating YouTube URL:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to validate YouTube video',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}