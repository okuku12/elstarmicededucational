import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { gallerySchema } from "@/lib/validations";

interface GalleryItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  category: string;
  is_featured: boolean;
  display_order?: number;
}

const Gallery = () => {
  const { user } = useAuth();
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<GalleryItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    fetchGallery();
    checkAdminRole();
  }, [user]);

  useEffect(() => {
    if (activeCategory === "all") {
      setFilteredItems(galleryItems);
    } else {
      setFilteredItems(galleryItems.filter(item => item.category === activeCategory));
    }
  }, [activeCategory, galleryItems]);

  const checkAdminRole = async () => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!data);
  };

  const fetchGallery = async () => {
    try {
      const { data } = await supabase
        .from("gallery")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (data) setGalleryItems(data);
    } catch (error) {
      console.error("Error fetching gallery:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData: FormData) => {
    const rawData = {
      title: (formData.get("title") as string || "").trim(),
      description: (formData.get("description") as string || "").trim(),
      image_url: (formData.get("image_url") as string || "").trim(),
      category: (formData.get("category") as string || "").trim(),
      is_featured: formData.get("is_featured") === "on",
      display_order: parseInt(formData.get("display_order") as string) || 0,
    };

    const result = gallerySchema.safeParse(rawData);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    try {
      if (editingItem) {
        const { error } = await supabase.from("gallery").update({
          title: result.data.title,
          description: result.data.description || null,
          image_url: result.data.image_url,
          category: result.data.category,
          display_order: result.data.display_order,
          is_featured: result.data.is_featured,
        }).eq("id", editingItem.id);
        if (error) throw error;
        toast.success("Image updated successfully");
      } else {
        const { error } = await supabase.from("gallery").insert({
          title: result.data.title,
          description: result.data.description || null,
          image_url: result.data.image_url,
          category: result.data.category,
          display_order: result.data.display_order,
          is_featured: result.data.is_featured,
          created_by: user?.id!,
        });
        if (error) throw error;
        toast.success("Image added successfully");
      }
      setIsDialogOpen(false);
      setIsAddDialogOpen(false);
      setEditingItem(null);
      fetchGallery();
    } catch (error: any) {
      toast.error("Failed to save: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;
    try {
      const { error } = await supabase.from("gallery").delete().eq("id", id);
      if (error) throw error;
      toast.success("Image deleted successfully");
      fetchGallery();
    } catch (error: any) {
      toast.error("Failed to delete: " + error.message);
    }
  };

  const categories = ["all", ...Array.from(new Set(galleryItems.map(item => item.category)))];

  const GalleryForm = ({ item }: { item?: GalleryItem }) => (
    <form onSubmit={(e) => { e.preventDefault(); handleSave(new FormData(e.currentTarget)); }} className="space-y-4">
      <div>
        <Label>Title *</Label>
        <Input name="title" defaultValue={item?.title || ""} required maxLength={200} />
      </div>
      <div>
        <Label>Description</Label>
        <Textarea name="description" defaultValue={item?.description || ""} maxLength={500} />
      </div>
      <div>
        <Label>Image URL *</Label>
        <Input name="image_url" type="url" defaultValue={item?.image_url || ""} required maxLength={500} placeholder="https://example.com/image.jpg" />
      </div>
      <div>
        <Label>Category *</Label>
        <Input name="category" defaultValue={item?.category || "general"} required maxLength={50} />
      </div>
      <div>
        <Label>Display Order</Label>
        <Input name="display_order" type="number" defaultValue={item?.display_order || 0} min="0" max="9999" />
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" name="is_featured" id="form_is_featured" defaultChecked={item?.is_featured || false} />
        <Label htmlFor="form_is_featured">Featured</Label>
      </div>
      <Button type="submit" className="w-full">{item ? "Save Changes" : "Add Image"}</Button>
    </form>
  );

  return (
    <div className="min-h-screen py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-6 text-foreground">Gallery</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Explore moments from our vibrant school community through our photo gallery.
          </p>
          {isAdmin && (
            <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Upload Image
            </Button>
          )}
        </div>

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-8">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-2 md:grid-cols-5 gap-2">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Gallery Grid */}
        {loading ? (
          <div className="text-center py-16 text-muted-foreground">Loading gallery...</div>
        ) : filteredItems.length === 0 ? (
          <Card className="border-none shadow-lg">
            <CardContent className="p-16 text-center text-muted-foreground">
              No images available in this category.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <Card 
                key={item.id} 
                className="border-none shadow-lg hover:shadow-xl transition-all overflow-hidden group"
              >
                <div 
                  className="relative aspect-[4/3] overflow-hidden cursor-pointer"
                  onClick={() => setSelectedImage(item)}
                >
                  <img 
                    src={item.image_url} 
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  {item.is_featured && (
                    <Badge className="absolute top-2 right-2">Featured</Badge>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-1 text-foreground">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="outline" className="capitalize">{item.category}</Badge>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => { e.stopPropagation(); setEditingItem(item); setIsDialogOpen(true); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Lightbox Dialog */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl">
            {selectedImage && (
              <div className="space-y-4">
                <img 
                  src={selectedImage.image_url} 
                  alt={selectedImage.title}
                  className="w-full h-auto rounded-lg"
                />
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">{selectedImage.title}</h2>
                  {selectedImage.description && (
                    <p className="text-muted-foreground">{selectedImage.description}</p>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Badge className="capitalize">{selectedImage.category}</Badge>
                    {selectedImage.is_featured && <Badge variant="secondary">Featured</Badge>}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Image Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload New Image</DialogTitle>
            </DialogHeader>
            <GalleryForm />
          </DialogContent>
        </Dialog>

        {/* Edit Image Dialog */}
        <Dialog open={isDialogOpen && !!editingItem} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingItem(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Image</DialogTitle>
            </DialogHeader>
            {editingItem && <GalleryForm item={editingItem} />}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Gallery;
