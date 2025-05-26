
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { updateUserProfileAction } from "@/actions/userActions";
import { deleteImageFromImageKit } from "@/actions/imageKitActions";
import type { AppUser } from "@/types";
import { Textarea } from "@/components/ui/textarea";

import { useRouter } from "next/navigation"; 
import { ImageUploader } from "@/components/ImageUploader";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";


const profileSchema = z.object({
  displayName: z.string().min(1, "El nombre para mostrar es obligatorio."),
  photoURL: z.string().url("Debe ser una URL válida para la foto.").or(z.literal("")).optional().nullable(),
  photoPath: z.string().optional().nullable(),
  phone1: z.string().min(7, "El teléfono principal debe tener al menos 7 caracteres.").regex(/^[0-9+-]*$/, "Teléfono inválido."),
  phone2: z.string().min(7, "El teléfono secundario debe tener al menos 7 caracteres.").regex(/^[0-9+-]*$/, "Teléfono inválido").or(z.literal("")).optional(),
  address: z.string().min(1, "La dirección es obligatoria."),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function EditProfilePage() {
  const { appUser, isLoading: authLoading, setAppUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter(); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      photoURL: "",
      photoPath: null,
      phone1: "",
      phone2: "",
      address: "",
    },
  });

  useEffect(() => {
    if (appUser) {
      form.reset({
        displayName: appUser.displayName || "",
        photoURL: appUser.photoURL || "",
        photoPath: appUser.photoPath || null,
        phone1: appUser.phone1 || "",
        phone2: appUser.phone2 || "",
        address: appUser.address || "",
      });
    }
  }, [appUser, form.reset]);

  const handleImageUploadSuccess = async (
    newImageUrl: string,
    newImagePath: string | null 
  ) => {
    const oldPath = form.getValues("photoPath");

    if ((!newImageUrl || newImageUrl === '') && oldPath && !oldPath.startsWith('http')) {
      try {
        await deleteImageFromImageKit(oldPath);
      } catch (e) {
        console.error("[EditProfilePage] Failed to delete old profile image from ImageKit (removed by user)", e);
      }
    } else if (newImageUrl && newImagePath && oldPath && oldPath !== newImagePath && !oldPath.startsWith('http')) {
      try {
        await deleteImageFromImageKit(oldPath);
      } catch (e) {
        console.error("[EditProfilePage] Failed to delete old profile image from ImageKit (replaced by user)", e);
      }
    }
    
    form.setValue("photoURL", newImageUrl || null);
    form.setValue("photoPath", newImagePath || null);
  };


  const onSubmit: SubmitHandler<ProfileFormData> = async (data) => {
    if (!appUser?.uid) {
      toast({ title: "Error", description: "Usuario no encontrado.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("displayName", data.displayName);
    formData.append("phone1", data.phone1);
    formData.append("address", data.address);

    if (data.photoURL !== undefined) formData.append("photoURL", data.photoURL || "");
    if (data.photoPath !== undefined && data.photoPath !== null) formData.append("photoPath", data.photoPath); else formData.append("photoPath", "");
    if (data.phone2 !== undefined) formData.append("phone2", data.phone2);
    
    try {
      const result = await updateUserProfileAction(appUser.uid, formData);
      if (result.success && result.data) {
        setAppUser(result.data as AppUser); 
        toast({ title: "Éxito", description: "Perfil actualizado correctamente." });
        router.push('/home'); 
      } else {
        toast({ title: "Error al Actualizar", description: result.error || "No se pudo actualizar el perfil.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error en submit de editar perfil:", error);
      toast({ title: "Error Inesperado", description: "Ocurrió un error inesperado.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !appUser) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Editar Perfil</CardTitle>
          <CardDescription>Actualiza la información de tu perfil.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="photoURL"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Foto de Perfil</FormLabel>
                    <FormControl>
                      <ImageUploader
                        uploaderId="userProfilePhoto"
                        labelTitle=""
                        initialImageUrl={field.value}
                        initialImagePath={form.getValues("photoPath")}
                        onUploadSuccess={handleImageUploadSuccess}
                        folder="user_profile_images"
                        fileNamePrefix={appUser.uid || "usuario"}
                        imageAiHint="persona perfil"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={appUser.email || ""} disabled className="bg-muted/50"/>
                <p className="text-sm text-muted-foreground">El email no se puede cambiar desde esta pantalla.</p>
              </div>

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="displayName">Nombre para Mostrar</FormLabel>
                    <FormControl>
                      <Input id="displayName" {...field} disabled={isSubmitting} />
                    </FormControl>
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
                      <FormLabel htmlFor="phone1">Teléfono Principal</FormLabel>
                       <FormControl>
                          <Input id="phone1" type="tel" placeholder="Ej: 3001234567" {...field} disabled={isSubmitting} />
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
                        <Input id="phone2" type="tel" placeholder="Ej: 3109876543" {...field} disabled={isSubmitting} />
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
                    <FormLabel htmlFor="address">Dirección</FormLabel>
                    <FormControl>
                        <Textarea
                        id="address"
                        placeholder="Ej: Calle Falsa 123, Ciudad"
                        {...field}
                        disabled={isSubmitting}
                        rows={3}
                        />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting || authLoading}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
