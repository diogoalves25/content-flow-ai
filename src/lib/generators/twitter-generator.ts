import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';

export interface TwitterThread {
  tweets: string[];
  hookTweet: string;
  totalTweets: number;
  estimatedReach: string;
  hashtags: string[];
  engagementTips: string[];
}

export interface TwitterGenerationOptions {
  maxTweets?: number;
  tone?: 'professional' | 'casual' | 'educational' | 'inspiring' | 'controversial';
  includeHashtags?: boolean;
  includeCallToAction?: boolean;
  targetAudience?: string;
}

const TWITTER_PROMPT_TEMPLATE = `You are an expert Twitter content creator who specializes in creating viral, engaging Twitter threads.

Your task is to transform the following content into a compelling Twitter thread that:
- Starts with a powerful hook that stops people from scrolling
- Breaks down complex ideas into tweet-sized, digestible chunks
- Uses numbered tweets for easy following
- Includes engaging elements like questions, insights, and actionable advice
- Ends with a strong call-to-action

Content to transform:
{content}

Guidelines:
- Tone: {tone}
- Target Audience: {targetAudience}
- Maximum tweets: {maxTweets}
- Include hashtags: {includeHashtags}
- Include call-to-action: {includeCallToAction}

IMPORTANT RULES:
1. Each tweet must be under 280 characters
2. Number each tweet (1/X, 2/X, etc.)
3. The first tweet should be a compelling hook
4. Use line breaks and emojis strategically for readability
5. Include relevant hashtags if requested
6. End with engagement (question, CTA, etc.)

Return your response in this exact JSON format:
{{
  "hookTweet": "The compelling first tweet without numbering",
  "tweets": [
    "1/X: [First tweet with hook]",
    "2/X: [Second tweet]",
    "3/X: [Third tweet]"
  ],
  "hashtags": ["#relevant", "#hashtags"],
  "engagementTips": [
    "Post during peak hours (9-10 AM or 7-9 PM)",
    "Engage with replies quickly",
    "Pin the thread to your profile"
  ]
}}`;

/**
 * Generate Twitter thread from content using LangChain and OpenAI
 */
export async function generateTwitterThread(
  content: string,
  options: TwitterGenerationOptions = {}
): Promise<TwitterThread> {
  const {
    maxTweets = 10,
    tone = 'educational',
    includeHashtags = true,
    includeCallToAction = true,
    targetAudience = 'general audience interested in the topic'
  } = options;

  try {
    const model = new ChatOpenAI({
      model: 'gpt-4',
      temperature: 0.7,
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = PromptTemplate.fromTemplate(TWITTER_PROMPT_TEMPLATE);

    const chain = prompt.pipe(model);

    const response = await chain.invoke({
      content: content.slice(0, 4000), // Limit content length
      tone,
      targetAudience,
      maxTweets,
      includeHashtags,
      includeCallToAction
    });

    // Parse the JSON response
    let result;
    try {
      result = JSON.parse(response.content as string);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      console.error('Failed to parse JSON response:', parseError);
      throw new Error('Failed to generate properly formatted Twitter thread');
    }

    // Validate and format the response
    const tweets = Array.isArray(result.tweets) ? result.tweets : [];
    const hashtags = Array.isArray(result.hashtags) ? result.hashtags : [];
    const engagementTips = Array.isArray(result.engagementTips) ? result.engagementTips : [];

    return {
      tweets,
      hookTweet: result.hookTweet || tweets[0] || '',
      totalTweets: tweets.length,
      estimatedReach: calculateEstimatedReach(tweets.length),
      hashtags,
      engagementTips
    };

  } catch (error) {
    console.error('Error generating Twitter thread:', error);
    throw new Error(`Failed to generate Twitter thread: ${error}`);
  }
}

/**
 * Validate tweet character count
 */
export function validateTweetLength(tweet: string): { isValid: boolean; length: number; remaining: number } {
  const length = tweet.length;
  const remaining = 280 - length;
  
  return {
    isValid: length <= 280,
    length,
    remaining
  };
}

/**
 * Split long content into Twitter-appropriate chunks
 */
export function splitIntoTweetChunks(content: string, maxLength: number = 240): string[] {
  if (content.length <= maxLength) {
    return [content];
  }

  const sentences = content.split(/[.!?]+/).filter(s => s.trim());
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;

    const potentialChunk = currentChunk 
      ? `${currentChunk}. ${trimmedSentence}`
      : trimmedSentence;

    if (potentialChunk.length <= maxLength) {
      currentChunk = potentialChunk;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      // If single sentence is too long, force split it
      if (trimmedSentence.length > maxLength) {
        const words = trimmedSentence.split(' ');
        let wordChunk = '';
        for (const word of words) {
          const potentialWordChunk = wordChunk ? `${wordChunk} ${word}` : word;
          if (potentialWordChunk.length <= maxLength) {
            wordChunk = potentialWordChunk;
          } else {
            if (wordChunk) chunks.push(wordChunk.trim());
            wordChunk = word;
          }
        }
        if (wordChunk) currentChunk = wordChunk;
      } else {
        currentChunk = trimmedSentence;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(chunk => chunk.length > 0);
}

/**
 * Add thread numbering to tweets
 */
export function addThreadNumbering(tweets: string[]): string[] {
  const total = tweets.length;
  return tweets.map((tweet, index) => {
    const number = index + 1;
    const prefix = `${number}/${total}: `;
    
    // Check if tweet already has numbering
    if (tweet.match(/^\d+\/\d+:/)) {
      return tweet;
    }
    
    // Ensure the tweet with numbering doesn't exceed 280 chars
    const maxContentLength = 280 - prefix.length;
    const tweetContent = tweet.length > maxContentLength 
      ? tweet.slice(0, maxContentLength - 3) + '...'
      : tweet;
    
    return `${prefix}${tweetContent}`;
  });
}

/**
 * Calculate estimated reach based on thread length
 */
function calculateEstimatedReach(tweetCount: number): string {
  if (tweetCount <= 3) return 'Low (single tweet performs better)';
  if (tweetCount <= 7) return 'Medium (good thread length)';
  if (tweetCount <= 12) return 'High (comprehensive thread)';
  return 'Very High (in-depth thread, may lose some readers)';
}

/**
 * Generate hashtag suggestions based on content
 */
export async function generateHashtags(
  content: string,
  count: number = 5
): Promise<string[]> {
  const model = new ChatOpenAI({
    model: 'gpt-3.5-turbo',
    temperature: 0.3,
    apiKey: process.env.OPENAI_API_KEY
  });

  const prompt = PromptTemplate.fromTemplate(`
    Analyze this content and suggest {count} relevant, trending hashtags for Twitter.
    Focus on hashtags that are:
    - Relevant to the content
    - Not too generic (#marketing is too broad)
    - Not too niche (avoid hashtags used by less than 1000 people)
    - Mix of popular and specific hashtags
    
    Content: {content}
    
    Return only the hashtags, one per line, with the # symbol:
  `);

  const chain = prompt.pipe(model);
  
  const response = await chain.invoke({
    content: content.slice(0, 1000),
    count
  });

  const hashtags = (response.content as string)
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.startsWith('#'))
    .slice(0, count);

  return hashtags;
}

/**
 * Optimize thread for engagement
 */
export interface ThreadOptimization {
  suggestions: string[];
  score: number;
  improvements: string[];
}

export function analyzeThreadEngagement(tweets: string[]): ThreadOptimization {
  const suggestions: string[] = [];
  const improvements: string[] = [];
  let score = 50; // Base score

  // Check hook quality
  const firstTweet = tweets[0]?.replace(/^\d+\/\d+:\s*/, '') || '';
  if (firstTweet.includes('?')) score += 10;
  if (firstTweet.includes('🧵')) score += 5;
  if (firstTweet.length < 100) {
    improvements.push('Consider making your hook more detailed');
    score -= 5;
  }

  // Check for engagement elements
  const hasQuestion = tweets.some(tweet => tweet.includes('?'));
  if (hasQuestion) {
    score += 10;
    suggestions.push('Great! You included questions to boost engagement');
  } else {
    improvements.push('Add questions to encourage replies');
    score -= 10;
  }

  // Check for emojis
  const hasEmojis = tweets.some(tweet => /[\u{1F300}-\u{1F9FF}]/u.test(tweet));
  if (hasEmojis) {
    score += 5;
  } else {
    improvements.push('Add relevant emojis for better visual appeal');
    score -= 5;
  }

  // Check thread length
  if (tweets.length >= 3 && tweets.length <= 8) {
    score += 10;
    suggestions.push('Good thread length for engagement');
  } else if (tweets.length > 15) {
    improvements.push('Consider breaking into multiple shorter threads');
    score -= 10;
  }

  // Check for call to action
  const lastTweet = tweets[tweets.length - 1] || '';
  if (lastTweet.toLowerCase().includes('follow') || 
      lastTweet.toLowerCase().includes('retweet') ||
      lastTweet.toLowerCase().includes('share')) {
    score += 10;
    suggestions.push('Good call-to-action in final tweet');
  } else {
    improvements.push('Add a call-to-action in your final tweet');
    score -= 5;
  }

  return {
    suggestions,
    score: Math.max(0, Math.min(100, score)),
    improvements
  };
}