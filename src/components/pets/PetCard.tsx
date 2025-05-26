
"use client";

import type { PetProfile } from "@/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, FilePenLine, Dog, Cat, Tag, Copy } from "lucide-react";
import { PetQRModal } from "./PetQRModal";
import { DeletePetButton } from "./DeletePetButton";
import { Badge } from "@/components/ui/badge";
import { PetDisplayImage } from "./PetDisplayImage";
import { calculateAge } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface PetCardProps {
  pet: PetProfile;
  onPetDeleted: () => void;
}

export function PetCard({ pet, onPetDeleted }: PetCardProps) {
  const { appUser } = useAuth();
  const ageDisplay = calculateAge(pet.fechaNacimiento);
  const { toast } = useToast();

  const handleCopyId = async () => {
    if (!navigator.clipboard) {
      toast({
        title: "Error",
        description: "La API del portapapeles no está disponible en este navegador.",
        variant: "destructive",
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(pet.id);
      toast({
        title: "¡ID Copiado!",
        description: `El ID ${pet.id} ha sido copiado al portapapeles.`,
      });
    } catch (err) {
      console.error("Error al copiar ID: ", err);
      toast({
        title: "Error al Copiar",
        description: "No se pudo copiar el ID al portapapeles.",
        variant: "destructive",
      });
    }
  };

  const PetIcon = pet.tipoAnimal === "Gato" ? Cat : Dog;

  return (
    <Card className="flex flex-col h-full shadow-md hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-3 mb-2">
          <PetIcon className="h-8 w-8 text-primary" />
          <CardTitle className="text-2xl">{pet.name}</CardTitle>
        </div>
        <CardDescription className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="capitalize">{pet.tipoAnimal}</Badge>
          <Badge variant="outline">{pet.breed || 'Raza no especificada'}</Badge>
          <Badge variant="outline" className="capitalize">{pet.sexo || 'Sexo no especificado'}</Badge>
          <Badge variant="outline">{ageDisplay}</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="aspect-[3/2] w-full relative rounded-md overflow-hidden border border-muted mb-4">
          <PetDisplayImage
            src={pet.photoUrl}
            alt={pet.name}
            petName={pet.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            data-ai-hint={`${pet.tipoAnimal?.toLowerCase()} mascota`}
          />
        </div>
        <div className="space-y-1 text-sm">
          <p><span className="font-semibold">Dueño:</span> {pet.ownerName || 'Dueño no especificado'}</p>
          {pet.ownerPhone1 && <p><span className="font-semibold">Teléfono Principal:</span> {pet.ownerPhone1}</p>}
          {pet.ownerEmail && <p><span className="font-semibold">Email:</span> {pet.ownerEmail}</p>}

          {appUser?.nivel === 'admin' && (
            <div className="mt-2 flex items-center space-x-1">
              <Badge variant="outline" className="text-xs flex items-center space-x-1 py-1">
                  <Tag className="h-3 w-3" />
                  <span>ID: {pet.id}</span>
              </Badge>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopyId} aria-label="Copiar ID de mascota">
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row sm:justify-between gap-2 pt-4 border-t">
        <div className="flex gap-2 flex-wrap">
          <Link href={`/pets/${pet.id}`} passHref>
            <Button variant="outline" size="sm" aria-label={`Ver perfil de ${pet.name}`}>
              <Eye className="mr-2 h-4 w-4" />
              Ver
            </Button>
          </Link>
          <Link href={`/pets/${pet.id}/edit`} passHref>
            <Button variant="outline" size="sm" aria-label={`Editar perfil de ${pet.name}`}>
              <FilePenLine className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </Link>
        </div>
        <div className="flex gap-2 flex-wrap">
          <PetQRModal pet={pet} />

          {(appUser?.nivel === 'admin' || appUser?.uid === pet.userId) && (
             <DeletePetButton petId={pet.id} petName={pet.name} onPetDeleted={onPetDeleted} />
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
