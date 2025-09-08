import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';

export interface LinkedInPost {
  content: string;
  hook: string;
  callToAction: string;
  hashtags: string[];
  engagementTips: string[];
  wordCount: number;
  estimatedReadTime: string;
}

export interface LinkedInGenerationOptions {
  tone?: 'professional' | 'thought-leadership' | 'personal' | 'educational' | 'storytelling';
  includeHashtags?: boolean;
  includeCallToAction?: boolean;
  targetAudience?: string;
  postType?: 'insight' | 'story' | 'tips' | 'announcement' | 'question';
  length?: 'short' | 'medium' | 'long';
}

const LINKEDIN_PROMPT_TEMPLATE = `You are a LinkedIn content strategist who creates high-engagement professional posts.

Transform this content into a LinkedIn post that:
- Starts with a compelling hook that grabs attention
- Provides genuine value and insights
- Uses professional yet approachable tone
- Includes line breaks for readability
- Ends with meaningful engagement

Content to transform:
{content}

Guidelines:
- Tone: {tone}
- Post Type: {postType}
- Length: {length}
- Target Audience: {targetAudience}
- Include hashtags: {includeHashtags}
- Include call-to-action: {includeCallToAction}

IMPORTANT RULES:
1. Hook should be 1-2 lines that create curiosity or provide value
2. Use short paragraphs (1-3 sentences) with line breaks
3. Include personal insights or professional experiences when possible
4. Use bullet points or numbers for lists
5. End with a question or call-to-action to drive engagement
6. Keep hashtags relevant and professional (3-5 max)
7. LinkedIn posts perform best at 150-300 words for engagement

Return your response in this exact JSON format:
{{
  "content": "Full LinkedIn post content with proper formatting",
  "hook": "The compelling opening lines",
  "callToAction": "Final engagement question or CTA",
  "hashtags": ["#RelevantHashtag", "#ProfessionalHashtag"],
  "engagementTips": [
    "Post during business hours (9 AM - 5 PM weekdays)",
    "Engage with comments within first 2 hours",
    "Share personal experiences when relevant"
  ]
}}`;

/**
 * Generate LinkedIn post from content using LangChain and OpenAI
 */
export async function generateLinkedInPost(
  content: string,
  options: LinkedInGenerationOptions = {}
): Promise<LinkedInPost> {
  const {
    tone = 'professional',
    includeHashtags = true,
    includeCallToAction = true,
    targetAudience = 'professionals in relevant industry',
    postType = 'insight',
    length = 'medium'
  } = options;

  try {
    const model = new ChatOpenAI({
      model: 'gpt-4',
      temperature: 0.7,
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = PromptTemplate.fromTemplate(LINKEDIN_PROMPT_TEMPLATE);

    const chain = prompt.pipe(model);

    const response = await chain.invoke({
      content: content.slice(0, 4000), // Limit content length
      tone,
      postType,
      length,
      targetAudience,
      includeHashtags,
      includeCallToAction
    });

    // Parse the JSON response
    let result;
    try {
      result = JSON.parse(response.content as string);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      throw new Error('Failed to generate properly formatted LinkedIn post');
    }

    const postContent = result.content || '';
    const wordCount = countWords(postContent);
    const estimatedReadTime = calculateReadTime(wordCount);

    return {
      content: postContent,
      hook: result.hook || '',
      callToAction: result.callToAction || '',
      hashtags: Array.isArray(result.hashtags) ? result.hashtags : [],
      engagementTips: Array.isArray(result.engagementTips) ? result.engagementTips : [],
      wordCount,
      estimatedReadTime
    };

  } catch (error) {
    console.error('Error generating LinkedIn post:', error);
    throw new Error(`Failed to generate LinkedIn post: ${error}`);
  }
}

/**
 * Generate LinkedIn carousel post suggestions
 */
export interface CarouselSlide {
  title: string;
  content: string;
  slideNumber: number;
}

export interface CarouselPost {
  slides: CarouselSlide[];
  coverSlide: CarouselSlide;
  totalSlides: number;
  postCaption: string;
}

export async function generateLinkedInCarousel(
  content: string,
  slideCount: number = 6
): Promise<CarouselPost> {
  const model = new ChatOpenAI({
    model: 'gpt-4',
    temperature: 0.7,
    apiKey: process.env.OPENAI_API_KEY
  });

  const prompt = PromptTemplate.fromTemplate(`
    Create a LinkedIn carousel post from this content with {slideCount} slides.
    
    Content: {content}
    
    Rules:
    1. First slide should be a compelling cover/title slide
    2. Each slide should have a clear title and 2-3 bullet points
    3. Use actionable, valuable insights
    4. End with a summary or CTA slide
    5. Keep text concise for readability
    
    Return in JSON format:
    {{
      "coverSlide": {{
        "title": "Compelling Title",
        "content": "Subtitle or key benefit"
      }},
      "slides": [
        {{
          "title": "Slide Title",
          "content": "• Point 1\\n• Point 2\\n• Point 3",
          "slideNumber": 1
        }}
      ],
      "postCaption": "Engaging caption for the carousel post"
    }}
  `);

  const chain = prompt.pipe(model);

  const response = await chain.invoke({
    content: content.slice(0, 3000),
    slideCount
  });

  const result = JSON.parse(response.content as string);

  return {
    coverSlide: result.coverSlide,
    slides: result.slides || [],
    totalSlides: (result.slides?.length || 0) + 1, // +1 for cover slide
    postCaption: result.postCaption || ''
  };
}

/**
 * Generate LinkedIn article from content
 */
export interface LinkedInArticle {
  title: string;
  content: string;
  summary: string;
  tags: string[];
  sections: ArticleSection[];
  wordCount: number;
  readTime: string;
}

export interface ArticleSection {
  heading: string;
  content: string;
  type: 'introduction' | 'main' | 'conclusion' | 'list' | 'quote';
}

export async function generateLinkedInArticle(
  content: string,
  title?: string
): Promise<LinkedInArticle> {
  const model = new ChatOpenAI({
    model: 'gpt-4',
    temperature: 0.7,
    apiKey: process.env.OPENAI_API_KEY
  });

  const prompt = PromptTemplate.fromTemplate(`
    Transform this content into a comprehensive LinkedIn article.
    
    Content: {content}
    Suggested Title: {title}
    
    Create a professional article with:
    1. Compelling title
    2. Brief summary (2-3 sentences)
    3. Well-structured sections with headings
    4. Professional insights and takeaways
    5. Relevant tags for LinkedIn
    
    Return in JSON format:
    {{
      "title": "Article Title",
      "summary": "Brief summary of the article",
      "content": "Full article content with proper formatting",
      "sections": [
        {{
          "heading": "Section Title",
          "content": "Section content",
          "type": "main"
        }}
      ],
      "tags": ["tag1", "tag2", "tag3"]
    }}
  `);

  const chain = prompt.pipe(model);

  const response = await chain.invoke({
    content,
    title: title || 'Professional Insights'
  });

  const result = JSON.parse(response.content as string);
  const wordCount = countWords(result.content || '');

  return {
    title: result.title || 'Untitled Article',
    content: result.content || '',
    summary: result.summary || '',
    tags: result.tags || [],
    sections: result.sections || [],
    wordCount,
    readTime: calculateReadTime(wordCount)
  };
}

/**
 * Analyze LinkedIn post performance potential
 */
export interface PostAnalysis {
  engagementScore: number;
  strengths: string[];
  improvements: string[];
  bestTimeToPost: string;
  targetAudience: string[];
}

export function analyzeLinkedInPost(post: string): PostAnalysis {
  const strengths: string[] = [];
  const improvements: string[] = [];
  let score = 50; // Base score

  // Check length
  const wordCount = countWords(post);
  if (wordCount >= 150 && wordCount <= 300) {
    strengths.push('Optimal length for engagement');
    score += 15;
  } else if (wordCount < 50) {
    improvements.push('Post might be too short - add more value');
    score -= 10;
  } else if (wordCount > 500) {
    improvements.push('Consider breaking into multiple posts or an article');
    score -= 10;
  }

  // Check for questions
  if (post.includes('?')) {
    strengths.push('Includes questions to drive engagement');
    score += 10;
  } else {
    improvements.push('Add questions to encourage comments');
    score -= 5;
  }

  // Check formatting
  if (post.includes('\n\n')) {
    strengths.push('Good use of line breaks for readability');
    score += 10;
  } else {
    improvements.push('Use line breaks between paragraphs');
    score -= 5;
  }

  // Check for personal touch
  if (post.toLowerCase().includes('i ') || 
      post.toLowerCase().includes('my ') ||
      post.toLowerCase().includes('personally')) {
    strengths.push('Includes personal perspective');
    score += 10;
  } else {
    improvements.push('Add personal insights or experiences');
    score -= 5;
  }

  // Check for hashtags
  if (post.includes('#')) {
    strengths.push('Includes relevant hashtags');
    score += 5;
  } else {
    improvements.push('Add 3-5 relevant hashtags');
    score -= 5;
  }

  return {
    engagementScore: Math.max(0, Math.min(100, score)),
    strengths,
    improvements,
    bestTimeToPost: 'Tuesday-Thursday, 9 AM - 11 AM or 1 PM - 3 PM',
    targetAudience: ['Professionals', 'Industry peers', 'Potential clients']
  };
}

/**
 * Utility functions
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

function calculateReadTime(wordCount: number): string {
  const wordsPerMinute = 200; // Average reading speed
  const minutes = Math.ceil(wordCount / wordsPerMinute);
  return minutes === 1 ? '1 minute read' : `${minutes} minute read`;
}

/**
 * Generate LinkedIn hashtags
 */
export async function generateLinkedInHashtags(
  content: string,
  industry?: string,
  count: number = 5
): Promise<string[]> {
  const model = new ChatOpenAI({
    model: 'gpt-3.5-turbo',
    temperature: 0.3,
    apiKey: process.env.OPENAI_API_KEY
  });

  const prompt = PromptTemplate.fromTemplate(`
    Generate {count} professional LinkedIn hashtags for this content.
    Industry context: {industry}
    
    Focus on hashtags that are:
    - Professional and industry-relevant
    - Neither too broad nor too niche
    - Actually used by LinkedIn professionals
    - Mix of popular and specific tags
    
    Content: {content}
    
    Return only hashtags, one per line, with # symbol:
  `);

  const chain = prompt.pipe(model);
  
  const response = await chain.invoke({
    content: content.slice(0, 1000),
    industry: industry || 'general business',
    count
  });

  const hashtags = (response.content as string)
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('#'))
    .slice(0, count);

  return hashtags;
}