import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

interface GalleryItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  category: string;
  is_featured: boolean;
  display_order: number;
}

const GalleryManagement = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from("gallery")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch gallery: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();

    const channel = supabase
      .channel("gallery-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "gallery" }, () => {
        fetchItems();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSave = async (formData: FormData) => {
    try {
      const data = {
        title: formData.get("title") as string,
        description: formData.get("description") as string || null,
        image_url: formData.get("image_url") as string,
        category: formData.get("category") as string,
        is_featured: formData.get("is_featured") === "on",
        display_order: parseInt(formData.get("display_order") as string) || 0,
        created_by: user?.id,
      };

      if (editingItem) {
        const { error } = await supabase.from("gallery").update(data).eq("id", editingItem.id);
        if (error) throw error;
        toast.success("Gallery item updated successfully");
      } else {
        const { error } = await supabase.from("gallery").insert(data);
        if (error) throw error;
        toast.success("Gallery item created successfully");
      }

      setIsDialogOpen(false);
      setEditingItem(null);
    } catch (error: any) {
      toast.error("Failed to save: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this gallery item?")) return;

    try {
      const { error } = await supabase.from("gallery").delete().eq("id", id);
      if (error) throw error;
      toast.success("Gallery item deleted successfully");
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
        <CardTitle>Gallery Management</CardTitle>
        <Dialog open={isDialogOpen && !editingItem} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingItem(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingItem(null); setIsDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Image
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Gallery Image</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); handleSave(new FormData(e.currentTarget)); }} className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input name="title" required />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea name="description" />
              </div>
              <div>
                <Label>Image URL</Label>
                <Input name="image_url" type="url" required />
              </div>
              <div>
                <Label>Category</Label>
                <Input name="category" defaultValue="general" required />
              </div>
              <div>
                <Label>Display Order</Label>
                <Input name="display_order" type="number" defaultValue="0" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" name="is_featured" id="is_featured" />
                <Label htmlFor="is_featured">Featured</Label>
              </div>
              <Button type="submit" className="w-full">Add to Gallery</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <img src={item.image_url} alt={item.title} className="w-full h-48 object-cover rounded-md mb-2" />
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.category}</p>
                <div className="flex gap-2 mt-2">
                  <Dialog open={isDialogOpen && editingItem?.id === item.id} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingItem(null); }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setEditingItem(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Gallery Item</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={(e) => { e.preventDefault(); handleSave(new FormData(e.currentTarget)); }} className="space-y-4">
                        <div>
                          <Label>Title</Label>
                          <Input name="title" defaultValue={item.title} required />
                        </div>
                        <div>
                          <Label>Description</Label>
                          <Textarea name="description" defaultValue={item.description || ""} />
                        </div>
                        <div>
                          <Label>Image URL</Label>
                          <Input name="image_url" type="url" defaultValue={item.image_url} required />
                        </div>
                        <div>
                          <Label>Category</Label>
                          <Input name="category" defaultValue={item.category} required />
                        </div>
                        <div>
                          <Label>Display Order</Label>
                          <Input name="display_order" type="number" defaultValue={item.display_order} />
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" name="is_featured" id={`is_featured_${item.id}`} defaultChecked={item.is_featured} />
                          <Label htmlFor={`is_featured_${item.id}`}>Featured</Label>
                        </div>
                        <Button type="submit" className="w-full">Save Changes</Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default GalleryManagement;
