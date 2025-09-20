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

  // Function to convert YouTube URLs to embeds
  const processContent = (text: string): JSX.Element[] => {
    const elements: JSX.Element[] = [];
    const lines = text.split('\n');
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      // Check if line contains a YouTube URL
      const youtubeId = extractYouTubeId(trimmedLine);
      
      if (youtubeId) {
        elements.push(
          <div key={`youtube-${index}`} className="my-6">
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
      } else if (trimmedLine) {
        // Regular text content - preserve HTML formatting
        elements.push(
          <div 
            key={`text-${index}`} 
            className="mb-4"
            dangerouslySetInnerHTML={{ __html: line }}
          />
        );
      } else {
        // Empty line
        elements.push(<br key={`br-${index}`} />);
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