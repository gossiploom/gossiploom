import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Zap } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="relative py-20 px-4 bg-gradient-hero overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
      </div>
      
      <div className="container mx-auto text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Where Gossip
            <span className="block bg-gradient-to-r from-accent to-primary-glow bg-clip-text text-transparent">
              Comes Alive
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
            Join the ultimate community-driven platform for entertainment news, 
            celebrity gossip, and trending stories that matter.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button variant="accent" size="lg" className="text-lg px-8 py-6 shadow-xl">
              <Sparkles className="w-5 h-5 mr-2" />
              Start Reading Gossip
            </Button>
            <Button variant="secondary" size="lg" className="text-lg px-8 py-6">
              <Zap className="w-5 h-5 mr-2" />
              Submit Your Story
            </Button>
          </div>
          
          <div className="mt-12 text-white/70 text-sm">
            <p>✨ Anonymous posting • 🚀 Real-time updates • 💬 Community discussions</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;