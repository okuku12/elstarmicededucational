import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, FileText, Calendar } from "lucide-react";
import ClassesManagement from "@/components/admin/ClassesManagement";
import StudentsManagement from "@/components/admin/StudentsManagement";
import AssignmentsManagement from "@/components/admin/AssignmentsManagement";

const TeacherDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isTeacher, setIsTeacher] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    const checkTeacherRole = async () => {
      if (!user) {
        setCheckingRole(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "teacher")
          .maybeSingle();

        if (error) throw error;
        setIsTeacher(!!data);
      } catch (error) {
        console.error("Error checking teacher role:", error);
        setIsTeacher(false);
      } finally {
        setCheckingRole(false);
      }
    };

    checkTeacherRole();
  }, [user]);

  useEffect(() => {
    if (!loading && !checkingRole && (!user || !isTeacher)) {
      navigate("/");
    }
  }, [user, loading, checkingRole, isTeacher, navigate]);

  if (loading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isTeacher) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl">Teacher Dashboard</CardTitle>
          <CardDescription>Manage your classes, students, and assignments</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="classes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="classes" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Classes</span>
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Students</span>
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Assignments</span>
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Attendance</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="classes">
          <ClassesManagement />
        </TabsContent>

        <TabsContent value="students">
          <StudentsManagement />
        </TabsContent>

        <TabsContent value="assignments">
          <AssignmentsManagement />
        </TabsContent>

        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Management</CardTitle>
              <CardDescription>Mark and view student attendance</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Attendance management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TeacherDashboard;
