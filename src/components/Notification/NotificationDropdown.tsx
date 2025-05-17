import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
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

  const {
    notifications,
    isLoading,
    isError,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  // Log once on mount for debugging
  useEffectSingle(() => {
    console.log("NotificationDropdown mounted");
    console.log("Current notifications:", notifications);
    console.log("Unread count:", unreadCount);

    // Perform a direct check on the database
    if (user?.id) {
      (async () => {
        try {
          const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (error) {
            console.error(
              "Direct DB check - Error fetching notifications:",
              error
            );
          } else {
            console.log(
              "Direct DB check - Notifications found:",
              data?.length || 0
            );
          }
        } catch (e) {
          console.error("Direct DB check - Exception:", e);
        }
      })();
    }

    if (isError) {
      console.error("Notifications error:", error);
    }
  }, []);

  // Close the popover when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (open) {
        setOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [open]);

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    // Mark notification as read
    if (!notification.is_read) {
      markAsRead.mutate(notification.id, {
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
  };

  // Get icon based on notification type
  const getNotificationIcon = (type: string) => {
    return <Bell className="h-4 w-4 text-primary" />;
  };

  // Format relative time
  const getRelativeTime = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return "recently";
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate(undefined, {
      onSuccess: () => {
        setOpen(false);
        toast.success("All notifications marked as read");
      },
      onError: (error) => {
        console.error("Failed to mark all notifications as read:", error);
        toast.error("Failed to mark all notifications as read");
      },
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        asChild
        onClick={(e) => {
          e.stopPropagation();
          console.log(
            "Notification bell clicked, current unread count:",
            unreadCount
          );
        }}
      >
        <Button variant="ghost" size="icon" className="relative">
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
        className="w-80 p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-2 bg-card">
          <h4 className="font-medium">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>

        <Separator />

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading notifications...
            </div>
          ) : isError ? (
            <div className="p-4 text-center text-destructive">
              Error loading notifications
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No notifications
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
                    px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors
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
                    <div>
                      <p
                        className={`text-sm ${
                          !notification.is_read ? "font-medium" : ""
                        }`}
                      >
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
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
