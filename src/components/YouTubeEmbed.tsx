import React from 'react';

interface YouTubeEmbedProps {
  url: string;
  className?: string;
}

const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({ url, className = "" }) => {
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

  const youtubeId = extractYouTubeId(url);

  if (!youtubeId) {
    return null;
  }

  return (
    <div className={`my-6 ${className}`}>
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
};

export default YouTubeEmbed;