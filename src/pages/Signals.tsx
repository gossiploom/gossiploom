import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { SlideInMenu } from "@/components/SlideInMenu";

// Signals page - disabled until required database tables are created
// Required tables: admin_signals, and is_signal_subscriber/subscription_expires_at columns in profiles

const Signals = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SlideInMenu />
      <div className="max-w-4xl mx-auto p-6 pt-20">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Trading Signals</h1>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>
              The trading signals feature is currently being developed.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground text-sm">
              Premium trading signals from expert analysts will be available here once the feature is complete.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signals;
