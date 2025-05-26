
"use client";

import type { AppUser } from "@/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Edit3, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DeleteUserButton } from "./DeleteUserButton";

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
      <CardHeader className="pb-4">
        <div className="flex items-start space-x-4"> 
          <Avatar className="h-16 w-16 border-2 border-primary flex-shrink-0">
            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || "Usuario"} data-ai-hint="persona perfil" />
            <AvatarFallback>{getInitials(user.email, user.displayName)}</AvatarFallback>
          </Avatar>
          <div className="flex-grow min-w-0"> 
            <CardTitle className="text-xl break-words">{user.displayName || "Usuario sin nombre"}</CardTitle>
            <CardDescription className="text-sm text-muted-foreground truncate"> 
              {user.email}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="py-2">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <Badge variant={user.nivel === "admin" ? "destructive" : "secondary"} className="capitalize">
            {user.nivel || "user"}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap justify-start items-center gap-2 pt-4 border-t">
        <Link href={`/admin/users/${user.uid}`} passHref>
          <Button variant="outline" size="sm">
            <Eye className="mr-2 h-4 w-4" />
            Ver
          </Button>
        </Link>
        <Link href={`/admin/users/${user.uid}/edit`} passHref>
          <Button variant="outline" size="sm">
            <Edit3 className="mr-2 h-4 w-4" />
            Editar
          </Button>
        </Link>
        <DeleteUserButton 
          userId={user.uid} 
          userName={user.displayName || user.email || "este usuario"} 
          onUserDeleted={onUserDeleted} 
        />
      </CardFooter>
    </Card>
  );
}
