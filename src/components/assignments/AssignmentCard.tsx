import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface AssignmentCardProps {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  max_marks: number;
  file_url: string | null;
  class_name: string;
  subject_name: string;
}

const AssignmentCard = ({
  title,
  description,
  due_date,
  max_marks,
  file_url,
  class_name,
  subject_name,
}: AssignmentCardProps) => {
  const isOverdue = due_date && new Date(due_date) < new Date();

  const handleDownload = async () => {
    if (!file_url) return;
    try {
      toast.info("Starting download...");
      const response = await fetch(file_url);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();

      // Try to keep original extension from the URL
      const urlPath = new URL(file_url).pathname;
      const ext = urlPath.includes(".") ? urlPath.split(".").pop() : "pdf";
      const safeTitle = title.replace(/[^a-zA-Z0-9-_ ]/g, "_").trim() || "assignment";

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${safeTitle}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Download started!");
    } catch (error) {
      // Fallback: open in a new tab so user can save manually
      window.open(file_url, "_blank", "noopener,noreferrer");
      toast.error("Direct download failed. Opened the file in a new tab — use your browser's Save option.");
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg line-clamp-1">{title}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{subject_name}</Badge>
              <Badge variant="outline">{class_name}</Badge>
            </div>
          </div>
          <Badge variant={isOverdue ? "destructive" : "default"}>
            {max_marks} marks
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        )}
        <div className="flex items-center justify-between">
          <p className={`text-sm ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
            {due_date 
              ? `Due: ${new Date(due_date).toLocaleDateString()}` 
              : "No due date"}
          </p>
          {file_url && (
            <Button size="sm" variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AssignmentCard;
