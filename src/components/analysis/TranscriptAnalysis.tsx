'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Brain, 
  Lightbulb, 
  Quote, 
  Target, 
  FileText,
  Edit3,
  Check,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { TranscriptAnalysis } from '@/lib/transcript-analyzer';

interface TranscriptAnalysisProps {
  analysis: TranscriptAnalysis;
  fullTranscript: string;
  onAnalysisUpdate?: (updatedAnalysis: TranscriptAnalysis) => void;
  className?: string;
}

export function TranscriptAnalysisComponent({ 
  analysis, 
  fullTranscript, 
  onAnalysisUpdate,
  className = '' 
}: TranscriptAnalysisProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAnalysis, setEditedAnalysis] = useState<TranscriptAnalysis>(analysis);
  const [showFullTranscript, setShowFullTranscript] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    keyPoints: true,
    insights: true,
    quotes: false,
    topics: false,
    structure: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSave = () => {
    onAnalysisUpdate?.(editedAnalysis);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedAnalysis(analysis);
    setIsEditing(false);
  };

  const updateKeyPoints = (index: number, value: string) => {
    const newKeyPoints = [...editedAnalysis.keyPoints];
    newKeyPoints[index] = value;
    setEditedAnalysis(prev => ({ ...prev, keyPoints: newKeyPoints }));
  };

  const updateInsights = (index: number, value: string) => {
    const newInsights = [...editedAnalysis.actionableInsights];
    newInsights[index] = value;
    setEditedAnalysis(prev => ({ ...prev, actionableInsights: newInsights }));
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            AI Transcript Analysis
          </h2>
          <p className="text-gray-600 mt-1">
            Review and edit the analysis before generating content
          </p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave} size="sm" className="bg-green-600 hover:bg-green-700">
                <Check className="h-4 w-4 mr-1" />
                Save Changes
              </Button>
              <Button onClick={handleCancel} size="sm" variant="outline">
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} size="sm" variant="outline">
              <Edit3 className="h-4 w-4 mr-1" />
              Edit Analysis
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
          <div className="text-2xl font-bold text-blue-700">{analysis.wordCount.toLocaleString()}</div>
          <div className="text-blue-600 text-sm">Words</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
          <div className="text-2xl font-bold text-green-700">{analysis.estimatedReadingTime}</div>
          <div className="text-green-600 text-sm">Reading Time</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
          <div className="text-2xl font-bold text-purple-700">{analysis.keyPoints.length}</div>
          <div className="text-purple-600 text-sm">Key Points</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl">
          <div className="text-2xl font-bold text-orange-700">{analysis.mainTopics.length}</div>
          <div className="text-orange-600 text-sm">Main Topics</div>
        </div>
      </div>

      {/* Executive Summary */}
      <Card>
        <CardHeader 
          className="cursor-pointer" 
          onClick={() => toggleSection('summary')}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Executive Summary
            </CardTitle>
            {expandedSections.summary ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CardHeader>
        {expandedSections.summary && (
          <CardContent>
            {isEditing ? (
              <Textarea
                value={editedAnalysis.executiveSummary}
                onChange={(e) => setEditedAnalysis(prev => ({ ...prev, executiveSummary: e.target.value }))}
                className="min-h-[80px]"
              />
            ) : (
              <p className="text-gray-700 leading-relaxed">{analysis.executiveSummary}</p>
            )}
          </CardContent>
        )}
      </Card>

      {/* Key Points */}
      <Card>
        <CardHeader 
          className="cursor-pointer" 
          onClick={() => toggleSection('keyPoints')}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Key Points
            </CardTitle>
            {expandedSections.keyPoints ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CardHeader>
        {expandedSections.keyPoints && (
          <CardContent>
            <div className="space-y-3">
              {analysis.keyPoints.map((point, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  </div>
                  {isEditing ? (
                    <Textarea
                      value={editedAnalysis.keyPoints[index]}
                      onChange={(e) => updateKeyPoints(index, e.target.value)}
                      className="flex-1 min-h-[60px]"
                    />
                  ) : (
                    <p className="flex-1 text-gray-700">{point}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Actionable Insights */}
      <Card>
        <CardHeader 
          className="cursor-pointer" 
          onClick={() => toggleSection('insights')}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              Actionable Insights
            </CardTitle>
            {expandedSections.insights ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CardHeader>
        {expandedSections.insights && (
          <CardContent>
            <div className="space-y-3">
              {analysis.actionableInsights.map((insight, index) => (
                <div key={index} className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-1" />
                  {isEditing ? (
                    <Textarea
                      value={editedAnalysis.actionableInsights[index]}
                      onChange={(e) => updateInsights(index, e.target.value)}
                      className="flex-1 min-h-[60px]"
                    />
                  ) : (
                    <p className="flex-1 text-gray-700">{insight}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Notable Quotes */}
      <Card>
        <CardHeader 
          className="cursor-pointer" 
          onClick={() => toggleSection('quotes')}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Quote className="h-5 w-5 text-indigo-600" />
              Notable Quotes
            </CardTitle>
            {expandedSections.quotes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CardHeader>
        {expandedSections.quotes && (
          <CardContent>
            <div className="space-y-4">
              {analysis.notableQuotes.map((quote, index) => (
                <blockquote key={index} className="border-l-4 border-indigo-200 pl-4 py-2 bg-indigo-50 rounded-r-lg">
                  <p className="text-gray-700 italic">&ldquo;{quote}&rdquo;</p>
                </blockquote>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Main Topics */}
      <Card>
        <CardHeader 
          className="cursor-pointer" 
          onClick={() => toggleSection('topics')}
        >
          <div className="flex items-center justify-between">
            <CardTitle>Main Topics</CardTitle>
            {expandedSections.topics ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CardHeader>
        {expandedSections.topics && (
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analysis.mainTopics.map((topic, index) => (
                <Badge key={index} variant="outline" className="text-sm">
                  {topic}
                </Badge>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Content Structure */}
      <Card>
        <CardHeader 
          className="cursor-pointer" 
          onClick={() => toggleSection('structure')}
        >
          <div className="flex items-center justify-between">
            <CardTitle>Content Structure</CardTitle>
            {expandedSections.structure ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CardHeader>
        {expandedSections.structure && (
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Introduction</h4>
                <p className="text-gray-600">{analysis.contentStructure.introduction}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Main Sections</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  {analysis.contentStructure.mainSections.map((section, index) => (
                    <li key={index}>{section}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Conclusion</h4>
                <p className="text-gray-600">{analysis.contentStructure.conclusion}</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Full Transcript */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Full Transcript</CardTitle>
            <Button
              onClick={() => setShowFullTranscript(!showFullTranscript)}
              variant="outline"
              size="sm"
            >
              {showFullTranscript ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Hide Transcript
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Show Transcript
                </>
              )}
            </Button>
          </div>
          <CardDescription>
            The original transcript used for analysis
          </CardDescription>
        </CardHeader>
        {showFullTranscript && (
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap font-mono text-sm">
                {fullTranscript}
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}