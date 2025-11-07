import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

interface Teacher {
  id: string;
  teacher_id: string;
  user_id: string;
  date_of_birth: string | null;
  gender: string | null;
  qualification: string | null;
  specialization: string | null;
  address: string | null;
  profiles: { full_name: string; email: string } | null;
}

const TeachersManagement = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from("teachers")
        .select("*, profiles!teachers_user_id_fkey(full_name, email)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTeachers(data as any || []);
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teachers Management</CardTitle>
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
              {teachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell>{teacher.teacher_id}</TableCell>
                  <TableCell>{teacher.profiles?.full_name || "N/A"}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeachersManagement;
