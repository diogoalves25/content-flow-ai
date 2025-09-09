import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';

export interface TranscriptAnalysis {
  executiveSummary: string;
  keyPoints: string[];
  actionableInsights: string[];
  notableQuotes: string[];
  mainTopics: string[];
  contentStructure: {
    introduction: string;
    mainSections: string[];
    conclusion: string;
  };
  wordCount: number;
  estimatedReadingTime: string;
}

const ANALYSIS_PROMPT_TEMPLATE = `You are an expert content analyst who specializes in extracting key insights from video transcripts.

Your task is to analyze the following video transcript and provide a comprehensive breakdown that will help content creators understand the material before generating platform-specific content.

Transcript to analyze:
{transcript}

Please provide a thorough analysis in the following JSON format:

{{
  "executiveSummary": "A concise 2-3 sentence summary of the main message",
  "keyPoints": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"],
  "actionableInsights": ["Insight 1", "Insight 2", "Insight 3", "Insight 4"],
  "notableQuotes": ["Quote 1", "Quote 2", "Quote 3"],
  "mainTopics": ["Topic 1", "Topic 2", "Topic 3", "Topic 4"],
  "contentStructure": {{
    "introduction": "Brief description of how the content starts",
    "mainSections": ["Section 1", "Section 2", "Section 3"],
    "conclusion": "Brief description of how the content ends"
  }},
  "wordCount": actual_word_count_of_transcript,
  "estimatedReadingTime": "X minutes"
}}

IMPORTANT INSTRUCTIONS:
1. Focus on extracting the most valuable and shareable insights
2. Identify quotes that would work well for social media
3. Highlight actionable advice that viewers can implement
4. Capture the logical flow and structure of the content
5. Be specific and concrete rather than generic
6. Ensure all insights are directly derived from the transcript content`;

const model = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.3,
  maxTokens: 1500,
});

export async function analyzeTranscript(transcript: string): Promise<TranscriptAnalysis> {
  if (!transcript || transcript.trim().length === 0) {
    throw new Error('Transcript is empty or invalid');
  }

  // Clean transcript
  const cleanedTranscript = transcript
    .replace(/\d+:\d+/g, '') // Remove timestamps
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();

  if (cleanedTranscript.length < 50) {
    throw new Error('Transcript is too short to analyze');
  }

  const prompt = PromptTemplate.fromTemplate(ANALYSIS_PROMPT_TEMPLATE);
  
  const formattedPrompt = await prompt.format({
    transcript: cleanedTranscript
  });

  try {
    const response = await model.invoke(formattedPrompt);
    const result = JSON.parse(response.content as string);
    
    // Calculate actual metrics if not provided or incorrect
    const actualWordCount = cleanedTranscript.split(/\s+/).length;
    const readingTime = Math.ceil(actualWordCount / 250); // Average reading speed

    return {
      ...result,
      wordCount: actualWordCount,
      estimatedReadingTime: `${readingTime} min read`
    };
  } catch (error) {
    console.error('Error analyzing transcript:', error);
    
    // Fallback analysis
    return createFallbackAnalysis(cleanedTranscript);
  }
}

function createFallbackAnalysis(transcript: string): TranscriptAnalysis {
  const wordCount = transcript.split(/\s+/).length;
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  return {
    executiveSummary: "This content provides valuable insights and information that can be transformed into engaging social media content.",
    keyPoints: [
      "Content contains actionable information",
      "Multiple topics are covered throughout",
      "Suitable for content generation",
      "Contains quotable moments",
      "Structured for easy consumption"
    ],
    actionableInsights: [
      "Extract key quotes for social sharing",
      "Identify main themes for content creation",
      "Focus on practical applications",
      "Highlight unique perspectives"
    ],
    notableQuotes: sentences.slice(0, 3).map(s => s.trim()),
    mainTopics: [
      "Primary subject matter",
      "Supporting concepts",
      "Practical applications",
      "Key takeaways"
    ],
    contentStructure: {
      introduction: "Content begins with context setting",
      mainSections: [
        "Introduction and setup",
        "Main content delivery",
        "Key insights and examples",
        "Conclusions and takeaways"
      ],
      conclusion: "Content wraps up with actionable advice"
    },
    wordCount,
    estimatedReadingTime: `${Math.ceil(wordCount / 250)} min read`
  };
}