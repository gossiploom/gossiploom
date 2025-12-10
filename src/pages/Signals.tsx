import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SlideInMenu } from "@/components/SlideInMenu";
import { ProfileCompletionGuard } from "@/components/ProfileCompletionGuard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NewsScrollingBanner } from "@/components/NewsScrollingBanner";
import { Badge } from "@/components/ui/badge";
import { Footer } from "@/components/Footer";
import { Lock, TrendingUp, ExternalLink } from "lucide-react";

interface Signal {
  id: string;
  image_path: string;
  title: string | null;
  description: string | null;
  created_at: string;
}

const Signals = () => {
  const navigate = useNavigate();
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [subscriptionExpiry, setSubscriptionExpiry] = useState<string | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_signal_subscriber, subscription_expires_at")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        const isActive = profile.is_signal_subscriber && 
          (!profile.subscription_expires_at || new Date(profile.subscription_expires_at) > new Date());
        setIsSubscriber(isActive);
        setSubscriptionExpiry(profile.subscription_expires_at);

        if (isActive) {
          fetchSignals();
        }
      }
      setLoading(false);
    };

    checkSubscription();
  }, [navigate]);

  const fetchSignals = async () => {
    const { data } = await supabase
      .from("admin_signals")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      // Get signed URLs for images
      const signalsWithUrls = await Promise.all(
        data.map(async (signal) => {
          const { data: urlData } = await supabase.storage
            .from("admin-signals")
            .createSignedUrl(signal.image_path, 3600);
          return { ...signal, image_url: urlData?.signedUrl };
        })
      );
      setSignals(signalsWithUrls as any);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div> 
        <NewsScrollingBanner position="top" />
      <NewsScrollingBanner position="bottom" showNextDay />
      </div>
    );
  }

  return (
    <ProfileCompletionGuard>
      <div className="min-h-screen bg-background">
        <SlideInMenu />
        <div className="container mx-auto px-4 py-6 pt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/20 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Trading Signals</h1>
              <p className="text-muted-foreground">Professional signals from our experts</p>
            </div>
          </div>

          {!isSubscriber ? (
            <Card className="max-w-lg mx-auto">
              <CardHeader className="text-center">
                <div className="mx-auto p-4 bg-primary/10 rounded-full w-fit mb-4">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Subscribe to Access Signals</CardTitle>
                <CardDescription>
                  Get access to professional trading signals for just $45/month
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Daily trading signals from experts
                  </li>
                  <li className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Chart images with entry/exit points
                  </li>
                  <li className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Regular updates throughout the day
                  </li>
                </ul>
                <Button 
                  className="w-full" 
                  onClick={() => window.open("https://www.paypal.com/ncp/payment/X9DZFU5T3LKBG", "_blank")}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Subscribe Now - $45/month
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  After payment, your subscription will be activated within 24 hours.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="default" className="bg-green-500">Active Subscription</Badge>
                {subscriptionExpiry && (
                  <span className="text-sm text-muted-foreground">
                    Expires: {new Date(subscriptionExpiry).toLocaleDateString()}
                  </span>
                )}
              </div>

              {signals.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No signals posted yet. Check back soon!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {signals.map((signal: any) => (
                    <Card key={signal.id} className="overflow-hidden">
                      <img 
                        src={signal.image_url} 
                        alt={signal.title || "Trading signal"} 
                        className="w-full h-64 object-contain bg-muted"
                      />
                      <CardContent className="p-4">
                        {signal.title && <h3 className="font-semibold">{signal.title}</h3>}
                        {signal.description && (
                          <p className="text-sm text-muted-foreground mt-1">{signal.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          Posted: {new Date(signal.created_at).toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      <Footer />
      </div>
    </ProfileCompletionGuard>
  );
};

export default Signals;
