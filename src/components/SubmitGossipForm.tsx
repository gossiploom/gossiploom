import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  title: z.string().min(10, 'Title must be at least 10 characters').max(200, 'Title too long'),
  content: z.string().min(50, 'Story must be at least 50 characters'),
  category: z.string().min(1, 'Please select a category'),
  authorName: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface SubmitGossipFormProps {
  children: React.ReactNode;
  onSuccess?: () => void;
}

const SubmitGossipForm: React.FC<SubmitGossipFormProps> = ({ children, onSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      category: '',
      authorName: '',
    },
  });

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Image too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview("");
  };

  const generateExcerpt = (content: string): string => {
    const sentences = content.split('. ');
    const excerpt = sentences.slice(0, 2).join('. ');
    return excerpt.length > 150 ? excerpt.substring(0, 147) + '...' : excerpt + '...';
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      let imageUrl = null;
      
      // Upload image if selected
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('gossip-images')
          .upload(fileName, selectedImage);
          
        if (uploadError) {
          throw uploadError;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('gossip-images')
          .getPublicUrl(fileName);
          
        imageUrl = publicUrl;
      }

      // Create the post
      const { error } = await supabase
        .from('gossip_posts')
        .insert({
          title: data.title,
          content: data.content,
          excerpt: generateExcerpt(data.content),
          category: data.category,
          author_name: data.authorName || 'Anonymous',
          image_url: imageUrl,
        });

      if (error) throw error;

      toast({
        title: "Gossip submitted!",
        description: "Your story has been published successfully.",
      });

      form.reset();
      setSelectedImage(null);
      setImagePreview("");
      setIsOpen(false);
      onSuccess?.();
      
    } catch (error) {
      console.error('Error submitting gossip:', error);
      toast({
        title: "Submission failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
            Submit Your Gossip Story
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Story Title *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="What's the juicy headline?" 
                      {...field}
                      className="text-base"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Celebrity">Celebrity</SelectItem>
                      <SelectItem value="TV Shows">TV Shows</SelectItem>
                      <SelectItem value="Entertainment">Entertainment</SelectItem>
                      <SelectItem value="Lifestyle">Lifestyle</SelectItem>
                      <SelectItem value="Music">Music</SelectItem>
                      <SelectItem value="Sports">Sports</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="authorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Name (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Leave blank to post anonymously" 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Upload */}
            <div className="space-y-4">
              <FormLabel>Add Photo (Optional)</FormLabel>
              <div className="border-2 border-dashed border-border rounded-lg p-6">
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={removeImage}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Upload an image to make your story more engaging
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload">
                        <Button type="button" variant="outline" asChild>
                          <span className="cursor-pointer">
                            <Upload className="w-4 h-4 mr-2" />
                            Select Image
                          </span>
                        </Button>
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Max file size: 5MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Story *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Spill the tea... What happened? Who was involved? Don't hold back on the details!" 
                      className="min-h-[200px] resize-none text-base"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Minimum 50 characters. Be detailed and engaging!
                  </p>
                </FormItem>
              )}
            />

            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 text-sm">Posting Guidelines:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Keep it entertaining but respectful</li>
                <li>• No hate speech or harassment</li>
                <li>• Verify your facts when possible</li>
                <li>• No personal information like addresses or phone numbers</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
                variant="hero"
              >
                {isSubmitting ? 'Publishing...' : 'Publish Story'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SubmitGossipForm;