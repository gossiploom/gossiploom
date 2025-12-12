import React from 'react';

interface ContentRendererProps {
  content: string;
  className?: string;
}

const ContentRenderer: React.FC<ContentRendererProps> = ({ content, className = "" }) => {
  return (
    <div className={`prose prose-lg max-w-none ${className}`}>
      <div 
        className="whitespace-pre-wrap text-base leading-relaxed"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
};

export default ContentRenderer;
