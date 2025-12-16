import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen } from "lucide-react";

export const PlatformGuide = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
          <BookOpen className="h-4 w-4" />
          Platform Guide
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            📈 TradeAdvisor.live: Platform Onboarding and Signal Generation Guide
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[70vh] pr-4">
          <div className="space-y-6 text-sm">
            {/* Welcome Section */}
            <section>
              <h3 className="text-lg font-semibold text-primary mb-2">Welcome and Platform Overview</h3>
              <p className="text-muted-foreground">
                Thank you for creating an account with TradeAdvisor.live. This platform is designed to assist you in your pursuit of financial independence through high-quality trading signals and expert-generated setups.
              </p>
              <p className="text-muted-foreground mt-2">
                This introductory guide will provide a comprehensive walkthrough of the platform and the two primary methods through which you can leverage our analytical tools and expertise.
              </p>
            </section>

            {/* Video Walkthrough */}
            <section>
              <h3 className="text-lg font-semibold text-primary mb-2">📹 Video Walkthrough</h3>
              <p className="text-muted-foreground mb-3">
                Watch this quick video guide to see how to navigate and use the platform effectively:
              </p>
              <div className="rounded-lg overflow-hidden border border-border bg-muted/30">
                <video 
                  controls 
                  className="w-full max-h-[400px]"
                  preload="metadata"
                >
                  <source src="/TradeAdvisorGuide.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              <p className="text-xs text-muted-foreground mt-2 italic">
                Tip: Click the fullscreen button for a better viewing experience.
              </p>
            </section>

            {/* Options for Signal Access */}
            <section>
              <h3 className="text-lg font-semibold text-primary mb-2">Options for Signal Access</h3>
              <p className="text-muted-foreground mb-3">
                You can benefit from the TradeAdvisor.live platform through two distinct service models:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border rounded-lg">
                  <thead>
                    <tr className="bg-muted">
                      <th className="border border-border p-3 text-left font-semibold">Service Model</th>
                      <th className="border border-border p-3 text-left font-semibold">Description</th>
                      <th className="border border-border p-3 text-left font-semibold">Cost Structure</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-border p-3 font-medium">1. Self-Generated Signals</td>
                      <td className="border border-border p-3 text-muted-foreground">Users purchase analysis credits ("slots") to generate proprietary trade signals and setups using our integrated technical analysis engine.</td>
                      <td className="border border-border p-3 text-muted-foreground">Analysis slots must be purchased. The minimum purchase is 20 slots, valued at $30 USD.</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3 font-medium">2. Expert-Generated Signals</td>
                      <td className="border border-border p-3 text-muted-foreground">Our team of expert analysts posts new, verified signals daily, accessible to subscribers.</td>
                      <td className="border border-border p-3 text-muted-foreground">Available Monday through Friday via the dedicated Signals Page. Subscription fee is $45 USD per month.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Step 1 */}
            <section>
              <h3 className="text-lg font-semibold text-primary mb-2">Step 1: Account Configuration and Risk Management</h3>
              <p className="text-muted-foreground mb-3">
                Upon logging into your account with your selected credentials, your first step is to configure your trading preferences in the Settings page:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                <li><strong>Risk Acceptance Level:</strong> Preset your acceptable risk tolerance.</li>
                <li><strong>Account Size:</strong> Input your account capital for accurate position sizing.</li>
                <li><strong>Trading Type:</strong> We recommend utilizing Pending Orders, as this method has demonstrated the highest profitability within our platform's ecosystem.</li>
              </ul>

              <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
                <h4 className="font-semibold text-foreground mb-2">Broker and Point Configuration Notice</h4>
                <p className="text-muted-foreground mb-3">
                  The platform's point configuration is primarily calculated based on the JustMarkets broker. If you use a different broker, please be aware that the calculated Stop Loss (SL) and Reward-to-Risk (R:R) ratio values may vary.
                </p>
                <h5 className="font-medium text-foreground mb-2">Important Note for Non-JustMarkets Users:</h5>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                  <li>The generated Entry and Take profit values remains valid.</li>
                  <li>Always use the provided Invalidation Point as your definitive Stop Loss.</li>
                  <li>If the calculated SL value appears unrealistic, assess the risk tolerance for the trade. The Invalidation Point is critical; reaching it signifies a deep retracement or potential reversal, making it the optimal point for market exit.</li>
                  <li>After saving your settings, return to the Home Page.</li>
                </ul>
              </div>
            </section>

            {/* Purchasing Slots */}
            <section>
              <h3 className="text-lg font-semibold text-primary mb-2">Purchasing Analysis Slots</h3>
              <p className="text-muted-foreground">
                To generate your own signals, you must have analysis credits. Navigate to the Purchase Slots page. Once purchased, your credits will be issued immediately and will be reflected in the "Analysis Slots" section on the Home Page after a refresh.
              </p>
            </section>

            {/* Step 2 */}
            <section>
              <h3 className="text-lg font-semibold text-primary mb-2">Step 2: Generating Your Own Trading Setups</h3>
              <p className="text-muted-foreground mb-3">
                Once analysis slots are available, you are ready to generate your own trading setups. A list of highly recommended and profitable trading pairs, optimized for our strategy, was provided to you via email upon registration. Our strategy utilizes technical analysis, and these pairs have proven most effective through extensive backtesting.
              </p>

              <h4 className="font-semibold text-foreground mb-2">Procedure for Optimal Signal Generation</h4>
              <p className="text-muted-foreground mb-3">
                To ensure the generation of the most logical and realistic trade signals, please follow these steps precisely:
              </p>
              <ol className="list-decimal list-inside space-y-3 text-muted-foreground ml-2">
                <li>
                  <strong>MT4/MT5 Chart Preparation:</strong> On your trading platform, disable price lines or paint them white. This prevents the analysis tool from misinterpreting them as support/resistance levels, which can lead to erroneous signals.
                </li>
                <li>
                  <strong>Chart Visualization:</strong> Position your device in landscape mode to maximize chart visibility. Zoom out (minimize) the chart as much as possible to ensure the maximum number of candlesticks are visible, which is crucial for a comprehensive analysis.
                </li>
                <li>
                  <strong>Screenshot Capture:</strong> Capture screenshots of the current chart on the following five timeframes:
                  <ul className="list-disc list-inside ml-6 mt-1 space-y-1">
                    <li>5-minute (M5)</li>
                    <li>15-minute (M15)</li>
                    <li>1-hour (H1)</li>
                    <li>4-hour (H4)</li>
                    <li>12-hour (H12)</li>
                  </ul>
                  <p className="ml-6 mt-1 text-sm italic">(Larger timeframes establish market bias, while smaller timeframes help pinpoint optimal entry and exit zones.)</p>
                </li>
                <li>
                  <strong>Upload Charts:</strong> Return to the TradeAdvisor.live Home Page and upload the five captured screenshots (best results are achieved with five charts).
                </li>
                <li>
                  <strong>Signal Generation:</strong> Click "Analyse Charts" and allow a few seconds for the comprehensive trading signal to be generated.
                </li>
                <li>
                  <strong>Review Signal:</strong> The generated signal will include the Entry Value, Stop Loss (SL) Value, and Take Profit (TP) Value. The definitive Invalidation Value (to be used as SL) is provided along with the rationale explaining the trade logic, as well as the calculated Risk-Reward (R:R) Ratio.
                </li>
              </ol>
            </section>

            {/* Step 3 */}
            <section>
              <h3 className="text-lg font-semibold text-primary mb-2">Step 3: Trade Execution and Monitoring</h3>
              <p className="text-muted-foreground mb-3">With the signal generated:</p>
              <ol className="list-decimal list-inside space-y-2 text-muted-foreground ml-2">
                <li>
                  <strong>Execute Trade:</strong> Navigate back to your MT4 or MT5 platform and open a Pending Order using the provided values.
                </li>
                <li>
                  <strong>Stop Loss Selection:</strong> You may choose to use the Invalidation Value as your Stop Loss, particularly if the potential loss using the system's SL has an R:R ratio favorable than 1:1 relative to the Take Profit value.
                </li>
                <li>
                  <strong>Monitor:</strong> Continuously monitor the open trade. We wish you a profitable venture.
                </li>
              </ol>
            </section>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
