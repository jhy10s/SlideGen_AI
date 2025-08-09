import { render, screen, fireEvent } from '@testing-library/react';
import SlideViewer from '@/components/SlideViewer';

const mockSlideData = {
  title: 'Test Presentation',
  theme: {
    primaryColor: '#0891b2',
    secondaryColor: '#0f766e',
    backgroundColor: '#ffffff',
    textColor: '#1e293b',
    fontFamily: 'Inter'
  },
  slides: [
    {
      id: 1,
      type: 'title',
      title: 'Welcome',
      subtitle: 'Test Presentation',
      content: [],
      speakerNotes: 'Introduction slide',
      animation: 'fadeIn'
    },
    {
      id: 2,
      type: 'content',
      title: 'Main Content',
      content: ['Point 1', 'Point 2', 'Point 3'],
      speakerNotes: 'Main content slide',
      animation: 'slideInLeft'
    }
  ]
};

describe('SlideViewer', () => {
  const mockOnToggleChat = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders slide content correctly', () => {
    render(
      <SlideViewer
        slideData={mockSlideData}
        onToggleChat={mockOnToggleChat}
        isChatOpen={false}
      />
    );

    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByText('Test Presentation')).toBeInTheDocument();
  });

  it('navigates between slides', () => {
    render(
      <SlideViewer
        slideData={mockSlideData}
        onToggleChat={mockOnToggleChat}
        isChatOpen={false}
      />
    );

    // Should show first slide initially
    expect(screen.getByText('Welcome')).toBeInTheDocument();

    // Navigate to next slide
    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);

    // Should show second slide
    expect(screen.getByText('Main Content')).toBeInTheDocument();
  });

  it('toggles chat when button is clicked', () => {
    render(
      <SlideViewer
        slideData={mockSlideData}
        onToggleChat={mockOnToggleChat}
        isChatOpen={false}
      />
    );

    const chatButton = screen.getByText('AI Chat');
    fireEvent.click(chatButton);

    expect(mockOnToggleChat).toHaveBeenCalledTimes(1);
  });
});