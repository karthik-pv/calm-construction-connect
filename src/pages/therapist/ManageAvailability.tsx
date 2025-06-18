import { useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { PageTitle } from "@/components/shared/PageTitle";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Clock, AlertCircle } from "lucide-react";
import {
  DAYS_OF_WEEK,
  useManageAvailability,
  AvailabilitySlot,
} from "@/hooks/useTherapistAvailability";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Helper function to format time for display
const formatTimeDisplay = (timeString: string) => {
  const [hour, minute] = timeString.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
};

// Time slot editor component
const TimeSlotEditor = ({
  isOpen,
  onClose,
  onSave,
  editingSlot = null,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (slot: {
    id?: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_available: boolean;
  }) => void;
  editingSlot: AvailabilitySlot | null;
}) => {
  const [dayOfWeek, setDayOfWeek] = useState<number>(
    editingSlot?.day_of_week || 1
  ); // Default to Monday
  const [startTime, setStartTime] = useState<string>(
    editingSlot?.start_time || "09:00"
  );
  const [endTime, setEndTime] = useState<string>(
    editingSlot?.end_time || "17:00"
  );
  const [isAvailable, setIsAvailable] = useState<boolean>(
    editingSlot ? editingSlot.is_available : true
  );

  // Reset form when opening
  useState(() => {
    if (isOpen) {
      setDayOfWeek(editingSlot?.day_of_week || 1);
      setStartTime(editingSlot?.start_time || "09:00");
      setEndTime(editingSlot?.end_time || "17:00");
      setIsAvailable(editingSlot ? editingSlot.is_available : true);
    }
  });

  const handleSave = () => {
    // Basic validation
    if (!startTime || !endTime) return;

    // Convert times to 24-hour format for comparison
    const startParts = startTime.split(":").map(Number);
    const endParts = endTime.split(":").map(Number);

    // Check that end time is after start time
    if (
      endParts[0] < startParts[0] ||
      (endParts[0] === startParts[0] && endParts[1] <= startParts[1])
    ) {
      alert("End time must be after start time");
      return;
    }

    onSave({
      id: editingSlot?.id,
      day_of_week: dayOfWeek,
      start_time: startTime,
      end_time: endTime,
      is_available: isAvailable,
    });

    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingSlot ? "Edit Availability" : "Add Availability"}
          </DialogTitle>
          <DialogDescription>
            Set your availability for appointments on a specific day of the
            week.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="day">Day of Week</Label>
            <Select
              value={dayOfWeek.toString()}
              onValueChange={(value) => setDayOfWeek(parseInt(value))}
            >
              <SelectTrigger id="day">
                <SelectValue placeholder="Select day" />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map((day) => (
                  <SelectItem key={day.value} value={day.value.toString()}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="glass-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="glass-input"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isAvailable"
              checked={isAvailable}
              onCheckedChange={setIsAvailable}
            />
            <Label htmlFor="isAvailable">Available for bookings</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="glass-button" onClick={onClose}>
            Cancel
          </Button>
          <Button className="glass-button" onClick={handleSave}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function ManageAvailability() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<AvailabilitySlot | null>(null);

  const {
    availability,
    isLoading,
    isError,
    addAvailability,
    updateAvailability,
    deleteAvailability,
  } = useManageAvailability();

  const handleSave = (slotData: {
    id?: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_available: boolean;
  }) => {
    if (slotData.id) {
      // Update existing slot
      updateAvailability.mutate({
        id: slotData.id,
        day_of_week: slotData.day_of_week,
        start_time: slotData.start_time,
        end_time: slotData.end_time,
        is_available: slotData.is_available,
      });
    } else {
      // Add new slot
      addAvailability.mutate({
        day_of_week: slotData.day_of_week,
        start_time: slotData.start_time,
        end_time: slotData.end_time,
        is_available: slotData.is_available,
      });
    }
  };

  const handleDeleteSlot = (slotId: string) => {
    if (
      window.confirm("Are you sure you want to delete this availability slot?")
    ) {
      deleteAvailability.mutate(slotId);
    }
  };

  // Group availability by day for better organization
  const availabilityByDay = availability.reduce((acc, slot) => {
    const day = slot.day_of_week;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(slot);
    return acc;
  }, {} as Record<number, AvailabilitySlot[]>);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <PageTitle
            title="Manage Availability"
            subtitle="Set your available time slots for appointments"
          />
          <Button
            className="glass-button"
            onClick={() => {
              setEditingSlot(null);
              setIsAddDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Availability
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p>Loading your availability settings...</p>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center h-64 text-center">
            <div>
              <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
              <p className="text-lg font-semibold">
                Error Loading Availability
              </p>
              <p className="text-muted-foreground mt-1">
                Please try again later
              </p>
            </div>
          </div>
        ) : availability.length === 0 ? (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>No Availability Set</CardTitle>
              <CardDescription>
                You haven't set any availability for appointments yet. Add your
                first availability slot to start accepting appointments.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button
                className="glass-button"
                onClick={() => {
                  setEditingSlot(null);
                  setIsAddDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Availability
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Your Availability</CardTitle>
              <CardDescription>
                Manage when you're available for patient appointments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day</TableHead>
                    <TableHead>Time Range</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DAYS_OF_WEEK.map((day) => {
                    const slots = availabilityByDay[day.value] || [];

                    if (slots.length === 0) return null;

                    return slots.map((slot, index) => (
                      <TableRow
                        key={slot.id}
                        className={slot.is_available ? "" : "opacity-50"}
                      >
                        <TableCell>{index === 0 && day.label}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-primary" />
                            {formatTimeDisplay(slot.start_time)} -{" "}
                            {formatTimeDisplay(slot.end_time)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {slot.is_available ? (
                            <span className="text-green-400">Available</span>
                          ) : (
                            <span className="text-muted-foreground">
                              Unavailable
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="glass-button"
                              onClick={() => {
                                setEditingSlot(slot);
                                setIsAddDialogOpen(true);
                              }}
                            >
                              <Clock className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="glass-button"
                              onClick={() => handleDeleteSlot(slot.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ));
                  })}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                * Set your availability for each day of the week. Patients will
                only be able to book appointments during these times.
              </p>
              <Button
                variant="outline"
                className="glass-button"
                onClick={() => {
                  setEditingSlot(null);
                  setIsAddDialogOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Time Slot
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>

      {/* Time slot editor dialog */}
      {isAddDialogOpen && (
        <TimeSlotEditor
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onSave={handleSave}
          editingSlot={editingSlot}
        />
      )}
    </DashboardLayout>
  );
}
