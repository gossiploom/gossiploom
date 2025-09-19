import React, { useState } from 'react';
import Header from '@/components/Header';
import CategoryNav from '@/components/CategoryNav';
import HeroSection from '@/components/HeroSection';
import PostsGrid from '@/components/PostsGrid';
import Footer from '@/components/Footer';

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTrending, setShowTrending] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleTrendingClick = () => {
    setShowTrending(!showTrending);
    setSelectedCategory(showTrending ? 'All' : 'Trending');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={handleSearch} onTrendingClick={handleTrendingClick} />
      <CategoryNav 
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />
      <HeroSection />
      <PostsGrid 
        selectedCategory={selectedCategory} 
        searchQuery={searchQuery}
        showTrending={showTrending}
      />
      <Footer />
    </div>
  );
};

export default Index;
