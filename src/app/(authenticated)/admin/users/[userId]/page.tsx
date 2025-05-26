
"use client";

import { use, useEffect, useState } from "react";
import { getUserByIdFromFirestore } from "@/actions/userActions";
import { getPetsByUserId } from "@/actions/petActions";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Home as HomeIcon, ShieldCheck, Edit3, Dog } from "lucide-react";
import { PetList } from "@/components/pets/PetList";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { AppUser, PetProfile } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

interface ViewUserPageProps {
  params: { userId: string };
}

export default function ViewUserPage({ params }: ViewUserPageProps) {
  const resolvedParams = use(params as any);
  const { userId } = resolvedParams;

  const [user, setUser] = useState<AppUser | null>(null);
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId || typeof userId !== 'string') {
      setIsLoading(false);
      notFound();
      return;
    }

    async function fetchData() {
      setIsLoading(true);
      const fetchedUser = await getUserByIdFromFirestore(userId);
      if (fetchedUser) {
        setUser(fetchedUser);
        const fetchedPets = await getPetsByUserId(fetchedUser.uid);
        setPets(fetchedPets);
        if (typeof document !== 'undefined') {
          document.title = `Perfil de ${fetchedUser.displayName || fetchedUser.email} - Pet Link`;
        }
      } else {
        notFound();
      }
      setIsLoading(false);
    }
    fetchData();
  }, [userId]);

  const getInitials = (email?: string | null, displayName?: string | null) => {
    if (displayName) return displayName.substring(0, 2).toUpperCase();
    if (email) return email.substring(0, 2).toUpperCase();
    return "SN";
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!user) {
    notFound();
    return null; 
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Avatar className="h-24 w-24 border-4 border-primary">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || "Usuario"} data-ai-hint="persona perfil" />
              <AvatarFallback className="text-3xl">{getInitials(user.email, user.displayName)}</AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left flex-grow min-w-0">
              <CardTitle className="text-3xl font-bold break-words">{user.displayName || "Usuario sin nombre"}</CardTitle>
              <CardDescription className="text-lg text-muted-foreground truncate">{user.email}</CardDescription>
              <Badge variant={user.nivel === "admin" ? "destructive" : "secondary"} className="capitalize mt-2">
                <ShieldCheck className="mr-1 h-4 w-4" />
                {user.nivel || "user"}
              </Badge>
            </div>
            <div className="flex-shrink-0">
              <Link href={`/admin/users/${user.uid}/edit`} passHref>
                <Button variant="outline">
                  <Edit3 className="mr-2 h-4 w-4" />
                  Editar Usuario
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {(user.phone1 || user.phone2 || user.address) && (
            <>
              <Separator />
              <div>
                <h3 className="text-xl font-semibold mb-3 text-primary flex items-center">
                  <User className="h-6 w-6 mr-2" /> Información de Contacto Adicional
                </h3>
                <div className="space-y-2 text-muted-foreground pl-8">
                  {user.phone1 && (
                    <p className="flex items-center">
                      <Phone className="h-5 w-5 mr-3 text-primary/80" />
                      <span className="font-medium text-foreground">{user.phone1} (Principal)</span>
                    </p>
                  )}
                  {user.phone2 && (
                    <p className="flex items-center">
                      <Phone className="h-5 w-5 mr-3 text-primary/80" />
                      <span className="font-medium text-foreground">{user.phone2} (Secundario)</span>
                    </p>
                  )}
                  {user.address && (
                    <p className="flex items-center">
                      <HomeIcon className="h-5 w-5 mr-3 text-primary/80" />
                      <span className="font-medium text-foreground">{user.address}</span>
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
          <Separator />
          <div>
            <h3 className="text-xl font-semibold mb-4 text-primary flex items-center">
              <Dog className="h-6 w-6 mr-2" /> Mascotas Registradas por {user.displayName || 'este usuario'} ({pets.length})
            </h3>
            {pets.length > 0 ? (
              <PetList pets={pets} onPetDeleted={() => { }} />
            ) : (
              <p className="text-muted-foreground pl-8">
                Este usuario aún no tiene mascotas registradas.
              </p>
            )}
          </div>
        </CardContent>
         <CardFooter className="border-t pt-4">
          <p className="text-xs text-muted-foreground">ID de Usuario (UID): {user.uid}</p>
        </CardFooter>
      </Card>
    </div>
  );
}
