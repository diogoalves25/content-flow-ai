import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';

export interface BlogPost {
  title: string;
  content: string;
  wordCount: number;
  readTime: string;
  sections: string[];
  seoKeywords: string[];
}

export interface BlogGenerationOptions {
  tone?: 'professional' | 'casual' | 'educational' | 'technical' | 'conversational';
  targetAudience?: string;
  minWordCount?: number;
  includeSEO?: boolean;
  format?: 'listicle' | 'howto' | 'analysis' | 'story';
}

const BLOG_PROMPT_TEMPLATE = `You are an expert blog writer who specializes in creating comprehensive, engaging blog posts.

Your task is to transform the following content into a well-structured blog post that:
- Creates an engaging title that captures the main topic
- Includes a compelling introduction that hooks the reader
- Organizes content into clear sections with proper headings
- Removes all timestamps and transcript formatting completely
- Expands on key points with analysis, context, and insights
- Includes practical takeaways and actionable advice
- Ends with a strong conclusion that summarizes key points
- Uses proper markdown formatting for headings and structure

Content to transform:
{content}

CRITICAL INSTRUCTIONS:
1. COMPLETELY REMOVE all timestamps (like "0:02", "0:04", etc.)
2. Transform transcript into proper article prose
3. Create logical sections with H2 headings (##)
4. Add analysis, context, and insights beyond just the transcript
5. Include practical examples or applications where relevant
6. Write in a {tone} tone for {target_audience}
7. Ensure the content is substantially expanded from the original transcript
8. Use proper paragraph breaks and formatting

Format: {format}
Target Audience: {target_audience}
Tone: {tone}
Minimum Word Count: {min_word_count}

Return your response in this exact JSON format:
{{
  "title": "Compelling Blog Post Title",
  "content": "Full blog post content with proper markdown formatting including ## headings",
  "wordCount": actual_word_count,
  "readTime": "X min read",
  "sections": ["Section 1 Title", "Section 2 Title", "Section 3 Title"],
  "seoKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}}`;

const model = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.7,
  maxTokens: 2000,
});

export async function generateBlogPost(
  content: string, 
  options: BlogGenerationOptions = {}
): Promise<BlogPost> {
  const {
    tone = 'professional',
    targetAudience = 'general readers interested in the topic',
    minWordCount = 800,
    format = 'analysis'
  } = options;

  // Clean content and remove timestamps
  const cleanedContent = content
    .replace(/\d+:\d+/g, '') // Remove timestamps
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();

  const prompt = PromptTemplate.fromTemplate(BLOG_PROMPT_TEMPLATE);
  
  const formattedPrompt = await prompt.format({
    content: cleanedContent,
    tone,
    target_audience: targetAudience,
    min_word_count: minWordCount,
    format,
  });

  try {
    const response = await model.invoke(formattedPrompt);
    const result = JSON.parse(response.content as string);
    
    // Calculate actual metrics
    const actualWordCount = result.content.split(/\s+/).length;
    const readTime = Math.ceil(actualWordCount / 200);
    
    return {
      ...result,
      wordCount: actualWordCount,
      readTime: `${readTime} min read`
    };
  } catch (error) {
    console.error('Error generating blog post:', error);
    
    // Fallback generation
    return createFallbackBlogPost(cleanedContent);
  }
}

function createFallbackBlogPost(content: string): BlogPost {
  const cleanContent = content
    .replace(/\d+:\d+/g, '') // Remove timestamps
    .replace(/\s+/g, ' ')
    .trim();
    
  const title = extractTitleFromContent(cleanContent);
  const sections = createSectionsFromContent();
  
  const blogContent = `# ${title}

## Introduction

In today's digital landscape, understanding key insights and practical applications is crucial for success. This post explores important concepts and provides actionable takeaways.

## Key Insights

${cleanContent.substring(0, 500)}...

## Practical Applications

Based on the insights shared, here are some practical ways to apply these concepts:

- Focus on understanding the core principles
- Implement changes gradually and measure results
- Stay updated with best practices and trends
- Connect with others who share similar interests

## Conclusion

The insights covered in this post provide a foundation for understanding and implementing effective strategies. By focusing on practical applications and continuous learning, you can achieve better results in your endeavors.

Remember to adapt these concepts to your specific context and needs. Success comes from consistent application and willingness to iterate based on feedback and results.`;

  const wordCount = blogContent.split(/\s+/).length;
  
  return {
    title,
    content: blogContent,
    wordCount,
    readTime: `${Math.ceil(wordCount / 200)} min read`,
    sections: sections,
    seoKeywords: extractKeywords(cleanContent)
  };
}

function extractTitleFromContent(content: string): string {
  const sentences = content.split('.').filter(s => s.trim().length > 10);
  if (sentences.length > 0) {
    return sentences[0].trim().substring(0, 60) + (sentences[0].length > 60 ? '...' : '');
  }
  return 'Insights and Key Takeaways';
}

function createSectionsFromContent(): string[] {
  return [
    'Introduction',
    'Key Insights', 
    'Practical Applications',
    'Conclusion'
  ];
}

function extractKeywords(content: string): string[] {
  const lowerContent = content.toLowerCase();
  const keywords: string[] = [];
  
  // Extract relevant keywords based on content
  if (lowerContent.includes('code') || lowerContent.includes('programming')) {
    keywords.push('coding', 'programming', 'development', 'software', 'technology');
  } else if (lowerContent.includes('business') || lowerContent.includes('startup')) {
    keywords.push('business', 'startup', 'entrepreneur', 'strategy', 'growth');
  } else if (lowerContent.includes('ai') || lowerContent.includes('artificial intelligence')) {
    keywords.push('AI', 'artificial intelligence', 'machine learning', 'technology', 'automation');
  } else {
    keywords.push('insights', 'tips', 'strategy', 'best practices', 'guide');
  }
  
  return keywords.slice(0, 5);
}