import { Footer } from "@/components/Footer";
import { NewsScrollingBanner } from "@/components/NewsScrollingBanner";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Refund = () => {
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
          
          <h1 className="text-3xl font-bold text-foreground mb-2">Refund Policy</h1>
          <p className="text-muted-foreground mb-8">Last Updated: 10th October 2025</p>
          
          <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
            <p>
              Please read this Refund Policy carefully before purchasing any of our services.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">1. No Refund Policy</h2>
            <p>
              All payments made for subscriptions, plans, or digital services on this website are final and non-refundable.
            </p>
            <p>
              Because our products include digital trading signals, market insights, and instant-access content, we cannot reverse or retract delivery once payment is processed.
            </p>
            <p>Therefore:</p>
            <ul className="list-none space-y-2">
              <li>❌ No refunds</li>
              <li>❌ No partial refunds</li>
              <li>❌ No credits</li>
              <li>❌ No exchanges</li>
            </ul>
            <p className="font-semibold text-foreground">
              Once you purchase a plan, you will have full access until depletion.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">2. User Responsibility</h2>
            <p>By completing a purchase, you acknowledge that:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You have reviewed all pricing details</li>
              <li>You fully understand what you are purchasing</li>
              <li>You accept that refunds are not available</li>
              <li>You only proceed with payment when you are sure about the services you are paying for.</li>
            </ul>
            <p>This ensures fairness and transparency for all users.</p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">3. Service Access</h2>
            <p>After payment:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access is activated immediately</li>
              <li>You are responsible for enjoying the services your have paid for</li>
              <li>Failure to use the service does not qualify for a refund</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">4. Exceptional Cases</h2>
            <p>
              Refunds may only be considered if required by law. Otherwise, the NO REFUND rule strictly applies.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">5. Contact</h2>
            <p>
              If you need assistance with account access or billing, contact us by filling the <Link to="/contact" className="text-primary hover:underline">contact form</Link> with the enquires you have.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Refund;
