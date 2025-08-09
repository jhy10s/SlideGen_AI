'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { validateApiKey } from '@/lib/openai';
import { Key, Eye, EyeOff, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface ApiKeyManagerProps {
  onApiKeySet?: (apiKey: string) => void;
  showModal?: boolean;
  onClose?: () => void;
}

export default function ApiKeyManager({ onApiKeySet, showModal = false, onClose }: ApiKeyManagerProps) {
  const [apiKey, setApiKey] = useLocalStorage('openai_api_key', '');
  const [inputKey, setInputKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [error, setError] = useState('');

  useEffect(() => {
    if (apiKey) {
      setInputKey(apiKey);
      setValidationStatus('valid');
    }
  }, [apiKey]);

  const handleValidateAndSave = async () => {
    if (!inputKey.trim()) {
      setError('Please enter your OpenAI API key');
      return;
    }

    // Allow demo key for development
    if (inputKey === 'demo-key' || inputKey.startsWith('sk-')) {
      setIsValidating(true);
      setError('');

      try {
        setApiKey(inputKey);
        setValidationStatus('valid');
        onApiKeySet?.(inputKey);
        onClose?.();
      } catch (error) {
        setValidationStatus('invalid');
        setError('Failed to save API key. Please try again.');
      } finally {
        setIsValidating(false);
      }
    } else {
      setError('Invalid API key format. OpenAI keys start with "sk-" or use "demo-key" for testing');
    }
  };

  const handleRemoveKey = () => {
    setApiKey('');
    setInputKey('');
    setValidationStatus('idle');
    setError('');
  };

  const getStatusIcon = () => {
    switch (validationStatus) {
      case 'valid':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'invalid':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Key className="h-5 w-5 text-gray-400" />;
    }
  };

  const content = (
    <Card className={showModal ? 'w-full max-w-md' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          {getStatusIcon()}
          <span>OpenAI API Key</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!apiKey && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">API Key Required</p>
                <p className="text-amber-700 mt-1">
                  For <strong>custom, beautiful AI-generated slides</strong>, get your OpenAI API key from{' '}
                  <a 
                    href="https://platform.openai.com/api-keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:no-underline font-semibold"
                  >
                    OpenAI Platform
                  </a>
                  {' '}($5 gives you ~500 presentations).
                </p>
                <p className="text-amber-600 text-sm mt-2">
                  💡 Use <code className="bg-amber-200 px-1 rounded">demo-key</code> for basic testing, but real API keys create truly customized, beautiful presentations!
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            API Key
          </label>
          <div className="relative">
            <Input
              type={showKey ? 'text' : 'password'}
              placeholder="sk-proj-..."
              value={inputKey}
              onChange={(e) => {
                setInputKey(e.target.value);
                setValidationStatus('idle');
                setError('');
              }}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {/* Debug info */}
          <div className="text-xs text-gray-400">
            Current stored key: {apiKey ? `${apiKey.substring(0, 10)}...` : 'None'}
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        {validationStatus === 'valid' && (
          <div className="text-green-600 text-sm bg-green-50 p-2 rounded flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>API key is valid and ready to use</span>
          </div>
        )}

        <div className="flex space-x-2">
          <Button
            onClick={handleValidateAndSave}
            disabled={isValidating || !inputKey.trim()}
            className="flex-1"
          >
            {isValidating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Validating...
              </>
            ) : (
              'Save & Validate'
            )}
          </Button>
          
          {apiKey && (
            <Button
              onClick={handleRemoveKey}
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Remove
            </Button>
          )}
          
          {showModal && onClose && (
            <Button
              onClick={onClose}
              variant="outline"
            >
              Cancel
            </Button>
          )}
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Your API key is stored securely in your browser only</p>
          <p>• It's never sent to our servers or stored in our database</p>
          <p>• You can remove it anytime from settings</p>
        </div>
      </CardContent>
    </Card>
  );

  if (showModal) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        {content}
      </div>
    );
  }

  return content;
}