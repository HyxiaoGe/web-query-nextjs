'use client';

import React, { useState } from 'react';
import { MessageSquare, ThumbsUp, ThumbsDown, AlertTriangle, Clock, Trash2, X } from 'lucide-react';
import type { SearchResult } from '@/types/search';
import type { FeedbackType } from '@/types/feedback';

interface FeedbackButtonProps {
  result: SearchResult;
  query: string;
}

const feedbackOptions = [
  {
    type: 'helpful' as FeedbackType,
    label: '很有用',
    icon: ThumbsUp,
    color: 'text-green-600 hover:text-green-700',
    description: '这个结果很有帮助'
  },
  {
    type: 'inaccurate' as FeedbackType,
    label: '不准确',
    icon: ThumbsDown,
    color: 'text-red-600 hover:text-red-700',
    description: '结果与搜索内容不符'
  },
  {
    type: 'irrelevant' as FeedbackType,
    label: '不相关',
    icon: X,
    color: 'text-orange-600 hover:text-orange-700',
    description: '与搜索主题无关'
  },
  {
    type: 'spam' as FeedbackType,
    label: '垃圾内容',
    icon: Trash2,
    color: 'text-purple-600 hover:text-purple-700',
    description: '低质量或垃圾内容'
  },
  {
    type: 'outdated' as FeedbackType,
    label: '过时信息',
    icon: Clock,
    color: 'text-blue-600 hover:text-blue-700',
    description: '信息已过时或过期'
  }
];

export default function FeedbackButton({ result, query }: FeedbackButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFeedbackSubmit = async (feedbackType: FeedbackType) => {
    if (isSubmitting || submitted) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          resultUrl: result.url,
          resultTitle: result.title,
          resultContent: result.content,
          resultEngine: result.engine,
          resultScore: result.score,
          feedbackType
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setIsOpen(false);
          setSubmitted(false);
        }, 1500);
      } else {
        console.error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-1 text-green-600 text-xs">
        <ThumbsUp className="h-3 w-3" />
        <span>感谢反馈！</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-xs transition-colors duration-200"
        title="对这个结果进行反馈"
      >
        <MessageSquare className="h-3 w-3" />
        <span>反馈</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10 min-w-48">
          <div className="text-xs text-gray-600 mb-2 font-medium">
            这个结果如何？
          </div>
          
          <div className="space-y-1">
            {feedbackOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <button
                  key={option.type}
                  onClick={() => handleFeedbackSubmit(option.type)}
                  disabled={isSubmitting}
                  className={`w-full flex items-center gap-2 p-2 text-xs rounded-md hover:bg-gray-50 transition-colors duration-200 ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : option.color
                  }`}
                  title={option.description}
                >
                  <IconComponent className="h-3 w-3 flex-shrink-0" />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-2 pt-2 border-t border-gray-100">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 点击外部关闭 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}