import React, { useState } from 'react';
import Header from '@/components/Header';
import CategoryNav from '@/components/CategoryNav';
import HeroSection from '@/components/HeroSection';
import PostsGrid from '@/components/PostsGrid';
import Footer from '@/components/Footer';

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CategoryNav 
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />
      <HeroSection />
      <PostsGrid selectedCategory={selectedCategory} />
      <Footer />
    </div>
  );
};

export default Index;
