import { Upload, FileImage, FileSpreadsheet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ChartUploadProps {
  onFilesUpload: (files: File[]) => void;
  uploadedFiles: File[];
}

export const ChartUpload = ({ onFilesUpload, uploadedFiles }: ChartUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const maxFiles = 5;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = (files: File[]) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'text/csv'];
    const validFiles = files.filter(file => validTypes.includes(file.type));
    
    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid file type",
        description: "Please upload PNG, JPG, or CSV files only.",
        variant: "destructive",
      });
    }

    if (uploadedFiles.length + validFiles.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `You can upload a maximum of ${maxFiles} charts.`,
        variant: "destructive",
      });
      return;
    }

    if (validFiles.length > 0) {
      onFilesUpload([...uploadedFiles, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    onFilesUpload(newFiles);
  };

  return (
    <div className="space-y-4">
      <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-all">
        <form
          className="p-8"
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".png,.jpg,.jpeg,.csv"
            onChange={handleChange}
            multiple
          />
          <label
            htmlFor="file-upload"
            className={`flex flex-col items-center justify-center cursor-pointer space-y-4 ${
              dragActive ? "opacity-70" : ""
            }`}
          >
            <div className="p-4 bg-secondary rounded-full">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold text-foreground">
                Upload Charts for Analysis
              </p>
              <p className="text-sm text-muted-foreground">
                Drag and drop or click to browse (Max {maxFiles} charts)
              </p>
              <p className="text-xs text-muted-foreground">
                Upload multiple timeframes of the same symbol for better analysis
              </p>
              <div className="flex items-center justify-center gap-4 pt-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <FileImage className="h-4 w-4" />
                  PNG, JPG
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV
                </div>
              </div>
            </div>
          </label>
        </form>
      </Card>

      {uploadedFiles.length > 0 && (
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">
              Uploaded Charts ({uploadedFiles.length}/{maxFiles})
            </p>
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-secondary rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <FileImage className="h-4 w-4 text-primary" />
                  <span className="text-sm text-foreground">{file.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
