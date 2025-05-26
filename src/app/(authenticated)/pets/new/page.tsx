
'use client';

import { PetForm } from "@/components/pets/PetForm";
import { ClaimPetForm } from "@/components/pets/ClaimPetForm";
import { useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert } from "lucide-react";

export default function NewPetPage() {
  const { appUser, isLoading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-1/3 mx-auto" />
        <Skeleton className="h-96 w-full max-w-2xl mx-auto" />
      </div>
    );
  }

  if (!appUser) {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Error de Autenticación</AlertTitle>
        <AlertDescription>
          Usuario no autenticado. Por favor, inicia sesión.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (appUser.nivel === 'admin') {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold tracking-tight text-center">Agregar Nueva Mascota</h1>
        <PetForm />
      </div>
    );
  } else {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold tracking-tight text-center">Agregar Mascota</h1>
        <ClaimPetForm />
      </div>
    );
  }
}
