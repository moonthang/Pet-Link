
"use client";

import type { PetProfile, AppUser } from "@/types";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createPetAction, updatePetAction } from "@/actions/petActions";
import { deleteImageFromImageKit } from "@/actions/imageKitActions";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Dog, Cat, PawPrint, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format, isValid, parseISO, getYear, subYears } from "date-fns";
import { es } from "date-fns/locale";
import * as dateFnsTz from 'date-fns-tz';
import { cn } from "@/lib/utils";
import { ImageUploader } from '@/components/ImageUploader';

const BOGOTA_TIMEZONE = 'America/Bogota';

const petSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio."),
  tipoAnimal: z.enum(["Perro", "Gato"], {
    required_error: "Debes seleccionar un tipo de animal.",
  }),
  breed: z.string().min(1, "La raza es obligatoria.").nullable().optional(),
  photoUrl: z.string().url("Debe ser una URL válida.").or(z.literal("")).optional().nullable(),
  photoPath: z.string().optional().nullable(),
  photoUrl2: z.string().url("Debe ser una URL válida.").or(z.literal("")).optional().nullable(),
  photoPath2: z.string().optional().nullable(),
  fechaNacimiento: z.string().refine((val) => {
    if (!val) return false; 
    const date = parseISO(val);
    return isValid(date);
  }, "Fecha de nacimiento inválida o no seleccionada. Debe ser en formato AAAA-MM-DD.")
  .refine((val) => {
    if (!val) return false;
    const date = parseISO(val);
    return date <= new Date(new Date().setHours(23, 59, 59, 999));
  }, "La fecha de nacimiento no puede ser futura.").nullable(),
  sexo: z.enum(["Macho", "Hembra"], {
    required_error: "Debes seleccionar el sexo de la mascota.",
  }).nullable(),
  caracteristicaEspecial: z.string().max(200, "Máximo 200 caracteres.").optional().nullable(),
  ownerName: z.string().min(1, "El nombre del dueño es obligatorio.").nullable().optional(),
  ownerEmail: z.string().email("Dirección de email inválida").or(z.literal("")).optional().nullable(),
  ownerPhone1: z.string().min(7, "El teléfono principal debe tener al menos 7 dígitos.").regex(/^[0-9+-]*$/, "Teléfono principal inválido.").nullable().optional(),
  ownerPhone2: z.string().min(7, "El teléfono secundario debe tener al menos 7 dígitos.").regex(/^[0-9+-]*$/, "Teléfono secundario inválido.").or(z.literal("")).optional().nullable(),
});

type PetFormData = z.infer<typeof petSchema>;

interface PetFormProps {
  pet?: PetProfile;
}

const PLACEHOLDER_BREED_ADMIN = "Raza Pendiente";
const PLACEHOLDER_SEXO_ADMIN = "Macho" as PetProfile['sexo']; 
const PLACEHOLDER_OWNER_NAME_ADMIN = "Dueño Pendiente (Cliente completará)";
const PLACEHOLDER_OWNER_PHONE_ADMIN = "0000000"; 
const DEFAULT_BIRTH_DATE_STRING_ADMIN = () => format(subYears(new Date(), 1), 'yyyy-MM-dd');


export function PetForm({ pet }: PetFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { appUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const currentYear = getYear(new Date());
  const fromYear = 1990;
  const toYear = currentYear;

  const isAdminCreatingNew = appUser?.nivel === 'admin' && !pet;

  const form = useForm<PetFormData>({
    resolver: zodResolver(petSchema),
    defaultValues: {
      name: "",
      tipoAnimal: undefined,
      breed: "",
      photoUrl: "",
      photoPath: null,
      photoUrl2: "",
      photoPath2: null,
      fechaNacimiento: null,
      sexo: null,
      caracteristicaEspecial: "",
      ownerName: "",
      ownerEmail: "",
      ownerPhone1: "",
      ownerPhone2: "",
    },
  });

  const tipoAnimalWatched = form.watch("tipoAnimal");
  const nameWatched = form.watch("name");


  useEffect(() => {
    if (pet) {
      const initialValues: PetFormData = {
        name: pet.name || "",
        tipoAnimal: pet.tipoAnimal || undefined,
        breed: pet.breed || "",
        photoUrl: pet.photoUrl || "",
        photoPath: pet.photoPath || null,
        photoUrl2: pet.photoUrl2 || "",
        photoPath2: pet.photoPath2 || null,
        fechaNacimiento: pet.fechaNacimiento && isValid(new Date(pet.fechaNacimiento))
          ? dateFnsTz.formatInTimeZone(new Date(pet.fechaNacimiento), BOGOTA_TIMEZONE, 'yyyy-MM-dd')
          : null,
        sexo: pet.sexo || null,
        caracteristicaEspecial: pet.caracteristicaEspecial || "",
        ownerName: pet.ownerName || "",
        ownerEmail: pet.ownerEmail || "",
        ownerPhone1: pet.ownerPhone1 || "",
        ownerPhone2: pet.ownerPhone2 || "",
      };
      form.reset(initialValues);

      if (appUser && pet.userId === appUser.uid && 
          (initialValues.ownerName === PLACEHOLDER_OWNER_NAME_ADMIN || !initialValues.ownerName)
      ) {
        form.setValue("ownerName", appUser.displayName || "");
        if (!initialValues.ownerEmail && appUser.email) {
          form.setValue("ownerEmail", appUser.email);
        }
        if (initialValues.ownerPhone1 === PLACEHOLDER_OWNER_PHONE_ADMIN || !initialValues.ownerPhone1) {
          form.setValue("ownerPhone1", appUser.phone1 || "");
        }
         if (!initialValues.ownerPhone2 && appUser.phone2) {
          form.setValue("ownerPhone2", appUser.phone2 || "");
        }
      }
    } else if (appUser && !isAdminCreatingNew) {
      form.reset({
        name: "",
        tipoAnimal: undefined,
        breed: "",
        photoUrl: "", photoPath: null, photoUrl2: "", photoPath2: null,
        fechaNacimiento: null,
        sexo: null,
        caracteristicaEspecial: "",
        ownerName: appUser.displayName || "",
        ownerEmail: appUser.email || "",
        ownerPhone1: appUser.phone1 || "",
        ownerPhone2: appUser.phone2 || "",
      });
    } else if (isAdminCreatingNew) {
       form.reset({
        name: "",
        tipoAnimal: undefined,
        breed: PLACEHOLDER_BREED_ADMIN,
        photoUrl: "", photoPath: null, photoUrl2: "", photoPath2: null,
        fechaNacimiento: DEFAULT_BIRTH_DATE_STRING_ADMIN(),
        sexo: PLACEHOLDER_SEXO_ADMIN,
        caracteristicaEspecial: "",
        ownerName: PLACEHOLDER_OWNER_NAME_ADMIN,
        ownerEmail: "",
        ownerPhone1: PLACEHOLDER_OWNER_PHONE_ADMIN,
        ownerPhone2: "",
      });
    }
  }, [appUser, pet, isAdminCreatingNew, form]);


  const handleImageUploadSuccess = async (
    newImageUrl: string,
    newImagePath: string | null,
    imageField: 'photoUrl' | 'photoUrl2',
    pathField: 'photoPath' | 'photoPath2'
  ) => {
    const oldPath = form.getValues(pathField);

    if ((!newImageUrl || newImageUrl === '') && oldPath && !oldPath.startsWith('http')) {
      try {
        await deleteImageFromImageKit(oldPath); 
        toast({ title: "Imagen Anterior Eliminada", description: `La imagen anterior de ${pathField} ha sido eliminada de ImageKit.`});
      } catch (e) {
        console.error(`[PetForm] Failed to delete old image ${oldPath} from ImageKit`, e);
      }
    } else if (newImageUrl && newImagePath && oldPath && oldPath !== newImagePath && !oldPath.startsWith('http')) {
      try {
        await deleteImageFromImageKit(oldPath);
        toast({ title: "Imagen Anterior Eliminada", description: `La imagen anterior de ${pathField} ha sido eliminada de ImageKit.`});
      } catch (e) {
        console.error(`[PetForm] Failed to delete old image ${oldPath} from ImageKit`, e);
      }
    }
    
    form.setValue(imageField, newImageUrl || null);
    form.setValue(pathField, newImagePath || null);
  };


  const onSubmit: SubmitHandler<PetFormData> = async (data) => {
    if (!appUser?.uid) {
      toast({ title: "Error de Autenticación", description: "No se pudo identificar al usuario.", variant: "destructive" });
      return;
    }
    setIsLoading(true);

    const formDataToSubmit = new FormData();
    formDataToSubmit.append("isAdminCreatingNew", isAdminCreatingNew.toString());
    
    let petNameForPlaceholder = data.name || "Mascota";
    if (isAdminCreatingNew && !data.name) {
      petNameForPlaceholder = "Nueva Mascota";
    }

    (Object.keys(data) as Array<keyof PetFormData>).forEach(key => {
        let value = data[key];
        if (key === 'photoUrl' && !value) {
             value = `https://placehold.co/300x200.png?text=${encodeURIComponent(petNameForPlaceholder)}&data-ai-hint=${tipoAnimalWatched?.toLowerCase() || 'animal'}`;
        }

        if (value !== undefined && value !== null) {
            formDataToSubmit.append(key, String(value));
        } else {
            formDataToSubmit.append(key, ""); 
        }
    });
    
    if (!data.photoUrl) {
      formDataToSubmit.set("photoPath", "");
    }
    if (!data.photoUrl2) {
      formDataToSubmit.set("photoPath2", "");
    }

    let result;
    if (pet) {
        result = await updatePetAction(pet.id, formDataToSubmit);
    } else {
        result = await createPetAction(formDataToSubmit, appUser.uid, appUser.displayName || appUser.email || "Usuario desconocido");
    }

    setIsLoading(false); 

    if (result?.error) {
        toast({ title: "Error al Guardar", description: result.error, variant: "destructive" });
    } else if (result?.petId) {
        toast({ title: "¡Éxito!", description: `Perfil de mascota ${pet ? "actualizado" : "creado"} exitosamente.` });
        if (isAdminCreatingNew && !pet) {
            router.push('/home');
        } else {
            router.push(`/pets/${result.petId}`);
        }
        router.refresh();
    } else {
        toast({ title: "Respuesta Inesperada", description: "La operación finalizó pero no se recibió una respuesta clara.", variant: "destructive" });
    }
  };

  const getAiHintForUploader = (mainPhoto: boolean = true) => {
    const currentType = tipoAnimalWatched || pet?.tipoAnimal;
    let hint = "mascota";
    if (currentType === "Perro") hint = "perro mascota";
    if (currentType === "Gato") hint = "gato mascota";
    return mainPhoto ? hint : `${hint} adicional`;
  };

  const FormHeaderIcon = tipoAnimalWatched === "Gato" ? Cat : tipoAnimalWatched === "Perro" ? Dog : PawPrint;


  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <FormHeaderIcon className="h-6 w-6 text-primary" />
          <CardTitle>{pet ? `Editar Perfil de ${pet.name}` : (isAdminCreatingNew ? "Registrar Nueva Mascota" : "Crear Nuevo Perfil de Mascota")}</CardTitle>
        </div>
        <CardDescription>
          {pet ? "Actualiza los detalles de esta mascota." : (isAdminCreatingNew ? "Ingresa nombre y tipo. El cliente completará el resto después de reclamar la mascota." : "Completa los detalles para agregar una nueva mascota.")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <h3 className="text-lg font-semibold border-b pb-2">Información de la Mascota</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="name">Nombre</FormLabel>
                    <FormControl><Input id="name" placeholder="Ej: Buddy" {...field} disabled={isLoading} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tipoAnimal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="tipoAnimal">Tipo de Animal</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""} defaultValue={field.value || ""} disabled={isLoading}>
                      <FormControl><SelectTrigger id="tipoAnimal"><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Perro">Perro</SelectItem>
                        <SelectItem value="Gato">Gato</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {isAdminCreatingNew ? (
              <>
                <FormField control={form.control} name="breed" render={({ field }) => (<FormItem className="hidden"><FormControl><Input {...field} value={PLACEHOLDER_BREED_ADMIN} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="sexo" render={({ field }) => (<FormItem className="hidden"><FormControl><Input {...field} value={PLACEHOLDER_SEXO_ADMIN} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="fechaNacimiento" render={({ field }) => (<FormItem className="hidden"><FormControl><Input {...field} value={DEFAULT_BIRTH_DATE_STRING_ADMIN()} /></FormControl></FormItem>)} />
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="breed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="breed">Raza</FormLabel>
                        <FormControl><Input id="breed" placeholder="Ej: Golden Retriever" {...field} value={field.value ?? ""} disabled={isLoading} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sexo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="sexo">Sexo</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""} defaultValue={field.value || ""} disabled={isLoading}>
                          <FormControl><SelectTrigger id="sexo"><SelectValue placeholder="Selecciona el sexo" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="Macho">Macho</SelectItem>
                            <SelectItem value="Hembra">Hembra</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="fechaNacimiento"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Fecha de Nacimiento</FormLabel>
                      <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                              disabled={isLoading}
                            >
                              {field.value && isValid(parseISO(field.value)) ? (
                                format(dateFnsTz.toDate(field.value + "T00:00:00", { timeZone: BOGOTA_TIMEZONE }), "PPP", { locale: es })
                              ) : (<span>Selecciona una fecha</span>)}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value && isValid(parseISO(field.value)) ? parseISO(field.value) : undefined}
                            onSelect={(date) => {
                                field.onChange(date ? format(date, 'yyyy-MM-dd') : null);
                            }}
                            disabled={(date) => date > new Date(new Date().setHours(23, 59, 59, 999)) || date < new Date("1990-01-01")}
                            locale={es}
                            captionLayout="dropdown-buttons"
                            fromYear={fromYear}
                            toYear={toYear}
                          />
                           <div className="p-2 border-t text-right bg-background">
                            <Button type="button" size="sm" onClick={() => setIsCalendarOpen(false)} disabled={isLoading}>OK</Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="caracteristicaEspecial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="caracteristicaEspecial">Característica Especial (Opcional)</FormLabel>
                      <FormControl><Textarea id="caracteristicaEspecial" placeholder="Ej: Muy juguetón, tiene una mancha particular, etc." {...field} value={field.value ?? ""} disabled={isLoading} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="photoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <ImageUploader
                            uploaderId="petPhoto1"
                            labelTitle="Foto Principal de la Mascota"
                            initialImageUrl={field.value}
                            initialImagePath={form.getValues("photoPath")}
                            onUploadSuccess={(imageUrl, imagePath) => {
                              handleImageUploadSuccess(imageUrl, imagePath, 'photoUrl', 'photoPath');
                            }}
                            folder="pets_profile_images"
                            fileNamePrefix={nameWatched || "mascota"}
                            imageAiHint={getAiHintForUploader(true)}
                          />
                        </FormControl>
                        {(appUser?.nivel !== 'admin' && (!form.getValues("photoUrl") || form.getValues("photoUrl")?.startsWith('https://placehold.co'))) && (
                            <FormDescription className="text-primary">
                              Es recomendable subir una foto principal para tu mascota.
                            </FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="photoUrl2"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <ImageUploader
                            uploaderId="petPhoto2"
                            labelTitle="Foto Secundaria (Opcional)"
                            initialImageUrl={field.value}
                            initialImagePath={form.getValues("photoPath2")}
                            onUploadSuccess={(imageUrl, imagePath) => {
                              handleImageUploadSuccess(imageUrl, imagePath, 'photoUrl2', 'photoPath2');
                            }}
                            folder="pets_profile_images_secondary"
                            fileNamePrefix={`${nameWatched || "mascota"}-alt`}
                            imageAiHint={getAiHintForUploader(false)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}
            
            {!isAdminCreatingNew && (
              <>
                <h3 className="text-lg font-semibold border-b pb-2 pt-4">Información del Dueño</h3>
                <FormField
                  control={form.control}
                  name="ownerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="ownerName">Nombre del Dueño</FormLabel>
                      <FormControl><Input id="ownerName" placeholder={"Ej: Juan Pérez"} {...field} value={field.value ?? ""} disabled={isLoading} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="ownerPhone1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="ownerPhone1">Teléfono Principal</FormLabel>
                        <FormControl><Input id="ownerPhone1" type="tel" placeholder={"Ej: 3001234567"} {...field} value={field.value ?? ""} disabled={isLoading} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ownerPhone2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="ownerPhone2">Teléfono Secundario (Opcional)</FormLabel>
                        <FormControl><Input id="ownerPhone2" type="tel" placeholder="Ej: 3109876543" {...field} value={field.value ?? ""} disabled={isLoading} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="ownerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="ownerEmail">Email del Dueño (Opcional)</FormLabel>
                      <FormControl><Input id="ownerEmail" type="email" placeholder="Ej: juan.perez@ejemplo.com" {...field} value={field.value ?? ""} disabled={isLoading} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {isAdminCreatingNew && (
              <>
                <h3 className="text-lg font-semibold border-b pb-2 pt-4">Información del Dueño</h3>
                <FormField
                    control={form.control}
                    name="ownerName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre del Dueño</FormLabel>
                            <Input {...field} value={field.value || PLACEHOLDER_OWNER_NAME_ADMIN} disabled />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="ownerPhone1"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Teléfono Principal</FormLabel>
                            <Input {...field} value={field.value || PLACEHOLDER_OWNER_PHONE_ADMIN} disabled />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="ownerEmail"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel htmlFor="ownerEmailAdmin">Email del Dueño (Opcional)</FormLabel>
                        <FormControl><Input id="ownerEmailAdmin" type="email" placeholder="juan.perez@ejemplo.com" {...field} value={field.value ?? ""} disabled={isLoading} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                 <FormField
                    control={form.control}
                    name="ownerPhone2"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel htmlFor="ownerPhone2Admin">Teléfono Secundario (Opcional)</FormLabel>
                        <FormControl><Input id="ownerPhone2Admin" type="tel" placeholder="3109876543" {...field} value={field.value ?? ""} disabled={isLoading} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
              </>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {pet ? "Guardando Cambios..." : "Creando Perfil..."}
                </>
                ) : (pet ? "Guardar Cambios" : "Crear Perfil")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
