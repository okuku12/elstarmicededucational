import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, BookOpen, Mail, FileText, Calendar, Megaphone, ClipboardCheck } from "lucide-react";
import { Link } from "react-router-dom";

interface Stats {
  students: number;
  teachers: number;
  classes: number;
  newMessages: number;
  pendingAdmissions: number;
  upcomingEvents: number;
  upcomingDates: number;
  recentAnnouncements: number;
}

const AdminOverview = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const today = new Date().toISOString();
      const [
        students, teachers, classes, messages, admissions, events, dates, announcements
      ] = await Promise.all([
        supabase.from("students").select("*", { count: "exact", head: true }),
        supabase.from("teachers").select("*", { count: "exact", head: true }),
        supabase.from("classes").select("*", { count: "exact", head: true }),
        supabase.from("contact_submissions").select("*", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("admission_applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("events").select("*", { count: "exact", head: true }).gte("event_date", today),
        supabase.from("important_dates").select("*", { count: "exact", head: true }).gte("date", today.split("T")[0]),
        supabase.from("announcements").select("*", { count: "exact", head: true }).eq("is_active", true),
      ]);
      setStats({
        students: students.count || 0,
        teachers: teachers.count || 0,
        classes: classes.count || 0,
        newMessages: messages.count || 0,
        pendingAdmissions: admissions.count || 0,
        upcomingEvents: events.count || 0,
        upcomingDates: dates.count || 0,
        recentAnnouncements: announcements.count || 0,
      });
      setLoading(false);
    };
    load();
  }, []);

  const cards = [
    { title: "Students", value: stats?.students, icon: Users, tab: "students" },
    { title: "Teachers", value: stats?.teachers, icon: GraduationCap, tab: "teachers" },
    { title: "Classes", value: stats?.classes, icon: BookOpen, tab: "classes" },
    { title: "New Messages", value: stats?.newMessages, icon: Mail, tab: "messages", highlight: true },
    { title: "Pending Admissions", value: stats?.pendingAdmissions, icon: FileText, tab: "messages", highlight: true },
    { title: "Active Announcements", value: stats?.recentAnnouncements, icon: Megaphone, tab: "announcements" },
    { title: "Upcoming Events", value: stats?.upcomingEvents, icon: Calendar, tab: "events" },
    { title: "Upcoming Important Dates", value: stats?.upcomingDates, icon: ClipboardCheck, tab: "important-dates" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">Overview</h2>
        <p className="text-muted-foreground">At-a-glance summary of school activity</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.title} to={`/admin?tab=${c.tab}`}>
            <Card className={`hover:shadow-md transition-shadow ${c.highlight && (c.value ?? 0) > 0 ? "border-primary" : ""}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{c.title}</CardTitle>
                <c.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{loading ? "—" : c.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminOverview;
