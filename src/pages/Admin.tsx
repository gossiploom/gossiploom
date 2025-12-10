import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield } from "lucide-react";

// Admin page - disabled until required database tables are created
// Required tables: account_requests, user_presence, pending_payments, usdt_payments, 
// support_threads, support_messages, gossip_posts, gossip_comments, signal_posts

const Admin = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>
              The admin dashboard is currently being developed.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground text-sm mb-4">
              The following database tables need to be created before this feature can be used:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• user_roles (for admin access control)</li>
              <li>• account_requests</li>
              <li>• user_presence</li>
              <li>• pending_payments / usdt_payments</li>
              <li>• support_threads / support_messages</li>
              <li>• admin_notifications / notification_reads</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
