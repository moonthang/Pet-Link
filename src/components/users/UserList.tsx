
"use client";

import type { AppUser } from "@/types";
import { UserCard } from "./UserCard";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Users } from "lucide-react";

interface UserListProps {
  users: AppUser[];
  onUserDeleted: (userId: string) => void;
}

export function UserList({ users, onUserDeleted }: UserListProps) {
  if (!users || users.length === 0) {
    return (
      <div className="text-center py-10">
        <Alert className="max-w-md mx-auto">
          <Users className="h-4 w-4" />
          <AlertTitle>¡No hay Usuarios Registrados!</AlertTitle>
          <AlertDescription>
            Aún no hay perfiles de usuario en la base de datos o que coincidan con tu búsqueda.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"> 
      {users.map((user) => (
        <UserCard key={user.uid} user={user} onUserDeleted={onUserDeleted} />
      ))}
    </div>
  );
}
