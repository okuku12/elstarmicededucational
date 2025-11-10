import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, FileText, Calendar, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StudentData {
  id: string;
  student_id: string;
  class_id: string;
}

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  max_marks: number;
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

          // Fetch assignments for the student's class
          const { data: assignmentsData, error: assignmentsError } = await supabase
            .from("assignments")
            .select("id, title, description, due_date, max_marks")
            .order("due_date", { ascending: true })
            .limit(10);

          if (assignmentsError) throw assignmentsError;
          setAssignments(assignmentsData || []);
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
                    <Card key={assignment.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{assignment.title}</CardTitle>
                            <CardDescription>{assignment.description}</CardDescription>
                          </div>
                          <Badge variant="outline">
                            {assignment.max_marks} marks
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          Due: {new Date(assignment.due_date).toLocaleDateString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-muted-foreground">No assignments available</p>
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
