import React from 'react';

interface ContentRendererProps {
  content: string;
  className?: string;
}

const ContentRenderer: React.FC<ContentRendererProps> = ({ content, className = "" }) => {
  // Function to extract YouTube video ID from URL
  const extractYouTubeId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  // Function to convert YouTube URLs to embeds and handle rich text content
  const processContent = (text: string): JSX.Element[] => {
    const elements: JSX.Element[] = [];
    
    // Split by double line breaks to handle paragraphs, but also check for YouTube URLs
    const paragraphs = text.split(/\n\s*\n/);
    
    paragraphs.forEach((paragraph, index) => {
      const trimmedParagraph = paragraph.trim();
      
      // Check if paragraph contains only a YouTube URL
      const lines = trimmedParagraph.split('\n');
      const youtubeLines = lines.filter(line => extractYouTubeId(line.trim()));
      
      if (youtubeLines.length > 0) {
        // Handle YouTube embeds
        youtubeLines.forEach((youtubeLine, ytIndex) => {
          const youtubeId = extractYouTubeId(youtubeLine.trim());
          if (youtubeId) {
            elements.push(
              <div key={`youtube-${index}-${ytIndex}`} className="my-6">
                <div className="aspect-video w-full max-w-2xl mx-auto">
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full rounded-lg"
                  />
                </div>
              </div>
            );
          }
        });
        
        // Add any remaining non-YouTube content from this paragraph
        const nonYouTubeContent = lines.filter(line => !extractYouTubeId(line.trim())).join('\n').trim();
        if (nonYouTubeContent) {
          elements.push(
            <div 
              key={`content-${index}`} 
              className="mb-4"
              dangerouslySetInnerHTML={{ __html: nonYouTubeContent }}
            />
          );
        }
      } else if (trimmedParagraph) {
        // Regular rich text content - preserve HTML formatting
        elements.push(
          <div 
            key={`paragraph-${index}`} 
            className="mb-4"
            dangerouslySetInnerHTML={{ __html: trimmedParagraph }}
          />
        );
      }
    });
    
    return elements;
  };

  return (
    <div className={`prose prose-lg max-w-none ${className}`}>
      <div className="whitespace-pre-wrap text-base leading-relaxed">
        {processContent(content)}
      </div>
    </div>
  );
};

export default ContentRenderer;