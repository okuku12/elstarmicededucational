import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { heroSectionSchema } from "@/lib/validations";

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
  const [errors, setErrors] = useState<Record<string, string>>({});
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
        .maybeSingle();

      if (error) throw error;
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
    setErrors({});
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const rawData = {
      title: (formData.get("title") as string || "").trim(),
      subtitle: (formData.get("subtitle") as string || "").trim(),
      button_text: (formData.get("button_text") as string || "").trim(),
      button_link: (formData.get("button_link") as string || "").trim(),
      background_image: (formData.get("background_image") as string || "").trim(),
    };

    // Validate
    const result = heroSectionSchema.safeParse(rawData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast({
        title: "Validation Error",
        description: result.error.errors[0].message,
        variant: "destructive",
      });
      setSaving(false);
      return;
    }

    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;

      if (heroSection?.id) {
        const { error } = await supabase
          .from("hero_section")
          .update({
            title: result.data.title,
            subtitle: result.data.subtitle || null,
            button_text: result.data.button_text,
            button_link: result.data.button_link,
            background_image: result.data.background_image || null,
            updated_by: userId!,
          })
          .eq("id", heroSection.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("hero_section")
          .insert([{
            title: result.data.title,
            subtitle: result.data.subtitle || null,
            button_text: result.data.button_text,
            button_link: result.data.button_link,
            background_image: result.data.background_image || null,
            updated_by: userId!,
          }]);

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
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              defaultValue={heroSection?.title || ""}
              required
              maxLength={100}
              placeholder="Welcome to Our School"
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              name="subtitle"
              defaultValue={heroSection?.subtitle || ""}
              maxLength={200}
              placeholder="In Pursuit of Excellence"
              className={errors.subtitle ? "border-destructive" : ""}
            />
            {errors.subtitle && <p className="text-sm text-destructive">{errors.subtitle}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="button_text">Button Text *</Label>
            <Input
              id="button_text"
              name="button_text"
              defaultValue={heroSection?.button_text || "Apply Now"}
              required
              maxLength={50}
              className={errors.button_text ? "border-destructive" : ""}
            />
            {errors.button_text && <p className="text-sm text-destructive">{errors.button_text}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="button_link">Button Link *</Label>
            <Input
              id="button_link"
              name="button_link"
              defaultValue={heroSection?.button_link || "/admissions/apply"}
              required
              maxLength={200}
              placeholder="/admissions/apply or https://..."
              className={errors.button_link ? "border-destructive" : ""}
            />
            <p className="text-xs text-muted-foreground">Must start with / for internal links or http for external</p>
            {errors.button_link && <p className="text-sm text-destructive">{errors.button_link}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="background_image">Background Image URL</Label>
            <Input
              id="background_image"
              name="background_image"
              defaultValue={heroSection?.background_image || ""}
              maxLength={500}
              placeholder="/hero-school.jpg or https://..."
              className={errors.background_image ? "border-destructive" : ""}
            />
            {errors.background_image && <p className="text-sm text-destructive">{errors.background_image}</p>}
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
