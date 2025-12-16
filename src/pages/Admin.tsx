import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SlideInMenu } from "@/components/SlideInMenu";
import { useToast } from "@/hooks/use-toast";
import { Users, Bell, CreditCard, UserPlus, Activity, Send, Check, X, Image, MessageSquare, Upload, Calendar, Globe, Mail } from "lucide-react";

interface AccountRequest {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  status: string;
  created_at: string;
  rejection_reason: string | null;
  request_ip: string | null;
}

interface UserWithDetails {
  user_id: string;
  name: string;
  phone_number: string;
  unique_identifier: string;
  analysis_limit: number;
  is_online: boolean;
  last_seen: string | null;
  slots_used: number;
  slots_remaining: number;
  successful_trades: number;
  last_login_ip: string | null;
  is_signal_subscriber: boolean;
  subscription_expires_at: string | null;
  referral_code: string | null;
  total_referrals: number;
  successful_referrals: number;
}

interface Payment {
  id: string;
  user_id: string;
  amount_kes?: number;
  amount_usd?: number;
  package_type: string;
  status: string;
  payment_method?: string;
  created_at: string;
  screenshot_path?: string;
  user_name?: string;
  user_identifier?: string;
  analysis_slots?: number;
}

interface SupportThread {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_name?: string;
  user_identifier?: string;
}

interface SupportMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  message: string;
  attachment_path: string | null;
  attachment_type: string | null;
  created_at: string;
}

interface ContactQuery {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  admin_response: string | null;
  responded_at: string | null;
  created_at: string;
}

interface AdminSignal {
  id: string;
  symbol: string | null;
  direction: string | null;
  entry_price: number | null;
  stop_loss: number | null;
  take_profit: number | null;
  risk_reward: string | null;
  outcome: string;
  outcome_notes: string | null;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdminCheck();
  const { toast } = useToast();
  
  const [accountRequests, setAccountRequests] = useState<AccountRequest[]>([]);
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [supportThreads, setSupportThreads] = useState<SupportThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<SupportThread | null>(null);
  const [threadMessages, setThreadMessages] = useState<SupportMessage[]>([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [contactQueries, setContactQueries] = useState<ContactQuery[]>([]);
  const [selectedQuery, setSelectedQuery] = useState<ContactQuery | null>(null);
  const [queryResponse, setQueryResponse] = useState("");
  const [sendingQueryResponse, setSendingQueryResponse] = useState(false);
  
  // Create user form
  const [createUserDialog, setCreateUserDialog] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserSlots, setNewUserSlots] = useState("0");
  const [creatingUser, setCreatingUser] = useState(false);

  // Notification form
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationTarget, setNotificationTarget] = useState("all");
  const [notificationDuration, setNotificationDuration] = useState("10");
  const [sendingNotification, setSendingNotification] = useState(false);

  // Adjust slots
  const [adjustSlotsDialog, setAdjustSlotsDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
  const [newSlots, setNewSlots] = useState("");

  // Subscription management
  const [subscriptionDialog, setSubscriptionDialog] = useState(false);
  const [subscriptionExpiry, setSubscriptionExpiry] = useState("");

  // View screenshot
  const [screenshotDialog, setScreenshotDialog] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState("");

  // Signal posting and management
  const [signalDialog, setSignalDialog] = useState(false);
  const [signalSymbol, setSignalSymbol] = useState("");
  const [signalDirection, setSignalDirection] = useState<"long" | "short">("long");
  const [signalEntry, setSignalEntry] = useState("");
  const [signalStopLoss, setSignalStopLoss] = useState("");
  const [signalTakeProfit, setSignalTakeProfit] = useState("");
  const [signalRiskReward, setSignalRiskReward] = useState("");
  const [postingSignal, setPostingSignal] = useState(false);
  const [adminSignals, setAdminSignals] = useState<AdminSignal[]>([]);
  const [editSignalDialog, setEditSignalDialog] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<AdminSignal | null>(null);
  const [outcomeDialog, setOutcomeDialog] = useState(false);
  const [signalOutcome, setSignalOutcome] = useState<"win" | "loss" | "pending">("pending");
  const [outcomeNotes, setOutcomeNotes] = useState("");
  
  const PRESET_NOTES = "Do not continue to hold your trades if Stop Loss has Reached, exit the trade. Consider also using trailing profit or breakeven to lock any realized profit should price retrace to stop loss before getting to take profit. Break even when 1:1.5 profit is realized";

  // Admin reply
  const [replyMessage, setReplyMessage] = useState("");

  // Admin email
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailTargetType, setEmailTargetType] = useState<"all" | "single">("all");
  const [singleEmailAddress, setSingleEmailAddress] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchAccountRequests();
      fetchUsers();
      fetchPayments();
      fetchSupportThreads();
      fetchContactQueries();
      fetchAdminSignals();
    }
  }, [isAdmin]);

  const fetchAccountRequests = async () => {
    const { data } = await supabase
      .from("account_requests")
      .select("*")
      .order("created_at", { ascending: false });
    setAccountRequests(data || []);
  };

  const fetchUsers = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, phone_number, unique_identifier, last_login_ip, is_signal_subscriber, subscription_expires_at, referral_code");

    if (!profiles) return;

    const userIds = profiles.map(p => p.user_id);

    const { data: settings } = await supabase
      .from("user_settings")
      .select("user_id, analysis_limit")
      .in("user_id", userIds);

    const { data: presence } = await supabase
      .from("user_presence")
      .select("user_id, is_online, last_seen")
      .in("user_id", userIds);

    const { data: trades } = await supabase
      .from("trades")
      .select("user_id, outcome")
      .in("user_id", userIds);

    const { data: referrals } = await supabase
      .from("referrals")
      .select("referrer_id, has_purchased")
      .in("referrer_id", userIds);

    const combined = profiles.map(profile => {
      const userSettings = settings?.find(s => s.user_id === profile.user_id);
      const userPresence = presence?.find(p => p.user_id === profile.user_id);
      const userTrades = trades?.filter(t => t.user_id === profile.user_id) || [];
      const userReferrals = referrals?.filter(r => r.referrer_id === profile.user_id) || [];
      const slotsUsed = userTrades.length;
      const successfulTrades = userTrades.filter(t => t.outcome === "win").length;
      const totalSlots = userSettings?.analysis_limit ?? 0;
      
      return {
        ...profile,
        analysis_limit: totalSlots,
        is_online: userPresence?.is_online || false,
        last_seen: userPresence?.last_seen || null,
        slots_used: slotsUsed,
        slots_remaining: Math.max(0, totalSlots - slotsUsed),
        successful_trades: successfulTrades,
        total_referrals: userReferrals.length,
        successful_referrals: userReferrals.filter(r => r.has_purchased).length,
      };
    });

    setUsers(combined);
    setOnlineCount(combined.filter(u => u.is_online).length);
  };

  const fetchPayments = async () => {
    const { data: mpesaPayments } = await supabase
      .from("pending_payments")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: usdtPayments } = await supabase
      .from("usdt_payments")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, unique_identifier");

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    const allPayments: Payment[] = [
      ...(mpesaPayments?.map(p => ({
        ...p,
        user_name: profileMap.get(p.user_id)?.name,
        user_identifier: profileMap.get(p.user_id)?.unique_identifier,
      })) || []),
      ...(usdtPayments?.map(p => ({
        ...p,
        payment_method: "usdt",
        user_name: profileMap.get(p.user_id)?.name,
        user_identifier: profileMap.get(p.user_id)?.unique_identifier,
      })) || []),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setPayments(allPayments);
  };

  const fetchSupportThreads = async () => {
    const { data: threads } = await supabase
      .from("support_threads")
      .select("*")
      .order("updated_at", { ascending: false });

    if (!threads) return;

    const userIds = [...new Set(threads.map(t => t.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, name, unique_identifier")
      .in("user_id", userIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    const threadsWithUsers = threads.map(t => ({
      ...t,
      user_name: profileMap.get(t.user_id)?.name,
      user_identifier: profileMap.get(t.user_id)?.unique_identifier,
    }));

    setSupportThreads(threadsWithUsers);
  };

  const fetchContactQueries = async () => {
    const { data } = await supabase
      .from("contact_queries")
      .select("*")
      .order("created_at", { ascending: false });
    setContactQueries((data as ContactQuery[]) || []);
  };

  const fetchThreadMessages = async (threadId: string) => {
    const { data } = await supabase
      .from("support_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    setThreadMessages(data || []);
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserName || !newUserPhone) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setCreatingUser(true);
    try {
      const response = await supabase.functions.invoke("admin-create-user", {
        body: {
          email: newUserEmail,
          password: newUserPassword,
          fullName: newUserName,
          phoneNumber: newUserPhone,
          initialSlots: parseInt(newUserSlots),
        },
      });

      if (response.error) throw response.error;

      toast({ title: "Success", description: "User created successfully" });
      setCreateUserDialog(false);
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserName("");
      setNewUserPhone("");
      setNewUserSlots("0");
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setCreatingUser(false);
    }
  };

  const handleProcessRequest = async (request: AccountRequest, approve: boolean, rejectionReason?: string) => {
    if (approve) {
      setNewUserEmail(request.email);
      setNewUserName(request.full_name);
      setNewUserPhone(request.phone_number);
      setCreateUserDialog(true);
    }

    await supabase
      .from("account_requests")
      .update({ 
        status: approve ? "approved" : "rejected",
        processed_at: new Date().toISOString(),
        rejection_reason: rejectionReason || null,
      })
      .eq("id", request.id);

    fetchAccountRequests();
  };

  const handleSendNotification = async () => {
    if (!notificationTitle || !notificationMessage) {
      toast({ title: "Error", description: "Please fill title and message", variant: "destructive" });
      return;
    }

    setSendingNotification(true);
    try {
      const notificationData: any = {
        title: notificationTitle,
        message: notificationMessage,
        duration_seconds: parseInt(notificationDuration),
        is_global: notificationTarget === "all",
      };

      if (notificationTarget !== "all") {
        notificationData.target_user_id = notificationTarget;
      }

      const { error } = await supabase.from("admin_notifications").insert(notificationData);
      if (error) throw error;

      toast({ title: "Success", description: "Notification sent" });
      setNotificationTitle("");
      setNotificationMessage("");
      setNotificationTarget("all");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSendingNotification(false);
    }
  };

  const handleAdjustSlots = async () => {
    if (!selectedUser || !newSlots) return;

    try {
      const { error } = await supabase
        .from("user_settings")
        .update({ analysis_limit: parseInt(newSlots) })
        .eq("user_id", selectedUser.user_id);

      if (error) throw error;

      toast({ title: "Success", description: "Slots updated" });
      setAdjustSlotsDialog(false);
      setSelectedUser(null);
      setNewSlots("");
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleUpdateSubscription = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ 
          is_signal_subscriber: true,
          subscription_expires_at: subscriptionExpiry || null,
        })
        .eq("user_id", selectedUser.user_id);

      if (error) throw error;

      toast({ title: "Success", description: "Subscription updated" });
      setSubscriptionDialog(false);
      setSelectedUser(null);
      setSubscriptionExpiry("");
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleViewScreenshot = async (path: string) => {
    const { data } = await supabase.storage
      .from("usdt-payments")
      .createSignedUrl(path, 3600);
    
    if (data?.signedUrl) {
      setScreenshotUrl(data.signedUrl);
      setScreenshotDialog(true);
    }
  };

  const handleVerifyPayment = async (payment: Payment, approve: boolean) => {
    try {
      if (payment.payment_method === "usdt") {
        if (approve) {
          await supabase
            .from("usdt_payments")
            .update({ 
              status: "verified",
              verified_at: new Date().toISOString(),
            })
            .eq("id", payment.id);

          const { data: currentSettings } = await supabase
            .from("user_settings")
            .select("analysis_limit")
            .eq("user_id", payment.user_id)
            .single();

          const currentSlots = currentSettings?.analysis_limit || 0;
          const slotsToAdd = payment.analysis_slots || 0;

          await supabase
            .from("user_settings")
            .update({ analysis_limit: currentSlots + slotsToAdd })
            .eq("user_id", payment.user_id);

          // Mark referral as successful (first purchase)
          await supabase
            .from("referrals")
            .update({ 
              has_purchased: true,
              first_purchase_at: new Date().toISOString(),
            })
            .eq("referred_id", payment.user_id)
            .eq("has_purchased", false);
        } else {
          await supabase
            .from("usdt_payments")
            .update({ status: "rejected" })
            .eq("id", payment.id);
        }
      } else {
        // M-Pesa or Card payment
        if (approve) {
          await supabase
            .from("pending_payments")
            .update({ 
              status: "completed",
              completed_at: new Date().toISOString(),
            })
            .eq("id", payment.id);

          const { data: currentSettings } = await supabase
            .from("user_settings")
            .select("analysis_limit")
            .eq("user_id", payment.user_id)
            .single();

          const currentSlots = currentSettings?.analysis_limit || 0;
          const slotsToAdd = payment.analysis_slots || 0;

          await supabase
            .from("user_settings")
            .update({ analysis_limit: currentSlots + slotsToAdd })
            .eq("user_id", payment.user_id);

          // Mark referral as successful (first purchase)
          await supabase
            .from("referrals")
            .update({ 
              has_purchased: true,
              first_purchase_at: new Date().toISOString(),
            })
            .eq("referred_id", payment.user_id)
            .eq("has_purchased", false);
        } else {
          await supabase
            .from("pending_payments")
            .update({ status: "rejected" })
            .eq("id", payment.id);
        }
      }

      toast({ title: "Success", description: approve ? "Payment verified and slots added" : "Payment rejected" });
      fetchPayments();
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handlePostSignal = async () => {
    if (!signalSymbol || !signalEntry || !signalStopLoss || !signalTakeProfit || !signalRiskReward) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    setPostingSignal(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: insertError } = await supabase.from("admin_signals").insert({
        symbol: signalSymbol.toUpperCase(),
        direction: signalDirection,
        entry_price: parseFloat(signalEntry),
        stop_loss: parseFloat(signalStopLoss),
        take_profit: parseFloat(signalTakeProfit),
        risk_reward: signalRiskReward,
        additional_notes: PRESET_NOTES,
        created_by: user.id,
      });

      if (insertError) throw insertError;

      toast({ title: "Success", description: "Signal posted successfully" });
      setSignalDialog(false);
      setSignalSymbol("");
      setSignalDirection("long");
      setSignalEntry("");
      setSignalStopLoss("");
      setSignalTakeProfit("");
      setSignalRiskReward("");
      fetchAdminSignals();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setPostingSignal(false);
    }
  };

  const fetchAdminSignals = async () => {
    const { data } = await supabase
      .from("admin_signals")
      .select("id, symbol, direction, entry_price, stop_loss, take_profit, risk_reward, outcome, outcome_notes, created_at")
      .order("created_at", { ascending: false });
    setAdminSignals(data || []);
  };

  const handleEditSignal = async () => {
    if (!selectedSignal || !signalSymbol || !signalEntry || !signalStopLoss || !signalTakeProfit || !signalRiskReward) {
      toast({ title: "Error", description: "Please fill all required fields", variant: "destructive" });
      return;
    }

    try {
      const { error } = await supabase
        .from("admin_signals")
        .update({
          symbol: signalSymbol.toUpperCase(),
          direction: signalDirection,
          entry_price: parseFloat(signalEntry),
          stop_loss: parseFloat(signalStopLoss),
          take_profit: parseFloat(signalTakeProfit),
          risk_reward: signalRiskReward,
        })
        .eq("id", selectedSignal.id);

      if (error) throw error;

      toast({ title: "Success", description: "Signal updated successfully" });
      setEditSignalDialog(false);
      setSelectedSignal(null);
      fetchAdminSignals();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteSignal = async (signalId: string) => {
    if (!confirm("Are you sure you want to delete this signal?")) return;

    try {
      const { error } = await supabase
        .from("admin_signals")
        .delete()
        .eq("id", signalId);

      if (error) throw error;

      toast({ title: "Success", description: "Signal deleted successfully" });
      fetchAdminSignals();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleUpdateOutcome = async () => {
    if (!selectedSignal) return;

    try {
      const { error } = await supabase
        .from("admin_signals")
        .update({
          outcome: signalOutcome,
          outcome_notes: outcomeNotes || null,
          outcome_updated_at: new Date().toISOString(),
        })
        .eq("id", selectedSignal.id);

      if (error) throw error;

      toast({ title: "Success", description: "Outcome updated successfully" });
      setOutcomeDialog(false);
      setSelectedSignal(null);
      setSignalOutcome("pending");
      setOutcomeNotes("");
      fetchAdminSignals();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const openEditSignalDialog = (signal: AdminSignal) => {
    setSelectedSignal(signal);
    setSignalSymbol(signal.symbol || "");
    setSignalDirection((signal.direction as "long" | "short") || "long");
    setSignalEntry(signal.entry_price?.toString() || "");
    setSignalStopLoss(signal.stop_loss?.toString() || "");
    setSignalTakeProfit(signal.take_profit?.toString() || "");
    setSignalRiskReward(signal.risk_reward || "");
    setEditSignalDialog(true);
  };

  const openOutcomeDialog = (signal: AdminSignal) => {
    setSelectedSignal(signal);
    setSignalOutcome((signal.outcome as "win" | "loss" | "pending") || "pending");
    setOutcomeNotes(signal.outcome_notes || "");
    setOutcomeDialog(true);
  };

  const handleAdminReply = async () => {
    if (!selectedThread || !replyMessage.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("support_messages").insert({
        thread_id: selectedThread.id,
        sender_id: user.id,
        subject: selectedThread.subject,
        message: replyMessage,
      });

      await supabase
        .from("support_threads")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", selectedThread.id);

      setReplyMessage("");
      fetchThreadMessages(selectedThread.id);
      toast({ title: "Reply sent" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleRespondToQuery = async () => {
    if (!selectedQuery || !queryResponse.trim()) return;

    setSendingQueryResponse(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.functions.invoke("respond-contact-query", {
        body: {
          queryId: selectedQuery.id,
          response: queryResponse.trim(),
          userEmail: selectedQuery.email,
          userName: selectedQuery.name,
          originalSubject: selectedQuery.subject,
          originalMessage: selectedQuery.message,
          adminUserId: user.id,
        },
      });

      if (error) throw error;

      toast({ title: "Response sent", description: "Email sent to user" });
      setQueryResponse("");
      setSelectedQuery(null);
      fetchContactQueries();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSendingQueryResponse(false);
    }
  };

  const handleSendAdminEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      toast({ title: "Error", description: "Subject and body are required", variant: "destructive" });
      return;
    }

    if (emailTargetType === "single" && !singleEmailAddress.trim()) {
      toast({ title: "Error", description: "Email address is required", variant: "destructive" });
      return;
    }

    setSendingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-admin-email", {
        body: {
          subject: emailSubject.trim(),
          body: emailBody.trim(),
          targetType: emailTargetType,
          singleEmail: emailTargetType === "single" ? singleEmailAddress.trim() : undefined,
        },
      });

      if (error) throw error;

      toast({ 
        title: "Email sent", 
        description: data.message || "Email sent successfully" 
      });
      setEmailSubject("");
      setEmailBody("");
      setSingleEmailAddress("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  const pendingRequests = accountRequests.filter(r => r.status === "pending");
  const rejectedRequests = accountRequests.filter(r => r.status === "rejected");

  return (
    <div className="min-h-screen bg-background relative">

    <div className="absolute top-5 right-4 z-50">
      <SlideInMenu />
    </div>

    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, payments, and notifications</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Activity className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Online Now</p>
                  <p className="text-2xl font-bold">{onlineCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <UserPlus className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Requests</p>
                  <p className="text-2xl font-bold">{pendingRequests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <CreditCard className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Payments</p>
                  <p className="text-2xl font-bold">{payments.filter(p => p.status === "pending").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Open Tickets</p>
                  <p className="text-2xl font-bold">{supportThreads.filter(t => t.status === "open").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <Mail className="h-5 w-5 text-cyan-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Queries</p>
                  <p className="text-2xl font-bold">{contactQueries.filter(q => q.status === "pending").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="requests" className="space-y-4">
          <TabsList className="grid grid-cols-8 w-full max-w-5xl">
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
            <TabsTrigger value="queries">Queries</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="signals">Signals</TabsTrigger>
          </TabsList>

          <TabsContent value="requests">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Pending Account Requests</CardTitle>
                  <CardDescription>Review and process account creation requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingRequests.map(request => (
                        <TableRow key={request.id}>
                          <TableCell>{request.full_name}</TableCell>
                          <TableCell>{request.email}</TableCell>
                          <TableCell>{request.phone_number}</TableCell>
                          <TableCell className="font-mono text-xs">{request.request_ip || "—"}</TableCell>
                          <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleProcessRequest(request, true)}>
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleProcessRequest(request, false, "Rejected by admin")}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {pendingRequests.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            No pending requests
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rejected Requests</CardTitle>
                  <CardDescription>Requests that were rejected</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rejection Reason</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rejectedRequests.map(request => (
                        <TableRow key={request.id}>
                          <TableCell>{request.full_name}</TableCell>
                          <TableCell>{request.email}</TableCell>
                          <TableCell className="text-destructive">{request.rejection_reason || "—"}</TableCell>
                          <TableCell>{new Date(request.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                      {rejectedRequests.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            No rejected requests
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>View and manage all users</CardDescription>
                </div>
                <Dialog open={createUserDialog} onOpenChange={setCreateUserDialog}>
                  <DialogTrigger asChild>
                    <Button><UserPlus className="h-4 w-4 mr-2" /> Create User</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New User</DialogTitle>
                      <DialogDescription>Create a new user account with login credentials</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Email</Label>
                        <Input value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} type="email" />
                      </div>
                      <div>
                        <Label>Password</Label>
                        <Input value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} type="password" />
                      </div>
                      <div>
                        <Label>Full Name</Label>
                        <Input value={newUserName} onChange={e => setNewUserName(e.target.value)} />
                      </div>
                      <div>
                        <Label>Phone Number</Label>
                        <Input value={newUserPhone} onChange={e => setNewUserPhone(e.target.value)} />
                      </div>
                      <div>
                        <Label>Initial Analysis Slots</Label>
                        <Input value={newUserSlots} onChange={e => setNewUserSlots(e.target.value)} type="number" />
                      </div>
                      <Button onClick={handleCreateUser} disabled={creatingUser} className="w-full">
                        {creatingUser ? "Creating..." : "Create User"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Slots Used</TableHead>
                        <TableHead>Slots Left</TableHead>
                        <TableHead>Wins</TableHead>
                        <TableHead>Referrals</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map(user => (
                        <TableRow key={user.user_id}>
                          <TableCell className="font-mono">{user.unique_identifier}</TableCell>
                          <TableCell>
                            <div>
                              {user.name || "—"}
                              {user.is_signal_subscriber && (
                                <Badge variant="outline" className="ml-2 text-xs">Subscriber</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{user.phone_number || "—"}</TableCell>
                          <TableCell>{user.slots_used}</TableCell>
                          <TableCell>{user.slots_remaining}</TableCell>
                          <TableCell className="text-green-600">{user.successful_trades}</TableCell>
                          <TableCell>
                            <span className="text-primary font-semibold">{user.successful_referrals}</span>
                            <span className="text-muted-foreground">/{user.total_referrals}</span>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{user.last_login_ip || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={user.is_online ? "default" : "secondary"}>
                              {user.is_online ? "Online" : "Offline"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setNewSlots(String(user.analysis_limit));
                                  setAdjustSlotsDialog(true);
                                }}
                              >
                                Slots
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setSubscriptionExpiry(user.subscription_expires_at || "");
                                  setSubscriptionDialog(true);
                                }}
                              >
                                <Calendar className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>Payment Tracking</CardTitle>
                <CardDescription>View all payments and verify transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Package</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map(payment => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{payment.user_name || "—"}</p>
                            <p className="text-xs text-muted-foreground">{payment.user_identifier}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {payment.payment_method === "usdt" ? "USDT" : payment.payment_method === "paypal" ? "Card" : "M-Pesa"}
                          </Badge>
                        </TableCell>
                        <TableCell>{payment.package_type}</TableCell>
                        <TableCell>
                          {payment.amount_usd ? `$${payment.amount_usd}` : `KES ${payment.amount_kes}`}
                        </TableCell>
                        <TableCell>
                          <Badge variant={payment.status === "pending" ? "secondary" : payment.status === "verified" || payment.status === "completed" ? "default" : "destructive"}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {payment.screenshot_path && (
                              <Button size="sm" variant="outline" onClick={() => handleViewScreenshot(payment.screenshot_path!)}>
                                <Image className="h-4 w-4" />
                              </Button>
                            )}
                            {payment.status === "pending" && (
                              <>
                                <Button size="sm" onClick={() => handleVerifyPayment(payment, true)}>
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleVerifyPayment(payment, false)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {payments.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground">
                          No payments found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Send Notification</CardTitle>
                <CardDescription>Send pop-up notifications to users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={notificationTitle}
                    onChange={e => setNotificationTitle(e.target.value)}
                    placeholder="Notification title"
                  />
                </div>
                <div>
                  <Label>Message</Label>
                  <Textarea
                    value={notificationMessage}
                    onChange={e => setNotificationMessage(e.target.value)}
                    placeholder="Notification message"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Target</Label>
                    <Select value={notificationTarget} onValueChange={setNotificationTarget}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            All Visitors (including non-users)
                          </div>
                        </SelectItem>
                        {users.map(user => (
                          <SelectItem key={user.user_id} value={user.user_id}>
                            {user.name || user.unique_identifier} ({user.unique_identifier})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Duration (seconds, 0 = until dismissed)</Label>
                    <Input
                      value={notificationDuration}
                      onChange={e => setNotificationDuration(e.target.value)}
                      type="number"
                      min="0"
                    />
                  </div>
                </div>
                <Button onClick={handleSendNotification} disabled={sendingNotification} className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  {sendingNotification ? "Sending..." : "Send Notification"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Support Tickets</CardTitle>
                  <CardDescription>User messages and requests</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px]">
                    <div className="p-4 space-y-2">
                      {supportThreads.map(thread => (
                        <div
                          key={thread.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedThread?.id === thread.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                          }`}
                          onClick={() => {
                            setSelectedThread(thread);
                            fetchThreadMessages(thread.id);
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-sm">{thread.subject}</p>
                              <p className="text-xs text-muted-foreground">
                                {thread.user_name || thread.user_identifier}
                              </p>
                            </div>
                            <Badge variant={thread.status === "open" ? "default" : "secondary"}>
                              {thread.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(thread.updated_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                      {supportThreads.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">No support tickets</p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedThread ? selectedThread.subject : "Select a ticket"}
                  </CardTitle>
                  {selectedThread && (
                    <CardDescription>
                      From: {selectedThread.user_name || selectedThread.user_identifier}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  {selectedThread ? (
                    <>
                      <ScrollArea className="h-[280px] px-4">
                        <div className="space-y-3 py-4">
                          {threadMessages.map(msg => (
                            <div
                              key={msg.id}
                              className={`p-3 rounded-lg max-w-[85%] ${
                                msg.sender_id !== selectedThread.user_id
                                  ? 'ml-auto bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm">{msg.message}</p>
                              <p className={`text-xs mt-1 ${
                                msg.sender_id !== selectedThread.user_id ? 'opacity-70' : 'text-muted-foreground'
                              }`}>
                                {new Date(msg.created_at).toLocaleString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      <div className="p-4 border-t flex gap-2">
                        <Input
                          value={replyMessage}
                          onChange={e => setReplyMessage(e.target.value)}
                          placeholder="Type your reply..."
                          onKeyDown={e => e.key === "Enter" && handleAdminReply()}
                        />
                        <Button onClick={handleAdminReply} disabled={!replyMessage.trim()}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="h-[340px] flex items-center justify-center text-muted-foreground">
                      Select a ticket to view messages
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="queries">
            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Queries from Non-Users
                  </CardTitle>
                  <CardDescription>Contact form submissions from website visitors</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px]">
                    <div className="p-4 space-y-2">
                      {contactQueries.map(query => (
                        <div
                          key={query.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedQuery?.id === query.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedQuery(query)}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium text-sm">{query.subject}</p>
                              <p className="text-xs text-muted-foreground">
                                {query.name} • {query.email}
                              </p>
                            </div>
                            <Badge variant={query.status === "pending" ? "secondary" : "default"}>
                              {query.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(query.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                      {contactQueries.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">No contact queries</p>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedQuery ? selectedQuery.subject : "Select a query"}
                  </CardTitle>
                  {selectedQuery && (
                    <CardDescription>
                      From: {selectedQuery.name} ({selectedQuery.email})
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {selectedQuery ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{selectedQuery.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Received: {new Date(selectedQuery.created_at).toLocaleString()}
                        </p>
                      </div>

                      {selectedQuery.admin_response ? (
                        <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                          <p className="text-xs text-primary font-medium mb-1">Your Response:</p>
                          <p className="text-sm whitespace-pre-wrap">{selectedQuery.admin_response}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            Responded: {selectedQuery.responded_at && new Date(selectedQuery.responded_at).toLocaleString()}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Label>Your Response</Label>
                          <Textarea
                            value={queryResponse}
                            onChange={e => setQueryResponse(e.target.value)}
                            placeholder="Type your response to the user..."
                            rows={4}
                          />
                          <Button 
                            onClick={handleRespondToQuery} 
                            disabled={!queryResponse.trim() || sendingQueryResponse}
                            className="w-full"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            {sendingQueryResponse ? "Sending..." : "Send Response"}
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      Select a query to view and respond
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle>Send Email</CardTitle>
                <CardDescription>Send emails to all users or a single recipient</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Recipients</Label>
                  <Select value={emailTargetType} onValueChange={(v: "all" | "single") => setEmailTargetType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users ({users.length} users)</SelectItem>
                      <SelectItem value="single">Single Email Address</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {emailTargetType === "single" && (
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      placeholder="recipient@example.com"
                      value={singleEmailAddress}
                      onChange={e => setSingleEmailAddress(e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Subject *</Label>
                  <Input
                    placeholder="Enter email subject"
                    value={emailSubject}
                    onChange={e => setEmailSubject(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Body *</Label>
                  <Textarea
                    placeholder="Enter email body. Use **text** for bold, *text* for italic, __text__ for underline."
                    value={emailBody}
                    onChange={e => setEmailBody(e.target.value)}
                    rows={10}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Formatting tips: **bold**, *italic*, __underline__. Line breaks will be preserved.
                  </p>
                </div>

                <Button 
                  onClick={handleSendAdminEmail} 
                  disabled={sendingEmail || !emailSubject.trim() || !emailBody.trim()}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendingEmail ? "Sending..." : emailTargetType === "all" ? `Send to All ${users.length} Users` : "Send Email"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signals">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Trading Signals</CardTitle>
                  <CardDescription>Post signals for subscribed users</CardDescription>
                </div>
                <Dialog open={signalDialog} onOpenChange={setSignalDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Send className="h-4 w-4 mr-2" />
                      Post Signal
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Post New Signal</DialogTitle>
                      <DialogDescription>Enter trading signal details</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Symbol *</Label>
                        <Input
                          value={signalSymbol}
                          onChange={e => setSignalSymbol(e.target.value)}
                          placeholder="e.g., EUR/USD, XAU/USD"
                        />
                      </div>
                      <div>
                        <Label>Direction *</Label>
                        <Select value={signalDirection} onValueChange={(v: "long" | "short") => setSignalDirection(v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="long">Long (Buy)</SelectItem>
                            <SelectItem value="short">Short (Sell)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Entry Point *</Label>
                          <Input
                            type="number"
                            step="any"
                            value={signalEntry}
                            onChange={e => setSignalEntry(e.target.value)}
                            placeholder="e.g., 1.0850"
                          />
                        </div>
                        <div>
                          <Label>Stop Loss *</Label>
                          <Input
                            type="number"
                            step="any"
                            value={signalStopLoss}
                            onChange={e => setSignalStopLoss(e.target.value)}
                            placeholder="e.g., 1.0800"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Take Profit *</Label>
                          <Input
                            type="number"
                            step="any"
                            value={signalTakeProfit}
                            onChange={e => setSignalTakeProfit(e.target.value)}
                            placeholder="e.g., 1.0950"
                          />
                        </div>
                        <div>
                          <Label>Risk to Reward *</Label>
                          <Input
                            value={signalRiskReward}
                            onChange={e => setSignalRiskReward(e.target.value)}
                            placeholder="e.g., 1:2"
                          />
                        </div>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <Label className="text-xs text-muted-foreground">Additional Notes (preset):</Label>
                        <p className="text-xs mt-1">{PRESET_NOTES}</p>
                      </div>
                      <Button 
                        onClick={handlePostSignal} 
                        disabled={postingSignal || !signalSymbol || !signalEntry || !signalStopLoss || !signalTakeProfit || !signalRiskReward} 
                        className="w-full"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {postingSignal ? "Posting..." : "Post Signal"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4 p-3 bg-muted rounded-lg">
                  <span className="text-sm">{users.filter(u => u.is_signal_subscriber).length} active signal subscribers</span>
                  <span className="text-sm text-muted-foreground">{adminSignals.length} signals posted</span>
                </div>
                
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {adminSignals.map(signal => (
                      <div key={signal.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">{signal.symbol}</span>
                            <Badge variant={signal.direction === "long" ? "default" : "destructive"}>
                              {signal.direction === "long" ? "LONG" : "SHORT"}
                            </Badge>
                            <Badge 
                              variant={signal.outcome === "win" ? "default" : signal.outcome === "loss" ? "destructive" : "secondary"}
                              className={signal.outcome === "win" ? "bg-green-600" : signal.outcome === "loss" ? "bg-red-600" : ""}
                            >
                              {signal.outcome.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEditSignalDialog(signal)}>
                              Edit
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openOutcomeDialog(signal)}>
                              Outcome
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDeleteSignal(signal.id)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Entry:</span> {signal.entry_price}
                          </div>
                          <div>
                            <span className="text-muted-foreground">SL:</span> {signal.stop_loss}
                          </div>
                          <div>
                            <span className="text-muted-foreground">TP:</span> {signal.take_profit}
                          </div>
                          <div>
                            <span className="text-muted-foreground">R:R:</span> {signal.risk_reward}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(signal.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                    {adminSignals.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No signals posted yet</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Adjust Slots Dialog */}
        <Dialog open={adjustSlotsDialog} onOpenChange={setAdjustSlotsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adjust Analysis Slots</DialogTitle>
              <DialogDescription>
                Update slots for {selectedUser?.name || selectedUser?.unique_identifier}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>New Slot Count</Label>
                <Input
                  value={newSlots}
                  onChange={e => setNewSlots(e.target.value)}
                  type="number"
                  min="0"
                />
              </div>
              <Button onClick={handleAdjustSlots} className="w-full">Update Slots</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Subscription Dialog */}
        <Dialog open={subscriptionDialog} onOpenChange={setSubscriptionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage Subscription</DialogTitle>
              <DialogDescription>
                Update signal subscription for {selectedUser?.name || selectedUser?.unique_identifier}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Subscription Expiry Date</Label>
                <Input
                  type="datetime-local"
                  value={subscriptionExpiry}
                  onChange={e => setSubscriptionExpiry(e.target.value)}
                />
              </div>
              <Button onClick={handleUpdateSubscription} className="w-full">
                Activate/Update Subscription
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Screenshot Dialog */}
        <Dialog open={screenshotDialog} onOpenChange={setScreenshotDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Payment Screenshot</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              <img src={screenshotUrl} alt="Payment proof" className="max-h-[70vh] object-contain rounded-lg" />
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Signal Dialog */}
        <Dialog open={editSignalDialog} onOpenChange={setEditSignalDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Signal</DialogTitle>
              <DialogDescription>Update trading signal details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Symbol *</Label>
                <Input
                  value={signalSymbol}
                  onChange={e => setSignalSymbol(e.target.value)}
                  placeholder="e.g., EUR/USD"
                />
              </div>
              <div>
                <Label>Direction *</Label>
                <Select value={signalDirection} onValueChange={(v: "long" | "short") => setSignalDirection(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="long">Long (Buy)</SelectItem>
                    <SelectItem value="short">Short (Sell)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Entry Point *</Label>
                  <Input
                    type="number"
                    step="any"
                    value={signalEntry}
                    onChange={e => setSignalEntry(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Stop Loss *</Label>
                  <Input
                    type="number"
                    step="any"
                    value={signalStopLoss}
                    onChange={e => setSignalStopLoss(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Take Profit *</Label>
                  <Input
                    type="number"
                    step="any"
                    value={signalTakeProfit}
                    onChange={e => setSignalTakeProfit(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Risk to Reward *</Label>
                  <Input
                    value={signalRiskReward}
                    onChange={e => setSignalRiskReward(e.target.value)}
                  />
                </div>
              </div>
              <Button onClick={handleEditSignal} className="w-full">
                Update Signal
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Outcome Dialog */}
        <Dialog open={outcomeDialog} onOpenChange={setOutcomeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Signal Outcome</DialogTitle>
              <DialogDescription>
                {selectedSignal?.symbol} - {selectedSignal?.direction?.toUpperCase()}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Outcome</Label>
                <Select value={signalOutcome} onValueChange={(v: "win" | "loss" | "pending") => setSignalOutcome(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="win">Win</SelectItem>
                    <SelectItem value="loss">Loss</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Textarea
                  value={outcomeNotes}
                  onChange={e => setOutcomeNotes(e.target.value)}
                  placeholder="Add any notes about the outcome..."
                  rows={3}
                />
              </div>
              <Button onClick={handleUpdateOutcome} className="w-full">
                Update Outcome
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Admin;
