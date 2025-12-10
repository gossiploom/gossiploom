import { Footer } from "@/components/Footer";
import { NewsScrollingBanner } from "@/components/NewsScrollingBanner";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1"> 
        <NewsScrollingBanner position="top" />
      <NewsScrollingBanner position="bottom" showNextDay />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          <h1 className="text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last Updated: 10th October 2025</p>
          
          <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
            <p>
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit or use our website and services. By accessing the website, you agree to the practices described in this Policy.
            </p>
            <p>We are committed to protecting your personal data and respecting your privacy.</p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">1. Information We Collect</h2>
            <p>We may collect the following types of information:</p>
            
            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">a) Personal Information</h3>
            <p>When you register or contact us, we may collect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Full name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Payment information (processed securely via third-party providers)</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">b) Automatically Collected Data</h3>
            <p>When you browse the website, we may collect:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>IP address</li>
              <li>Device information</li>
              <li>Browser type</li>
              <li>Cookies and tracking data</li>
              <li>Pages visited and usage patterns</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground mt-6 mb-3">c) Payment Information</h3>
            <p>
              We do not store full credit/debit card details. All payments are processed securely through third-party payment gateways.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">2. How We Use Your Information</h2>
            <p>We use the collected data to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and improve our services</li>
              <li>Deliver trading signals and market updates</li>
              <li>Process payments</li>
              <li>Manage user accounts</li>
              <li>Communicate with you regarding updates and support</li>
              <li>Analyze website usage to improve performance</li>
              <li>Prevent fraud, abuse, and unauthorized access</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">3. Sharing of Information</h2>
            <p>We do not sell or rent your personal data.</p>
            <p>We may share information only with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Trusted third-party payment processors</li>
              <li>Analytics providers (e.g., Google Analytics)</li>
              <li>Service providers who help maintain the website</li>
              <li>Legal authorities, if required by law or to protect our rights</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">4. Cookies and Tracking Technologies</h2>
            <p>We use cookies to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Enhance your browsing experience</li>
              <li>Remember your preferences</li>
              <li>Analyze traffic and website performance</li>
            </ul>
            <p>You may disable cookies in your browser settings, but some features may not function correctly.</p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">5. Data Security</h2>
            <p>We implement industry-standard measures to protect your information, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>SSL encryption</li>
              <li>Secure server environments</li>
              <li>Limited employee access</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">6. Your Rights</h2>
            <p>Depending on your region, you may have the following rights:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal data</li>
              <li>Request correction or deletion</li>
              <li>Opt out of marketing communications</li>
              <li>Request restrictions on processing</li>
              <li>Withdraw consent (where applicable)</li>
            </ul>
            <p>
              To exercise these rights, <Link to="/contact" className="text-primary hover:underline">contact us</Link>.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">7. Third-Party Links</h2>
            <p>
              Our website may contain links to external sites. We are not responsible for the privacy practices of those sites.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">8. Children's Privacy</h2>
            <p>
              Our services are not intended for individuals under 18. We do not knowingly collect data from minors.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">9. Changes to the Privacy Policy</h2>
            <p>
              We reserve the right to update this policy at any time. Changes take effect immediately upon posting on the website.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">10. Contact Us</h2>
            <p>
              For questions regarding this Privacy Policy, contact us with your enquiries by filling the <Link to="/contact" className="text-primary hover:underline">contact form</Link>.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Privacy;
