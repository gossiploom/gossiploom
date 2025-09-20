import React, { useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Start writing your story...",
  className = ""
}) => {
  const quillRef = useRef<ReactQuill>(null);

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet',
    'align',
    'blockquote', 'code-block',
    'link'
  ];

  // Custom styles for the editor
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .ql-toolbar {
        border-top: 1px solid hsl(var(--border));
        border-left: 1px solid hsl(var(--border));
        border-right: 1px solid hsl(var(--border));
        border-bottom: none;
        border-radius: 6px 6px 0 0;
        background: hsl(var(--background));
      }
      
      .ql-container {
        border-bottom: 1px solid hsl(var(--border));
        border-left: 1px solid hsl(var(--border));
        border-right: 1px solid hsl(var(--border));
        border-top: none;
        border-radius: 0 0 6px 6px;
        background: hsl(var(--background));
        font-family: inherit;
      }
      
      .ql-editor {
        min-height: 200px;
        color: hsl(var(--foreground));
        font-size: 14px;
        line-height: 1.6;
      }
      
      .ql-editor.ql-blank::before {
        color: hsl(var(--muted-foreground));
        font-style: normal;
      }
      
      .ql-toolbar .ql-stroke {
        stroke: hsl(var(--foreground));
      }
      
      .ql-toolbar .ql-fill {
        fill: hsl(var(--foreground));
      }
      
      .ql-toolbar button:hover .ql-stroke {
        stroke: hsl(var(--primary));
      }
      
      .ql-toolbar button:hover .ql-fill {
        fill: hsl(var(--primary));
      }
      
      .ql-toolbar button.ql-active .ql-stroke {
        stroke: hsl(var(--primary));
      }
      
      .ql-toolbar button.ql-active .ql-fill {
        fill: hsl(var(--primary));
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className={className}>
      <ReactQuill
        ref={quillRef}
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        theme="snow"
      />
      <div className="mt-2 text-xs text-muted-foreground">
        <p>💡 Tips:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Use the toolbar above to format your text (bold, italic, etc.)</li>
          <li>Paste YouTube links on separate lines to embed videos</li>
          <li>Use headers to organize your story</li>
        </ul>
      </div>
    </div>
  );
};

export default RichTextEditor;