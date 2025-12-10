import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Smartphone, 
  CreditCard, 
  Bitcoin, 
  Loader2, 
  Check, 
  Copy, 
  Upload, 
  ExternalLink,
  Sparkles,
  Zap,
  Crown,
  Rocket
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { NewsScrollingBanner } from "@/components/NewsScrollingBanner";
import { SlideInMenu } from "@/components/SlideInMenu";
import { ProfileCompletionGuard } from "@/components/ProfileCompletionGuard";

interface Package {
  id: string;
  name: string;
  slots: number;
  priceUSD: number;
  badge?: string;
  icon: React.ReactNode;
  paypalLink: string;
  gradient: string;
}

const PACKAGES: Package[] = [
  { 
    id: "starter", 
    name: "Starter", 
    slots: 40, 
    priceUSD: 40,
    icon: <Zap className="h-6 w-6" />,
    paypalLink: "https://www.paypal.com/ncp/payment/B828YDDYX7YG8",
    gradient: "from-emerald-500/20 to-teal-500/20"
  },
  { 
    id: "growth", 
    name: "Growth", 
    slots: 100, 
    priceUSD: 90, 
    badge: "Popular",
    icon: <Sparkles className="h-6 w-6" />,
    paypalLink: "https://www.paypal.com/ncp/payment/FERY3X9S9UQJ4",
    gradient: "from-blue-500/20 to-indigo-500/20"
  },
  { 
    id: "professional", 
    name: "Professional", 
    slots: 250, 
    priceUSD: 200,
    icon: <Rocket className="h-6 w-6" />,
    paypalLink: "https://www.paypal.com/ncp/payment/MGA57L7HPKNUE",
    gradient: "from-purple-500/20 to-pink-500/20"
  },
  { 
    id: "enterprise", 
    name: "Enterprise", 
    slots: 500, 
    priceUSD: 350, 
    badge: "Best Value",
    icon: <Crown className="h-6 w-6" />,
    paypalLink: "https://www.paypal.com/ncp/payment/89Q8J96A839T8",
    gradient: "from-amber-500/20 to-orange-500/20"
  },
];

const CUSTOM_PAYPAL_LINK = "https://www.paypal.com/ncp/payment/48H44GJJ6642J";
const USDT_ADDRESS = "TN1UuykftzNNYA8brBiWsd3xasLfAUfTdd";

const Purchase = () => {
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [customSlots, setCustomSlots] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [loadingRate, setLoadingRate] = useState(true);
  const [processingMpesa, setProcessingMpesa] = useState(false);
  const [currentLimit, setCurrentLimit] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>("mobile");
  const [copied, setCopied] = useState(false);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchExchangeRate();
    fetchCurrentLimit();
  }, []);

  const fetchExchangeRate = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-exchange-rate');
      if (error) throw error;
      setExchangeRate(data.rate);
    } catch (error: any) {
      console.error('Error fetching exchange rate:', error);
      toast({
        title: "Exchange Rate Error",
        description: "Could not fetch current exchange rate.",
        variant: "destructive",
      });
    } finally {
      setLoadingRate(false);
    }
  };

  const fetchCurrentLimit = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('user_settings')
        .select('analysis_limit')
        .eq('user_id', session.user.id)
        .single();

      if (error) throw error;
      setCurrentLimit(data?.analysis_limit || 0);
    } catch (error) {
      console.error('Error fetching current limit:', error);
    }
  };

  const calculateCustomPrice = (slots: number): number => {
    if (slots < 1) return 0;
    if (slots <= 599) return slots * 1.5;
    return slots * 0.6;
  };

  const getSelectedSlots = (): number => {
    if (selectedPackage?.id === "custom") {
      return parseInt(customSlots) || 0;
    }
    return selectedPackage?.slots || 0;
  };

  const getSelectedPriceUSD = (): number => {
    if (selectedPackage?.id === "custom") {
      return calculateCustomPrice(parseInt(customSlots) || 0);
    }
    return selectedPackage?.priceUSD || 0;
  };

  const getPriceKES = (): number => {
    if (!exchangeRate) return 0;
    return Math.round(getSelectedPriceUSD() * exchangeRate);
  };

  const copyUSDTAddress = async () => {
    await navigator.clipboard.writeText(USDT_ADDRESS);
    setCopied(true);
    toast({ title: "Address Copied", description: "USDT address copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMpesaPayment = async () => {
    if (!phone.trim()) {
      toast({ title: "Phone Number Required", description: "Please enter your M-Pesa phone number", variant: "destructive" });
      return;
    }

    if (!selectedPackage) {
      toast({ title: "No Package Selected", description: "Please select a package first", variant: "destructive" });
      return;
    }

    if (selectedPackage.id === "custom" && (!customSlots || parseInt(customSlots) < 1)) {
      toast({ title: "Invalid Slots", description: "Please enter a valid number of slots", variant: "destructive" });
      return;
    }

    const amountKES = getPriceKES();
    if (amountKES < 10) {
      toast({ title: "Amount Too Low", description: "Minimum transaction amount is Ksh 10", variant: "destructive" });
      return;
    }

    setProcessingMpesa(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Authentication Required", description: "Please log in to make a purchase", variant: "destructive" });
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke('initiate-mpesa-payment', {
        body: {
          phone: phone,
          amount: amountKES,
          analysisSlots: getSelectedSlots(),
          packageType: selectedPackage.id,
        },
      });

      if (error) throw error;

      toast({
        title: "Payment Request Sent",
        description: data.message || "Check your phone and enter your M-Pesa PIN to complete the payment.",
      });

      setPhone("");
    } catch (error: any) {
      console.error('M-Pesa payment error:', error);
      toast({ title: "Payment Failed", description: error.message || "Failed to initiate M-Pesa payment.", variant: "destructive" });
    } finally {
      setProcessingMpesa(false);
    }
  };

  const handleCardPayment = (pkg: Package | null) => {
    if (!pkg) return;
    
    if (pkg.id === "custom") {
      window.open(CUSTOM_PAYPAL_LINK, "_blank");
    } else {
      window.open(pkg.paypalLink, "_blank");
    }
  };

  const handleScreenshotUpload = async () => {
    // USDT payments disabled - usdt_payments table doesn't exist yet
    toast({
      title: "Coming Soon",
      description: "USDT payment verification is currently being set up. Please use M-Pesa or Card payment for now.",
      variant: "default",
    });
  };

  return (
    <ProfileCompletionGuard>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <NewsScrollingBanner position="top" />
        <NewsScrollingBanner position="bottom" showNextDay />
        <SlideInMenu />

        <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl mt-16 mb-8 sticky top-16 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Purchase Analysis Slots
                </h1>
                <p className="text-sm text-muted-foreground">
                  Current balance: <span className="font-semibold text-primary">{currentLimit} slots</span>
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 max-w-6xl mb-32">
          {/* Package Selection */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-6 text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Select Your Package
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {PACKAGES.map((pkg) => (
                <Card
                  key={pkg.id}
                  className={`relative p-5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] bg-gradient-to-br ${pkg.gradient} backdrop-blur-sm ${
                    selectedPackage?.id === pkg.id
                      ? "border-primary border-2 shadow-lg shadow-primary/20"
                      : "border-border/50 hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedPackage(pkg)}
                >
                  {pkg.badge && (
                    <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground shadow-lg">
                      {pkg.badge}
                    </Badge>
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {pkg.icon}
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{pkg.name}</h3>
                  </div>
                  <p className="text-4xl font-bold text-primary mb-1">{pkg.slots}</p>
                  <p className="text-sm text-muted-foreground mb-4">analysis slots</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-foreground">${pkg.priceUSD}</span>
                    <span className="text-sm text-muted-foreground">USD</span>
                  </div>
                  {selectedPackage?.id === pkg.id && (
                    <div className="absolute top-3 right-3">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {/* Custom Package */}
            <Card
              className={`p-5 cursor-pointer transition-all duration-300 hover:shadow-xl bg-gradient-to-br from-slate-500/10 to-zinc-500/10 ${
                selectedPackage?.id === "custom"
                  ? "border-primary border-2 shadow-lg shadow-primary/20"
                  : "border-border/50 hover:border-primary/50"
              }`}
              onClick={() => setSelectedPackage({ 
                id: "custom", 
                name: "Custom", 
                slots: 0, 
                priceUSD: 0, 
                icon: <Sparkles className="h-6 w-6" />,
                paypalLink: CUSTOM_PAYPAL_LINK,
                gradient: "from-slate-500/20 to-zinc-500/20"
              })}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Custom Package</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    From minimum of 20-599 slots: <span className="font-semibold">$1.50</span> per slot • 
                    600+ slots: <span className="font-semibold">$0.60</span> per slot
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-40">
                    <Label htmlFor="custom-slots" className="text-xs text-muted-foreground">Slots</Label>
                    <Input
                      id="custom-slots"
                      type="number"
                      min="1"
                      placeholder="Enter slots"
                      value={customSlots}
                      onChange={(e) => setCustomSlots(e.target.value)}
                      className="mt-1"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  {customSlots && parseInt(customSlots) > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold text-primary">
                        ${calculateCustomPrice(parseInt(customSlots)).toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
                {selectedPackage?.id === "custom" && (
                  <div className="absolute top-3 right-3">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-4 w-4 text-primary-foreground" />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </section>

          {/* Payment Methods */}
          {selectedPackage && getSelectedSlots() > 0 && (
            <section className="animate-fade-in">
              <h2 className="text-xl font-semibold mb-6 text-foreground flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Choose Payment Method
              </h2>

              <Tabs value={paymentMethod} onValueChange={setPaymentMethod} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6 h-14 bg-muted/50">
                  <TabsTrigger value="mobile" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Smartphone className="h-4 w-4" />
                    <span className="hidden sm:inline">Mobile</span>
                  </TabsTrigger>
                  <TabsTrigger value="card" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <CreditCard className="h-4 w-4" />
                    <span className="hidden sm:inline">Card</span>
                  </TabsTrigger>
                  <TabsTrigger value="crypto" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    <Bitcoin className="h-4 w-4" />
                    <span className="hidden sm:inline">USDT</span>
                  </TabsTrigger>
                </TabsList>

                {/* Mobile Payment (M-Pesa) */}
                <TabsContent value="mobile">
                  <Card className="p-6 bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-500/20">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-green-500/10 rounded-xl">
                        <Smartphone className="h-7 w-7 text-green-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">M-Pesa Payment</h3>
                        <p className="text-sm text-muted-foreground">Pay instantly with your M-Pesa account</p>
                      </div>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div>
                        <Label htmlFor="phone">M-Pesa Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+254712345678"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="mt-2"
                        />
                      </div>

                      <div className="bg-background/50 p-4 rounded-xl space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Package:</span>
                          <span className="font-semibold text-foreground">{selectedPackage.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Slots:</span>
                          <span className="font-semibold text-foreground">{getSelectedSlots()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Amount (USD):</span>
                          <span className="font-semibold text-foreground">${getSelectedPriceUSD().toFixed(2)}</span>
                        </div>
                        {exchangeRate && (
                          <>
                            <div className="border-t border-border/50 pt-3 flex justify-between text-xs">
                              <span className="text-muted-foreground">Rate:</span>
                              <span className="text-muted-foreground">1 USD = {exchangeRate.toFixed(2)} KES</span>
                            </div>
                            <div className="flex justify-between text-lg">
                              <span className="font-semibold text-foreground">Total (KES):</span>
                              <span className="font-bold text-green-500">KES {getPriceKES().toLocaleString()}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <Button
                      className="w-full h-12 bg-green-500 hover:bg-green-600 text-white"
                      onClick={handleMpesaPayment}
                      disabled={processingMpesa || !phone.trim()}
                    >
                      {processingMpesa ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Smartphone className="mr-2 h-5 w-5" />
                          Pay with M-Pesa
                        </>
                      )}
                    </Button>
                  </Card>
                </TabsContent>

                {/* Card Payment */}
                <TabsContent value="card">
                  <Card className="p-6 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 border-blue-500/20">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-blue-500/10 rounded-xl">
                        <CreditCard className="h-7 w-7 text-blue-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">Card Payment</h3>
                        <p className="text-sm text-muted-foreground">Pay securely with your credit or debit card</p>
                      </div>
                    </div>

                    <div className="bg-background/50 p-4 rounded-xl space-y-3 mb-6">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Package:</span>
                        <span className="font-semibold text-foreground">{selectedPackage.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Slots:</span>
                        <span className="font-semibold text-foreground">{getSelectedSlots()}</span>
                      </div>
                      <div className="flex justify-between text-lg">
                        <span className="font-semibold text-foreground">Total:</span>
                        <span className="font-bold text-blue-500">${getSelectedPriceUSD().toFixed(2)} USD</span>
                      </div>
                    </div>

                    <Button
                      className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white"
                      onClick={() => handleCardPayment(selectedPackage)}
                    >
                      <ExternalLink className="mr-2 h-5 w-5" />
                      Proceed to Secure Checkout
                    </Button>
                    
                    <p className="text-xs text-center text-muted-foreground mt-4">
                      You will be redirected to a secure payment page
                    </p>
                  </Card>
                </TabsContent>

                {/* USDT Crypto Payment */}
                <TabsContent value="crypto">
                  <Card className="p-6 bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/20">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-amber-500/10 rounded-xl">
                        <Bitcoin className="h-7 w-7 text-amber-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">USDT Payment (TRC20)</h3>
                        <p className="text-sm text-muted-foreground">Pay with Tether on the TRON network</p>
                      </div>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="bg-background/50 p-4 rounded-xl space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Package:</span>
                          <span className="font-semibold text-foreground">{selectedPackage.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Slots:</span>
                          <span className="font-semibold text-foreground">{getSelectedSlots()}</span>
                        </div>
                        <div className="flex justify-between text-lg">
                          <span className="font-semibold text-foreground">Amount:</span>
                          <span className="font-bold text-amber-500">{getSelectedPriceUSD().toFixed(2)} USDT</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">USDT Address (TRC20)</Label>
                        <div className="mt-2 flex items-center gap-2">
                          <Input
                            value={USDT_ADDRESS}
                            readOnly
                            className="font-mono text-sm bg-muted/50"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={copyUSDTAddress}
                            className="shrink-0"
                          >
                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                        <p className="text-sm text-foreground font-medium mb-2">Instructions:</p>
                        <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                          <li>Send exactly <strong className="text-amber-500">{getSelectedPriceUSD().toFixed(2)} USDT</strong> to the address above</li>
                          <li>Wait for the transaction confirmation email</li>
                          <li>Upload a screenshot of the confirmation below</li>
                        </ol>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Upload Payment Screenshot</Label>
                        <div className="mt-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
                            className="hidden"
                          />
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-border/50 rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all"
                          >
                            {screenshotFile ? (
                              <div className="flex items-center justify-center gap-2 text-primary">
                                <Check className="h-5 w-5" />
                                <span className="font-medium">{screenshotFile.name}</span>
                              </div>
                            ) : (
                              <>
                                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                <p className="text-sm text-muted-foreground">
                                  Click to upload screenshot
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white"
                      onClick={handleScreenshotUpload}
                      disabled={uploadingScreenshot || !screenshotFile}
                    >
                      {uploadingScreenshot ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-5 w-5" />
                          Submit Payment Proof
                        </>
                      )}
                    </Button>
                  </Card>
                </TabsContent>
              </Tabs>
            </section>
          )}
        </main>
      <Footer />
      </div>
    </ProfileCompletionGuard>
  );
};

export default Purchase;
