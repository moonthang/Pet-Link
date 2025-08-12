
"use client";

import type { AppUser } from "@/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck, Edit3, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DeleteUserButton } from "./DeleteUserButton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface UserCardProps {
  user: AppUser;
  onUserDeleted: (userId: string) => void;
}

export function UserCard({ user, onUserDeleted }: UserCardProps) {
  const getInitials = (email?: string | null, displayName?: string | null) => {
    if (displayName) return displayName.substring(0, 2).toUpperCase();
    if (email) return email.substring(0, 2).toUpperCase();
    return "SN"; 
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 w-full">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4 min-w-0">
          <Avatar className="h-12 w-12 border-2 border-primary flex-shrink-0">
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || "Usuario"} data-ai-hint="persona perfil" />
            <AvatarFallback>{getInitials(user.email, user.displayName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{user.displayName || "Usuario sin nombre"}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            <Badge variant={user.nivel === "admin" ? "destructive" : "secondary"} className="capitalize mt-1 text-xs">
              <ShieldCheck className="mr-1 h-3 w-3" />
              {user.nivel || "user"}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            <TooltipProvider delayDuration={200}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link href={`/admin/users/${user.uid}`} passHref>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                        </Button>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent><p>Ver</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Link href={`/admin/users/${user.uid}/edit`} passHref>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                            <Edit3 className="h-4 w-4" />
                        </Button>
                        </Link>
                    </TooltipTrigger>
                    <TooltipContent><p>Editar</p></TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <div>
                            <DeleteUserButton 
                            userId={user.uid} 
                            userName={user.displayName || user.email || "este usuario"} 
                            onUserDeleted={onUserDeleted}
                            size="icon"
                            className="h-8 w-8"
                            />
                        </div>
                    </TooltipTrigger>
                    <TooltipContent><p>Eliminar</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}
