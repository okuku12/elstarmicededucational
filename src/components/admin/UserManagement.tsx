import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { UserCog, Shield, GraduationCap, User, Users } from "lucide-react";

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: "admin" | "teacher" | "student";
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkRole, setBulkRole] = useState<string>("");

  const fetchData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
      ]);

      if (usersRes.error) throw usersRes.error;
      if (rolesRes.error) throw rolesRes.error;

      setUsers(usersRes.data || []);
      setUserRoles(rolesRes.data || []);
    } catch (error: any) {
      toast.error("Failed to fetch users: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const rolesChannel = supabase
      .channel("user-roles-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(rolesChannel);
    };
  }, []);

  const getUserRoles = (userId: string) => {
    return userRoles.filter((role) => role.user_id === userId).map((role) => role.role);
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) {
      toast.error("Please select a user and role");
      return;
    }

    try {
      // Check if user already has this role
      const existingRole = userRoles.find(
        (role) => role.user_id === selectedUser.id && role.role === selectedRole
      );

      if (existingRole) {
        toast.info("User already has this role");
        setIsDialogOpen(false);
        return;
      }

      const { error } = await supabase.from("user_roles").insert({
        user_id: selectedUser.id,
        role: selectedRole as "admin" | "teacher" | "student",
      });

      if (error) throw error;
      toast.success(`${selectedRole} role assigned successfully`);
      setIsDialogOpen(false);
      setSelectedUser(null);
      setSelectedRole("");
    } catch (error: any) {
      toast.error("Failed to assign role: " + error.message);
    }
  };

  const handleRemoveRole = async (userId: string, roleId: string) => {
    if (!confirm("Are you sure you want to remove this role?")) return;

    try {
      const { error } = await supabase.from("user_roles").delete().eq("id", roleId);

      if (error) throw error;
      toast.success("Role removed successfully");
    } catch (error: any) {
      toast.error("Failed to remove role: " + error.message);
    }
  };

  const handleBulkAssign = async () => {
    if (selectedUsers.size === 0 || !bulkRole) {
      toast.error("Please select users and a role");
      return;
    }

    try {
      const usersToAssign = Array.from(selectedUsers);
      
      // Filter out users who already have this role
      const usersNeedingRole = usersToAssign.filter((userId) => {
        const existingRole = userRoles.find(
          (role) => role.user_id === userId && role.role === bulkRole
        );
        return !existingRole;
      });

      if (usersNeedingRole.length === 0) {
        toast.info("All selected users already have this role");
        setIsBulkDialogOpen(false);
        return;
      }

      // Prepare bulk insert data
      const roleAssignments = usersNeedingRole.map((userId) => ({
        user_id: userId,
        role: bulkRole as "admin" | "teacher" | "student",
      }));

      const { error } = await supabase.from("user_roles").insert(roleAssignments);

      if (error) throw error;

      toast.success(
        `Successfully assigned ${bulkRole} role to ${usersNeedingRole.length} user(s)`
      );
      setIsBulkDialogOpen(false);
      setSelectedUsers(new Set());
      setBulkRole("");
    } catch (error: any) {
      toast.error("Failed to assign roles: " + error.message);
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map((u) => u.id)));
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Shield className="h-4 w-4" />;
      case "teacher":
        return <GraduationCap className="h-4 w-4" />;
      case "student":
        return <User className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getRoleVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (role) {
      case "admin":
        return "destructive";
      case "teacher":
        return "default";
      case "student":
        return "secondary";
      default:
        return "outline";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>User Management</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Assign and manage user roles for access control
          </p>
        </div>
        {selectedUsers.size > 0 && (
          <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Users className="h-4 w-4 mr-2" />
                Bulk Assign ({selectedUsers.size})
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Assign Role</DialogTitle>
                <DialogDescription>
                  Assign a role to {selectedUsers.size} selected user(s)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Role</label>
                  <Select value={bulkRole} onValueChange={setBulkRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a role to assign" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Admin - Full system access
                        </div>
                      </SelectItem>
                      <SelectItem value="teacher">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          Teacher - Manage classes and students
                        </div>
                      </SelectItem>
                      <SelectItem value="student">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Student - Access to assignments and grades
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm font-medium mb-2">Selected Users:</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {users
                      .filter((u) => selectedUsers.has(u.id))
                      .map((user) => (
                        <div key={user.id} className="text-sm text-muted-foreground">
                          • {user.full_name} ({user.email})
                        </div>
                      ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleBulkAssign} className="flex-1">
                    Assign Role to All
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedUsers(new Set());
                      setIsBulkDialogOpen(false);
                    }}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedUsers.size === users.length && users.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Current Roles</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const roles = getUserRoles(user.id);
                const userRoleObjects = userRoles.filter((role) => role.user_id === user.id);

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.has(user.id)}
                        onCheckedChange={() => toggleUserSelection(user.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex gap-2 flex-wrap">
                        {roles.length > 0 ? (
                          roles.map((role, idx) => {
                            const roleObj = userRoleObjects.find((r) => r.role === role);
                            return (
                              <Badge
                                key={idx}
                                variant={getRoleVariant(role)}
                                className="flex items-center gap-1"
                              >
                                {getRoleIcon(role)}
                                {role}
                                <button
                                  onClick={() => roleObj && handleRemoveRole(user.id, roleObj.id)}
                                  className="ml-1 hover:text-destructive"
                                  title="Remove role"
                                >
                                  ×
                                </button>
                              </Badge>
                            );
                          })
                        ) : (
                          <Badge variant="outline">No roles assigned</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Dialog
                        open={isDialogOpen && selectedUser?.id === user.id}
                        onOpenChange={(open) => {
                          setIsDialogOpen(open);
                          if (!open) {
                            setSelectedUser(null);
                            setSelectedRole("");
                          }
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            <UserCog className="h-4 w-4 mr-2" />
                            Assign Role
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Assign Role to {user.full_name}</DialogTitle>
                            <DialogDescription>
                              Select a role to assign to this user. Users can have multiple roles.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <label className="text-sm font-medium">Select Role</label>
                              <Select value={selectedRole} onValueChange={setSelectedRole}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose a role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">
                                    <div className="flex items-center gap-2">
                                      <Shield className="h-4 w-4" />
                                      Admin - Full system access
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="teacher">
                                    <div className="flex items-center gap-2">
                                      <GraduationCap className="h-4 w-4" />
                                      Teacher - Manage classes and students
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="student">
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4" />
                                      Student - Access to assignments and grades
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="bg-muted p-3 rounded-md">
                              <p className="text-sm text-muted-foreground">
                                <strong>Current roles:</strong>{" "}
                                {roles.length > 0 ? roles.join(", ") : "None"}
                              </p>
                            </div>

                            <Button onClick={handleAssignRole} className="w-full">
                              Assign Role
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
