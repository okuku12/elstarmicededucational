import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

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
            <Button asChild size="sm" variant="outline">
              <a href={file_url} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                Download
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AssignmentCard;
