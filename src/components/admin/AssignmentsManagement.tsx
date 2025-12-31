import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { assignmentSchema } from "@/lib/validations";

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  max_marks: number;
  class_subject_id: string;
}

interface ClassSubject {
  id: string;
  class_id: string;
  subject_id: string;
  classes: { name: string };
  subjects: { name: string };
}

const AssignmentsManagement = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClassSubject, setSelectedClassSubject] = useState<string>("");

  const fetchData = async () => {
    try {
      const [assignmentsRes, classSubjectsRes] = await Promise.all([
        supabase.from("assignments").select("*").order("created_at", { ascending: false }),
        supabase.from("class_subjects").select("*, classes(name), subjects(name)"),
      ]);

      if (assignmentsRes.error) throw assignmentsRes.error;
      if (classSubjectsRes.error) throw classSubjectsRes.error;

      setAssignments(assignmentsRes.data || []);
      setClassSubjects(classSubjectsRes.data || []);
    } catch (error: any) {
      toast.error("Failed to fetch data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("assignments-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "assignments" }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSave = async (formData: FormData) => {
    const rawData = {
      title: (formData.get("title") as string || "").trim(),
      description: (formData.get("description") as string || "").trim(),
      class_subject_id: selectedClassSubject || formData.get("class_subject_id") as string || "",
      due_date: formData.get("due_date") as string || "",
      max_marks: parseInt(formData.get("max_marks") as string) || 100,
    };

    // Validate
    const result = assignmentSchema.safeParse(rawData);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    try {
      const data = {
        title: result.data.title,
        description: result.data.description || null,
        class_subject_id: result.data.class_subject_id,
        due_date: result.data.due_date || null,
        max_marks: result.data.max_marks,
        created_by: user?.id,
      };

      if (editingAssignment) {
        const { error } = await supabase.from("assignments").update(data).eq("id", editingAssignment.id);
        if (error) throw error;
        toast.success("Assignment updated successfully");
      } else {
        const { error } = await supabase.from("assignments").insert(data);
        if (error) throw error;
        toast.success("Assignment created successfully");
      }

      setIsDialogOpen(false);
      setEditingAssignment(null);
      setSelectedClassSubject("");
    } catch (error: any) {
      toast.error("Failed to save: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;

    try {
      const { error } = await supabase.from("assignments").delete().eq("id", id);
      if (error) throw error;
      toast.success("Assignment deleted successfully");
    } catch (error: any) {
      toast.error("Failed to delete: " + error.message);
    }
  };

  const openEditDialog = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setSelectedClassSubject(assignment.class_subject_id);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingAssignment(null);
    setSelectedClassSubject("");
    setIsDialogOpen(true);
  };

  if (loading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Assignments Management</CardTitle>
        <Dialog open={isDialogOpen && !editingAssignment} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingAssignment(null); setSelectedClassSubject(""); } }}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Assignment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Assignment</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(new FormData(e.currentTarget)); }} className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input name="title" required maxLength={200} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea name="description" maxLength={2000} />
              </div>
              <div>
                <Label>Class & Subject *</Label>
                <Select value={selectedClassSubject} onValueChange={setSelectedClassSubject} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class and subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {classSubjects.map((cs) => (
                      <SelectItem key={cs.id} value={cs.id}>
                        {cs.classes.name} - {cs.subjects.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="class_subject_id" value={selectedClassSubject} />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input name="due_date" type="datetime-local" />
              </div>
              <div>
                <Label>Max Marks</Label>
                <Input name="max_marks" type="number" defaultValue="100" min="1" max="1000" />
              </div>
              <Button type="submit" className="w-full">Create Assignment</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Max Marks</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => {
                const classSubject = classSubjects.find((cs) => cs.id === assignment.class_subject_id);
                return (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{assignment.title}</div>
                        {classSubject && (
                          <div className="text-sm text-muted-foreground">
                            {classSubject.classes.name} - {classSubject.subjects.name}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : "No due date"}</TableCell>
                    <TableCell>{assignment.max_marks}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Dialog open={isDialogOpen && editingAssignment?.id === assignment.id} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingAssignment(null); setSelectedClassSubject(""); } }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(assignment)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Assignment</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={(e) => { e.preventDefault(); handleSave(new FormData(e.currentTarget)); }} className="space-y-4">
                              <div>
                                <Label>Title *</Label>
                                <Input name="title" defaultValue={assignment.title} required maxLength={200} />
                              </div>
                              <div>
                                <Label>Description</Label>
                                <Textarea name="description" defaultValue={assignment.description || ""} maxLength={2000} />
                              </div>
                              <div>
                                <Label>Class & Subject *</Label>
                                <Select value={selectedClassSubject} onValueChange={setSelectedClassSubject}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {classSubjects.map((cs) => (
                                      <SelectItem key={cs.id} value={cs.id}>
                                        {cs.classes.name} - {cs.subjects.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <input type="hidden" name="class_subject_id" value={selectedClassSubject} />
                              </div>
                              <div>
                                <Label>Due Date</Label>
                                <Input name="due_date" type="datetime-local" defaultValue={assignment.due_date || ""} />
                              </div>
                              <div>
                                <Label>Max Marks</Label>
                                <Input name="max_marks" type="number" defaultValue={assignment.max_marks} min="1" max="1000" />
                              </div>
                              <Button type="submit" className="w-full">Save Changes</Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                        <Button variant="destructive" size="sm" onClick={() => handleDelete(assignment.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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

export default AssignmentsManagement;
