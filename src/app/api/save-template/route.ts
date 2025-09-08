import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface SaveTemplateRequest {
  name: string;
  platform: string;
  prompt: string;
  description?: string;
  isPublic?: boolean;
}

interface UpdateTemplateRequest extends SaveTemplateRequest {
  id: string;
}

export async function POST(request: NextRequest) {
  try {
    const { 
      name, 
      platform, 
      prompt, 
      description,
      isPublic = false
    }: SaveTemplateRequest = await request.json();

    // Validate input
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Template name is required' },
        { status: 400 }
      );
    }

    if (!platform || typeof platform !== 'string') {
      return NextResponse.json(
        { error: 'Platform is required' },
        { status: 400 }
      );
    }

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt template is required' },
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

    // Check if template with same name and platform already exists
    const existingTemplate = await prisma.template.findFirst({
      where: {
        name,
        platform
      }
    });

    if (existingTemplate) {
      return NextResponse.json(
        { error: 'Template with this name already exists for this platform' },
        { status: 400 }
      );
    }

    // Create new template
    const template = await prisma.template.create({
      data: {
        name,
        platform,
        prompt,
        description,
        isPublic,
        isDefault: false
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        id: template.id,
        name: template.name,
        platform: template.platform,
        prompt: template.prompt,
        description: template.description,
        isPublic: template.isPublic,
        isDefault: template.isDefault,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt
      }
    });

  } catch (error) {
    console.error('Error saving template:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to save template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const platform = searchParams.get('platform');
    const isPublic = searchParams.get('public');
    const isDefault = searchParams.get('default');

    const where: Record<string, unknown> = {};

    if (platform) {
      where.platform = platform;
    }

    if (isPublic === 'true') {
      where.isPublic = true;
    }

    if (isDefault === 'true') {
      where.isDefault = true;
    }

    const templates = await prisma.template.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      data: templates
    });

  } catch (error) {
    console.error('Error fetching templates:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch templates',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { 
      id,
      name, 
      platform, 
      prompt, 
      description,
      isPublic = false
    }: UpdateTemplateRequest = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required for updates' },
        { status: 400 }
      );
    }

    // Check if template exists
    const existingTemplate = await prisma.template.findUnique({
      where: { id }
    });

    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Update template
    const updatedTemplate = await prisma.template.update({
      where: { id },
      data: {
        name: name || existingTemplate.name,
        platform: platform || existingTemplate.platform,
        prompt: prompt || existingTemplate.prompt,
        description: description !== undefined ? description : existingTemplate.description,
        isPublic: isPublic !== undefined ? isPublic : existingTemplate.isPublic,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedTemplate
    });

  } catch (error) {
    console.error('Error updating template:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to update template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Check if template exists and is not a default template
    const template = await prisma.template.findUnique({
      where: { id }
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    if (template.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default templates' },
        { status: 400 }
      );
    }

    // Delete template
    await prisma.template.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting template:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to delete template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}