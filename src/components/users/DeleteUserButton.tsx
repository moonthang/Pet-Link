
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
import { Button, type ButtonProps } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteUserAndPetsAction } from "@/actions/userActions";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface DeleteUserButtonProps extends ButtonProps {
  userId: string;
  userName: string;
  onUserDeleted: (userId: string) => void;
}

export function DeleteUserButton({ userId, userName, onUserDeleted, variant = "destructive", size = "icon", className, ...props }: DeleteUserButtonProps) {
  const { toast } = useToast();
  const { appUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const isDemoUser = appUser?.nivel === 'demo';

  const handleDelete = async () => {
    if (isDemoUser) {
      toast({
        title: "Acción no permitida",
        description: "La cuenta de demostración no puede eliminar usuarios.",
        variant: "destructive"
      });
      return;
    }
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
        <Button 
          variant={variant} 
          size={size} 
          disabled={isDemoUser} 
          title={isDemoUser ? "Deshabilitado para cuenta demo" : "Eliminar usuario"}
          className={cn(className)}
          {...props}
        > 
          <Trash2 className="h-4 w-4" />
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
