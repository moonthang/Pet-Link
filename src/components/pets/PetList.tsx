
"use client";

import type { PetProfile } from "@/types";
import { PetCard } from "./PetCard";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface PetListProps {
  pets: PetProfile[];
  onPetDeleted: (deletedPetId: string) => void;
}

export function PetList({ pets = [], onPetDeleted }: PetListProps) {

  if (pets.length === 0) {
    return (
      <div className="text-center py-10">
        <Alert className="max-w-md mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>¡No Hay Mascotas para Mostrar!</AlertTitle>
          <AlertDescription>
            Parece que aún no se han agregado perfiles de mascota, o ninguna coincide con tu búsqueda actual.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {pets.map((pet) => (
        <PetCard key={pet.id} pet={pet} onPetDeleted={onPetDeleted} />
      ))}
    </div>
  );
}
