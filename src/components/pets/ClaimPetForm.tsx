
'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { claimPetByIdentifier } from '@/actions/petActions';
import { KeyRound, Loader2 } from 'lucide-react';

const claimPetSchema = z.object({
  identifier: z.string().min(1, 'El identificador es obligatorio.'),
});

type ClaimPetFormData = z.infer<typeof claimPetSchema>;

export function ClaimPetForm() {
  const { appUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ClaimPetFormData>({
    resolver: zodResolver(claimPetSchema),
    defaultValues: {
      identifier: '',
    },
  });

  const onSubmit: SubmitHandler<ClaimPetFormData> = async (data) => {
    if (!appUser?.uid) {
      toast({
        title: 'Error de Autenticación',
        description: 'No se pudo identificar al usuario. Por favor, inicia sesión de nuevo.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    try {
      const result = await claimPetByIdentifier(data.identifier, appUser.uid);
      
      if (result.error) {
        toast({
          title: 'Error al Agregar Mascota',
          description: result.error,
          variant: 'destructive',
        });
      } else if (result.petId) {
        toast({
          title: '¡Mascota Agregada!',
          description: 'Ahora puedes editar y completar la información de tu mascota.',
        });
        router.push(`/pets/${result.petId}/edit`);
      } else {
         toast({
          title: 'Error Inesperado',
          description: 'Ocurrió un error al procesar la solicitud.',
          variant: 'destructive',
        });
      }
    } catch (error) {
        console.error("[ClaimPetForm] Error inesperado en submit:", error);
        toast({
          title: 'Error Inesperado',
          description: 'Ocurrió un error inesperado al agregar la mascota.',
          variant: 'destructive',
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader>
        <div className="flex items-center space-x-2 mb-2">
          <KeyRound className="h-6 w-6 text-primary" />
          <CardTitle>Ingresa el Identificador de tu Mascota</CardTitle>
        </div>
        <CardDescription>
          El administrador te proporcionó un identificador único para tu mascota.
          Ingrésalo aquí para asociarla a tu cuenta y completar su perfil.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="identifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="identifier">Identificador de Mascota</FormLabel>
                  <FormControl>
                    <Input
                      id="identifier"
                      placeholder="Ej: Kfg7sLpQjR2mX..."
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormDescription>
                    Este es el código único de la mascota proporcionado por el administrador.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                'Agregar y Editar Perfil de Mascota'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
