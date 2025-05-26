
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BellRing, CheckCheck, Trash2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useCallback } from "react";
import type { AppNotification } from "@/types";
import { getNotificationsForUser, markNotificationsAsRead, deleteNotifications } from "@/actions/notificationActions";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function NotificationsPage() {
  const { appUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNotificationIds, setSelectedNotificationIds] = useState<string[]>([]);

  const fetchUserNotifications = useCallback(async () => {
    if (appUser?.uid) {
      setIsLoading(true);
      const userNotifications = await getNotificationsForUser(appUser.uid);
      setNotifications(userNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setIsLoading(false);
    } else {
      setNotifications([]);
      setIsLoading(false);
    }
  }, [appUser?.uid]);

  useEffect(() => {
    fetchUserNotifications();
  }, [fetchUserNotifications]);

  const handleMarkOneAsReadAndNavigate = async (notification: AppNotification) => {
    if (!appUser?.uid) return;
    if (!notification.read) {
      const result = await markNotificationsAsRead(appUser.uid, [notification.id]);
      if (result.success) {
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
      } else {
        toast({ title: "Error", description: result.error || "No se pudo marcar como leída.", variant: "destructive" });
      }
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const handleToggleSelectNotification = (notificationId: string) => {
    setSelectedNotificationIds(prevSelected =>
      prevSelected.includes(notificationId)
        ? prevSelected.filter(id => id !== notificationId)
        : [...prevSelected, notificationId]
    );
  };

  const handleToggleSelectAll = () => {
    if (isLoading || notifications.length === 0) return; 
    if (selectedNotificationIds.length === notifications.length) {
      setSelectedNotificationIds([]);
    } else {
      setSelectedNotificationIds(notifications.map(n => n.id));
    }
  };

  const handleMarkSelectedAsRead = async () => {
    if (!appUser?.uid || selectedNotificationIds.length === 0) return;
    const unreadSelectedIds = notifications
      .filter(n => selectedNotificationIds.includes(n.id) && !n.read)
      .map(n => n.id);

    if (unreadSelectedIds.length === 0) {
      toast({ title: "Información", description: "Las notificaciones seleccionadas ya están leídas." });
      return;
    }

    const result = await markNotificationsAsRead(appUser.uid, unreadSelectedIds);
    if (result.success) {
      setNotifications(prev =>
        prev.map(n => (unreadSelectedIds.includes(n.id) ? { ...n, read: true } : n))
      );
      setSelectedNotificationIds([]); 
      toast({ title: "Éxito", description: "Notificaciones seleccionadas marcadas como leídas." });
    } else {
      toast({ title: "Error", description: result.error || "No se pudo marcar las notificaciones como leídas.", variant: "destructive" });
    }
  };

  const handleDeleteSelected = async () => {
    if (!appUser?.uid || selectedNotificationIds.length === 0) return;
    const result = await deleteNotifications(appUser.uid, selectedNotificationIds);
    if (result.success) {
      setNotifications(prev =>
        prev.filter(n => !selectedNotificationIds.includes(n.id))
      );
      setSelectedNotificationIds([]); 
      toast({ title: "Éxito", description: "Notificaciones seleccionadas eliminadas." });
    } else {
      toast({ title: "Error", description: result.error || "No se pudo eliminar las notificaciones.", variant: "destructive" });
    }
  };

  if (isLoading && notifications.length === 0) { 
    return (
      <div className="space-y-8">
        <div className="flex items-center space-x-3">
          <BellRing className="h-8 w-8 text-primary animate-pulse" />
          <h1 className="text-3xl font-bold tracking-tight">Cargando Notificaciones...</h1>
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Bandeja de Entrada</CardTitle>
            <CardDescription>Cargando tus notificaciones y alertas...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 rounded-md border bg-muted/30 animate-pulse">
                <Skeleton className="h-4 bg-muted rounded w-3/4 mb-2" />
                <Skeleton className="h-3 bg-muted rounded w-full mb-2" />
                <Skeleton className="h-2 bg-muted rounded w-1/4" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  const isAllSelected = notifications.length > 0 && selectedNotificationIds.length === notifications.length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3">
          <BellRing className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Todas tus Notificaciones</h1>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
           <div className="flex items-center space-x-2">
              <Checkbox
                  id="selectAll"
                  checked={isAllSelected}
                  onCheckedChange={handleToggleSelectAll}
                  aria-label="Seleccionar todas las notificaciones"
                  disabled={notifications.length === 0 || isLoading}
              />
              <label htmlFor="selectAll" className={`text-sm font-medium ${notifications.length === 0 || isLoading ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer'}`}>
                  Seleccionar Todo
              </label>
          </div>
          
          <div className="flex gap-2 mt-2 sm:mt-0">
            <Button 
              onClick={handleMarkSelectedAsRead} 
              variant="outline" 
              size="sm"
              disabled={selectedNotificationIds.length === 0 || isLoading}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Marcar como Leídas
            </Button>
            <Button 
              onClick={handleDeleteSelected} 
              variant="destructive" 
              size="sm"
              disabled={selectedNotificationIds.length === 0 || isLoading}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
          </div>
        </div>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Bandeja de Entrada</CardTitle>
          <CardDescription>Aquí encontrarás todas tus notificaciones y alertas.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && notifications.length === 0 ? ( 
             <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 rounded-md border bg-muted/30 animate-pulse">
                    <Skeleton className="h-4 bg-muted rounded w-3/4 mb-2" />
                    <Skeleton className="h-3 bg-muted rounded w-full mb-2" />
                    <Skeleton className="h-2 bg-muted rounded w-1/4" />
                </div>
                ))}
            </div>
          ) : !isLoading && notifications.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Sin Notificaciones</AlertTitle>
              <AlertDescription>No tienes notificaciones en este momento.</AlertDescription>
            </Alert>
          ) : (
            <ul className="space-y-4">
              {notifications.map((notification) => (
                <li 
                  key={notification.id} 
                  className={`relative p-4 rounded-md border transition-colors ${notification.read ? 'bg-muted/50 hover:bg-muted/60' : 'bg-card shadow-sm hover:bg-accent/10'}`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id={`select-${notification.id}`}
                      checked={selectedNotificationIds.includes(notification.id)}
                      onCheckedChange={() => handleToggleSelectNotification(notification.id)}
                      aria-labelledby={`title-${notification.id}`}
                      className="mt-1"
                      disabled={isLoading}
                    />
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 id={`title-${notification.id}`} className={`font-semibold ${notification.read ? 'text-muted-foreground' : 'text-primary'}`}>
                            {notification.title}
                          </h3>
                          <p className="text-sm text-foreground mt-1">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(notification.timestamp).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        </div>
                        {!notification.read && (
                          <span className="absolute top-3 right-3 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                          </span>
                        )}
                      </div>
                      {notification.link && (
                        <Button 
                          variant="link" 
                          className="mt-2 p-0 h-auto text-sm" 
                          onClick={() => handleMarkOneAsReadAndNavigate(notification)}
                          disabled={isLoading}
                        >
                          Ver detalles
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
