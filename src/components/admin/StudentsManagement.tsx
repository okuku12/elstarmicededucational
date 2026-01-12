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
import { Pencil, Plus, Trash2 } from "lucide-react";

interface Profile {
  id: string;
  full_name: string;
  email: string;
}

interface Student {
  id: string;
  student_id: string;
  user_id: string;
  class_id: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  parent_email: string | null;
  profile?: Profile;
}

interface Class {
  id: string;
  name: string;
  grade_level: number;
  section: string | null;
}

const StudentsManagement = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [studentsRes, classesRes, profilesRes] = await Promise.all([
        supabase.from("students").select("*").order("created_at", { ascending: false }),
        supabase.from("classes").select("*").order("grade_level", { ascending: true }),
        supabase.from("profiles").select("id, full_name, email"),
      ]);

      if (studentsRes.error) throw studentsRes.error;
      if (classesRes.error) throw classesRes.error;
      if (profilesRes.error) throw profilesRes.error;

      // Map profiles by id for quick lookup
      const profilesMap = new Map(profilesRes.data?.map(p => [p.id, p]) || []);
      
      // Join students with profiles manually
      const studentsWithProfiles = (studentsRes.data || []).map(student => ({
        ...student,
        profile: profilesMap.get(student.user_id)
      }));

      setStudents(studentsWithProfiles);
      setClasses(classesRes.data || []);
    } catch (error: any) {
      toast.error("Failed to fetch data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("students-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "students" }, () => {
        fetchData();
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
        student_id: formData.get("student_id") as string,
        class_id: formData.get("class_id") as string || null,
        date_of_birth: formData.get("date_of_birth") as string || null,
        gender: genderValue && ["male", "female", "other"].includes(genderValue) ? genderValue : null,
        address: formData.get("address") as string || null,
        parent_name: formData.get("parent_name") as string || null,
        parent_phone: formData.get("parent_phone") as string || null,
        parent_email: formData.get("parent_email") as string || null,
      };

      if (editingStudent) {
        const { error } = await supabase.from("students").update(data).eq("id", editingStudent.id);
        if (error) throw error;
        toast.success("Student updated successfully");
      }

      setIsDialogOpen(false);
      setEditingStudent(null);
    } catch (error: any) {
      toast.error("Failed to save: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return;

    try {
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (error) throw error;
      toast.success("Student deleted successfully");
    } catch (error: any) {
      toast.error("Failed to delete: " + error.message);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Students Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>{student.student_id}</TableCell>
                  <TableCell>{student.profile?.full_name || "N/A"}</TableCell>
                  <TableCell>{classes.find((c) => c.id === student.class_id)?.name || "Not assigned"}</TableCell>
                  <TableCell>{student.parent_name || "N/A"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog open={isDialogOpen && editingStudent?.id === student.id} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingStudent(null); }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setEditingStudent(student)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Student</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={(e) => { e.preventDefault(); handleSave(new FormData(e.currentTarget)); }} className="space-y-4">
                            <div>
                              <Label>Student ID</Label>
                              <Input name="student_id" defaultValue={student.student_id} required />
                            </div>
                            <div>
                              <Label>Class</Label>
                              <Select name="class_id" defaultValue={student.class_id || ""}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select class" />
                                </SelectTrigger>
                                <SelectContent>
                                  {classes.map((cls) => (
                                    <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Date of Birth</Label>
                              <Input name="date_of_birth" type="date" defaultValue={student.date_of_birth || ""} />
                            </div>
                            <div>
                              <Label>Gender</Label>
                              <Select name="gender" defaultValue={student.gender || ""}>
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
                              <Label>Address</Label>
                              <Input name="address" defaultValue={student.address || ""} />
                            </div>
                            <div>
                              <Label>Parent Name</Label>
                              <Input name="parent_name" defaultValue={student.parent_name || ""} />
                            </div>
                            <div>
                              <Label>Parent Phone</Label>
                              <Input name="parent_phone" defaultValue={student.parent_phone || ""} />
                            </div>
                            <div>
                              <Label>Parent Email</Label>
                              <Input name="parent_email" type="email" defaultValue={student.parent_email || ""} />
                            </div>
                            <Button type="submit" className="w-full">Save Changes</Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(student.id)}>
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

export default StudentsManagement;
