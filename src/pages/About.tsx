import { Footer } from "@/components/Footer";
import { NewsScrollingBanner } from "@/components/NewsScrollingBanner";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const About = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col"> 
      <NewsScrollingBanner position="top" />
      <NewsScrollingBanner position="bottom" showNextDay />
      <div className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          <h1 className="text-3xl font-bold text-foreground mb-8">About Us</h1>
          
          <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
            <p>
              Welcome to our Trading Signals platform — a trusted source of market insights designed to empower traders of all levels with accurate, timely, and high-quality trade recommendations.
            </p>
            <p>
              We understand that trading can be challenging, especially in fast-moving markets where timing and clarity are everything. Our mission is to simplify your trading journey by providing clear, actionable signals that help you make informed decisions with confidence.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Who We Are</h2>
            <p>
              We are a dedicated team of market analysts, technical traders, and financial researchers committed to helping traders succeed. With a strong foundation in technical analysis and market structure, we specialize in identifying high-probability setups across major forex pairs, indices, and commodities.
            </p>
            <p>Our passion lies in offering reliable insights supported by:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Technical chart analysis</li>
              <li>Trend assessments</li>
              <li>Smart risk-management strategies</li>
              <li>Clear entry, stop loss, and take profit levels</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">What We Do</h2>
            <p>
              We provide real-time trading signals backed by thorough market research. Every signal includes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Clear trade direction (Buy/Sell)</li>
              <li>Logical entry points</li>
              <li>Strategically placed stop loss levels</li>
              <li>Well-researched take profit targets</li>
              <li>A short explanation of market structure or trend conditions</li>
            </ul>
            <p>
              Our goal is to shorten your market analysis time so you can focus on executing trades effectively.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Why Choose Us</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-foreground">Accuracy & Professionalism</strong> – Our signals are based on real market conditions and tested trading strategies.</li>
              <li><strong className="text-foreground">Beginner-Friendly</strong> – Whether new or experienced, our signals are easy to understand and follow.</li>
              <li><strong className="text-foreground">Consistent Updates</strong> – We monitor the markets continuously to provide relevant, high-probability trade setups.</li>
              <li><strong className="text-foreground">Educational Value</strong> – Beyond signals, we help you understand why a trade setup is valid, helping you grow as a trader.</li>
            </ul>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Our Vision</h2>
            <p>
              To become a leading platform for traders seeking clarity, guidance, and consistent results in the financial markets.
            </p>

            <h2 className="text-2xl font-semibold text-foreground mt-8 mb-4">Our Commitment</h2>
            <p>
              Your growth as a trader is our priority. We aim to equip you with the tools, confidence, and support needed to navigate the markets successfully.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default About;
