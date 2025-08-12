
'use client';

import Link from "next/link";
import Image from "next/image";
import { Home, LogOut, Users, ShieldCheck, Bell, Menu, SquareUser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState, useCallback } from "react";
import type { AppNotification, AppUser } from "@/types";
import { getNotificationsForUser, markNotificationsAsRead } from "@/actions/notificationActions";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import logoImage from '@/assets/logo/logo.png';

interface NavLinkItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles: Array<AppUser['nivel'] | 'all'>;
}

export function Navbar() {
  const { appUser, signOut, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const fetchUserNotifications = useCallback(async () => {
    if (appUser?.uid) {
      const fetchedNotifications = await getNotificationsForUser(appUser.uid, 5);
      setNotifications(fetchedNotifications);
      const unreadPresent = fetchedNotifications.some(n => !n.read);
      setHasUnread(unreadPresent);
    } else {
      setNotifications([]);
      setHasUnread(false);
    }
  }, [appUser?.uid]);

  useEffect(() => {
    fetchUserNotifications();
    const intervalId = setInterval(fetchUserNotifications, 60000);
    return () => clearInterval(intervalId);
  }, [fetchUserNotifications]);

  if (authLoading && !appUser) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center animate-pulse">
          <div className="h-8 w-20 bg-muted rounded mr-2"></div>
          <div className="h-5 w-32 bg-muted rounded"></div>
          <div className="flex-1" />
          <div className="h-8 w-8 bg-muted rounded-full mr-2"></div>
          <div className="h-8 w-8 bg-muted rounded-full"></div>
        </div>
      </header>
    );
  }

  if (!appUser) {
    return null;
  }

  const getInitials = (email?: string | null, displayName?: string | null) => {
    if (displayName) return displayName.substring(0, 2).toUpperCase();
    if (email) return email.substring(0, 2).toUpperCase();
    return "U";
  };

  const handleNotificationClick = async (notification: AppNotification) => {
    setIsSheetOpen(false);
    if (!appUser?.uid) return;

    if (!notification.read) {
      const markReadResult = await markNotificationsAsRead(appUser.uid, [notification.id]);
      if (markReadResult.success) {
        const updatedNotifications = notifications.map(n =>
          n.id === notification.id ? { ...n, read: true } : n
        );
        setNotifications(updatedNotifications);
        const stillHasUnreadInDropdown = updatedNotifications.some(n => !n.read);
        setHasUnread(stillHasUnreadInDropdown);
      } else {
        toast({ title: "Error", description: markReadResult.error || "No se pudo marcar la notificación como leída.", variant: "destructive" });
      }
    }

    if (notification.link) {
      router.push(notification.link);
    }
  };

  const navLinks: NavLinkItem[] = [
    { href: "/home", label: "Inicio", icon: Home, roles: ['all'] },
    { href: "/admin/users", label: "Usuarios", icon: Users, roles: ['admin', 'demo'] },
    { href: "/admin/dashboard", label: "Panel de Administración", icon: ShieldCheck, roles: ['admin', 'demo'] },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 -mx-4 px-4">
      <div className="flex h-14 items-center">
        <div className="md:hidden mr-2">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="sr-only">Menú Principal</SheetTitle> 
                <SheetClose asChild>
                  <Link href="/home" className="mb-4 flex items-center space-x-2">
                    <Image
                      src={logoImage}
                      alt="Pet Link Logo"
                      width={30}
                      height={12}
                      priority
                      data-ai-hint="logo marca"
                    />
                    <span className="font-bold text-lg">Pet Link</span>
                  </Link>
                </SheetClose>
              </SheetHeader>
              <Separator className="mb-4" />
              <nav className="flex flex-col space-y-2 px-4">
                {navLinks.map((linkItem) => (
                  (linkItem.roles.includes('all') || (appUser.nivel && linkItem.roles.includes(appUser.nivel))) && (
                    <SheetClose asChild key={linkItem.href}>
                      <Link href={linkItem.href} passHref>
                        <Button variant="ghost" className="text-sm font-medium w-full justify-start">
                          <linkItem.icon className="mr-2 h-4 w-4" />
                          {linkItem.label}
                        </Button>
                      </Link>
                    </SheetClose>
                  )
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        <Link href="/home" className="ml-2 flex items-center space-x-2">
          <Image
            src={logoImage}
            alt="Pet Link Logo"
            width={40}
            height={16}
            priority
            data-ai-hint="logo marca"
            className="mr-2"
          />
          <span className="hidden font-bold sm:inline-block">
            Pet Link
          </span>
        </Link>

        <nav className="hidden md:flex flex-1 items-center space-x-1 ml-4">
          {navLinks.map((linkItem) => (
             (linkItem.roles.includes('all') || (appUser.nivel && linkItem.roles.includes(appUser.nivel))) && (
                <Link href={linkItem.href} passHref key={linkItem.href}>
                  <Button variant="ghost" className="text-sm font-medium group hover:bg-transparent">
                    <linkItem.icon className="mr-2 h-4 w-4 text-foreground/80 group-hover:text-accent transition-colors" />
                    <span className="text-foreground/80 group-hover:text-accent transition-colors">{linkItem.label}</span>
                  </Button>
                </Link>
             )
          ))}
        </nav>

        <div className="flex items-center space-x-2 ml-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative group hover:bg-transparent">
                <Bell className="h-5 w-5 text-foreground group-hover:text-accent transition-colors" />
                {hasUnread && (
                  <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive"></span>
                  </span>
                )}
                <span className="sr-only">Ver notificaciones</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 md:w-96" align="end">
              <DropdownMenuLabel className="px-3 py-2">Notificaciones</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length > 0 ? (
                notifications.map(notif => (
                  <DropdownMenuItem
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`cursor-pointer px-3 py-2 ${!notif.read ? 'font-semibold' : ''}`}
                  >
                    <div className="flex flex-col w-full">
                      <p className="text-sm truncate">{notif.title}</p>
                      <p className={`text-xs ${!notif.read ? 'text-foreground/90' : 'text-muted-foreground'} truncate`}>{notif.message}</p>
                      <p className="text-xs text-muted-foreground/70 mt-0.5">
                        {new Date(notif.timestamp).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No hay notificaciones nuevas.
                </div>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="px-3 py-2">
                <Link href="/notifications" className="w-full flex justify-center">
                  Ver todas las notificaciones
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={appUser.photoURL || undefined} alt={appUser.displayName || appUser.email || "Usuario"} data-ai-hint="persona perfil" />
                  <AvatarFallback>{getInitials(appUser.email, appUser.displayName)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal px-3 py-2">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{appUser.displayName || 'Perfil de Usuario'}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {appUser.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem asChild className="px-3 py-2">
                  <Link href="/profile/edit">
                    <SquareUser className="mr-2 h-4 w-4" />
                    <span>Editar Perfil</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 px-3 py-2">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
