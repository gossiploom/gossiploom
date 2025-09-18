import React from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PrivacyPolicy = () => {
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
              📜 Privacy Policy
            </h1>
            <p className="text-muted-foreground">Effective Date: July 2024</p>
          </div>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-6">
            <p className="text-lg">
              GossipLoom ("we," "our," or "us") respects your privacy and is committed to protecting it through this Privacy Policy. This Policy explains how we handle information when you visit or use our website.
            </p>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Information We Collect</h2>
              <div className="space-y-3">
                <p><strong>User-Submitted Content:</strong> When you submit a post, comment, or contribution, we collect only the content you provide (text, media, display name if given).</p>
                <p><strong>Anonymous Usage:</strong> You may publish content anonymously. No account or personal profile is required.</p>
                <p><strong>Technical Data:</strong> Like most websites, we collect non-identifiable information such as browser type, device, IP address (for security and spam prevention), and cookies to improve functionality.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. How We Use Information</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>To publish and display user-submitted content.</li>
                <li>To maintain website functionality, security, and compliance withlegal standards.</li>
                <li>To improve user experience (e.g., performance monitoring, trending content).</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Data Sharing</h2>
              <div className="space-y-3">
                <p>We do not sell, rent, or trade personal data.</p>
                <p>Technical data may be shared with service providers strictly for operational purposes.</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Cookies & Tracking</h2>
              <p>We use cookies to enhance functionality. You can disable cookies in your browser, though some features may not function properly.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Data Retention</h2>
              <p>We only retain submitted content for as long as it remains published. No personal accounts or identifiable user databases are maintained.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Children's Privacy</h2>
              <p>GossipLoom is not intended for children under 13. We do not knowingly collect personal data from minors.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Changes to Policy</h2>
              <p>We may update this Privacy Policy at any time. Updates will be reflected with a new "Effective Date."</p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PrivacyPolicy;
