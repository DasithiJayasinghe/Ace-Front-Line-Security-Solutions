import { useState, useEffect } from "react";
import {
  getNotificationsForUser,
  markNotificationRead,
  markAllNotificationsRead,
  type Notification,
} from "@/lib/notifications";
import { Bell, CheckCircle, XCircle, DollarSign, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

const LoanNotificationBell = () => {
  const userId = Number(localStorage.getItem("userId") || "0");
  const role = localStorage.getItem("role") || "";
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const refresh = () => setNotifications(getNotificationsForUser(userId, role));

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (message: string) => {
    if (message.includes("APPROVED") || message.includes("approved"))
      return <CheckCircle className="w-4 h-4 text-[hsl(var(--success))] shrink-0" />;
    if (message.includes("REJECTED") || message.includes("rejected"))
      return <XCircle className="w-4 h-4 text-destructive shrink-0" />;
    return <DollarSign className="w-4 h-4 text-primary shrink-0" />;
  };

  const formatTime = (timestamp: string | undefined) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell className="w-4 h-4 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-[9px] font-bold text-white flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-bold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 text-primary"
              onClick={() => { markAllNotificationsRead(userId); refresh(); }}>
              <Check className="w-3 h-3 mr-1" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              <Bell className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
              No notifications yet
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
                  onClick={() => { markNotificationRead(n.id); refresh(); }}
                >
                  <div className="flex gap-3">
                    {getIcon(n.message)}
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs leading-relaxed ${!n.read ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {n.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-muted-foreground">{formatTime(n.time)}</span>
                        {!n.read && (
                          <Badge className="h-4 px-1.5 text-[9px] bg-primary/15 text-primary border-0">NEW</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default LoanNotificationBell;
