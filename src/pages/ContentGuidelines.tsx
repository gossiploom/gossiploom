import React from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ContentGuidelines = () => {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-6">
            <Link to="/">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
              📝 Content Guidelines
            </h1>
            <p className="text-muted-foreground">Effective Date: July 2024</p>
          </div>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
            <p className="text-lg">
              To ensure InsiderNewsWatch remains a safe and entertaining community, all submissions must follow these guidelines:
            </p>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Allowed Content</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Breaking news, insider stories, celebrity gossip, trending content, lifestyle news, and entertainment discussions.</li>
                <li>Community contributions, opinions, and commentary presented respectfully.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Prohibited Content</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Hate speech, threats, harassment, or discrimination.</li>
                <li>Adult, sexually explicit, or pornographic material.</li>
                <li>Violence, self-harm, or graphic content.</li>
                <li>False medical, political, or financial claims intended to mislead.</li>
                <li>Copyrighted material (e.g., reposted articles, photos, or videos without permission).</li>
                <li>Spam, advertising links, or malicious software.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Quality Standards</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Posts must be unique, original, and meaningful.</li>
                <li>Titles and descriptions should accurately reflect the content.</li>
                <li>Excessive repetition, gibberish, or auto-generated text is not allowed.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">Moderation</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Submissions are subject to review. Content violating these rules may be edited or removed.</li>
                <li>Repeat offenders may be blocked from future posting.</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ContentGuidelines;
