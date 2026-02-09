import { useState } from 'react';
import { Bell, Check, CheckCheck, Package, AlertCircle, Info, X } from 'lucide-react';
import { useLang } from '@/contexts/LangContext';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead, Notification } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

const typeIcons: Record<string, React.ReactNode> = {
  order_update: <Package className="h-4 w-4 text-primary" />,
  success: <Check className="h-4 w-4 text-emerald" />,
  warning: <AlertCircle className="h-4 w-4 text-warning" />,
  error: <X className="h-4 w-4 text-destructive" />,
  info: <Info className="h-4 w-4 text-muted-foreground" />,
};

export default function NotificationBell() {
  const { lang } = useLang();
  const { data: notifications, isLoading } = useNotifications();
  const unreadCount = useUnreadCount();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const [open, setOpen] = useState(false);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }
    // Navigate if there's a link in data
    if (notification.data?.link) {
      window.location.href = notification.data.link;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2.5 rounded-xl bg-muted/80 hover:bg-muted transition-all duration-200">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] bg-gradient-gold-static text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1.5 shadow-gold animate-scale-bounce">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-80 p-0 rounded-2xl shadow-card-hover border-0"
        sideOffset={12}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/30 rounded-t-2xl">
          <h3 className="font-bold">
            {lang === 'ar' ? 'الإشعارات' : 'Notifications'}
          </h3>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead.mutate()}
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1.5 font-medium transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {lang === 'ar' ? 'قراءة الكل' : 'Mark all read'}
            </button>
          )}
        </div>

        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-20">
              <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          ) : !notifications?.length ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">
                {lang === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "w-full text-start px-4 py-3 hover:bg-muted/50 transition-colors",
                    !notification.read && "bg-primary/5"
                  )}
                >
                  <div className="flex gap-3">
                    <div className="shrink-0 mt-0.5">
                      {typeIcons[notification.type] || typeIcons.info}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm line-clamp-1",
                        !notification.read && "font-medium"
                      )}>
                        {notification.title}
                      </p>
                      {notification.body && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {notification.body}
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: lang === 'ar' ? ar : enUS,
                        })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="shrink-0">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
