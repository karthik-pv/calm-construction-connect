import { useState, useEffect, useCallback, useRef } from "react";
import { Bell, Check, AlertCircle, Info, Calendar, User } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { format, formatDistanceToNow } from "date-fns";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import { useNotifications, Notification } from "@/hooks/useNotifications";
import { useEffect as useEffectSingle, useLayoutEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function NotificationDropdown() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const bellRef = useRef<HTMLButtonElement>(null);
  const [forcedRefresh, setForcedRefresh] = useState(0);

  const {
    notifications,
    isLoading,
    isError,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch,
  } = useNotifications();

  // Debug logging - log notification data when it changes
  useEffect(() => {
    console.log(
      "NotificationDropdown - Current notifications:",
      notifications?.length > 0 ? notifications : "No notifications"
    );
    console.log("Unread count:", unreadCount);
  }, [notifications, unreadCount]);

  // Refresh notifications when dropdown opens
  useEffect(() => {
    if (open) {
      console.log("Dropdown opened - refreshing notifications");
      refetch();
    }
  }, [open, refetch]);

  // Force refresh notifications on mount
  useEffectSingle(() => {
    console.log("NotificationDropdown mounted - forcing initial refresh");
    refetch();

    // Direct check against the database for debugging
    if (user?.id) {
      (async () => {
        try {
          console.log("Performing direct DB check for notifications");
          const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (error) {
            console.error("Direct DB check - Error:", error);
          } else {
            console.log(
              `Direct DB check - Found ${data?.length || 0} notifications`
            );
            if (data?.length > 0) {
              console.log("Sample notification:", data[0]);
            }
          }
        } catch (e) {
          console.error("Direct DB check - Exception:", e);
        }
      })();
    }
  }, [refetch, user?.id]);

  // Set up periodic refresh of notifications
  useEffect(() => {
    // Check for new notifications every 15 seconds when the component is mounted
    const intervalId = setInterval(() => {
      console.log("Periodic refresh triggered");
      refetch();
    }, 15000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [refetch]);

  // Force a refresh with a timer - to ensure we get fresh data
  useEffect(() => {
    if (forcedRefresh > 0) {
      const timer = setTimeout(() => {
        console.log("Executing forced refresh");
        refetch();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [forcedRefresh, refetch]);

  // Handle notification click - optimized with useCallback
  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      console.log("Notification clicked:", notification.id);

      // Mark notification as read
      if (!notification.is_read) {
        markAsRead.mutate(notification.id, {
          onSuccess: () => {
            console.log("Notification marked as read:", notification.id);
          },
          onError: (error) => {
            console.error("Failed to mark notification as read:", error);
            toast.error("Failed to mark notification as read");
          },
        });
      }

      // Navigate to the linked page if available
      if (notification.link) {
        navigate(notification.link);
      }

      // Close the popover
      setOpen(false);
    },
    [markAsRead, navigate]
  );

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "appointment_request":
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case "appointment_confirmed":
        return <Check className="h-4 w-4 text-green-500" />;
      case "appointment_rejected":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "system":
        return <Info className="h-4 w-4 text-primary" />;
      default:
        return <Bell className="h-4 w-4 text-primary" />;
    }
  };

  // Format relative time
  const getRelativeTime = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return "recently";
    }
  };

  const handleMarkAllAsRead = useCallback(() => {
    console.log("Marking all notifications as read");
    markAllAsRead.mutate(undefined, {
      onSuccess: () => {
        console.log("All notifications marked as read successfully");
        setOpen(false);
        toast.success("All notifications marked as read");
      },
      onError: (error) => {
        console.error("Failed to mark all notifications as read:", error);
        toast.error("Failed to mark all notifications as read");
      },
    });
  }, [markAllAsRead]);

  const handleBellClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      console.log("Bell icon clicked - triggering refresh");
      setForcedRefresh((prev) => prev + 1);
      refetch();
    },
    [refetch]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={bellRef}
          variant="ghost"
          size="icon"
          className="relative transition-colors hover:bg-muted focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2"
          onClick={handleBellClick}
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-primary text-white text-xs font-bold rounded-full">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[350px] p-0 border-border shadow-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-card/80 backdrop-blur-sm">
          <h4 className="font-medium text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8 hover:bg-primary/10"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>

        <Separator />

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <div className="mindful-loader mb-2"></div>
              <p>Loading notifications...</p>
            </div>
          ) : isError ? (
            <div className="p-8 text-center">
              <div className="flex flex-col items-center">
                <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                <p className="text-sm text-destructive mb-2">
                  Error loading notifications
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    console.log("Manual retry triggered");
                    refetch();
                  }}
                >
                  Try again
                </Button>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[300px] p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 opacity-20 mb-2" />
              <p>No notifications</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-4 text-xs"
                onClick={() => {
                  console.log("Manual refresh triggered");
                  refetch();
                }}
              >
                Refresh
              </Button>
            </div>
          ) : (
            <AnimatePresence>
              {notifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`
                    px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/40 last:border-b-0
                    ${
                      !notification.is_read
                        ? "bg-primary/5 dark:bg-primary/10"
                        : ""
                    }
                  `}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm ${
                          !notification.is_read ? "font-medium" : ""
                        }`}
                      >
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 break-words">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 opacity-70">
                        {getRelativeTime(notification.created_at)}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
