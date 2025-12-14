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
import { Lock, TrendingUp, ExternalLink, CreditCard, Smartphone, Copy, Check, Loader2, Upload } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

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
  const [phoneNumber, setPhoneNumber] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);

  const USDT_WALLET_ADDRESS = "TN1UuykftzNNYA8brBiWsd3xasLfAUfTdd";

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

  const copyUSDTAddress = async () => {
    try {
      await navigator.clipboard.writeText(USDT_WALLET_ADDRESS);
      setCopied(true);
      toast.success("Wallet address copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy address");
    }
  };

  const handleMpesaPayment = async () => {
    if (!phoneNumber || phoneNumber.length < 9) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setProcessingPayment(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please login first");
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke("initiate-mpesa-payment", {
        body: {
          phone: phoneNumber,
          amount: 45 * 129, // Convert USD to KES (approximate rate)
          packageType: "Signal Subscription",
          analysisSlots: 0
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("STK Push sent! Check your phone to complete payment.");
      } else {
        toast.error(data?.message || "Payment initiation failed");
      }
    } catch (error: any) {
      toast.error(error.message || "Payment failed");
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleScreenshotUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingScreenshot(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login first");
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `signal-sub-${user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("usdt-payments")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from("usdt_payments")
        .insert({
          user_id: user.id,
          amount_usd: 45,
          analysis_slots: 0,
          package_type: "Signal Subscription",
          screenshot_path: fileName,
          status: "pending"
        });

      if (insertError) throw insertError;

      toast.success("Screenshot uploaded! Your subscription will be activated after verification.");
    } catch (error: any) {
      toast.error(error.message || "Upload failed");
    } finally {
      setUploadingScreenshot(false);
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

                <Tabs defaultValue="card" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="card" className="flex items-center gap-1">
                      <CreditCard className="h-4 w-4" />
                      Card
                    </TabsTrigger>
                    <TabsTrigger value="usdt" className="flex items-center gap-1">
                      <span className="text-xs font-bold">₮</span>
                      USDT
                    </TabsTrigger>
                    <TabsTrigger value="mpesa" className="flex items-center gap-1">
                      <Smartphone className="h-4 w-4" />
                      M-Pesa
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="card" className="space-y-3 mt-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-primary">$45</p>
                      <p className="text-sm text-muted-foreground">Monthly subscription</p>
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={() => window.open("https://www.paypal.com/ncp/payment/X9DZFU5T3LKBG", "_blank")}
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Pay with Card - $45
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Secure payment via PayPal. Subscription activates within 24 hours.
                    </p>
                  </TabsContent>

                  <TabsContent value="usdt" className="space-y-3 mt-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-primary">45 USDT</p>
                      <p className="text-sm text-muted-foreground">TRC20 Network</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Wallet Address:</p>
                      <div className="flex items-center gap-2">
                        <Input 
                          value={USDT_WALLET_ADDRESS} 
                          readOnly 
                          className="text-xs font-mono"
                        />
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={copyUSDTAddress}
                        >
                          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">After payment, upload confirmation screenshot:</p>
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleScreenshotUpload}
                          disabled={uploadingScreenshot}
                          className="text-xs"
                        />
                        {uploadingScreenshot && <Loader2 className="h-4 w-4 animate-spin" />}
                      </div>
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      Subscription activates after admin verification (within 24 hours).
                    </p>
                  </TabsContent>

                  <TabsContent value="mpesa" className="space-y-3 mt-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <p className="text-2xl font-bold text-primary">KES 5,805</p>
                      <p className="text-sm text-muted-foreground">≈ $45 USD</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">M-Pesa Phone Number:</p>
                      <Input
                        type="tel"
                        placeholder="e.g., +254712345678"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                    </div>
                    <Button 
                      className="w-full" 
                      onClick={handleMpesaPayment}
                      disabled={processingPayment || !phoneNumber}
                    >
                      {processingPayment ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending STK Push...
                        </>
                      ) : (
                        <>
                          <Smartphone className="h-4 w-4 mr-2" />
                          Pay with M-Pesa
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      You'll receive an STK push on your phone to complete payment.
                    </p>
                  </TabsContent>
                </Tabs>
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
