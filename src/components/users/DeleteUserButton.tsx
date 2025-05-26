
"use client";

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
import { deleteUserAndPetsAction } from "@/actions/userActions";

interface DeleteUserButtonProps {
  userId: string;
  userName: string;
  onUserDeleted: (userId: string) => void;
}

export function DeleteUserButton({ userId, userName, onUserDeleted }: DeleteUserButtonProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const result = await deleteUserAndPetsAction(userId);
      if (result.success) {
        toast({
          title: "Usuario Eliminado",
          description: `El usuario ${userName} y sus mascotas asociadas han sido eliminados de Firestore.`,
        });
        onUserDeleted(userId);
        setIsDialogOpen(false); 
      } else {
        toast({
          title: "Error al Eliminar",
          description: result.error || `No se pudo eliminar al usuario ${userName}.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error en DeleteUserButton:", error);
      toast({
        title: "Error Inesperado",
        description: "Ocurrió un error inesperado al intentar eliminar el usuario.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm"> 
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente el perfil del usuario ${userName} 
            y todas sus mascotas asociadas de Firestore. 
            <strong className="block mt-2">Importante:</strong> Esta acción NO elimina al usuario del sistema de autenticación de Firebase.
            Eso debe hacerse manualmente desde la consola de Firebase si es necesario.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isLoading} className="bg-destructive hover:bg-destructive/90">
            {isLoading ? "Eliminando..." : "Sí, eliminar usuario y mascotas"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
