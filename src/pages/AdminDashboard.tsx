import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, BookOpen, Image, FileText, UserCog } from "lucide-react";
import StudentsManagement from "@/components/admin/StudentsManagement";
import TeachersManagement from "@/components/admin/TeachersManagement";
import ClassesManagement from "@/components/admin/ClassesManagement";
import GalleryManagement from "@/components/admin/GalleryManagement";
import AssignmentsManagement from "@/components/admin/AssignmentsManagement";
import UserManagement from "@/components/admin/UserManagement";

const AdminDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setCheckingRole(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (error) throw error;
        setIsAdmin(!!data);
      } catch (error) {
        console.error("Error checking admin role:", error);
        setIsAdmin(false);
      } finally {
        setCheckingRole(false);
      }
    };

    checkAdminRole();
  }, [user]);

  useEffect(() => {
    if (!loading && !checkingRole && (!user || !isAdmin)) {
      navigate("/");
    }
  }, [user, loading, checkingRole, isAdmin, navigate]);

  if (loading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl">Admin Dashboard</CardTitle>
          <CardDescription>Manage your school's data and resources</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Students</span>
          </TabsTrigger>
          <TabsTrigger value="teachers" className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">Teachers</span>
          </TabsTrigger>
          <TabsTrigger value="classes" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span className="hidden sm:inline">Classes</span>
          </TabsTrigger>
          <TabsTrigger value="gallery" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            <span className="hidden sm:inline">Gallery</span>
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Assignments</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="students">
          <StudentsManagement />
        </TabsContent>

        <TabsContent value="teachers">
          <TeachersManagement />
        </TabsContent>

        <TabsContent value="classes">
          <ClassesManagement />
        </TabsContent>

        <TabsContent value="gallery">
          <GalleryManagement />
        </TabsContent>

        <TabsContent value="assignments">
          <AssignmentsManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
