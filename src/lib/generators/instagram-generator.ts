import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';

export interface InstagramPost {
  content: string;
  hashtags: string[];
  engagementTips: string[];
  captionLength: number;
  estimatedReach: string;
}

export interface InstagramGenerationOptions {
  tone?: 'professional' | 'casual' | 'inspirational' | 'educational' | 'trendy';
  includeEmojis?: boolean;
  includeCallToAction?: boolean;
  targetAudience?: string;
  maxLength?: number;
}

const INSTAGRAM_PROMPT_TEMPLATE = `You are an expert Instagram content creator who specializes in creating engaging, visual-friendly Instagram posts.

Your task is to transform the following content into a compelling Instagram post that:
- Creates an engaging caption with strategic line breaks for readability
- Uses relevant emojis to enhance visual appeal and engagement
- Includes 3-5 strategic line breaks to create visual spacing
- Focuses on the most important insights and takeaways
- Removes all timestamps and transcript formatting
- Creates value-driven content that encourages engagement
- Uses platform-appropriate hashtags (relevant to the content topic)
- Includes a clear call-to-action

Content to transform:
{content}

IMPORTANT INSTRUCTIONS:
1. REMOVE ALL TIMESTAMPS (like "0:02", "0:04", etc.) completely
2. Transform transcript into engaging, conversational tone
3. Use relevant emojis throughout (but not excessive)
4. Create strategic line breaks for Instagram readability
5. Focus on key insights, tips, or takeaways
6. Generate hashtags relevant to the actual content topic (not generic ones)
7. Keep the caption engaging and scannable
8. Include a call-to-action that encourages engagement

Tone: {tone}
Target Audience: {target_audience}
Include Emojis: {include_emojis}
Include Call to Action: {include_call_to_action}

Return your response in this exact JSON format:
{{
  "content": "Your Instagram caption here with emojis and line breaks",
  "hashtags": ["#RelevantHashtag1", "#RelevantHashtag2", "#RelevantHashtag3", "#RelevantHashtag4", "#RelevantHashtag5"],
  "engagementTips": ["Tip 1", "Tip 2", "Tip 3"],
  "captionLength": number_of_characters,
  "estimatedReach": "engagement_estimate"
}}`;

const model = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.7,
  maxTokens: 1000,
});

export async function generateInstagramPost(
  content: string, 
  options: InstagramGenerationOptions = {}
): Promise<InstagramPost> {
  const {
    tone = 'casual',
    includeEmojis = true,
    includeCallToAction = true,
    targetAudience = 'general audience interested in the topic',
    maxLength = 2200
  } = options;

  // Clean content and remove timestamps
  const cleanedContent = content
    .replace(/\d+:\d+/g, '') // Remove timestamps
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();

  const prompt = PromptTemplate.fromTemplate(INSTAGRAM_PROMPT_TEMPLATE);
  
  const formattedPrompt = await prompt.format({
    content: cleanedContent,
    tone,
    target_audience: targetAudience,
    include_emojis: includeEmojis,
    include_call_to_action: includeCallToAction,
  });

  try {
    const response = await model.invoke(formattedPrompt);
    const result = JSON.parse(response.content as string);
    
    // Ensure the content doesn't exceed max length
    if (result.content.length > maxLength) {
      result.content = result.content.substring(0, maxLength - 3) + '...';
      result.captionLength = result.content.length;
    }
    
    return result;
  } catch (error) {
    console.error('Error generating Instagram post:', error);
    
    // Fallback generation
    const fallbackHashtags = extractRelevantHashtags(cleanedContent);
    
    return {
      content: createFallbackInstagramPost(cleanedContent, includeEmojis),
      hashtags: fallbackHashtags,
      engagementTips: [
        'Post during peak hours (6-9 PM)',
        'Use Stories to drive traffic to this post',
        'Engage with comments within first hour'
      ],
      captionLength: 0,
      estimatedReach: 'Medium engagement expected'
    };
  }
}

function createFallbackInstagramPost(content: string, includeEmojis: boolean): string {
  const cleanContent = content
    .replace(/\d+:\d+/g, '') // Remove timestamps
    .substring(0, 1500); // Truncate if too long
    
  const emoji = includeEmojis ? '✨ ' : '';
  
  return `${emoji}Here are some key insights from this content:\n\n${cleanContent}\n\n💭 What are your thoughts on this? Share in the comments below!\n\n${includeEmojis ? '👆 ' : ''}Save this post for later reference`;
}

function extractRelevantHashtags(content: string): string[] {
  const lowerContent = content.toLowerCase();
  
  // Common tech/content hashtags based on content analysis
  const hashtags: string[] = [];
  
  if (lowerContent.includes('code') || lowerContent.includes('programming') || lowerContent.includes('developer')) {
    hashtags.push('#Coding', '#Programming', '#Developer', '#Tech', '#CodeLife');
  } else if (lowerContent.includes('ai') || lowerContent.includes('artificial intelligence') || lowerContent.includes('claude')) {
    hashtags.push('#AI', '#ArtificialIntelligence', '#ClaudeAI', '#Tech', '#Innovation');
  } else if (lowerContent.includes('tutorial') || lowerContent.includes('learn') || lowerContent.includes('guide')) {
    hashtags.push('#Tutorial', '#Learning', '#Education', '#TechTips', '#HowTo');
  } else if (lowerContent.includes('business') || lowerContent.includes('entrepreneur')) {
    hashtags.push('#Business', '#Entrepreneur', '#StartupLife', '#BusinessTips', '#Success');
  } else {
    hashtags.push('#Content', '#Tips', '#Knowledge', '#Learning', '#Insights');
  }
  
  return hashtags.slice(0, 5); // Return max 5 hashtags
}