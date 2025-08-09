import OpenAI from 'openai';

export const createOpenAIClient = (apiKey: string) => {
  if (!apiKey) {
    throw new Error('No API key provided. Please set your OpenAI API key.');
  }
  
  // Handle demo key for development
  if (apiKey === 'demo-key') {
    console.log('Using demo mode - will use fallback slide generation');
    return null; // We'll handle this in the generate functions
  }
  
  if (!apiKey.startsWith('sk-')) {
    throw new Error('Invalid OpenAI API key format. Please check your API key and try again.');
  }
  
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });
};

export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  // Handle demo key
  if (apiKey === 'demo-key') {
    return true;
  }
  
  try {
    const openai = createOpenAIClient(apiKey);
    if (!openai) return false;
    
    const response = await Promise.race([
      openai.models.list(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      )
    ]);
    return true;
  } catch (error: any) {
    console.error('API key validation error:', error);
    if (error.message.includes('timeout') || error.message.includes('network')) {
      throw new Error('Network error. Please check your internet connection.');
    }
    return false;
  }
};

export const generateSlides = async (apiKey: string, prompt: string, isDayPlanner: boolean = false) => {
  // Only use demo mode if explicitly requested
  if (apiKey === 'demo-key') {
    console.log('Demo mode requested - generating fallback slides');
    return generateFallbackSlides(prompt, isDayPlanner);
  }
  
  // Prioritize real API key usage
  const openai = createOpenAIClient(apiKey);
  
  if (!openai) {
    throw new Error('Failed to create OpenAI client. Please check your API key.');
  }
  
  const systemPrompt = isDayPlanner ? getDayPlannerPrompt() : getSlideGenerationPrompt();
  
  try {
    console.log('Using OpenAI API to generate slides...');
    
    // Add timeout to the request
    const response = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout after 45 seconds')), 45000)
      )
    ]) as any;

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No response from OpenAI');
    
    console.log('OpenAI response received, parsing...');
    
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.log('Raw content:', content);
      throw new Error('Failed to parse AI response as JSON. The AI may have returned invalid format.');
    }
    
    // Validate the response structure
    if (!parsedContent.title || !parsedContent.slides || !Array.isArray(parsedContent.slides)) {
      console.error('Invalid structure:', parsedContent);
      throw new Error('Invalid response structure from OpenAI. Missing title or slides array.');
    }
    
    // Ensure each slide has required fields
    parsedContent.slides = parsedContent.slides.map((slide: any, index: number) => ({
      id: slide.id || index + 1,
      type: slide.type || 'content',
      title: slide.title || `Slide ${index + 1}`,
      subtitle: slide.subtitle || '',
      content: slide.content || [],
      speakerNotes: slide.speakerNotes || '',
      animation: slide.animation || 'fadeIn',
      ...slide
    }));
    
    console.log(`Successfully generated ${parsedContent.slides.length} slides`);
    return parsedContent;
    
  } catch (error: any) {
    console.error('OpenAI generation error:', error);
    
    // Provide specific error messages
    if (error.message.includes('timeout')) {
      throw new Error('OpenAI request timed out. Please try again with a shorter prompt or check your internet connection.');
    }
    if (error.message.includes('network') || error.message.includes('fetch')) {
      throw new Error('Network error connecting to OpenAI. Please check your internet connection.');
    }
    if (error.message.includes('JSON') || error.message.includes('parse')) {
      throw new Error('OpenAI returned invalid format. Please try rephrasing your prompt.');
    }
    if (error.status === 401) {
      throw new Error('Invalid OpenAI API key. Please check your API key and try again.');
    }
    if (error.status === 429) {
      throw new Error('OpenAI rate limit exceeded. Please wait a moment and try again.');
    }
    if (error.status === 500) {
      throw new Error('OpenAI service error. Please try again in a few minutes.');
    }
    if (error.status === 400) {
      throw new Error('Invalid request to OpenAI. Please try a different prompt.');
    }
    
    // Only use fallback as last resort and inform user
    console.warn('All OpenAI attempts failed, using fallback generation');
    throw new Error(`OpenAI API Error: ${error.message || 'Unknown error occurred'}. Please check your API key and try again.`);
  }
};

export const chatWithAI = async (apiKey: string, messages: any[], slideData: any) => {
  // Handle demo key
  if (apiKey === 'demo-key') {
    return "I'm in demo mode. In the full version, I can help you modify slides, change themes, add content, and more!";
  }
  
  const openai = createOpenAIClient(apiKey);
  
  if (!openai) {
    throw new Error('Failed to create OpenAI client');
  }
  
  const systemPrompt = `You are an AI assistant helping to refine a slide presentation. 

Current presentation data:
Title: ${slideData.title}
Number of slides: ${slideData.slides?.length || 0}
Theme: ${JSON.stringify(slideData.theme)}

You can help users:
1. Add new slides - Provide the new slide JSON structure
2. Remove slides - Specify which slide to remove
3. Edit slide content - Provide updated content
4. Change themes and colors - Suggest new theme colors
5. Modify animations - Suggest different animation types
6. Update speaker notes - Provide enhanced notes
7. Reorder slides - Suggest better slide sequence

When making changes that require updating the presentation, provide the complete updated JSON structure for the affected slides or the entire presentation.

Available slide types: "title", "content", "image", "quote", "conclusion", "section"
Available animations: "fadeIn", "slideInLeft", "slideInRight", "zoomIn", "bounceIn", "slideUp", "slideDown"

Always be helpful, specific, and provide actionable suggestions.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    return response.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
  } catch (error: any) {
    throw new Error(`Chat AI Error: ${error.message}`);
  }
};

export const generateDayPlanner = async (apiKey: string, tasks: any[], date: string) => {
  const taskList = tasks.map(task => 
    `${task.time}: ${task.title} (${task.duration} min, ${task.priority} priority)`
  ).join('\n');
  
  const prompt = `Create a professional daily planner presentation for ${date} with these tasks:

${taskList}

Generate a comprehensive daily schedule with time management tips, priority focus areas, and motivational elements.`;

  return generateSlides(apiKey, prompt, true);
};

const getSlideGenerationPrompt = () => `You are a world-class presentation designer with expertise in visual design, typography, color theory, and user experience. Create stunning, modern slide decks that combine excellent content with beautiful visual design.

IMPORTANT: You must respond with valid JSON only. No additional text or explanations.

Required JSON structure:
{
  "title": "Compelling, Topic-Specific Title",
  "description": "Detailed description tailored to the topic",
  "theme": {
    "primaryColor": "#6366f1",
    "secondaryColor": "#8b5cf6",
    "backgroundColor": "#ffffff",
    "textColor": "#1f2937",
    "accentColor": "#f59e0b",
    "gradientStart": "#6366f1",
    "gradientEnd": "#8b5cf6",
    "fontFamily": "Inter",
    "headingFont": "Poppins",
    "bodyFont": "Inter",
    "mood": "professional"
  },
  "slides": [
    {
      "id": 1,
      "type": "hero",
      "title": "Main Title",
      "subtitle": "Compelling subtitle",
      "content": [],
      "speakerNotes": "Opening remarks",
      "animation": "fadeIn",
      "layout": "center",
      "backgroundStyle": "gradient",
      "imageUrl": "https://images.unsplash.com/1600x900/?business,modern,professional",
      "imageDescription": "Professional business environment",
      "styling": {
        "titleSize": "5xl",
        "titleWeight": "bold",
        "subtitleSize": "xl",
        "textAlign": "center",
        "overlay": "dark"
      }
    }
  ]
}

DESIGN REQUIREMENTS:

1. **Color Schemes** - Choose mood-based palettes that match the topic:
   - **Business/Corporate**: Navy, gold, silver (#1e3a8a, #d97706, #6b7280)
   - **Technology**: Electric blues, cyans, purples (#3b82f6, #06b6d4, #8b5cf6)
   - **Creative/Design**: Vibrant purples, pinks, oranges (#8b5cf6, #ec4899, #f97316)
   - **Health/Medical**: Clean blues, greens, whites (#0891b2, #059669, #f8fafc)
   - **Education**: Warm oranges, blues, greens (#f97316, #3b82f6, #10b981)
   - **Finance**: Deep blues, golds, grays (#1e40af, #d97706, #64748b)
   - **Environment**: Earth greens, browns, blues (#059669, #92400e, #0891b2)
   - **Modern/Startup**: Gradients with vibrant colors (#6366f1 to #8b5cf6)

2. **Typography Combinations**:
   - **Modern**: headingFont: "Poppins", bodyFont: "Inter"
   - **Professional**: headingFont: "Montserrat", bodyFont: "Open Sans"
   - **Creative**: headingFont: "Playfair Display", bodyFont: "Source Sans Pro"
   - **Tech**: headingFont: "Roboto Slab", bodyFont: "Lato"

3. **Images** - Include relevant Unsplash URLs for EVERY slide:
   - Format: "https://images.unsplash.com/1600x900/?[keywords]"
   - Use specific keywords: "business,meeting", "technology,innovation", "nature,growth"
   - Match images to slide content and overall theme

4. **Slide Types & Layouts**:
   - **hero**: Large title with stunning background image
   - **split**: Content on left, large image on right
   - **grid**: Multiple content blocks in organized grid
   - **quote**: Large inspirational quote with author image
   - **stats**: Big numbers with icons and visual elements
   - **timeline**: Process steps with connecting lines
   - **comparison**: Side-by-side with visual dividers
   - **image-focus**: Minimal text over striking imagery
   - **section**: Beautiful divider with topic-relevant graphics

5. **Background Styles**:
   - **gradient**: Beautiful linear gradients (use gradientStart/gradientEnd)
   - **image**: Full background image with colored overlay
   - **split-color**: Two-tone backgrounds for visual interest
   - **pattern**: Subtle geometric patterns or textures

6. **Advanced Styling** for each slide:
   Include styling object with properties like titleSize, titleWeight, titleColor, subtitleSize, contentSize, textAlign, padding, borderRadius, shadow, overlay, iconColor, bulletStyle

7. **Animations** (choose based on slide type):
   - **Entrances**: "fadeIn", "slideInUp", "zoomIn", "bounceIn"
   - **Emphasis**: "pulse", "tada", "swing", "wobble"
   - **Directional**: "slideInLeft", "slideInRight", "flipInX", "rotateIn"

CONTENT ENHANCEMENT:
1. **Visual Elements**: Use emojis, icons, and symbols strategically
2. **Hierarchy**: Vary text sizes for visual impact
3. **White Space**: Use generous spacing for modern look
4. **Color Psychology**: Match colors to evoke appropriate emotions
5. **Brand Consistency**: Maintain visual consistency throughout

SLIDE CREATION RULES:
1. Generate 8-15 slides with varied, engaging layouts
2. Start with impactful hero slide with stunning visuals
3. Include beautiful section dividers
4. Use data visualization concepts for statistics
5. Add relevant quotes with author attribution
6. Include compelling call-to-action slides
7. End with memorable, visually striking conclusion
8. Ensure every slide has appropriate background image
9. Match all visual elements to the topic/industry
10. Create presentation-ready content that impresses

Make each slide a visual masterpiece while maintaining professional credibility and topic relevance.`;

const getDayPlannerPrompt = () => `You are a productivity expert and daily planning specialist. Create a comprehensive daily planner presentation.

IMPORTANT: You must respond with valid JSON only. No additional text or explanations.

Required JSON structure:
{
  "title": "Daily Planner - [Date]",
  "description": "Organized daily schedule with productivity tips",
  "theme": {
    "primaryColor": "#059669",
    "secondaryColor": "#0d9488",
    "backgroundColor": "#ffffff",
    "textColor": "#1f2937",
    "accentColor": "#10b981",
    "fontFamily": "Inter"
  },
  "slides": [
    {
      "id": 1,
      "type": "title",
      "title": "Daily Planner",
      "subtitle": "Date and motivational tagline",
      "content": [],
      "speakerNotes": "Daily planning overview",
      "animation": "fadeIn"
    }
  ]
}

Planner Slide Types:
1. Title slide with date and motivation
2. Daily overview with key priorities
3. Morning schedule (detailed time blocks)
4. Afternoon schedule (detailed time blocks)
5. Evening schedule and wind-down
6. Priority tasks highlight
7. Break times and self-care
8. Productivity tips and reminders
9. Tomorrow's preparation
10. Daily reflection prompts

Include:
- Time management strategies
- Priority task identification
- Break reminders
- Motivational quotes
- Productivity tips
- Energy level optimization
- Goal tracking elements

Make it practical, motivating, and actionable for daily use.`;

// Intelligent fallback slide generator that creates personalized content
const generateFallbackSlides = (prompt: string, isDayPlanner: boolean = false) => {
  
  // Advanced prompt analysis
  const analyzePrompt = (prompt: string) => {
    const p = prompt.toLowerCase();
    const words = p.split(' ');
    
    // Extract key topics and concepts
    const topics = [];
    const concepts = [];
    const actionWords = [];
    
    // Industry/domain detection
    let industry = 'general';
    if (p.includes('business') || p.includes('corporate') || p.includes('finance') || p.includes('marketing')) industry = 'business';
    else if (p.includes('tech') || p.includes('ai') || p.includes('artificial intelligence') || p.includes('digital') || p.includes('software')) industry = 'technology';
    else if (p.includes('health') || p.includes('medical') || p.includes('wellness') || p.includes('fitness')) industry = 'health';
    else if (p.includes('education') || p.includes('learning') || p.includes('teaching') || p.includes('school')) industry = 'education';
    else if (p.includes('environment') || p.includes('climate') || p.includes('sustainability') || p.includes('green')) industry = 'environment';
    else if (p.includes('creative') || p.includes('design') || p.includes('art') || p.includes('innovation')) industry = 'creative';
    
    // Extract main subject
    const subject = extractMainSubject(prompt);
    
    // Determine presentation type
    let presentationType = 'informational';
    if (p.includes('strategy') || p.includes('plan') || p.includes('approach')) presentationType = 'strategic';
    else if (p.includes('how to') || p.includes('guide') || p.includes('tutorial')) presentationType = 'instructional';
    else if (p.includes('benefits') || p.includes('advantages') || p.includes('why')) presentationType = 'persuasive';
    else if (p.includes('overview') || p.includes('introduction') || p.includes('about')) presentationType = 'overview';
    
    return { industry, subject, presentationType, originalPrompt: prompt };
  };
  
  const extractMainSubject = (prompt: string) => {
    // Simple extraction - in a real implementation, this would be more sophisticated
    const words = prompt.toLowerCase().split(' ');
    const stopWords = ['create', 'make', 'generate', 'about', 'on', 'for', 'presentation', 'slides', 'a', 'an', 'the', 'and', 'or', 'but'];
    const meaningfulWords = words.filter(word => !stopWords.includes(word) && word.length > 2);
    return meaningfulWords.slice(0, 3).join(' ');
  };
  
  // Determine theme based on industry and topic
  const getIndustryTheme = (industry: string) => {
    const themes = {
      business: {
        primaryColor: "#1e3a8a", secondaryColor: "#3b82f6", backgroundColor: "#ffffff",
        textColor: "#1f2937", accentColor: "#d97706", gradientStart: "#1e3a8a", gradientEnd: "#3b82f6",
        fontFamily: "Inter", headingFont: "Montserrat", bodyFont: "Open Sans", mood: "professional"
      },
      technology: {
        primaryColor: "#6366f1", secondaryColor: "#8b5cf6", backgroundColor: "#ffffff",
        textColor: "#1f2937", accentColor: "#06b6d4", gradientStart: "#6366f1", gradientEnd: "#8b5cf6",
        fontFamily: "Inter", headingFont: "Poppins", bodyFont: "Inter", mood: "modern"
      },
      health: {
        primaryColor: "#0891b2", secondaryColor: "#059669", backgroundColor: "#ffffff",
        textColor: "#1f2937", accentColor: "#10b981", gradientStart: "#0891b2", gradientEnd: "#059669",
        fontFamily: "Inter", headingFont: "Poppins", bodyFont: "Inter", mood: "clean"
      },
      education: {
        primaryColor: "#f97316", secondaryColor: "#3b82f6", backgroundColor: "#ffffff",
        textColor: "#1f2937", accentColor: "#10b981", gradientStart: "#f97316", gradientEnd: "#3b82f6",
        fontFamily: "Inter", headingFont: "Poppins", bodyFont: "Inter", mood: "friendly"
      },
      environment: {
        primaryColor: "#059669", secondaryColor: "#92400e", backgroundColor: "#ffffff",
        textColor: "#1f2937", accentColor: "#fbbf24", gradientStart: "#059669", gradientEnd: "#92400e",
        fontFamily: "Inter", headingFont: "Poppins", bodyFont: "Inter", mood: "natural"
      },
      creative: {
        primaryColor: "#8b5cf6", secondaryColor: "#ec4899", backgroundColor: "#ffffff",
        textColor: "#1f2937", accentColor: "#f97316", gradientStart: "#8b5cf6", gradientEnd: "#ec4899",
        fontFamily: "Inter", headingFont: "Playfair Display", bodyFont: "Source Sans Pro", mood: "creative"
      },
      general: {
        primaryColor: "#6366f1", secondaryColor: "#8b5cf6", backgroundColor: "#ffffff",
        textColor: "#1f2937", accentColor: "#f59e0b", gradientStart: "#6366f1", gradientEnd: "#8b5cf6",
        fontFamily: "Inter", headingFont: "Poppins", bodyFont: "Inter", mood: "modern"
      }
    };
    return themes[industry] || themes.general;
  };
  
  // Generate content based on prompt analysis
  const generatePersonalizedContent = (analysis: any) => {
    const { industry, subject, presentationType, originalPrompt } = analysis;
    
    // Create contextual content based on the prompt
    const contentStrategies = {
      strategic: {
        slides: [
          { type: 'hero', title: `${subject}: Strategic Approach`, focus: 'strategy' },
          { type: 'content', title: 'Current Situation Analysis', focus: 'analysis' },
          { type: 'content', title: 'Strategic Objectives', focus: 'objectives' },
          { type: 'content', title: 'Implementation Roadmap', focus: 'implementation' },
          { type: 'stats', title: 'Expected Outcomes', focus: 'results' },
          { type: 'quote', title: 'Strategic Insight', focus: 'inspiration' },
          { type: 'image-focus', title: 'Next Steps', focus: 'action' }
        ]
      },
      instructional: {
        slides: [
          { type: 'hero', title: `How to: ${subject}`, focus: 'guide' },
          { type: 'content', title: 'Getting Started', focus: 'basics' },
          { type: 'split', title: 'Step-by-Step Process', focus: 'process' },
          { type: 'content', title: 'Best Practices', focus: 'tips' },
          { type: 'content', title: 'Common Mistakes to Avoid', focus: 'pitfalls' },
          { type: 'stats', title: 'Success Metrics', focus: 'measurement' },
          { type: 'image-focus', title: 'Take Action Today', focus: 'action' }
        ]
      },
      persuasive: {
        slides: [
          { type: 'hero', title: `Why ${subject} Matters`, focus: 'importance' },
          { type: 'content', title: 'The Problem', focus: 'problem' },
          { type: 'split', title: 'The Solution', focus: 'solution' },
          { type: 'stats', title: 'Proven Benefits', focus: 'benefits' },
          { type: 'quote', title: 'Success Stories', focus: 'testimonial' },
          { type: 'content', title: 'Implementation Steps', focus: 'action' },
          { type: 'image-focus', title: 'Start Your Journey', focus: 'cta' }
        ]
      },
      overview: {
        slides: [
          { type: 'hero', title: `Understanding ${subject}`, focus: 'introduction' },
          { type: 'content', title: 'Key Concepts', focus: 'concepts' },
          { type: 'split', title: 'How It Works', focus: 'mechanism' },
          { type: 'stats', title: 'By the Numbers', focus: 'data' },
          { type: 'content', title: 'Real-World Applications', focus: 'applications' },
          { type: 'quote', title: 'Expert Perspective', focus: 'authority' },
          { type: 'image-focus', title: 'The Future', focus: 'future' }
        ]
      },
      informational: {
        slides: [
          { type: 'hero', title: `${subject}: Complete Guide`, focus: 'comprehensive' },
          { type: 'content', title: 'Overview & Importance', focus: 'overview' },
          { type: 'split', title: 'Key Components', focus: 'components' },
          { type: 'content', title: 'Detailed Analysis', focus: 'analysis' },
          { type: 'stats', title: 'Facts & Figures', focus: 'data' },
          { type: 'content', title: 'Practical Applications', focus: 'practical' },
          { type: 'quote', title: 'Industry Insights', focus: 'insights' },
          { type: 'image-focus', title: 'Looking Forward', focus: 'conclusion' }
        ]
      }
    };
    
    return contentStrategies[presentationType] || contentStrategies.informational;
  };
  
  // Generate specific content for each slide based on the prompt
  const generateSlideContent = (slideTemplate: any, analysis: any, index: number) => {
    const { industry, subject, originalPrompt } = analysis;
    
    // Content generators based on focus area
    const contentGenerators = {
      strategy: () => [`Comprehensive ${subject} strategy`, `Market analysis and positioning`, `Competitive advantages`, `Risk assessment and mitigation`],
      analysis: () => [`Current market landscape for ${subject}`, `Key challenges and opportunities`, `Stakeholder impact assessment`, `Resource requirements`],
      objectives: () => [`Primary goals for ${subject} initiative`, `Measurable success criteria`, `Timeline and milestones`, `Resource allocation strategy`],
      implementation: () => [`Phase 1: Foundation and planning`, `Phase 2: Execution and monitoring`, `Phase 3: Optimization and scaling`, `Continuous improvement process`],
      results: () => [`85% improvement in efficiency`, `200% increase in engagement`, `50% reduction in costs`, `95% user satisfaction rate`],
      guide: () => [`Complete ${subject} methodology`, `Proven techniques and approaches`, `Expert recommendations`, `Practical implementation tips`],
      basics: () => [`Essential ${subject} fundamentals`, `Core principles to understand`, `Prerequisites and requirements`, `Getting started checklist`],
      process: () => [`Step 1: Initial assessment and planning`, `Step 2: Implementation and execution`, `Step 3: Monitoring and adjustment`, `Step 4: Evaluation and optimization`],
      tips: () => [`Industry best practices for ${subject}`, `Expert recommendations`, `Proven strategies that work`, `Common success factors`],
      pitfalls: () => [`Avoid these common ${subject} mistakes`, `Warning signs to watch for`, `How to prevent typical failures`, `Recovery strategies when things go wrong`],
      problem: () => [`Current challenges with ${subject}`, `Impact on stakeholders`, `Cost of inaction`, `Urgency for change`],
      solution: () => [`Innovative ${subject} approach`, `Proven methodology`, `Comprehensive framework`, `Scalable implementation`],
      benefits: () => [`Immediate advantages of ${subject}`, `Long-term strategic value`, `ROI and cost savings`, `Competitive differentiation`],
      concepts: () => [`Core ${subject} principles`, `Fundamental concepts`, `Key terminology`, `Theoretical framework`],
      mechanism: () => [`How ${subject} functions`, `Underlying processes`, `System architecture`, `Workflow and procedures`],
      data: () => [`${subject} market size: $2.5B`, `Annual growth rate: 25%`, `User adoption: 78%`, `Success rate: 92%`],
      applications: () => [`${subject} in enterprise`, `Consumer applications`, `Industry use cases`, `Emerging opportunities`],
      components: () => [`Essential ${subject} elements`, `Core building blocks`, `Integration points`, `System dependencies`],
      practical: () => [`Real-world ${subject} examples`, `Case studies and results`, `Implementation scenarios`, `Practical considerations`],
      comprehensive: () => [`Everything you need to know about ${subject}`, `Complete coverage of key topics`, `Expert insights and analysis`, `Actionable recommendations`],
      overview: () => [`${subject} landscape overview`, `Current state and trends`, `Key players and stakeholders`, `Market dynamics`],
      insights: () => [`Expert analysis of ${subject}`, `Industry trends and patterns`, `Future predictions`, `Strategic recommendations`],
      conclusion: () => [`The future of ${subject}`, `Emerging trends and opportunities`, `Next steps and recommendations`, `Call to action`]
    };
    
    const generator = contentGenerators[slideTemplate.focus];
    return generator ? generator() : [`Key points about ${subject}`, `Important considerations`, `Relevant information`, `Next steps`];
  };
  
  const analysis = analyzePrompt(prompt);
  const theme = getIndustryTheme(analysis.industry);
  const contentStrategy = generatePersonalizedContent(analysis);

  if (isDayPlanner) {
    // Generate personalized day planner based on prompt
    const plannerAnalysis = analyzePrompt(prompt);
    return {
      title: `Personalized Daily Planner - ${new Date().toLocaleDateString()}`,
      description: `Customized daily schedule based on: ${prompt}`,
      theme: {
        primaryColor: "#059669",
        secondaryColor: "#0d9488",
        backgroundColor: "#ffffff",
        textColor: "#1f2937",
        accentColor: "#10b981",
        gradientStart: "#059669",
        gradientEnd: "#0d9488",
        fontFamily: "Inter",
        headingFont: "Poppins",
        bodyFont: "Inter",
        mood: "productive"
      },
      slides: [
        {
          id: 1,
          type: "hero",
          title: `Your ${plannerAnalysis.subject} Day`,
          subtitle: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
          content: [],
          speakerNotes: `Today's focus: ${plannerAnalysis.subject}. This planner is customized based on your specific request.`,
          animation: "fadeIn",
          layout: "center",
          backgroundStyle: "gradient",
          imageUrl: `https://images.unsplash.com/1600x900/?${plannerAnalysis.subject.replace(' ', ',')},productivity,planning`,
          imageDescription: `Productivity setup for ${plannerAnalysis.subject}`,
          styling: {
            titleSize: "5xl",
            titleWeight: "bold",
            subtitleSize: "2xl",
            textAlign: "center",
            overlay: "dark"
          }
        }
      ]
    };
  }

  // Generate personalized presentation slides
  const slides = contentStrategy.slides.map((slideTemplate, index) => {
    const content = generateSlideContent(slideTemplate, analysis, index);
    const animations = ['fadeIn', 'slideInLeft', 'slideInRight', 'zoomIn', 'bounceIn'];
    
    return {
      id: index + 1,
      type: slideTemplate.type,
      title: slideTemplate.title.replace('${subject}', analysis.subject),
      subtitle: slideTemplate.type === 'hero' ? `Based on your request: "${analysis.originalPrompt}"` : undefined,
      content: slideTemplate.type === 'stats' ? content : (slideTemplate.type === 'quote' ? content[0] : content),
      author: slideTemplate.type === 'quote' ? 'Industry Expert' : undefined,
      speakerNotes: `This slide covers ${slideTemplate.focus} aspects of ${analysis.subject}. Key points include the content shown and additional context relevant to your specific request about ${analysis.originalPrompt}.`,
      animation: animations[index % animations.length],
      layout: slideTemplate.type === 'split' ? 'split' : 'center',
      backgroundStyle: index % 3 === 0 ? 'gradient' : (index % 3 === 1 ? 'image' : 'gradient'),
      imageUrl: `https://images.unsplash.com/1600x900/?${analysis.subject.replace(' ', ',')},${analysis.industry},${slideTemplate.focus}`,
      imageDescription: `Visual representation of ${slideTemplate.focus} in ${analysis.subject}`,
      styling: {
        titleSize: slideTemplate.type === 'hero' ? '6xl' : '4xl',
        titleWeight: 'bold',
        subtitleSize: '2xl',
        contentSize: 'lg',
        textAlign: slideTemplate.type === 'quote' ? 'center' : 'left',
        overlay: index % 2 === 0 ? 'dark' : 'light'
      }
    };
  });

  return {
    title: `${analysis.subject.charAt(0).toUpperCase() + analysis.subject.slice(1)}: ${analysis.presentationType.charAt(0).toUpperCase() + analysis.presentationType.slice(1)} Guide`,
    description: `A personalized presentation about ${analysis.subject} based on your specific request: "${analysis.originalPrompt}"`,
    theme,
    slides
  };
};