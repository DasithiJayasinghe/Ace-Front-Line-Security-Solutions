import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { notificationApi, NotificationDTO } from "@/lib/notificationApi";
import { 
    Popover, 
    PopoverContent, 
    PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { toast } from "sonner";

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
    const [loading, setLoading] = useState(false);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const loadNotifications = async () => {
        try {
            const data = await notificationApi.myNotifications();
            if (Array.isArray(data)) {
                setNotifications(prev => {
                    // Check for new notifications to trigger toast
                    const newUnread = data.filter(n => !n.isRead && !prev.find(p => p.id === n.id));
                    if (newUnread.length > 0) {
                        newUnread.forEach(n => {
                            toast("New Assignment", {
                                description: n.message,
                            });
                        });
                    }
                    return data;
                });
            }
        } catch (error) {
            console.error("Failed to load notifications", error);
        }
    };

    useEffect(() => {
        loadNotifications();
        // Poll for notifications every 30 seconds
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, []); // Empty dependency array to mount poll only once

    const handleMarkAsRead = async (id: number) => {
        try {
            await notificationApi.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error("Failed to mark notification as read", error);
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-white/10 transition-colors">
                    <Bell className="h-5 w-5 text-[#D4AF37]" />
                    {unreadCount > 0 && (
                        <Badge 
                            variant="destructive" 
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-red-600 border-none"
                        >
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 bg-[#1A1A1A] border-[#D4AF37] text-white shadow-xl" align="end">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h3 className="font-bold text-[#D4AF37]">Notifications</h3>
                </div>
                <ScrollArea className="h-[300px]">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">
                            No notifications
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((n) => (
                                <div 
                                    key={n.id} 
                                    className={`p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group ${!n.isRead ? 'bg-[#D4AF37]/5' : ''}`}
                                >
                                    <div className="flex justify-between gap-2">
                                        <p className={`text-sm ${!n.isRead ? 'text-white font-medium' : 'text-gray-400'}`}>
                                            {n.message}
                                        </p>
                                        {!n.isRead && (
                                            <button 
                                                onClick={() => handleMarkAsRead(n.id)}
                                                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-[#D4AF37] hover:bg-[#D4AF37]/10 p-1 rounded"
                                                title="Mark as read"
                                            >
                                                <Check className="h-3 w-3" />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-2">
                                        {format(new Date(n.createdAt), "MMM d, HH:mm")}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
