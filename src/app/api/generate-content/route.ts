import { NextRequest, NextResponse } from 'next/server';
import { generateTwitterThread, TwitterGenerationOptions, TwitterThread } from '@/lib/generators/twitter-generator';
import { generateLinkedInPost, LinkedInGenerationOptions, LinkedInPost } from '@/lib/generators/linkedin-generator';
import { generateInstagramPost, InstagramGenerationOptions, InstagramPost } from '@/lib/generators/instagram-generator';
import { generateBlogPost, BlogGenerationOptions, BlogPost } from '@/lib/generators/blog-generator';
import { prisma } from '@/lib/prisma';

interface GenerateContentRequest {
  content: string;
  platform: 'twitter' | 'linkedin' | 'instagram' | 'blog';
  projectId?: string;
  userId?: string;
  options?: TwitterGenerationOptions | LinkedInGenerationOptions | InstagramGenerationOptions | BlogGenerationOptions | Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  try {
    const { 
      content, 
      platform, 
      projectId, 
      userId, 
      options = {} 
    }: GenerateContentRequest = await request.json();

    // Validate input
    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform is required' },
        { status: 400 }
      );
    }

    const supportedPlatforms = ['twitter', 'linkedin', 'instagram', 'blog'];
    if (!supportedPlatforms.includes(platform)) {
      return NextResponse.json(
        { error: `Platform must be one of: ${supportedPlatforms.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate content based on platform
    let generatedContent: TwitterThread | LinkedInPost | InstagramPost | BlogPost | Record<string, unknown>;
    let promptUsed = '';

    console.log(`Generating ${platform} content...`);
    console.log('Content received:', content.substring(0, 200) + '...');
    console.log('Content length:', content.length);
    console.log('Is content a fallback message?', content.includes('[No transcript available'));
    console.log('Platform:', platform);

    switch (platform) {
      case 'twitter':
        generatedContent = await generateTwitterThread(content, options as TwitterGenerationOptions);
        promptUsed = 'twitter_thread_v1';
        break;

      case 'linkedin':
        generatedContent = await generateLinkedInPost(content, options as LinkedInGenerationOptions);
        promptUsed = 'linkedin_post_v1';
        break;

      case 'instagram':
        generatedContent = await generateInstagramPost(content, options as InstagramGenerationOptions);
        promptUsed = 'instagram_post_v1';
        break;

      case 'blog':
        generatedContent = await generateBlogPost(content, options as BlogGenerationOptions);
        promptUsed = 'blog_post_v1';
        break;

      default:
        return NextResponse.json(
          { error: 'Unsupported platform' },
          { status: 400 }
        );
    }

    // Save generation to database if projectId is provided
    let generation = null;
    if (projectId) {
      generation = await prisma.generation.create({
        data: {
          projectId,
          platform,
          content: JSON.stringify(generatedContent),
          metadata: JSON.stringify({
            options,
            generatedAt: new Date().toISOString(),
            platform,
            contentLength: content.length
          }),
          promptUsed
        }
      });

      // Track usage if userId is provided
      if (userId) {
        await prisma.usage.create({
          data: {
            userId,
            action: 'generate',
            credits: getCreditsForPlatform(platform),
            metadata: JSON.stringify({
              platform,
              generationId: generation.id,
              contentLength: content.length
            })
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        generationId: generation?.id,
        platform,
        content: generatedContent,
        metadata: {
          promptUsed,
          options,
          createdAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Error generating content:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to generate content',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const projectId = searchParams.get('projectId');
  const userId = searchParams.get('userId');
  const platform = searchParams.get('platform');

  try {
    let generations;

    if (projectId) {
      // Get generations for a specific project
      generations = await prisma.generation.findMany({
        where: { 
          projectId,
          ...(platform && { platform })
        },
        orderBy: { createdAt: 'desc' },
        include: {
          project: {
            select: {
              title: true,
              sourceUrl: true,
              sourceType: true
            }
          }
        }
      });
    } else if (userId) {
      // Get all generations for a user
      generations = await prisma.generation.findMany({
        where: { 
          project: { userId },
          ...(platform && { platform })
        },
        orderBy: { createdAt: 'desc' },
        include: {
          project: {
            select: {
              title: true,
              sourceUrl: true,
              sourceType: true
            }
          }
        },
        take: 50 // Limit to recent 50 generations
      });
    } else {
      return NextResponse.json(
        { error: 'Either projectId or userId is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: generations.map(gen => ({
        id: gen.id,
        platform: gen.platform,
        content: JSON.parse(gen.content),
        metadata: JSON.parse(gen.metadata || '{}'),
        promptUsed: gen.promptUsed,
        isEdited: gen.isEdited,
        createdAt: gen.createdAt,
        project: gen.project
      }))
    });

  } catch (error) {
    console.error('Error fetching generations:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch generations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Utility function to determine credits cost per platform
function getCreditsForPlatform(platform: string): number {
  switch (platform) {
    case 'twitter':
      return 1;
    case 'linkedin':
      return 2;
    case 'instagram':
      return 1;
    case 'blog':
      return 3;
    default:
      return 1;
  }
}