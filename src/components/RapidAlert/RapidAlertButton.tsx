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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCreateRapidAlert, useTherapistsList } from "@/hooks/useRapidAlerts";
import { AlertTriangle, X, Check } from "lucide-react";

export function RapidAlertButton() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [therapistsOpen, setTherapistsOpen] = useState(false);
  const { mutate: createAlert, isPending } = useCreateRapidAlert();
  const { data: therapists = [] } = useTherapistsList();

  const handleSubmit = () => {
    createAlert(undefined, {
      onSuccess: () => {
        setConfirmOpen(false);
        setTherapistsOpen(true);
      },
    });
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: { [key: string]: string } = {
      therapist: "Therapist",
      relationship_expert: "Relationship Expert",
      financial_expert: "Financial Expert",
      dating_coach: "Dating Coach",
      health_wellness_coach: "Health & Wellness Coach",
    };
    return roleMap[role] || role;
  };

  return (
    <>
      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogTrigger asChild>
          <Button
            variant="destructive"
            className="w-full flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            Raise Rapid Alert
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-black/95 border-border backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Raise Rapid Alert
            </DialogTitle>
            <DialogDescription>
              This will immediately notify all available therapists and experts
              that you need urgent assistance. Are you sure you want to proceed?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSubmit}
              disabled={isPending}
            >
              {isPending ? "Sending Alert..." : "Send Alert"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Therapists List Dialog */}
      <Dialog open={therapistsOpen} onOpenChange={setTherapistsOpen}>
        <DialogContent className="bg-black/95 border-border backdrop-blur-md max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-500">
              <Check className="h-5 w-5" />
              Alert Sent Successfully
            </DialogTitle>
            <DialogDescription>
              Your rapid alert has been sent to the following therapists and
              experts:
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-60 overflow-y-auto">
            {therapists.length > 0 ? (
              <div className="space-y-3">
                {therapists.map((therapist) => (
                  <div
                    key={therapist.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-black/40 border border-border"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={therapist.avatar_url || ""} />
                      <AvatarFallback>
                        {therapist.full_name?.[0] || "T"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {therapist.full_name || "Unknown Therapist"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getRoleDisplayName(therapist.user_role)}
                      </p>
                    </div>
                    <div className="text-green-500">
                      <Check className="h-4 w-4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-muted-foreground">
                  No therapists are currently available
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setTherapistsOpen(false)}
              className="w-full"
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
