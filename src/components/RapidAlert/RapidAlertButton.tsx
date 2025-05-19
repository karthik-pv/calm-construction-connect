import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useCreateRapidAlert } from "@/hooks/useRapidAlerts";
import { AlertTriangle } from "lucide-react";

export function RapidAlertButton() {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const { mutate: createAlert, isPending } = useCreateRapidAlert();

  const handleSubmit = () => {
    if (!description.trim()) {
      return;
    }

    createAlert(description, {
      onSuccess: () => {
        setDescription("");
        setOpen(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          className="w-full flex items-center gap-2"
        >
          <AlertTriangle className="h-4 w-4" />
          Raise Rapid Alert
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Raise Rapid Alert</DialogTitle>
          <DialogDescription>
            Please describe your emergency situation. This will be immediately
            visible to all therapists.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="Describe your emergency situation..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={isPending || !description.trim()}
          >
            {isPending ? "Sending..." : "Send Alert"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
