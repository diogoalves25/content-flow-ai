'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Copy, 
  Twitter, 
  Edit, 
  Save, 
  TrendingUp, 
  Users, 
  MessageCircle,
  CheckCircle,
  AlertCircle,
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
      <Card className={className}>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Twitter className="h-5 w-5 text-blue-500" />
          Twitter Thread ({thread.totalTweets} tweets)
        </CardTitle>
        <CardDescription>
          Generated Twitter thread ready to post
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Thread Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-blue-50 rounded-lg">
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
              size="sm"
              onClick={copyFullThread}
              variant="outline"
              className="h-8"
            >
              {copiedStates['full-thread'] ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
        </div>

        {/* Individual Tweets */}
        <div className="space-y-4">
          {thread.tweets.map((tweet, index) => {
            const isEditing = editingTweet === index;
            const currentText = isEditing ? editContent : tweet;
            const charCount = getCharacterCount(currentText);
            const overLimit = isOverLimit(currentText);

            return (
              <div key={index} className="relative">
                <Card className={`${index === 0 ? 'border-blue-200 bg-blue-50/50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Tweet number badge */}
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
                              <span className={`text-xs ${
                                overLimit ? 'text-red-500' : 
                                charCount > 260 ? 'text-orange-500' : 
                                'text-muted-foreground'
                              }`}>
                                {charCount}/280 characters
                                {overLimit && (
                                  <span className="ml-2 text-red-500">
                                    ({charCount - 280} over limit)
                                  </span>
                                )}
                              </span>
                              <div className="space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={handleCancelEdit}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={handleSaveEdit}
                                  disabled={overLimit}
                                >
                                  <Save className="h-3 w-3 mr-1" />
                                  Save
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="text-sm leading-relaxed">
                              {tweet.split('\n').map((line, lineIndex) => (
                                <div key={lineIndex}>{line}</div>
                              ))}
                            </div>
                            
                            {/* Character count */}
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span className={charCount > 260 ? 'text-orange-500' : ''}>
                                {charCount}/280 characters
                              </span>
                              
                              {/* Action buttons */}
                              <div className="space-x-1">
                                {onEdit && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEdit(index)}
                                    className="h-6 px-2"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCopy(tweet, 'tweet', `tweet-${index}`)}
                                  className="h-6 px-2"
                                >
                                  {copiedStates[`tweet-${index}`] ? (
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Hashtags */}
        {thread.hashtags.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Suggested Hashtags</h4>
            <div className="flex flex-wrap gap-2">
              {thread.hashtags.map((hashtag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-blue-50"
                  onClick={() => handleCopy(hashtag, 'tweet', `hashtag-${index}`)}
                >
                  {hashtag}
                  {copiedStates[`hashtag-${index}`] ? (
                    <CheckCircle className="h-3 w-3 ml-1 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Engagement Tips */}
        {thread.engagementTips.length > 0 && (
          <Alert>
            <ThumbsUp className="h-4 w-4" />
            <AlertDescription>
              <strong>Engagement Tips:</strong>
              <ul className="mt-2 space-y-1">
                {thread.engagementTips.map((tip, index) => (
                  <li key={index} className="text-xs">• {tip}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}