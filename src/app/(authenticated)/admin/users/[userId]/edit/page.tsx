
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { updateUserProfileAction, getUserByIdFromFirestore } from "@/actions/userActions";
import type { AppUser } from "@/types";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, UserCog } from "lucide-react";
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


const adminEditProfileSchema = z.object({
  displayName: z.string().min(1, "El nombre para mostrar es obligatorio."),
  photoURL: z.string().url("Debe ser una URL válida para la foto.").or(z.literal("")).optional(),
  phone1: z.string().regex(/^[0-9+-]*$/, "Teléfono inválido").or(z.literal("")).optional(),
  phone2: z.string().regex(/^[0-9+-]*$/, "Teléfono inválido").or(z.literal("")).optional(),
  address: z.string().optional(),
  nivel: z.enum(["user", "admin", "demo"], {
    required_error: "Debes seleccionar un nivel de usuario.",
  }),
});

type AdminEditProfileFormData = z.infer<typeof adminEditProfileSchema>;

export default function AdminEditUserPage() {
  const { appUser: adminUser, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const userIdToEdit = params.userId as string;

  const [targetUser, setTargetUser] = useState<AppUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const isDemoUser = adminUser?.nivel === 'demo';

  const form = useForm<AdminEditProfileFormData>({
    resolver: zodResolver(adminEditProfileSchema),
    defaultValues: {
      displayName: "",
      photoURL: "",
      phone1: "",
      phone2: "",
      address: "",
      nivel: "user",
    },
  });

  const watchedPhotoURL = form.watch("photoURL");

  useEffect(() => {
    async function fetchUserToEdit() {
      if (!userIdToEdit) return;
      setIsLoadingUser(true);
      const user = await getUserByIdFromFirestore(userIdToEdit);
      if (user) {
        setTargetUser(user);
        form.reset({
          displayName: user.displayName || "",
          photoURL: user.photoURL || "",
          phone1: user.phone1 || "",
          phone2: user.phone2 || "",
          address: user.address || "",
          nivel: user.nivel || "user",
        });
        setPhotoPreview(user.photoURL || null);
      } else {
        toast({ title: "Error", description: "Usuario a editar no encontrado.", variant: "destructive" });
        router.replace("/admin/users");
      }
      setIsLoadingUser(false);
    }
    fetchUserToEdit();
  }, [userIdToEdit, form, router, toast]); 

  useEffect(() => {
    if (watchedPhotoURL && adminEditProfileSchema.shape.photoURL.safeParse(watchedPhotoURL).success) {
      setPhotoPreview(watchedPhotoURL);
    } else if (!watchedPhotoURL) {
      setPhotoPreview(null);
    }
  }, [watchedPhotoURL]);

  const onSubmit: SubmitHandler<AdminEditProfileFormData> = async (data) => {
    if (isDemoUser) {
      toast({ title: "Acción no permitida", description: "La cuenta de demostración no puede editar usuarios.", variant: "destructive"});
      return;
    }
    if (!targetUser?.uid) {
      toast({ title: "Error", description: "UID del usuario a editar no encontrado.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("displayName", data.displayName);
    if (data.photoURL !== undefined) formData.append("photoURL", data.photoURL);
    if (data.phone1 !== undefined) formData.append("phone1", data.phone1);
    if (data.phone2 !== undefined) formData.append("phone2", data.phone2);
    if (data.address !== undefined) formData.append("address", data.address);
    formData.append("nivel", data.nivel);
    
    try {
      const result = await updateUserProfileAction(targetUser.uid, formData, true); 
      if (result.success && result.data) {
        toast({ title: "Éxito", description: `Perfil de ${targetUser.displayName || targetUser.email} actualizado correctamente.` });
        router.push(`/admin/users/${targetUser.uid}`); 
      } else {
        toast({ title: "Error al Actualizar", description: result.error || "No se pudo actualizar el perfil.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error Inesperado", description: "Ocurrió un error inesperado.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoadingUser) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-8 w-3/4" />
        <div className="space-y-4 mt-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (adminUser?.nivel !== 'admin' && adminUser?.nivel !== 'demo') {
    return (
      <Alert variant="destructive" className="max-w-xl mx-auto">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Acceso Denegado</AlertTitle>
        <AlertDescription>
          No tienes permisos para acceder a esta página.
        </AlertDescription>
      </Alert>
    );
  }

  if (!targetUser) {
     return (
      <Alert variant="destructive" className="max-w-xl mx-auto">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Usuario no Encontrado</AlertTitle>
        <AlertDescription>
          El usuario que intentas editar no fue encontrado.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <UserCog className="h-8 w-8 text-primary" />
            <CardTitle className="text-3xl font-bold">Editar Perfil de Usuario (Admin)</CardTitle>
          </div>
          <CardDescription>Actualiza la información del perfil de <span className="font-semibold">{targetUser.displayName || targetUser.email}</span>.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email (No editable)</Label>
                <Input id="email" type="email" value={targetUser.email || ""} disabled className="bg-muted/50"/>
              </div>

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="displayName">Nombre para Mostrar</FormLabel>
                    <FormControl>
                      <Input id="displayName" {...field} disabled={isSubmitting || isDemoUser} />
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
                    <Select onValueChange={field.onChange} value={field.value || "user"} defaultValue={field.value || "user"} disabled={isSubmitting || isDemoUser}>
                      <FormControl>
                        <SelectTrigger id="nivel">
                          <SelectValue placeholder="Selecciona un nivel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">Usuario (user)</SelectItem>
                        <SelectItem value="admin">Administrador (admin)</SelectItem>
                        <SelectItem value="demo">Demo (demo)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="photoURL"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="photoURL">URL de Foto de Perfil (Opcional)</FormLabel>
                     <FormControl>
                        <Input id="photoURL" placeholder="https://ejemplo.com/foto.jpg" {...field} disabled={isSubmitting || isDemoUser} />
                     </FormControl>
                    {photoPreview && (
                      <div className="mt-2 rounded-full overflow-hidden border-2 border-primary h-24 w-24 mx-auto">
                        <Image
                          src={photoPreview}
                          alt="Vista previa foto de perfil"
                          width={96}
                          height={96}
                          className="object-cover w-full h-full"
                          onError={() => setPhotoPreview(`https://placehold.co/96x96.png?text=${(targetUser.displayName || 'U').charAt(0)}`)}
                          data-ai-hint="persona perfil"
                        />
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="phone1">Teléfono Principal (Opcional)</FormLabel>
                       <FormControl>
                          <Input id="phone1" type="tel" placeholder="Ej: 3001234567" {...field} disabled={isSubmitting || isDemoUser} />
                       </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="phone2">Teléfono Secundario (Opcional)</FormLabel>
                      <FormControl>
                        <Input id="phone2" type="tel" placeholder="Ej: 3109876543" {...field} disabled={isSubmitting || isDemoUser} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="address">Dirección (Opcional)</FormLabel>
                    <FormControl>
                        <Textarea
                        id="address"
                        placeholder="Ej: Calle Falsa 123, Ciudad"
                        {...field}
                        disabled={isSubmitting || isDemoUser}
                        rows={3}
                        />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting || authLoading || isLoadingUser || isDemoUser}>
                 {isDemoUser ? "Guardado deshabilitado para Demo" : (isSubmitting ? "Guardando Cambios..." : "Guardar Cambios")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
