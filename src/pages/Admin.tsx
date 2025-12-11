import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, TrendingDown, Download, Eye } from "lucide-react";
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
import { Users, Bell, CreditCard, UserPlus, Activity, ArrowLeft, Send, Check, X, Image, MessageSquare, TrendingUp, Upload, Calendar } from "lucide-react";

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
  
  // Create user form
  const [createUserDialog, setCreateUserDialog] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserSlots, setNewUserSlots] = useState("5");
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

  // Signal posting
  const [signalDialog, setSignalDialog] = useState(false);
  const [signalImage, setSignalImage] = useState<File | null>(null);
  const [signalTitle, setSignalTitle] = useState("");
  const [signalDescription, setSignalDescription] = useState("");
  const [postingSignal, setPostingSignal] = useState(false);

  // Admin reply
  const [replyMessage, setReplyMessage] = useState("");

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
      .select("user_id, name, phone_number, unique_identifier, last_login_ip, is_signal_subscriber, subscription_expires_at");

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

    const combined = profiles.map(profile => {
      const userSettings = settings?.find(s => s.user_id === profile.user_id);
      const userPresence = presence?.find(p => p.user_id === profile.user_id);
      const userTrades = trades?.filter(t => t.user_id === profile.user_id) || [];
      const slotsUsed = userTrades.length;
      const successfulTrades = userTrades.filter(t => t.outcome === "win").length;
      const totalSlots = userSettings?.analysis_limit || 5;
      
      return {
        ...profile,
        analysis_limit: totalSlots,
        is_online: userPresence?.is_online || false,
        last_seen: userPresence?.last_seen || null,
        slots_used: slotsUsed,
        slots_remaining: Math.max(0, totalSlots - slotsUsed),
        successful_trades: successfulTrades,
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
      setNewUserSlots("5");
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
    if (!signalImage) {
      toast({ title: "Error", description: "Please select an image", variant: "destructive" });
      return;
    }

    setPostingSignal(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = signalImage.name.split('.').pop();
      // Ensure the file path is a valid string, not an empty string
      const filePath = `${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("admin-signals")
        .upload(filePath, signalImage);

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("admin_signals").insert({
        image_path: filePath,
        title: signalTitle || null,
        description: signalDescription || null,
        created_by: user.id,
      });

      if (insertError) throw insertError;

      toast({ title: "Success", description: "Signal posted successfully" });
      setSignalDialog(false);
      setSignalImage(null);
      setSignalTitle("");
      setSignalDescription("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setPostingSignal(false);
    }
  };

  const handleAdminReply = async () => {
    if (!selectedThread || !replyMessage.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // The fix: Removed the subject field as it does not exist in the support_messages table.
      await supabase.from("support_messages").insert({
        thread_id: selectedThread.id,
        sender_id: user.id,
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users, payments, and notifications</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
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
        </div>

        <Tabs defaultValue="requests" className="space-y-4">
          <TabsList className="grid grid-cols-6 w-full max-w-4xl">
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
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
                          <TableCell className="font-mono text-xs">{user.last_login_ip || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={user.is_online ? "default" : "secondary"}>
                              {user.is_online ? "Online" : "Offline"}
                            </Badge>
                            {!user.is_online && user.last_seen && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Last seen: {new Date(user.last_seen).toLocaleTimeString()}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Dialog onOpenChange={setAdjustSlotsDialog}>
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setNewSlots(user.analysis_limit.toString());
                                    }}
                                  >
                                    Slots
                                  </Button>
                                </DialogTrigger>
                                {selectedUser && selectedUser.user_id === user.user_id && (
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Adjust Slots for {selectedUser.name}</DialogTitle>
                                      <DialogDescription>Set the total analysis slots available to the user.</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor="newSlots">Total Slots</Label>
                                        <Input 
                                          id="newSlots"
                                          type="number" 
                                          value={newSlots} 
                                          onChange={e => setNewSlots(e.target.value)} 
                                        />
                                      </div>
                                      <Button onClick={handleAdjustSlots} className="w-full">
                                        Update Slots
                                      </Button>
                                    </div>
                                  </DialogContent>
                                )}
                              </Dialog>

                              <Dialog onOpenChange={setSubscriptionDialog}>
                                <DialogTrigger asChild>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedUser(user);
                                      setSubscriptionExpiry(user.subscription_expires_at ? user.subscription_expires_at.split('T')[0] : "");
                                    }}
                                  >
                                    Sub
                                  </Button>
                                </DialogTrigger>
                                {selectedUser && selectedUser.user_id === user.user_id && (
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Manage Subscription for {selectedUser.name}</DialogTitle>
                                      <DialogDescription>Mark user as subscriber and set expiry date.</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor="expiryDate">Subscription Expiry Date</Label>
                                        <Input 
                                          id="expiryDate"
                                          type="date" 
                                          value={subscriptionExpiry} 
                                          onChange={e => setSubscriptionExpiry(e.target.value)} 
                                        />
                                      </div>
                                      <Button onClick={handleUpdateSubscription} className="w-full">
                                        Update Subscription
                                      </Button>
                                    </div>
                                  </DialogContent>
                                )}
                              </Dialog>
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
                <CardTitle>Payment Verification</CardTitle>
                <CardDescription>Review and verify all pending payments (M-Pesa, USDT, etc.)</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Slots</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map(payment => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {payment.user_name}
                          <span className="ml-2 font-mono text-xs text-muted-foreground">{payment.user_identifier}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{payment.payment_method?.toUpperCase() || "M-PESA"}</Badge>
                        </TableCell>
                        <TableCell>
                          {payment.amount_kes ? `KES ${payment.amount_kes.toLocaleString()}` : (
                            payment.amount_usd ? `USD ${payment.amount_usd.toLocaleString()}` : "N/A"
                          )}
                        </TableCell>
                        <TableCell>{payment.analysis_slots}</TableCell>
                        <TableCell>
                          <Badge variant={payment.status === "pending" ? "default" : payment.status === "verified" || payment.status === "completed" ? "secondary" : "destructive"}>
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {payment.screenshot_path && (
                              <Button size="sm" variant="outline" onClick={() => handleViewScreenshot(payment.screenshot_path!)}>
                                <Eye className="h-4 w-4" />
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
                          No payment records found
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
                <CardTitle>Send Global/Targeted Notification</CardTitle>
                <CardDescription>Send an in-app notification to all users or a specific user.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="notificationTitle">Title</Label>
                    <Input id="notificationTitle" value={notificationTitle} onChange={e => setNotificationTitle(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="notificationTarget">Target</Label>
                    <Select value={notificationTarget} onValueChange={setNotificationTarget}>
                      <SelectTrigger id="notificationTarget">
                        <SelectValue placeholder="Select target" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        {users.map(user => (
                          <SelectItem key={user.user_id} value={user.user_id}>{user.name} ({user.unique_identifier})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="notificationMessage">Message</Label>
                  <Textarea id="notificationMessage" value={notificationMessage} onChange={e => setNotificationMessage(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="notificationDuration">Display Duration (seconds)</Label>
                  <Input id="notificationDuration" type="number" value={notificationDuration} onChange={e => setNotificationDuration(e.target.value)} />
                </div>
                <Button onClick={handleSendNotification} disabled={sendingNotification} className="w-full">
                  {sendingNotification ? "Sending..." : "Send Notification"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Support Threads</CardTitle>
                    <CardDescription>Active and closed support conversations</CardDescription>
                  </CardHeader>
                  <ScrollArea className="h-[600px]">
                    <div className="divide-y">
                      {supportThreads.map(thread => (
                        <div
                          key={thread.id}
                          className={`p-4 cursor-pointer hover:bg-muted/50 ${selectedThread?.id === thread.id ? 'bg-muted' : ''}`}
                          onClick={() => {
                            setSelectedThread(thread);
                            fetchThreadMessages(thread.id);
                          }}
                        >
                          <div className="flex justify-between items-center">
                            <p className="font-semibold">{thread.subject}</p>
                            <Badge variant={thread.status === 'open' ? 'default' : 'secondary'}>
                              {thread.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {thread.user_name || "Unknown User"} ({thread.user_identifier})
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Last update: {new Date(thread.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </Card>
              </div>

              <div className="md:col-span-2">
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <CardTitle>
                      {selectedThread ? `Thread: ${selectedThread.subject}` : "Select a Thread"}
                    </CardTitle>
                    <CardDescription>
                      {selectedThread ? `User: ${selectedThread.user_name} (${selectedThread.user_identifier})` : "Conversation history will appear here"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    {selectedThread ? (
                      <>
                        <ScrollArea className="h-[400px] mb-4 p-4 border rounded-md">
                          <div className="space-y-4">
                            {threadMessages.map(message => (
                              <div key={message.id} className={`flex ${message.sender_id === selectedThread.user_id ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-xs p-3 rounded-lg ${message.sender_id === selectedThread.user_id ? 'bg-secondary text-secondary-foreground' : 'bg-primary text-primary-foreground'}`}>
                                  <p className="text-sm">{message.message}</p>
                                  <p className="text-xs mt-1 opacity-70">
                                    {message.sender_id === selectedThread.user_id ? selectedThread.user_name : "Admin"} - {new Date(message.created_at).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>

                        <div className="flex gap-2">
                          <Input
                            placeholder="Type your reply..."
                            value={replyMessage}
                            onChange={e => setReplyMessage(e.target.value)}
                            onKeyPress={e => e.key === 'Enter' && handleAdminReply()}
                          />
                          <Button onClick={handleAdminReply}>
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        Select a thread to view messages.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="signals">
            <Card>
              <CardHeader>
                <CardTitle>Post New Signal</CardTitle>
                <CardDescription>Share a new trading signal with subscribers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="signalTitle">Title (Optional)</Label>
                  <Input id="signalTitle" value={signalTitle} onChange={e => setSignalTitle(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="signalDescription">Description (Optional)</Label>
                  <Textarea id="signalDescription" value={signalDescription} onChange={e => setSignalDescription(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="signalImage">Signal Image</Label>
                  <Input 
                    id="signalImage" 
                    type="file" 
                    accept="image/*"
                    onChange={e => setSignalImage(e.target.files ? e.target.files[0] : null)}
                  />
                </div>
                <Button onClick={handlePostSignal} disabled={postingSignal || !signalImage} className="w-full">
                  {postingSignal ? "Posting..." : "Post Signal"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={screenshotDialog} onOpenChange={setScreenshotDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Payment Screenshot</DialogTitle>
            <DialogDescription>Proof of payment uploaded by the user.</DialogDescription>
          </DialogHeader>
          {screenshotUrl ? (
            <img src={screenshotUrl} alt="Payment Screenshot" className="max-w-full h-auto" />
          ) : (
            <p>Loading screenshot...</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
