'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, Download, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { exportToPPTX } from '@/lib/pptx-export';

interface Slide {
  id: number;
  type: string;
  title: string;
  subtitle?: string;
  content?: string[] | string;
  speakerNotes?: string;
  animation?: string;
  author?: string;
  layout?: string;
  backgroundStyle?: string;
  imageUrl?: string;
  imageDescription?: string;
  styling?: {
    titleSize?: string;
    titleWeight?: string;
    titleColor?: string;
    subtitleSize?: string;
    contentSize?: string;
    textAlign?: string;
    padding?: string;
    borderRadius?: string;
    shadow?: string;
    overlay?: string;
    iconColor?: string;
    bulletStyle?: string;
  };
}

interface SlideData {
  title: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
    accentColor?: string;
    gradientStart?: string;
    gradientEnd?: string;
    headingFont?: string;
    bodyFont?: string;
    mood?: string;
  };
  slides: Slide[];
}

interface SlideViewerProps {
  slideData: SlideData;
  onToggleChat: () => void;
  isChatOpen: boolean;
  projectType?: 'presentation' | 'planner';
}

export default function SlideViewer({ slideData, onToggleChat, isChatOpen, projectType = 'presentation' }: SlideViewerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);

  const nextSlide = () => {
    if (currentSlide < slideData.slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === ' ') {
      nextSlide();
    } else if (e.key === 'ArrowLeft') {
      prevSlide();
    } else if (e.key === 'Escape') {
      setIsPresenting(false);
    }
  };

  useEffect(() => {
    if (isPresenting) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [isPresenting, currentSlide]);

  const handleExportPPTX = async () => {
    try {
      await exportToPPTX(slideData);
    } catch (error: any) {
      console.error('Export failed:', error);
      alert('Export failed: ' + error.message);
    }
  };

  const handleExportHTML = async () => {
    try {
      // Simple HTML export functionality
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${slideData.title}</title>
          <style>
            body { font-family: ${slideData.theme.fontFamily}; margin: 0; padding: 20px; }
            .slide { page-break-after: always; margin-bottom: 40px; }
            h1 { color: ${slideData.theme.primaryColor}; }
            h2 { color: ${slideData.theme.primaryColor}; }
          </style>
        </head>
        <body>
          <h1>${slideData.title}</h1>
          ${slideData.slides.map((slide: any) => `
            <div class="slide">
              <h2>${slide.title}</h2>
              ${slide.subtitle ? `<h3>${slide.subtitle}</h3>` : ''}
              ${Array.isArray(slide.content) ? 
                `<ul>${slide.content.map((item: string) => `<li>${item}</li>`).join('')}</ul>` : 
                `<p>${slide.content || ''}</p>`
              }
              ${slide.speakerNotes ? `<p><em>Notes: ${slide.speakerNotes}</em></p>` : ''}
            </div>
          `).join('')}
        </body>
        </html>
      `;
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slideData.title?.replace(/[^a-z0-9]/gi, '_') || 'presentation'}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('HTML export failed:', error);
      alert('HTML export failed: ' + error.message);
    }
  };

  const renderSlide = (slide: Slide) => {
    const theme = slideData.theme;
    const styling = slide.styling || {};

    // Create dynamic styles based on slide configuration
    const getBackgroundStyle = () => {
      const baseStyle: any = {
        fontFamily: theme.bodyFont || theme.fontFamily || 'Inter',
        color: styling.titleColor || theme.textColor,
      };

      switch (slide.backgroundStyle) {
        case 'gradient':
          baseStyle.background = `linear-gradient(135deg, ${theme.gradientStart || theme.primaryColor}, ${theme.gradientEnd || theme.secondaryColor})`;
          break;
        case 'image':
          if (slide.imageUrl) {
            baseStyle.backgroundImage = `url(${slide.imageUrl})`;
            baseStyle.backgroundSize = 'cover';
            baseStyle.backgroundPosition = 'center';
            baseStyle.position = 'relative';
          }
          break;
        case 'split-color':
          baseStyle.background = `linear-gradient(90deg, ${theme.primaryColor} 50%, ${theme.backgroundColor} 50%)`;
          break;
        default:
          baseStyle.backgroundColor = theme.backgroundColor;
      }

      return baseStyle;
    };

    const getOverlayStyle = () => {
      if (slide.backgroundStyle === 'image' && styling.overlay) {
        const overlayOpacity = styling.overlay === 'dark' ? 0.6 : 0.3;
        return {
          position: 'absolute' as const,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: styling.overlay === 'dark' ? 'rgba(0,0,0,' + overlayOpacity + ')' : 'rgba(255,255,255,' + overlayOpacity + ')',
          zIndex: 1
        };
      }
      return {};
    };

    const getTextSizeClass = (size: string) => {
      const sizeMap: { [key: string]: string } = {
        'xs': 'text-xs',
        'sm': 'text-sm',
        'base': 'text-base',
        'lg': 'text-lg',
        'xl': 'text-xl',
        '2xl': 'text-2xl',
        '3xl': 'text-3xl',
        '4xl': 'text-4xl',
        '5xl': 'text-5xl',
        '6xl': 'text-6xl'
      };
      return sizeMap[size] || 'text-2xl';
    };

    const contentStyle = {
      position: 'relative' as const,
      zIndex: 2,
      height: '100%'
    };

    switch (slide.type) {
      case 'hero':
      case 'title':
        return (
          <div className="relative h-full" style={getBackgroundStyle()}>
            <div style={getOverlayStyle()}></div>
            <div
              className={`flex flex-col items-center justify-center h-full text-center p-8 ${styling.textAlign === 'left' ? 'text-left' : styling.textAlign === 'right' ? 'text-right' : 'text-center'}`}
              style={contentStyle}
            >
              <h1
                className={`${getTextSizeClass(styling.titleSize || '5xl')} font-${styling.titleWeight || 'bold'} mb-6`}
                style={{
                  color: styling.titleColor || theme.primaryColor,
                  fontFamily: theme.headingFont || theme.fontFamily,
                  textShadow: slide.backgroundStyle === 'image' ? '2px 2px 4px rgba(0,0,0,0.5)' : 'none'
                }}
              >
                {slide.title}
              </h1>
              {slide.subtitle && (
                <p
                  className={`${getTextSizeClass(styling.subtitleSize || '2xl')} opacity-90`}
                  style={{
                    color: styling.titleColor || theme.textColor,
                    textShadow: slide.backgroundStyle === 'image' ? '1px 1px 2px rgba(0,0,0,0.5)' : 'none'
                  }}
                >
                  {slide.subtitle}
                </p>
              )}
            </div>
          </div>
        );

      case 'split':
        return (
          <div className="relative h-full" style={getBackgroundStyle()}>
            <div style={getOverlayStyle()}></div>
            <div className="flex h-full" style={contentStyle}>
              <div className="w-1/2 p-8 flex flex-col justify-center">
                <h2
                  className={`${getTextSizeClass(styling.titleSize || '4xl')} font-bold mb-6`}
                  style={{
                    color: styling.titleColor || theme.primaryColor,
                    fontFamily: theme.headingFont || theme.fontFamily
                  }}
                >
                  {slide.title}
                </h2>
                {slide.content && (
                  <div className={`space-y-3 ${getTextSizeClass(styling.contentSize || 'lg')}`}>
                    {Array.isArray(slide.content) ? (
                      <ul className="space-y-3">
                        {slide.content.map((item, index) => (
                          <li key={index} className="flex items-start">
                            <span
                              className="w-2 h-2 rounded-full mr-3 mt-3 flex-shrink-0"
                              style={{ backgroundColor: theme.accentColor || theme.secondaryColor }}
                            />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>{slide.content}</p>
                    )}
                  </div>
                )}
              </div>
              <div className="w-1/2 relative">
                {slide.imageUrl && (
                  <img
                    src={slide.imageUrl}
                    alt={slide.imageDescription || slide.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>
          </div>
        );

      case 'quote':
        return (
          <div className="relative h-full" style={getBackgroundStyle()}>
            <div style={getOverlayStyle()}></div>
            <div className="flex flex-col items-center justify-center h-full text-center p-8" style={contentStyle}>
              <div className="max-w-4xl">
                <blockquote
                  className={`${getTextSizeClass(styling.titleSize || '4xl')} italic mb-8 leading-relaxed`}
                  style={{
                    color: styling.titleColor || theme.primaryColor,
                    fontFamily: theme.headingFont || theme.fontFamily
                  }}
                >
                  "{Array.isArray(slide.content) ? slide.content.join(' ') : slide.content}"
                </blockquote>
                {slide.author && (
                  <cite
                    className={`${getTextSizeClass(styling.subtitleSize || 'xl')} opacity-80 not-italic`}
                    style={{ color: theme.textColor }}
                  >
                    — {slide.author}
                  </cite>
                )}
              </div>
            </div>
          </div>
        );

      case 'stats':
        return (
          <div className="relative h-full" style={getBackgroundStyle()}>
            <div style={getOverlayStyle()}></div>
            <div className="h-full p-8" style={contentStyle}>
              <h2
                className={`${getTextSizeClass(styling.titleSize || '4xl')} font-bold mb-8 text-center`}
                style={{
                  color: styling.titleColor || theme.primaryColor,
                  fontFamily: theme.headingFont || theme.fontFamily
                }}
              >
                {slide.title}
              </h2>
              {slide.content && Array.isArray(slide.content) && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 h-3/4">
                  {slide.content.map((item, index) => (
                    <div key={index} className="text-center">
                      <div
                        className="text-6xl font-bold mb-4"
                        style={{ color: theme.accentColor || theme.primaryColor }}
                      >
                        {typeof item === 'string' ? item.split(' ')[0] : item}
                      </div>
                      <div className="text-lg opacity-80">
                        {typeof item === 'string' ? item.split(' ').slice(1).join(' ') : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'image-focus':
        return (
          <div className="relative h-full" style={getBackgroundStyle()}>
            <div style={getOverlayStyle()}></div>
            <div className="absolute inset-0 flex items-end p-8" style={{ zIndex: 2 }}>
              <div className="w-full">
                <h2
                  className={`${getTextSizeClass(styling.titleSize || '4xl')} font-bold mb-4`}
                  style={{
                    color: 'white',
                    fontFamily: theme.headingFont || theme.fontFamily,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                  }}
                >
                  {slide.title}
                </h2>
                {slide.subtitle && (
                  <p
                    className={`${getTextSizeClass(styling.subtitleSize || 'xl')} opacity-90`}
                    style={{
                      color: 'white',
                      textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                    }}
                  >
                    {slide.subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 'content':
      default:
        return (
          <div className="relative h-full" style={getBackgroundStyle()}>
            <div style={getOverlayStyle()}></div>
            <div className="h-full p-8 flex flex-col" style={contentStyle}>
              <h2
                className={`${getTextSizeClass(styling.titleSize || '4xl')} font-bold mb-8`}
                style={{
                  color: styling.titleColor || theme.primaryColor,
                  fontFamily: theme.headingFont || theme.fontFamily
                }}
              >
                {slide.title}
              </h2>
              {slide.content && (
                <div className={`space-y-4 ${getTextSizeClass(styling.contentSize || 'lg')} flex-1`}>
                  {Array.isArray(slide.content) ? (
                    <ul className="space-y-4">
                      {slide.content.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <span
                            className="w-3 h-3 rounded-full mr-4 mt-2 flex-shrink-0"
                            style={{ backgroundColor: theme.accentColor || theme.secondaryColor }}
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>{slide.content}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  if (isPresenting) {
    return (
      <div className="fixed inset-0 bg-black z-50">
        <div className="h-full w-full">
          {renderSlide(slideData.slides[currentSlide])}
        </div>

        {/* Presentation Controls */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-black/50 rounded-lg px-4 py-2">
          <Button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-white text-sm">
            {currentSlide + 1} / {slideData.slides.length}
          </span>

          <Button
            onClick={nextSlide}
            disabled={currentSlide === slideData.slides.length - 1}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            onClick={() => setIsPresenting(false)}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            <Pause className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col ${isChatOpen ? 'mr-80' : ''} transition-all duration-300`}>
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            variant="outline"
            size="sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-sm text-gray-600">
            Slide {currentSlide + 1} of {slideData.slides.length}
          </span>

          <Button
            onClick={nextSlide}
            disabled={currentSlide === slideData.slides.length - 1}
            variant="outline"
            size="sm"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            onClick={onToggleChat}
            variant="outline"
            size="sm"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            AI Chat
          </Button>

          <Button
            onClick={() => setIsPresenting(true)}
            variant="outline"
            size="sm"
          >
            <Play className="h-4 w-4 mr-2" />
            Present
          </Button>

          <div className="flex space-x-2">
            <Button
              onClick={handleExportHTML}
              className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export HTML
            </Button>
            <Button
              onClick={handleExportPPTX}
              variant="outline"
              size="sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Text
            </Button>
          </div>
        </div>
      </div>

      {/* Slide Display */}
      <div className="flex-1 bg-gray-100 p-8">
        <div
          className={`w-full h-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden slide-container slide-animate-${slideData.slides[currentSlide]?.animation || 'fadeIn'}`}
          style={{
            aspectRatio: '16/9',
            '--primary-color': slideData.theme.primaryColor,
            '--secondary-color': slideData.theme.secondaryColor,
            '--accent-color': slideData.theme.accentColor,
            '--gradient-start': slideData.theme.gradientStart || slideData.theme.primaryColor,
            '--gradient-end': slideData.theme.gradientEnd || slideData.theme.secondaryColor
          } as any}
        >
          {slideData.slides[currentSlide] && renderSlide(slideData.slides[currentSlide])}
        </div>
      </div>

      {/* Slide Thumbnails */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex space-x-2 overflow-x-auto">
          {slideData.slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => setCurrentSlide(index)}
              className={`flex-shrink-0 w-24 h-16 rounded border-2 transition-colors ${index === currentSlide
                ? 'border-teal-500 bg-teal-50'
                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
            >
              <div className="w-full h-full p-1 text-xs overflow-hidden">
                <div className="font-semibold truncate">{slide.title}</div>
                <div className="text-gray-500 text-[10px]">Slide {index + 1}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}