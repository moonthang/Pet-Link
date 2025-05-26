
'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { auth, createUserWithEmailAndPassword } from "@/lib/firebase"; 
import { createUserProfileInFirestore } from "@/actions/userActions";
import { UserPlus } from "lucide-react";

const newUserSchema = z.object({
  email: z.string().email("Debe ser un email válido."),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres."),
  displayName: z.string().min(1, "El nombre para mostrar es obligatorio."),
  nivel: z.enum(["user", "admin"], {
    required_error: "Debes seleccionar un nivel de usuario.",
  }),
});

type NewUserFormData = z.infer<typeof newUserSchema>;

export default function AdminAddNewUserPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<NewUserFormData>({
    resolver: zodResolver(newUserSchema),
    defaultValues: {
      email: "",
      password: "",
      displayName: "",
      nivel: "user",
    },
  });

  const onSubmit: SubmitHandler<NewUserFormData> = async (data) => {
    setIsLoading(true);
    try {
      
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = userCredential.user;

      if (firebaseUser) {
        
        const profileResult = await createUserProfileInFirestore(
          firebaseUser.uid,
          data.email,
          data.displayName,
          data.nivel
        );

        if (profileResult.success === false && profileResult.error) { 
          toast({
            title: "Error al Crear Perfil en Firestore",
            description: profileResult.error,
            variant: "destructive",
          });
        } else {
          toast({
            title: "¡Usuario Creado!",
            description: `El usuario ${data.displayName} (${data.email}) ha sido creado exitosamente.`,
          });
          router.push("/admin/users"); 
        }
      } else {
        throw new Error("No se pudo obtener el usuario de Firebase Auth después de la creación.");
      }
    } catch (error: any) {
      console.error("Error al crear nuevo usuario:", error);
      let errorMessage = "Ocurrió un error inesperado al crear el usuario.";
      if (error.code) { 
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'Este email ya está registrado.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'El formato del email es inválido.';
            break;
          case 'auth/weak-password':
            errorMessage = 'La contraseña es demasiado débil.';
            break;
          default:
            errorMessage = error.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({
        title: "Error al Crear Usuario",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-2 mb-2">
            <UserPlus className="h-6 w-6 text-primary" />
            <CardTitle>Agregar Nuevo Usuario</CardTitle>
          </div>
          <CardDescription>
            Completa los detalles para crear una nueva cuenta de usuario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="displayName">Nombre para Mostrar</FormLabel>
                    <FormControl>
                      <Input id="displayName" placeholder="Ej: Juan Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="email">Email</FormLabel>
                    <FormControl>
                      <Input id="email" type="email" placeholder="usuario@ejemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="password">Contraseña</FormLabel>
                    <FormControl>
                      <Input id="password" type="password" placeholder="Mínimo 6 caracteres" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nivel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="nivel">Nivel de Usuario</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""} defaultValue={field.value || "user"}>
                      <FormControl>
                        <SelectTrigger id="nivel">
                          <SelectValue placeholder="Selecciona un nivel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">Usuario (user)</SelectItem>
                        <SelectItem value="admin">Administrador (admin)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creando Usuario..." : "Crear Usuario"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
