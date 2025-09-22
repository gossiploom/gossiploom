import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Zap, Twitter, Instagram, Youtube } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-background border-t border-border mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                GossipLoom
              </h3>
            </div>
            <p className="text-muted-foreground mb-4 text-sm">
              Your ultimate destination for entertainment news, celebrity gossip, and trending stories.
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon">
                <Twitter className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Instagram className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Youtube className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Trending Now</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Celebrity News</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">TV Shows</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Submit Story</a></li>
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a 
                  href="mailto:gossiploom8@gmail.com" 
                  className="hover:text-primary transition-colors"
                >
                  gossiploom8@gmail.com
                </a>
              </li>
              <li className="text-xs">We'd love to hear from you!</li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link to="/content-guidelines" className="hover:text-primary transition-colors">Content Guidelines</Link></li>
            </ul>
          </div>
        </div>

        <Separator className="mb-6" />
        
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>&copy; 2024-2025 GossipLoom. All rights reserved.</p>
          <p className="mt-2 md:mt-0">
            Built for entertainment • Community guidelines apply
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
