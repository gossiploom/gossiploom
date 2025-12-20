import { Footer } from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { HelpCircle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const FAQ = () => {
  const faqSections = [
    {
      title: "Accessing Trade Advisor Services",
      questions: [
        {
          question: "What are the two primary ways I can utilize the tradeadvisor.live platform?",
          answer: (
            <div className="space-y-2">
              <p>You can benefit from the platform in two ways:</p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li><strong>Self-Generated Signals:</strong> Purchase analysis slots (credits) to use our integrated technical analysis engine to generate your own proprietary trade setups.</li>
                <li><strong>Expert-Generated Signals:</strong> Subscribe to our monthly service to gain access to signals and setups posted daily (Monday through Friday) by our team of expert analysts.</li>
              </ol>
            </div>
          ),
        },
        {
          question: "What are the current packages for purchasing analysis slots?",
          answer: (
            <div className="space-y-2">
              <p>We offer four packages to suit different trading volumes:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Starter:</strong> 40 analysis slots for $40 USD</li>
                <li><strong>Growth:</strong> 100 analysis slots for $90 USD</li>
                <li><strong>Professional:</strong> 250 analysis slots for $200 USD</li>
                <li><strong>Enterprise:</strong> 500 analysis slots for $350 USD</li>
              </ul>
            </div>
          ),
        },
        {
          question: "How much does the monthly expert signal subscription cost?",
          answer: "Access to the daily expert-generated signals is available for a subscription fee of $45 USD per month.",
        },
        {
          question: "What payment methods are accepted?",
          answer: (
            <div className="space-y-2">
              <p>We accept three payment methods:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Card Payment:</strong> Via secure PayPal payment links</li>
                <li><strong>USDT Crypto:</strong> Send to our wallet address with screenshot verification</li>
                <li><strong>M-Pesa:</strong> Mobile money payment for supported regions</li>
              </ul>
            </div>
          ),
        },
      ],
    },
    {
      title: "Trading Strategy and Setup",
      questions: [
        {
          question: "What is the recommended approach for executing trades based on our signals?",
          answer: (
            <div className="space-y-2">
              <p>For better performance and capital protection, we strongly recommend two practices:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Always use <strong>Pending Trade Orders</strong>.</li>
                <li>Always use the calculated <strong>Invalidation Point</strong> as your Stop Loss (SL). This approach prioritizes market structure and supports consistent results.</li>
              </ol>
            </div>
          ),
        },
        {
          question: "Which trading pairs and instruments do you recommend focusing on?",
          answer: "We recommend starting with a focus on US100, US30, and EURGBP. For broader market exposure, you can also include XAUUSD (Gold), GBPUSD, EURUSD, USDJPY, and BTCUSD.",
        },
        {
          question: "Why do I need to take screenshots from five different timeframes for analysis?",
          answer: "Uploading and analyzing 5 charts across specific timeframes (5-Minute, 15-Minute, 1-Hour, 4-Hour, and 12-Hour) is crucial for generating the most accurate signals. This comprehensive view allows the platform to establish the long-term market bias (from larger timeframes) and pinpoint the optimal entry/exit zones (from smaller timeframes).",
        },
        {
          question: "What key information does the final generated signal provide?",
          answer: "Each signal provides the precise Entry Value, the calculated Stop Loss Value, the Take Profit Value, the critical Invalidation Value (for Stop Loss use), and the resulting Risk-Reward (R:R) Ratio, along with a rationale explaining the signal's logic.",
        },
        {
          question: "How should I prepare my charts before taking screenshots?",
          answer: (
            <div className="space-y-2">
              <p>For optimal signal generation:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Disable price lines or paint them white on your MT4/MT5 platform</li>
                <li>Position your device in landscape mode</li>
                <li>Zoom out the chart to show maximum candlesticks</li>
                <li>Ensure the chart is clear and readable</li>
              </ul>
            </div>
          ),
        },
      ],
    },
    {
      title: "Risk Management and Configuration",
      questions: [
        {
          question: "What is the difference between the Stop Loss Value and the Invalidation Point?",
          answer: (
            <div className="space-y-2">
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li><strong>The Calculated Stop Loss Value</strong> is based on your preset risk tolerance and account size (monetary risk management).</li>
                <li><strong>The Invalidation Point</strong> is based on technical analysis; it is the price level at which the reason for entering the trade is structurally invalid, indicating a high probability of reversal (technical risk management).</li>
              </ul>
              <p className="mt-2 font-medium">We strongly recommend using the Invalidation Point as your Stop Loss.</p>
            </div>
          ),
        },
        {
          question: "Why is it necessary to input my risk acceptance and account size?",
          answer: "These values are essential for the platform to accurately calculate the initial Stop Loss Value and position sizing, ensuring the trade setup is tailored to your personal financial risk profile.",
        },
        {
          question: "How is the signal generation affected if I use a broker other than JustMarkets?",
          answer: "Our system's point configuration is optimized for the JustMarkets broker. If your broker differs, the generated Stop Loss and Risk-Reward ratio values may vary. However, the Entry Point remains valid, and you must use the Invalidation Point as your definitive Stop Loss.",
        },
        {
          question: "What risk percentage should I set for my trades?",
          answer: "We recommend risking no more than 1-2% of your account per trade for sustainable trading. You can configure this in the Settings page based on your personal risk tolerance and trading experience.",
        },
      ],
    },
    {
      title: "Broker Account Creation",
      questions: [
        {
          question: "How do I create a JustMarkets account?",
          answer: (
            <div>
              <p>To create a JustMarkets account, <a href="https://one.justmarkets.link/a/3zjen0swcb" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">click here to sign up</a>.</p>
            </div>
          ),
        },
        {
          question: "Can I use a different broker with this platform?",
          answer: "Yes, you can use any broker. However, please note that our point configuration is optimized for JustMarkets. With other brokers, the Entry and Take Profit values remain valid, but you should always use the Invalidation Point as your Stop Loss for accurate risk management.",
        },
      ],
    },
    {
      title: "Account and Support",
      questions: [
        {
          question: "How do I complete my profile setup?",
          answer: "After logging in, navigate to the Settings page to complete your profile by entering your name, phone number, and configuring your trading preferences including account size, risk percentage, and preferred trading type.",
        },
        {
          question: "How can I contact support?",
          answer: (
            <div>
              <p>You can reach our support team by:</p>
              <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                <li>Using the <Link to="/contact" className="text-primary hover:underline font-medium">Contact Us</Link> page on our website</li>
                <li>Sending a message through the in-app notification system (for registered users)</li>
              </ul>
            </div>
          ),
        },
        {
          question: "What is the referral program?",
          answer: "Our referral program rewards you with free analysis slots when users you refer sign up and make purchases. You receive a unique referral code to share, and can track your referrals and rewards on the Referral Program page.",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <Button variant="ghost" asChild className="gap-2">
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <HelpCircle className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">Frequently Asked Questions</h1>
            </div>
            <p className="text-muted-foreground">
              Find answers to common questions about using TradeAdvisor.live
            </p>
          </div>

          {/* FAQ Sections */}
          <div className="space-y-8">
            {faqSections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="bg-card rounded-lg border border-border p-6">
                <h2 className="text-xl font-semibold text-primary mb-4">{section.title}</h2>
                <Accordion type="single" collapsible className="w-full">
                  {section.questions.map((item, questionIndex) => (
                    <AccordionItem key={questionIndex} value={`${sectionIndex}-${questionIndex}`}>
                      <AccordionTrigger className="text-left hover:text-primary">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))}
          </div>

          {/* Still have questions */}
          <div className="mt-8 text-center p-6 bg-muted/50 rounded-lg border border-border">
            <h3 className="text-lg font-semibold mb-2">Still have questions?</h3>
            <p className="text-muted-foreground mb-4">
              Can't find the answer you're looking for? Please reach out to our support team.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;
