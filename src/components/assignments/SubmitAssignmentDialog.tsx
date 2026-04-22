import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Upload, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface SubmitAssignmentDialogProps {
  assignmentId: string;
  assignmentTitle: string;
  studentId: string;
}

interface ExistingSubmission {
  id: string;
  file_url: string | null;
  submission_text: string | null;
  submitted_at: string;
  marks_obtained: number | null;
  feedback: string | null;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const SubmitAssignmentDialog = ({
  assignmentId,
  assignmentTitle,
  studentId,
}: SubmitAssignmentDialogProps) => {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [existing, setExisting] = useState<ExistingSubmission | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoadingExisting(true);
      const { data, error } = await supabase
        .from("assignment_submissions")
        .select("id, file_url, submission_text, submitted_at, marks_obtained, feedback")
        .eq("assignment_id", assignmentId)
        .eq("student_id", studentId)
        .maybeSingle();
      if (!error && data) {
        setExisting(data);
        setSubmissionText(data.submission_text || "");
      } else {
        setExisting(null);
      }
      setLoadingExisting(false);
    };
    load();
  }, [open, assignmentId, studentId]);

  const handleSubmit = async () => {
    if (!file && !submissionText.trim()) {
      toast.error("Please attach a file or write a comment.");
      return;
    }
    if (file && file.size > MAX_FILE_SIZE) {
      toast.error("File is larger than 20MB.");
      return;
    }

    setSubmitting(true);
    try {
      let file_url: string | null = existing?.file_url ?? null;

      if (file) {
        const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
        const path = `${studentId}/${assignmentId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("assignment-files")
          .upload(path, file, { upsert: true, contentType: file.type });
        if (uploadError) throw uploadError;
        const { data: signed } = await supabase.storage
          .from("assignment-files")
          .createSignedUrl(path, 60 * 60 * 24 * 365);
        // Store the storage path so we can re-sign later; also signed URL for immediate access
        file_url = signed?.signedUrl ?? path;
      }

      if (existing) {
        const { error } = await supabase
          .from("assignment_submissions")
          .update({
            file_url,
            submission_text: submissionText.trim() || null,
            submitted_at: new Date().toISOString(),
            // Reset grade on resubmit
            marks_obtained: null,
            feedback: null,
            graded_by: null,
            graded_at: null,
          })
          .eq("id", existing.id);
        if (error) throw error;
        toast.success("Submission updated!");
      } else {
        const { error } = await supabase.from("assignment_submissions").insert({
          assignment_id: assignmentId,
          student_id: studentId,
          file_url,
          submission_text: submissionText.trim() || null,
        });
        if (error) throw error;
        toast.success("Assignment submitted!");
      }

      setFile(null);
      setOpen(false);
    } catch (err: any) {
      toast.error("Submission failed: " + (err.message || "Unknown error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Upload className="h-4 w-4 mr-2" />
          {existing ? "Resubmit" : "Submit"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit: {assignmentTitle}</DialogTitle>
          <DialogDescription>
            Upload your work and/or write a short comment for your teacher.
          </DialogDescription>
        </DialogHeader>

        {loadingExisting ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-4">
            {existing && (
              <div className="rounded-md border p-3 space-y-2 bg-muted/30">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Already submitted on{" "}
                  {new Date(existing.submitted_at).toLocaleString()}
                </div>
                {existing.marks_obtained !== null && (
                  <div className="flex items-center gap-2">
                    <Badge>Graded: {existing.marks_obtained}</Badge>
                    {existing.feedback && (
                      <span className="text-sm text-muted-foreground">
                        "{existing.feedback}"
                      </span>
                    )}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Submitting again will replace your previous file and reset any grade.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="file">File (optional, max 20MB)</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">Comment (optional)</Label>
              <Textarea
                id="comment"
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="e.g. I had trouble with question 3..."
                rows={4}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || loadingExisting}>
            {submitting ? "Submitting..." : existing ? "Resubmit" : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubmitAssignmentDialog;
