'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Send, X, Bot, User } from 'lucide-react';
import { chatWithAI } from '@/lib/openai';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
  slideData: any;
  onSlideUpdate?: (updatedSlideData: any) => void;
  projectType?: 'presentation' | 'planner';
}

export default function AIChat({ isOpen, onClose, slideData, onSlideUpdate, projectType = 'presentation' }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: projectType === 'planner' 
        ? 'Hi! I\'m here to help you optimize your daily planner. You can ask me to adjust schedules, add tasks, modify priorities, or improve time management suggestions.'
        : 'Hi! I\'m here to help you refine your presentation. You can ask me to add slides, modify content, change themes, or make any other improvements.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey] = useLocalStorage('openai_api_key', '');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !apiKey) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const chatMessages = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      chatMessages.push({ role: 'user', content: inputValue });

      const response = await chatWithAI(apiKey, chatMessages, slideData);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-lg z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Bot className="h-5 w-5 text-teal-600" />
          <h3 className="font-semibold text-gray-900">AI Assistant</h3>
        </div>
        <Button onClick={onClose} variant="ghost" size="sm">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-teal-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="flex items-start space-x-2">
                {message.role === 'assistant' && (
                  <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                )}
                {message.role === 'user' && (
                  <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                )}
                <div className="text-sm whitespace-pre-wrap">
                  {message.content}
                </div>
              </div>
              <div className={`text-xs mt-1 ${
                message.role === 'user' ? 'text-teal-100' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
              <div className="flex items-center space-x-2">
                <Bot className="h-4 w-4" />
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me to modify your slides..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {projectType === 'planner' 
            ? 'Try: "Add a break at 3 PM" or "Prioritize morning tasks"'
            : 'Try: "Add a slide about benefits" or "Change the color theme"'
          }
        </p>
      </div>
    </div>
  );
}