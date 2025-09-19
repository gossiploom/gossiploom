import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Star, Users, Tv, Heart, Sparkles, Vote, BookOpen } from 'lucide-react';

const categories = [
  { name: 'All', icon: Star },
  { name: 'Celebrity', icon: Users },
  { name: 'TV Shows', icon: Tv },
  { name: 'Lifestyle', icon: Heart },
  { name: 'Education', icon: BookOpen },
  { name: 'Entertainment', icon: Sparkles },
  { name: 'Politics', icon: Vote },
];

interface CategoryNavProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategoryNav: React.FC<CategoryNavProps> = ({ selectedCategory, onCategoryChange }) => {
  return (
    <nav className="border-b border-border bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Badge
                key={category.name}
                variant={selectedCategory === category.name ? "gossip" : "category"}
                className={`flex items-center gap-2 px-4 py-2 cursor-pointer whitespace-nowrap transition-all duration-200 hover:scale-105 ${
                  selectedCategory === category.name ? 'shadow-glow' : ''
                }`}
                onClick={() => onCategoryChange(category.name)}
              >
                <Icon className="w-3 h-3" />
                {category.name}
              </Badge>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default CategoryNav;
