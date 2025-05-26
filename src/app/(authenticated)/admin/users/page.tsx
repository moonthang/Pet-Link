
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, UserPlus, Search, AlertTriangle, Copy, Link2 } from "lucide-react";
import { getAllUsersFromFirestore } from "@/actions/userActions";
import { UserList } from "@/components/users/UserList";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useCallback } from "react";
import type { AppUser } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function AdminUsersPage() {
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AppUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registrationLink, setRegistrationLink] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRegistrationLink(window.location.origin + "/register");
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const usersFromDb = await getAllUsersFromFirestore();
      setAllUsers(usersFromDb);
      setFilteredUsers(usersFromDb); 
    } catch (e: any) {
      console.error("Error al obtener usuarios:", e);
      setError("No se pudieron cargar los usuarios. Inténtalo de nuevo más tarde.");
      setAllUsers([]);
      setFilteredUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredUsers(allUsers);
      return;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    const filtered = allUsers.filter(user =>
      (user.displayName?.toLowerCase().includes(lowercasedFilter)) ||
      (user.email?.toLowerCase().includes(lowercasedFilter))
    );
    setFilteredUsers(filtered);
  }, [searchTerm, allUsers]);

  const handleUserDeleted = useCallback((deletedUserId: string) => {
    setAllUsers(currentUsers => currentUsers.filter(user => user.uid !== deletedUserId));
  }, []);

  const handleCopyRegistrationLink = async () => {
    if (!registrationLink) return;
    try {
      await navigator.clipboard.writeText(registrationLink);
      toast({
        title: "¡Enlace Copiado!",
        description: "El enlace de registro ha sido copiado al portapapeles.",
      });
    } catch (err) {
      console.error("Error al copiar enlace de registro: ", err);
      toast({
        title: "Error al Copiar",
        description: "No se pudo copiar el enlace.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Gestionar Usuarios</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {registrationLink && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Link2 className="mr-2 h-4 w-4" />
                  Enlace de Registro
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <div className="flex items-center space-x-2">
                  <Input 
                    value={registrationLink} 
                    readOnly 
                    className="h-8 flex-grow text-xs" 
                    aria-label="Enlace de registro"
                  />
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleCopyRegistrationLink} 
                    className="h-8 w-8"
                    aria-label="Copiar enlace"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          )}
          <Link href="/admin/users/new" passHref>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Agregar Nuevo Usuario
            </Button>
          </Link>
        </div>
      </div>
      
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <div>
              <CardTitle>Lista de Usuarios Registrados</CardTitle>
              <CardDescription>
                Usuarios con perfiles creados en Firestore.
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-auto max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nombre o email..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Buscar usuarios"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : error ? (
             <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error al Cargar Usuarios</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <UserList users={filteredUsers} onUserDeleted={handleUserDeleted} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
