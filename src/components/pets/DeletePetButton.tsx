
"use client";

import { deletePet } from "@/actions/petActions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface DeletePetButtonProps {
  petId: string;
  petName: string;
  onDeleted?: () => void;
}

export function DeletePetButton({ petId, petName, onDeleted }: DeletePetButtonProps) {
  const { toast } = useToast();
  const { appUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const isDemoUser = appUser?.nivel === 'demo';

  const handleDelete = async () => {
    if (isDemoUser) {
      toast({
        title: "Acción no permitida",
        description: "La cuenta de demostración no puede eliminar mascotas.",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    try {
      const result = await deletePet(petId);
      if (result.success) {
        toast({
          title: "Mascota Eliminada",
          description: `El perfil de ${petName} ha sido eliminado.`,
        });
        if (onDeleted) onDeleted();
      } else {
        toast({
          title: "Error",
          description: `No se pudo eliminar a ${petName}.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="icon" disabled={isDemoUser} title={isDemoUser ? "Deshabilitado para cuenta demo" : "Eliminar mascota"}>
            <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente el perfil de {petName}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isLoading} className="bg-destructive hover:bg-destructive/90">
            {isLoading ? "Eliminando..." : "Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
