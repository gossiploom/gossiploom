import { useState } from "react";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !subject || !message) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields before submitting.",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-contact-query", {
        body: {
          name: name.trim(),
          email: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
        },
      });

      if (error) throw error;

      toast({
        title: "Message sent!",
        description: "We've received your enquiry and will get back to you soon. A confirmation email has been sent to your address.",
      });

      // Clear form
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (error: any) {
      console.error("Error submitting contact form:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          <h1 className="text-3xl font-bold text-foreground mb-2">Contact Us</h1>
          <p className="text-muted-foreground mb-8">
            Have a question or enquiry? Fill out the form below and we'll get back to you as soon as possible.
          </p>

          <div className="bg-card border border-border rounded-lg p-6 mb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-background"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  type="text"
                  placeholder="What is your enquiry about?"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="bg-background"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="bg-background min-h-[150px]"
                  disabled={isSubmitting}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </div>

          <div className="text-center">
            <p className="text-muted-foreground mb-2">
              You can also reach us directly at:
            </p>
            <a 
              href="mailto:tradeadvisor.live@gmail.com" 
              className="text-primary hover:underline font-medium"
            >
              tradeadvisor.live@gmail.com
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
