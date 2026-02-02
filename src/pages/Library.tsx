import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BookOpen, Search } from "lucide-react";
import { toast } from "sonner";

interface LibraryBook {
  id: string;
  title: string;
  author: string;
  isbn: string | null;
  category: string;
  description: string | null;
  cover_image_url: string | null;
  quantity: number;
  available_quantity: number;
  published_year: number | null;
  publisher: string | null;
}

const Library = () => {
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [categories, setCategories] = useState<string[]>(["all"]);
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null);

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from("library_books")
        .select("*")
        .order("title", { ascending: true });

      if (error) throw error;
      
      setBooks(data || []);
      
      // Extract unique categories
      const uniqueCategories = ["all", ...new Set((data || []).map(book => book.category))];
      setCategories(uniqueCategories);
    } catch (error: any) {
      toast.error("Failed to load library: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();

    const channel = supabase
      .channel("library-public")
      .on("postgres_changes", { event: "*", schema: "public", table: "library_books" }, () => {
        fetchBooks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let filtered = books;

    // Filter by category
    if (activeCategory !== "all") {
      filtered = filtered.filter(book => book.category === activeCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(book =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        (book.isbn && book.isbn.toLowerCase().includes(query)) ||
        (book.publisher && book.publisher.toLowerCase().includes(query))
      );
    }

    setFilteredBooks(filtered);
  }, [books, activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container mx-auto px-4 text-center">
          <BookOpen className="h-16 w-16 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">School Library</h1>
          <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
            Explore our collection of books and resources available for students and staff
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, author, ISBN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-8">
          <TabsList className="flex flex-wrap justify-center gap-2 h-auto">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category} className="capitalize">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Books Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No books found</p>
            <p className="text-sm">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredBooks.map((book) => (
              <Card
                key={book.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedBook(book)}
              >
                <CardContent className="p-3">
                  <div className="aspect-[3/4] relative rounded-md overflow-hidden mb-3 bg-muted">
                    {book.cover_image_url ? (
                      <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-10 w-10 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-sm line-clamp-2" title={book.title}>{book.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{book.author}</p>
                  <div className="mt-2">
                    <Badge variant={book.available_quantity > 0 ? "default" : "destructive"} className="text-xs">
                      {book.available_quantity > 0 ? `${book.available_quantity} available` : "Unavailable"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Book count */}
        {!loading && filteredBooks.length > 0 && (
          <p className="text-center text-muted-foreground mt-8">
            Showing {filteredBooks.length} of {books.length} books
          </p>
        )}
      </div>

      {/* Book Detail Dialog */}
      <Dialog open={!!selectedBook} onOpenChange={(open) => !open && setSelectedBook(null)}>
        <DialogContent className="max-w-2xl">
          {selectedBook && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedBook.title}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="aspect-[3/4] relative rounded-md overflow-hidden bg-muted">
                  {selectedBook.cover_image_url ? (
                    <img src={selectedBook.cover_image_url} alt={selectedBook.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Author</p>
                    <p className="font-medium">{selectedBook.author}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Category</p>
                      <p className="capitalize">{selectedBook.category}</p>
                    </div>
                    {selectedBook.isbn && (
                      <div>
                        <p className="text-sm text-muted-foreground">ISBN</p>
                        <p>{selectedBook.isbn}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {selectedBook.publisher && (
                      <div>
                        <p className="text-sm text-muted-foreground">Publisher</p>
                        <p>{selectedBook.publisher}</p>
                      </div>
                    )}
                    {selectedBook.published_year && (
                      <div>
                        <p className="text-sm text-muted-foreground">Published Year</p>
                        <p>{selectedBook.published_year}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Availability</p>
                    <Badge variant={selectedBook.available_quantity > 0 ? "default" : "destructive"}>
                      {selectedBook.available_quantity} of {selectedBook.quantity} copies available
                    </Badge>
                  </div>

                  {selectedBook.description && (
                    <div>
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p className="text-sm">{selectedBook.description}</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Library;
