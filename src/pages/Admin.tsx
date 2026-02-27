import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { 
  Users, 
  Shield, 
  TrendingUp, 
  UserPlus, 
  Search,
  CheckCircle,
  XCircle,
  Crown,
  Target,
  BarChart3,
  Mail,
  Phone,
  Calendar
} from "lucide-react";

interface UserWithRole {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  role: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}

interface Signal {
  id: string;
  provider_id: string;
  provider_email: string;
  currency_pair: string;
  signal_type: "BUY" | "SELL";
  signal_visibility: "free" | "subscribers" | "both";
  outcome: "pending" | "win" | "loss" | "breakeven" | null;
  created_at: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, loading: checkingAdmin } = useAdminCheck();
  
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Role assignment dialog
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");
  
  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    signalProviders: 0,
    admins: 0,
    totalSignals: 0,
    pendingSignals: 0,
    completedSignals: 0,
  });

  useEffect(() => {
    if (!checkingAdmin && !isAdmin) {
      navigate("/");
      toast({
        title: "Access Denied",
        description: "You don't have admin permissions.",
        variant: "destructive",
      });
    }
  }, [isAdmin, checkingAdmin, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchSignals();
      fetchStats();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      // Fetch users with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*");

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");

      if (rolesError) throw rolesError;

      // Merge profiles with roles
      const usersWithRoles = (profiles || []).map((profile: any) => {
        const userRole = roles?.find((r: any) => r.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role || null,
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users.",
        variant: "destructive",
      });
    }
  };

  const fetchSignals = async () => {
    try {
      const { data, error } = await supabase
        .from("signals")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      // Get provider emails
      const providerIds = [...new Set((data || []).map((s: any) => s.provider_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", providerIds);

      const signalsWithEmails = (data || []).map((signal: any) => ({
        ...signal,
        provider_email: profiles?.find((p: any) => p.id === signal.provider_id)?.email || "Unknown",
      }));

      setSignals(signalsWithEmails);
    } catch (error) {
      console.error("Error fetching signals:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: roles } = await supabase.from("user_roles").select("role");
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      
      const { count: totalSignals } = await supabase
        .from("signals")
        .select("*", { count: "exact", head: true });
      
      const { count: pendingSignals } = await supabase
        .from("signals")
        .select("*", { count: "exact", head: true })
        .eq("outcome", "pending");

      setStats({
        totalUsers: totalUsers || 0,
        signalProviders: roles?.filter((r: any) => r.role === "signal_provider").length || 0,
        admins: roles?.filter((r: any) => r.role === "admin").length || 0,
        totalSignals: totalSignals || 0,
        pendingSignals: pendingSignals || 0,
        completedSignals: (totalSignals || 0) - (pendingSignals || 0),
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const assignRole = async () => {
    if (!selectedUser || !selectedRole) return;

    try {
      // Check if user already has a role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", selectedUser.id)
        .maybeSingle();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update({ role: selectedRole })
          .eq("user_id", selectedUser.id);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from("user_roles")
          .insert({
            user_id: selectedUser.id,
            role: selectedRole,
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Role updated to ${selectedRole} for ${selectedUser.email}`,
      });

      setShowRoleDialog(false);
      setSelectedUser(null);
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error("Error assigning role:", error);
      toast({
        title: "Error",
        description: "Failed to assign role.",
        variant: "destructive",
      });
    }
  };

  const removeRole = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Role removed successfully.",
      });

      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error("Error removing role:", error);
      toast({
        title: "Error",
        description: "Failed to remove role.",
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-500"><Shield className="w-3 h-3 mr-1" /> Admin</Badge>;
      case "signal_provider":
        return <Badge className="bg-purple-500"><Target className="w-3 h-3 mr-1" /> Signal Provider</Badge>;
      default:
        return <Badge variant="outline"><Users className="w-3 h-3 mr-1" /> User</Badge>;
    }
  };

  const filteredUsers = users.filter((user) =>
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (checkingAdmin || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage users, roles, and signals
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <div className="text-xs text-muted-foreground">Total Users</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-purple-500">{stats.signalProviders}</div>
              <div className="text-xs text-muted-foreground">Signal Providers</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-500">{stats.admins}</div>
              <div className="text-xs text-muted-foreground">Admins</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.totalSignals}</div>
              <div className="text-xs text-muted-foreground">Total Signals</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-500">{stats.pendingSignals}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-500">{stats.completedSignals}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="signals">
              <BarChart3 className="w-4 h-4 mr-2" />
              All Signals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>
                      Manage user roles and permissions
                    </CardDescription>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full md:w-80"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {user.first_name} {user.last_name}
                              </div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {user.phone_number && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Phone className="w-3 h-3 mr-1" />
                                  {user.phone_number}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(user.created_at).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setSelectedRole(user.role || "signal_provider");
                                  setShowRoleDialog(true);
                                }}
                              >
                                <Crown className="w-3 h-3 mr-1" />
                                {user.role ? "Change Role" : "Assign Role"}
                              </Button>
                              {user.role && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeRole(user.id)}
                                >
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Remove
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signals" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Signals</CardTitle>
                <CardDescription>
                  View and manage all signals from providers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Signal</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Visibility</TableHead>
                        <TableHead>Outcome</TableHead>
                        <TableHead>Posted</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {signals.map((signal) => (
                        <TableRow key={signal.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{signal.currency_pair}</span>
                              <Badge
                                variant={signal.signal_type === "BUY" ? "default" : "destructive"}
                              >
                                {signal.signal_type}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{signal.provider_email}</div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                signal.signal_visibility === "free"
                                  ? "default"
                                  : signal.signal_visibility === "subscribers"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {signal.signal_visibility}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                signal.outcome === "win"
                                  ? "default"
                                  : signal.outcome === "loss"
                                  ? "destructive"
                                  : "outline"
                              }
                            >
                              {signal.outcome || "pending"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(signal.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Role Assignment Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <>
                  Assign a role to <strong>{selectedUser.email}</strong>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="signal_provider">
                    <div className="flex items-center">
                      <Target className="w-4 h-4 mr-2 text-purple-500" />
                      Signal Provider - Can post free and subscriber signals
                    </div>
                  </SelectItem>
                  <SelectItem value="admin">
                    <div className="flex items-center">
                      <Shield className="w-4 h-4 mr-2 text-red-500" />
                      Admin - Full access to all features
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-muted p-3 rounded text-sm">
              <strong>Signal Provider:</strong> Can create and manage trading signals.
              Signals can be published as free (visible to everyone), subscribers only,
              or both. Provider can update signal outcomes.
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={assignRole}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Assign Role
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;
