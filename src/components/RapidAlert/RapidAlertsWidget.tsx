import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRapidAlerts, useHandleRapidAlert } from "@/hooks/useRapidAlerts";
import { AlertTriangle, User } from "lucide-react";
import { toast } from "sonner";

export function RapidAlertsWidget() {
  const navigate = useNavigate();
  const { data: alerts, isLoading } = useRapidAlerts();
  const { mutate: handleAlert } = useHandleRapidAlert();

  // Show toast notification when new alerts arrive
  useEffect(() => {
    if (alerts && alerts.length > 0) {
      toast.error("New Rapid Alert!", {
        description: `${alerts.length} unhandled rapid alert${
          alerts.length > 1 ? "s" : ""
        } require attention.`,
        duration: 5000,
      });
    }
  }, [alerts]);

  const handleAlertAndNavigate = (alertId: string, patientId: string) => {
    handleAlert(alertId, {
      onSuccess: () => {
        // Navigate to patient's profile page after successfully handling the alert
        navigate(`/therapist/patients/${patientId}`);
      },
    });
  };

  if (isLoading) {
    return (
      <Card className="bg-black/40 border-border backdrop-blur-md">
        <CardHeader>
          <CardTitle>Rapid Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!alerts || alerts.length === 0) {
    return null;
  }

  return (
    <Card className="bg-black/40 border-border backdrop-blur-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Rapid Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="p-4 rounded-lg border border-destructive/50 bg-destructive/10"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">
                    {alert.patient?.full_name || "Unknown Patient"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Emergency assistance required
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(alert.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    navigate(`/therapist/patients/${alert.patient_id}`)
                  }
                >
                  View Profile
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() =>
                    handleAlertAndNavigate(alert.id, alert.patient_id)
                  }
                >
                  Handle Alert
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
