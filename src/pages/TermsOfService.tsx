import React from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TermsOfService = () => {
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
              ⚖️ Terms of Service
            </h1>
            <p className="text-muted-foreground">Effective Date: July 2024</p>
          </div>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
            <p className="text-lg">
              By accessing and using GossipLoom, you agree to the following Terms of Service:
            </p>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. User Responsibilities</h2>
              <div className="space-y-3">
                <p>You may submit posts, comments, and contributions either anonymously or with a chosen display name.</p>
                <p>You are solely responsible for the content you submit. By posting, you agree that your submission does not violate copyright, privacy, or any applicable laws.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Content Ownership</h2>
              <div className="space-y-3">
                <p>Users retain ownership of their submitted content.</p>
                <p>By submitting content, you grant GossipLoom a non-exclusive, royalty-free license to display, distribute, and promote that content on the website.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Prohibited Activities</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Submitting unlawful, defamatory, abusive, hateful, or obscene material.</li>
                <li>Posting copyrighted content without permission.</li>
                <li>Attempting to hack, disrupt, or overload the website.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Content Moderation</h2>
              <p>We reserve the right to edit, remove, or refuse any submission that violates our Content Guidelines or legal standards.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Disclaimers</h2>
              <div className="space-y-3">
                <p>GossipLoom provides user-generated content. We do not guarantee the accuracy, reliability, or truth of submissions.</p>
                <p>The website is provided "as is" without warranties of any kind.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Limitation of Liability</h2>
              <p>GossipLoom and its owners are not liable for damages resulting from the use of the site, including reliance on user-generated content.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Governing Law</h2>
              <p>These Terms are governed by the laws of [Insert Jurisdiction].</p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default TermsOfService;