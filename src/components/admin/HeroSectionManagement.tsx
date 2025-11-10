import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface HeroSection {
  id: string;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
  background_image: string;
}

const HeroSectionManagement = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [heroSection, setHeroSection] = useState<HeroSection | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchHeroSection();
  }, []);

  const fetchHeroSection = async () => {
    try {
      const { data, error } = await supabase
        .from("hero_section")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setHeroSection(data);
    } catch (error) {
      console.error("Error fetching hero section:", error);
      toast({
        title: "Error",
        description: "Failed to load hero section",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      subtitle: formData.get("subtitle") as string,
      button_text: formData.get("button_text") as string,
      button_link: formData.get("button_link") as string,
      background_image: formData.get("background_image") as string,
      updated_by: (await supabase.auth.getUser()).data.user?.id,
    };

    try {
      if (heroSection?.id) {
        const { error } = await supabase
          .from("hero_section")
          .update(data)
          .eq("id", heroSection.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("hero_section")
          .insert([data]);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Hero section updated successfully",
      });
      fetchHeroSection();
    } catch (error) {
      console.error("Error saving hero section:", error);
      toast({
        title: "Error",
        description: "Failed to save hero section",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hero Section Management</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hero Section Management</CardTitle>
        <CardDescription>Update the homepage hero section content</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              defaultValue={heroSection?.title || ""}
              required
              placeholder="Welcome to Our School"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              name="subtitle"
              defaultValue={heroSection?.subtitle || ""}
              placeholder="In Pursuit of Excellence"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="button_text">Button Text</Label>
            <Input
              id="button_text"
              name="button_text"
              defaultValue={heroSection?.button_text || "Apply Now"}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="button_link">Button Link</Label>
            <Input
              id="button_link"
              name="button_link"
              defaultValue={heroSection?.button_link || "/admissions/apply"}
              required
              placeholder="/admissions/apply"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="background_image">Background Image URL</Label>
            <Input
              id="background_image"
              name="background_image"
              defaultValue={heroSection?.background_image || ""}
              placeholder="/hero-school.jpg"
            />
          </div>

          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default HeroSectionManagement;
