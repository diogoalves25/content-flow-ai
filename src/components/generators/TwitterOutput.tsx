'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Copy, 
  Twitter, 
  Edit, 
  Save, 
  TrendingUp,
  CheckCircle,
  ThumbsUp
} from 'lucide-react';
import type { TwitterThread } from '@/lib/generators/twitter-generator';

interface TwitterOutputProps {
  thread: TwitterThread;
  loading?: boolean;
  onEdit?: (tweetIndex: number, newContent: string) => void;
  onCopy?: (content: string, type: 'thread' | 'tweet') => void;
  className?: string;
}

export function TwitterOutput({ 
  thread, 
  loading = false, 
  onEdit, 
  onCopy,
  className = '' 
}: TwitterOutputProps) {
  const [editingTweet, setEditingTweet] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});

  const handleCopy = async (content: string, type: 'thread' | 'tweet', key: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedStates({ ...copiedStates, [key]: true });
      onCopy?.(content, type);
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleEdit = (index: number) => {
    setEditingTweet(index);
    setEditContent(thread.tweets[index]);
  };

  const handleSaveEdit = () => {
    if (editingTweet !== null && onEdit) {
      onEdit(editingTweet, editContent);
    }
    setEditingTweet(null);
    setEditContent('');
  };

  const handleCancelEdit = () => {
    setEditingTweet(null);
    setEditContent('');
  };

  const getCharacterCount = (text: string) => {
    return text.length;
  };

  const isOverLimit = (text: string) => {
    return text.length > 280;
  };

  const copyFullThread = () => {
    const fullThread = thread.tweets.join('\n\n');
    handleCopy(fullThread, 'thread', 'full-thread');
  };

  if (loading) {
    return (
      <div className={`premium-card p-8 ${className} animate-fade-in-up`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg animate-pulse">
            <Twitter className="h-5 w-5 text-white drop-shadow-sm" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Generating Twitter Thread...</h2>
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="premium-card p-6 bg-white/50">
              <div className="animate-pulse space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-12 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-full"></div>
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-3/4"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-full"></div>
                  <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`premium-card p-8 ${className} animate-fade-in-up`}>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
            <Twitter className="h-5 w-5 text-white drop-shadow-sm" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Twitter Thread ({thread.totalTweets} tweets)
          </h2>
        </div>
        <p className="text-gray-600 text-lg">
          Generated Twitter thread ready to post
        </p>
      </div>

      <div className="space-y-8">
        {/* Thread Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gradient-to-r from-blue-50 to-cyan-50/50 rounded-2xl border border-blue-100/50 shadow-sm">
          <div className="text-center">
            <div className="font-semibold text-blue-800">{thread.totalTweets}</div>
            <div className="text-xs text-blue-600">Tweets</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-blue-800">{thread.hashtags.length}</div>
            <div className="text-xs text-blue-600">Hashtags</div>
          </div>
          <div className="text-center">
            <TrendingUp className="h-4 w-4 mx-auto text-blue-600" />
            <div className="text-xs text-blue-600">{thread.estimatedReach}</div>
          </div>
          <div className="text-center">
            <Button
              onClick={copyFullThread}
              className="h-10 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            >
              {copiedStates['full-thread'] ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy All
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Individual Tweets */}
        <div className="space-y-6">
          {thread.tweets.map((tweet, index) => {
            const isEditing = editingTweet === index;
            const currentText = isEditing ? editContent : tweet;
            const charCount = getCharacterCount(currentText);
            const overLimit = isOverLimit(currentText);

            const cardClasses = index === 0 
              ? 'premium-card p-6 hover:scale-105 transition-all duration-200 border-2 border-blue-200/50 bg-gradient-to-r from-blue-50/50 to-cyan-50/30'
              : 'premium-card p-6 hover:scale-105 transition-all duration-200 bg-white/95';

            const charCountClasses = overLimit 
              ? 'text-red-500' 
              : charCount > 260 
              ? 'text-orange-500' 
              : 'text-muted-foreground';

            return (
              <div key={index} className="relative">
                <div className={cardClasses}>
                  <div className="flex items-start gap-3">
                    <Badge variant={index === 0 ? 'default' : 'secondary'}>
                      {index === 0 ? 'Hook' : `${index + 1}/${thread.totalTweets}`}
                    </Badge>

                    <div className="flex-1 space-y-2">
                      {isEditing ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className={`min-h-[80px] ${overLimit ? 'border-red-500' : ''}`}
                            placeholder="Edit your tweet..."
                          />
                          <div className="flex items-center justify-between">
                            <span className={`text-xs ${charCountClasses}`}>
                              {charCount}/280 characters
                              {overLimit && (
                                <span className="ml-2 text-red-500">
                                  ({charCount - 280} over limit)
                                </span>
                              )}
                            </span>
                            <div className="space-x-3">
                              <Button
                                variant="outline"
                                onClick={handleCancelEdit}
                                className="px-4 py-2 rounded-xl border-gray-200 hover:bg-gray-50 transition-all"
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleSaveEdit}
                                disabled={overLimit}
                                className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                              >
                                <Save className="h-4 w-4 mr-2" />
                                Save
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm leading-relaxed">
                            {tweet.split('\n').map((line, lineIndex) => (
                              <div key={lineIndex}>{line}</div>
                            ))}
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className={charCount > 260 ? 'text-orange-500' : ''}>
                              {charCount}/280 characters
                            </span>
                            
                            <div className="flex gap-2">
                              {onEdit && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEdit(index)}
                                  className="h-8 px-3 rounded-lg hover:bg-blue-50 border-blue-200 transition-all"
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                              )}
                              <Button
                                size="sm"
                                onClick={() => handleCopy(tweet, 'tweet', `tweet-${index}`)}
                                className="h-8 px-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-lg shadow-sm hover:shadow-md transform hover:scale-105 transition-all duration-200"
                              >
                                {copiedStates[`tweet-${index}`] ? (
                                  <div className="flex items-center">
                                    <CheckCircle className="h-3 w-3 mr-1 text-green-400" />
                                    Copied!
                                  </div>
                                ) : (
                                  <div className="flex items-center">
                                    <Copy className="h-3 w-3 mr-1" />
                                    Copy
                                  </div>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Hashtags */}
        {thread.hashtags.length > 0 && (
          <div className="premium-card p-6 bg-gradient-to-r from-purple-50 to-pink-50/50 border border-purple-100/50">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Suggested Hashtags</h4>
            <div className="flex flex-wrap gap-3">
              {thread.hashtags.map((hashtag, index) => {
                const hashtagClasses = "inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 text-purple-800 rounded-full text-sm font-medium cursor-pointer transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md";
                
                return (
                  <button
                    key={index}
                    onClick={() => handleCopy(hashtag, 'tweet', `hashtag-${index}`)}
                    className={hashtagClasses}
                  >
                    {hashtag}
                    {copiedStates[`hashtag-${index}`] ? (
                      <CheckCircle className="h-3 w-3 ml-2 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3 ml-2 opacity-60" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Engagement Tips */}
        {thread.engagementTips.length > 0 && (
          <div className="premium-card p-6 bg-gradient-to-r from-emerald-50 to-teal-50/50 border border-emerald-100/50">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                <ThumbsUp className="h-4 w-4 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 text-lg">Engagement Tips</h4>
                <ul className="space-y-2">
                  {thread.engagementTips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm leading-relaxed">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}