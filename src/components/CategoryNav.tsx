import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Star, Users, Tv, Heart, Sparkles } from 'lucide-react';

const categories = [
  { name: 'All', icon: Star, active: true },
  { name: 'Celebrity', icon: Users },
  { name: 'TV Shows', icon: Tv },
  { name: 'Lifestyle', icon: Heart },
  { name: 'Entertainment', icon: Sparkles },
];

const CategoryNav = () => {
  return (
    <nav className="border-b border-border bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Badge
                key={category.name}
                variant={category.active ? "gossip" : "category"}
                className={`flex items-center gap-2 px-4 py-2 cursor-pointer whitespace-nowrap ${
                  category.active ? 'shadow-glow' : ''
                }`}
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