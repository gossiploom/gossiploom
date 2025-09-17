import React from 'react';
import PostCard from './PostCard';
import postSample1 from '@/assets/post-sample-1.jpg';
import postSample2 from '@/assets/post-sample-2.jpg';
import postSample3 from '@/assets/post-sample-3.jpg';

const samplePosts = [
  {
    id: 1,
    title: "BREAKING: A-List Celebrity Spotted in Secret Romance",
    excerpt: "Exclusive photos reveal Hollywood's biggest stars in an intimate dinner date that no one saw coming. Sources close to the couple reveal shocking details about their whirlwind romance that started on set...",
    category: "Celebrity",
    timeAgo: "2 hours ago",
    likes: 1247,
    comments: 89,
    trending: true,
    imageUrl: postSample1,
  },
  {
    id: 2,
    title: "Reality TV Drama: Behind the Scenes Feuds Exposed",
    excerpt: "Former cast members spill the tea on what really happened during filming. The drama wasn't just for cameras - real friendships were destroyed and alliances formed that viewers never knew about...",
    category: "TV Shows",
    timeAgo: "4 hours ago",
    likes: 892,
    comments: 156,
    trending: true,
    imageUrl: postSample2,
  },
  {
    id: 3,
    title: "Fashion Week Scandals: Designer Meltdowns & More",
    excerpt: "This year's fashion week was full of surprises, from unexpected collaborations to designer feuds that spilled onto the runway. Get the inside scoop on what really happened backstage...",
    category: "Lifestyle",
    timeAgo: "6 hours ago",
    likes: 634,
    comments: 73,
    imageUrl: postSample3,
  },
  {
    id: 4,
    title: "Social Media Influencer's Secret Past Revealed",
    excerpt: "What started as a routine background check uncovered a past that this mega-influencer has been desperately trying to hide. Fans are shocked by these revelations...",
    category: "Celebrity",
    timeAgo: "8 hours ago",
    likes: 1156,
    comments: 203,
  },
  {
    id: 5,
    title: "Music Industry Insider Reveals Album Drama",
    excerpt: "The hottest album of the year almost didn't happen. Studio tensions, creative differences, and personal conflicts nearly derailed what became a chart-topping success...",
    category: "Entertainment",
    timeAgo: "12 hours ago",
    likes: 789,
    comments: 91,
  },
  {
    id: 6,
    title: "Award Show After-Party Chaos: What Really Happened",
    excerpt: "The cameras stopped rolling, but the drama continued. Exclusive details from the most talked-about after-party of the year, including surprising encounters and unexpected alliances...",
    category: "Entertainment",
    timeAgo: "1 day ago",
    likes: 923,
    comments: 127,
    trending: true,
  },
];

const PostsGrid = () => {
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Latest Gossip</h2>
        <p className="text-muted-foreground">Stay updated with the hottest stories and trending news</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {samplePosts.map((post) => (
          <PostCard
            key={post.id}
            title={post.title}
            excerpt={post.excerpt}
            category={post.category}
            timeAgo={post.timeAgo}
            likes={post.likes}
            comments={post.comments}
            trending={post.trending}
            imageUrl={post.imageUrl}
          />
        ))}
      </div>
    </section>
  );
};

export default PostsGrid;