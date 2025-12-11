import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Send, MessageSquare, Paperclip, X, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
}

interface SupportThread {
  id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface SupportMessage {
  id: string;
  message: string;
  sender_id: string;
  attachment_path: string | null;
  attachment_type: string | null;
  created_at: string;
}

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsPanel = ({ isOpen, onClose }: NotificationsPanelProps) => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<SupportThread | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Contact admin form
  const [showContactForm, setShowContactForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      fetchThreads();
      getCurrentUser();
    }
  }, [isOpen]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: allNotifications } = await supabase
      .from("admin_notifications")
      .select("*")
      .or(`is_global.eq.true,target_user_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    const { data: readNotifications } = await supabase
      .from("notification_reads")
      .select("notification_id")
      .eq("user_id", user.id);

    const readIds = new Set(readNotifications?.map(r => r.notification_id) || []);
    
    const notificationsWithReadStatus = allNotifications?.map(n => ({
      ...n,
      is_read: readIds.has(n.id)
    })) || [];

    setNotifications(notificationsWithReadStatus);
  };

  const fetchThreads = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("support_threads")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    setThreads(data || []);
  };

  const fetchMessages = async (threadId: string) => {
    const { data } = await supabase
      .from("support_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    setMessages(data || []);
  };

  const markAsRead = async (notificationId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("notification_reads").insert({
      notification_id: notificationId,
      user_id: user.id,
    });

    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast({ title: "Error", description: "Please fill in subject and message", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Create thread
      const { data: thread, error: threadError } = await supabase
        .from("support_threads")
        .insert({
          user_id: user.id,
          subject: subject.trim(),
        })
        .select()
        .single();

      if (threadError) throw threadError;

      // Upload attachment if exists
      let attachmentPath = null;
      let attachmentType = null;
      if (attachment) {
        const fileExt = attachment.name.split('.').pop();
        const filePath = `${user.id}/${thread.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("support-attachments")
          .upload(filePath, attachment);

        if (!uploadError) {
          attachmentPath = filePath;
          attachmentType = attachment.type;
        }
      }

      // Create message
      // FIX: Removed 'subject' from support_messages insertion
      await supabase.from("support_messages").insert({
        thread_id: thread.id,
        sender_id: user.id,
        message: message.trim(),
        attachment_path: attachmentPath,
        attachment_type: attachmentType,
      });

      toast({ title: "Message Sent", description: "Admin will respond to your message soon." });
      setShowContactForm(false);
      setSubject("");
      setMessage("");
      setAttachment(null);
      fetchThreads();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleReply = async (threadId: string, replyMessage: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // FIX: Removed 'subject' from support_messages insertion
    await supabase.from("support_messages").insert({
      thread_id: threadId,
      sender_id: user.id,
      message: replyMessage,
    });

    await supabase
      .from("support_threads")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", threadId);

    fetchMessages(threadId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Notifications</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {selectedThread ? (
          <ThreadView
            thread={selectedThread}
            messages={messages}
            currentUserId={currentUserId}
            onBack={() => setSelectedThread(null)}
            onReply={handleReply}
          />
        ) : (
          <div className="flex-1 overflow-hidden grid md:grid-cols-2 gap-6">
            {/* Admin Notifications */}
            <Card className="flex flex-col overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">Admin Messages</CardTitle>
                <CardDescription>Notifications from the admin</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-[300px] px-6">
                  {notifications.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No notifications</p>
                  ) : (
                    <div className="space-y-3 pb-4">
                      {notifications.map(notification => (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-lg border ${notification.is_read ? 'bg-muted/30' : 'bg-primary/5 border-primary/20'}`}
                          onClick={() => !notification.is_read && markAsRead(notification.id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            {!notification.is_read && (
                              <Badge variant="default" className="text-xs">New</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Support Threads */}
            <Card className="flex flex-col overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div>
                  <CardTitle className="text-lg">Support Conversations</CardTitle>
                  <CardDescription>Your messages with admin</CardDescription>
                </div>
                <Dialog open={showContactForm} onOpenChange={setShowContactForm}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact Admin
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Contact Admin</DialogTitle>
                      <DialogDescription>Send a message to the administrator</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSendMessage} className="space-y-4">
                      <div>
                        <Label>Subject *</Label>
                        <Input
                          value={subject}
                          onChange={e => setSubject(e.target.value)}
                          placeholder="What's this about?"
                          required
                        />
                      </div>
                      <div>
                        <Label>Message *</Label>
                        <Textarea
                          value={message}
                          onChange={e => setMessage(e.target.value)}
                          placeholder="Describe your issue or question..."
                          rows={4}
                          required
                        />
                      </div>
                      <div>
                        <Label>Attachment (optional)</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            type="file"
                            accept="image/*,application/pdf,video/*"
                            onChange={e => setAttachment(e.target.files?.[0] || null)}
                            className="flex-1"
                          />
                          {attachment && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setAttachment(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Accepts images, PDFs, and videos
                        </p>
                      </div>
                      <Button type="submit" className="w-full" disabled={sending}>
                        <Send className="h-4 w-4 mr-2" />
                        {sending ? "Sending..." : "Send Message"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-[300px] px-6">
                  {threads.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No conversations yet</p>
                  ) : (
                    <div className="space-y-3 pb-4">
                      {threads.map(thread => (
                        <div
                          key={thread.id}
                          className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedThread(thread);
                            fetchMessages(thread.id);
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-sm">{thread.subject}</h4>
                            <Badge variant={thread.status === "open" ? "default" : "secondary"}>
                              {thread.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Updated: {new Date(thread.updated_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

// Thread view component
const ThreadView = ({ 
  thread, 
  messages, 
  currentUserId,
  onBack, 
  onReply 
}: { 
  thread: SupportThread;
  messages: SupportMessage[];
  currentUserId: string | null;
  onBack: () => void;
  onReply: (threadId: string, message: string) => void;
}) => {
  const [replyMessage, setReplyMessage] = useState("");
  // Note: Attachment handling is not fully implemented in the reply part of the original code, 
  // so we leave it out here for simplicity and focus on the main fix.
  // const [attachment, setAttachment] = useState<File | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    onReply(thread.id, replyMessage);
    setReplyMessage("");
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="font-semibold">{thread.subject}</h2>
          <p className="text-sm text-muted-foreground">
            Started: {new Date(thread.created_at).toLocaleString()}
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-4 pb-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`p-3 rounded-lg max-w-[80%] ${
                msg.sender_id === currentUserId 
                  ? 'ml-auto bg-primary text-primary-foreground' 
                  : 'bg-muted'
              }`}
            >
              <p className="text-sm">{msg.message}</p>
              {msg.attachment_path && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-xs">
                    <Paperclip className="h-3 w-3 mr-1" />
                    Attachment
                  </Badge>
                </div>
              )}
              <p className={`text-xs mt-1 ${msg.sender_id === currentUserId ? 'opacity-70' : 'text-muted-foreground'}`}>
                {new Date(msg.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <Input
          value={replyMessage}
          onChange={e => setReplyMessage(e.target.value)}
          placeholder="Type your reply..."
          className="flex-1"
        />
        <Button type="submit" disabled={!replyMessage.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};
