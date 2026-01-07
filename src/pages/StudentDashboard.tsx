import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, FileText, Calendar, Award, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface StudentData {
  id: string;
  student_id: string;
  class_id: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  max_marks: number;
  file_url: string | null;
  class_name: string;
  subject_name: string;
}

const StudentDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isStudent, setIsStudent] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  useEffect(() => {
    const checkStudentRole = async () => {
      if (!user) {
        setCheckingRole(false);
        return;
      }

      try {
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "student")
          .maybeSingle();

        if (roleError) throw roleError;
        setIsStudent(!!roleData);

        if (roleData) {
          const { data: student, error: studentError } = await supabase
            .from("students")
            .select("id, student_id, class_id")
            .eq("user_id", user.id)
            .single();

          if (studentError) throw studentError;
          setStudentData(student);

          // Fetch assignments only for the student's class
          if (student.class_id) {
            const { data: assignmentsData, error: assignmentsError } = await supabase
              .from("assignments")
              .select(`
                id, title, description, due_date, max_marks, file_url,
                class_subjects!inner (
                  class_id,
                  classes (name),
                  subjects (name)
                )
              `)
              .eq("class_subjects.class_id", student.class_id)
              .order("due_date", { ascending: true });

            if (assignmentsError) throw assignmentsError;
            
            const formattedAssignments = (assignmentsData || []).map((a: any) => ({
              id: a.id,
              title: a.title,
              description: a.description,
              due_date: a.due_date,
              max_marks: a.max_marks,
              file_url: a.file_url,
              class_name: a.class_subjects?.classes?.name || "",
              subject_name: a.class_subjects?.subjects?.name || "",
            }));
            
            setAssignments(formattedAssignments);
          }
        }
      } catch (error) {
        console.error("Error checking student role:", error);
        setIsStudent(false);
      } finally {
        setCheckingRole(false);
      }
    };

    checkStudentRole();
  }, [user]);

  useEffect(() => {
    if (!loading && !checkingRole && (!user || !isStudent)) {
      navigate("/");
    }
  }, [user, loading, checkingRole, isStudent, navigate]);

  if (loading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isStudent) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl">Student Dashboard</CardTitle>
          <CardDescription>
            Student ID: {studentData?.student_id || "Loading..."}
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="assignments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Assignments</span>
          </TabsTrigger>
          <TabsTrigger value="grades" className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            <span className="hidden sm:inline">Grades</span>
          </TabsTrigger>
          <TabsTrigger value="materials" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Materials</span>
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Attendance</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assignments">
          <Card>
            <CardHeader>
              <CardTitle>My Assignments</CardTitle>
              <CardDescription>View and submit your assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignments.length > 0 ? (
                  assignments.map((assignment) => (
                    <Card key={assignment.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-lg">{assignment.title}</CardTitle>
                            <div className="flex gap-2">
                              <Badge variant="secondary">{assignment.subject_name}</Badge>
                              <Badge variant="outline">{assignment.class_name}</Badge>
                            </div>
                          </div>
                          <Badge>
                            {assignment.max_marks} marks
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {assignment.description && (
                          <p className="text-sm text-muted-foreground">{assignment.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-muted-foreground">
                            Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : "No due date"}
                          </p>
                          {assignment.file_url && (
                            <Button asChild size="sm" variant="outline">
                              <a href={assignment.file_url} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </a>
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No assignments available for your class</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grades">
          <Card>
            <CardHeader>
              <CardTitle>My Grades</CardTitle>
              <CardDescription>View your academic performance</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Grades will be displayed here...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="materials">
          <Card>
            <CardHeader>
              <CardTitle>Study Materials</CardTitle>
              <CardDescription>Download class materials and resources</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Study materials coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>My Attendance</CardTitle>
              <CardDescription>View your attendance record</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Attendance records coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentDashboard;
