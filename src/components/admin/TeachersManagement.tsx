import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

interface Profile {
  id: string;
  full_name: string;
  email: string;
}

interface Teacher {
  id: string;
  teacher_id: string;
  user_id: string;
  date_of_birth: string | null;
  gender: string | null;
  qualification: string | null;
  specialization: string | null;
  address: string | null;
  profile?: Profile;
}

const TeachersManagement = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const fetchTeachers = async () => {
    try {
      const [teachersRes, profilesRes] = await Promise.all([
        supabase.from("teachers").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, full_name, email"),
      ]);

      if (teachersRes.error) throw teachersRes.error;
      if (profilesRes.error) throw profilesRes.error;

      // Map profiles by id for quick lookup
      const profilesMap = new Map(profilesRes.data?.map(p => [p.id, p]) || []);
      
      // Join teachers with profiles manually
      const teachersWithProfiles = (teachersRes.data || []).map(teacher => ({
        ...teacher,
        profile: profilesMap.get(teacher.user_id)
      }));

      setTeachers(teachersWithProfiles);
      setProfiles(profilesRes.data || []);
    } catch (error: any) {
      toast.error("Failed to fetch teachers: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();

    const channel = supabase
      .channel("teachers-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "teachers" }, () => {
        fetchTeachers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Get profiles that are not already teachers
  const getAvailableProfiles = () => {
    const teacherUserIds = new Set(teachers.map(t => t.user_id));
    return profiles.filter(p => !teacherUserIds.has(p.id));
  };

  const handleSave = async (formData: FormData) => {
    try {
      const genderValue = formData.get("gender") as string;
      const data: any = {
        teacher_id: formData.get("teacher_id") as string,
        date_of_birth: formData.get("date_of_birth") as string || null,
        gender: genderValue && ["male", "female", "other"].includes(genderValue) ? genderValue : null,
        qualification: formData.get("qualification") as string || null,
        specialization: formData.get("specialization") as string || null,
        address: formData.get("address") as string || null,
      };

      if (editingTeacher) {
        const { error } = await supabase.from("teachers").update(data).eq("id", editingTeacher.id);
        if (error) throw error;
        toast.success("Teacher updated successfully");
      }

      setIsDialogOpen(false);
      setEditingTeacher(null);
    } catch (error: any) {
      toast.error("Failed to save: " + error.message);
    }
  };

  const handleAddTeacher = async (formData: FormData) => {
    try {
      if (!selectedUserId) {
        toast.error("Please select a user");
        return;
      }

      const genderValue = formData.get("gender") as string;
      const validGender = genderValue && ["male", "female", "other"].includes(genderValue) 
        ? genderValue as "male" | "female" | "other" 
        : undefined;
      
      const data = {
        user_id: selectedUserId,
        teacher_id: formData.get("teacher_id") as string,
        date_of_birth: formData.get("date_of_birth") as string || undefined,
        gender: validGender,
        qualification: formData.get("qualification") as string || undefined,
        specialization: formData.get("specialization") as string || undefined,
        address: formData.get("address") as string || undefined,
      };

      const { error } = await supabase.from("teachers").insert([data]);
      if (error) throw error;

      // Also assign the teacher role to this user
      const { error: roleError } = await supabase.from("user_roles").insert([{
        user_id: selectedUserId,
        role: "teacher" as const,
      }]);

      if (roleError && !roleError.message.includes("duplicate")) {
        console.error("Failed to assign teacher role:", roleError);
      }

      toast.success("Teacher added successfully");
      setIsAddDialogOpen(false);
      setSelectedUserId("");
    } catch (error: any) {
      toast.error("Failed to add teacher: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this teacher?")) return;

    try {
      const { error } = await supabase.from("teachers").delete().eq("id", id);
      if (error) throw error;
      toast.success("Teacher deleted successfully");
    } catch (error: any) {
      toast.error("Failed to delete: " + error.message);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  const availableProfiles = getAvailableProfiles();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Teachers Management</CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Teacher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Teacher</DialogTitle>
              <DialogDescription>
                Select a user and fill in their teacher details.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleAddTeacher(new FormData(e.currentTarget)); }} className="space-y-4">
              <div>
                <Label>Select User *</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProfiles.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        No available users. All users are already teachers.
                      </div>
                    ) : (
                      availableProfiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.full_name} ({profile.email})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Teacher ID *</Label>
                <Input name="teacher_id" placeholder="e.g., TCH001" required />
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Input name="date_of_birth" type="date" />
              </div>
              <div>
                <Label>Gender</Label>
                <Select name="gender">
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Qualification</Label>
                <Input name="qualification" placeholder="e.g., M.Ed, B.Sc" />
              </div>
              <div>
                <Label>Specialization</Label>
                <Input name="specialization" placeholder="e.g., Mathematics, Science" />
              </div>
              <div>
                <Label>Address</Label>
                <Input name="address" placeholder="Enter address" />
              </div>
              <Button type="submit" className="w-full" disabled={!selectedUserId}>
                Add Teacher
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Teacher ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Qualification</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No teachers found. Click "Add Teacher" to add one.
                  </TableCell>
                </TableRow>
              ) : (
                teachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell>{teacher.teacher_id}</TableCell>
                    <TableCell>{teacher.profile?.full_name || "N/A"}</TableCell>
                    <TableCell>{teacher.specialization || "N/A"}</TableCell>
                    <TableCell>{teacher.qualification || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog open={isDialogOpen && editingTeacher?.id === teacher.id} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingTeacher(null); }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setEditingTeacher(teacher)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Teacher</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={(e) => { e.preventDefault(); handleSave(new FormData(e.currentTarget)); }} className="space-y-4">
                              <div>
                                <Label>Teacher ID</Label>
                                <Input name="teacher_id" defaultValue={teacher.teacher_id} required />
                              </div>
                              <div>
                                <Label>Date of Birth</Label>
                                <Input name="date_of_birth" type="date" defaultValue={teacher.date_of_birth || ""} />
                              </div>
                              <div>
                                <Label>Gender</Label>
                                <Select name="gender" defaultValue={teacher.gender || ""}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Qualification</Label>
                                <Input name="qualification" defaultValue={teacher.qualification || ""} />
                              </div>
                              <div>
                                <Label>Specialization</Label>
                                <Input name="specialization" defaultValue={teacher.specialization || ""} />
                              </div>
                              <div>
                                <Label>Address</Label>
                                <Input name="address" defaultValue={teacher.address || ""} />
                              </div>
                              <Button type="submit" className="w-full">Save Changes</Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(teacher.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeachersManagement;
