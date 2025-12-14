import { Footer } from "@/components/Footer";
import { NewsScrollingBanner } from "@/components/NewsScrollingBanner";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Terms = () => {
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
          
          <h1 className="text-3xl font-bold text-foreground mb-2">Terms and Conditions</h1>
          <p className="text-muted-foreground mb-8">Last Updated: 10th October 2025</p>
          
          <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
            <p>
              Welcome to our website. By accessing or using this platform, you agree to comply with and be bound by the following Terms and Conditions. Please read them carefully before using our services. If you do not agree with any part of these terms, you must not use the website.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">1. Definitions</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>"Website" refers to our trading signals platform and all associated services.</li>
              <li>"We," "Us," "Our" refers to the owners/operators of this website.</li>
              <li>"User," "You," "Your" refers to any person accessing or using the website.</li>
              <li>"Services" refers to trading signals, market insights, analysis, educational content, and any other features provided on the website.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">2. Acceptance of Terms</h2>
            <p>By using the website, you confirm that:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You have read and understood these Terms and Conditions.</li>
              <li>You agree to be bound by them.</li>
              <li>You are at least 18 years old or legally allowed to use trading-related platforms in your jurisdiction.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">3. Disclaimer: Not Financial Advice</h2>
            <p>
              All information provided on this website—including trading signals, market analysis, or educational content—is for informational and educational purposes only.
            </p>
            <p>We do NOT:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide financial or investment advice.</li>
              <li>Guarantee profit or performance.</li>
              <li>Accept responsibility for any trading decision you make.</li>
            </ul>
            <p className="font-semibold text-foreground">
              Trading involves risk, including the risk of losing your entire investment. You are solely responsible for your trading decisions.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">4. Use of the Website</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Misuse the website or engage in illegal activities.</li>
              <li>Copy, resell, or redistribute signals or content without permission.</li>
              <li>Attempt to hack, disrupt, or damage the website.</li>
              <li>Use automated systems (bots, scrapers, etc.) without written approval.</li>
            </ul>
            <p>We may suspend or terminate your access if these rules are violated.</p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">5. Accuracy of Information</h2>
            <p>While we strive to provide accurate, timely, and reliable information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>We do NOT guarantee that any content is error-free or always up to date.</li>
              <li>Market conditions can change rapidly, and signals may become invalid.</li>
            </ul>
            <p>We are not liable for losses resulting from delays, errors, or inaccurate information.</p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">6. Account Registration </h2>
            <p>To access certain features, you may need to create an account.</p>
            <p>You agree to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate and complete information.</li>
              <li>Keep your login credentials secure.</li>
              <li>Not share your account with anyone else.</li>
            </ul>
            <p>We reserve the right to suspend or delete accounts that violate our policies.</p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">7. Payment and Subscriptions </h2>
            <p>If the website offers paid plans:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>All payments must be made using approved methods.</li>
              <li>Fees are non-refundable unless stated otherwise.</li>
              <li>Subscription renewals are billed automatically unless cancelled in advance.</li>
            </ul>
            <p>You are responsible for cancelling subscriptions before the renewal date.</p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">8. Intellectual Property Rights</h2>
            <p>
              All content on the website—including signals, text, logos, videos, graphics, layouts, and trademarks—is our intellectual property.
            </p>
            <p>You may NOT:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Copy</li>
              <li>Reproduce</li>
              <li>Distribute</li>
              <li>Display</li>
              <li>Sell</li>
            </ul>
            <p>any content without our written consent.</p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law:</p>
            <p>We are NOT liable for:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Trading losses</li>
              <li>Financial damages</li>
              <li>Missed opportunities</li>
              <li>Website downtime</li>
              <li>Errors or inaccuracies in signals or analysis</li>
              <li>Any reliance placed on information from the website</li>
            </ul>
            <p className="font-semibold text-foreground">Your use of the website is entirely at your own risk.</p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">10. Third-Party Links</h2>
            <p>
              The website may contain links to external sites. We are not responsible for the content, accuracy, or practices of those third parties.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">11. Privacy</h2>
            <p>
              Your privacy is important to us. Please review our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> to understand how we collect and use data.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">12. Termination</h2>
            <p>
              We may suspend or terminate your access to the website at any time, without notice, for conduct that violates these Terms or harms the website or other users.
            </p>
            <p>You may stop using the website at any time.</p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">13. Changes to Terms and Conditions</h2>
            <p>
              We may update or change these Terms at any time. Changes take effect immediately upon posting on the website. Continued use of the website means you accept the updated terms.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">14. Governing Law</h2>
            <p>
              These Terms are governed by the laws of Kenya. Any disputes will be handled under the jurisdiction of Kenyan courts.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">15. Contact Us</h2>
            <p>
              If you have questions about these Terms, you can contact us by filling the <Link to="/contact" className="text-primary hover:underline">contact form</Link> with your enquiry.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Terms;
