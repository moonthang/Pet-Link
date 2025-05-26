
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { UserPlus, Loader2 } from 'lucide-react';
import { registerUserWithEmailAndPasswordAction } from '@/actions/authActions';
import {
  auth,
  GoogleAuthProvider,
  signInWithPopup,
} from '@/lib/firebase';
import { createUserProfileInFirestore, getUserByIdFromFirestore } from '@/actions/userActions';
import type { AppUser } from '@/types';
import logoImage from '@/assets/logo/logo.png';

const registrationSchema = z.object({
  displayName: z.string().min(1, 'El nombre para mostrar es obligatorio.'),
  email: z.string().email('Debe ser un email válido.'),
  confirmEmail: z.string().email('Debe ser un email válido para confirmar.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
  phone1: z.string().min(7, 'El teléfono principal debe tener al menos 7 caracteres.').regex(/^[0-9+-]*$/, 'Teléfono inválido.'),
  address: z.string().min(1, 'La dirección es obligatoria.'),
}).refine(data => data.email === data.confirmEmail, {
  message: "Los correos electrónicos no coinciden.",
  path: ["confirmEmail"],
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      displayName: '',
      email: '',
      confirmEmail: '',
      password: '',
      phone1: '',
      address: '',
    },
  });

  const onSubmit: SubmitHandler<RegistrationFormData> = async (data) => {
    setIsLoading(true);
    const formData = new FormData();
    formData.append('displayName', data.displayName);
    formData.append('email', data.email);
    formData.append('password', data.password);
    formData.append('phone1', data.phone1);
    formData.append('address', data.address);

    try {
      const result = await registerUserWithEmailAndPasswordAction(formData);
      if (result.success) {
        toast({
          title: '¡Registro Exitoso!',
          description: 'Tu cuenta ha sido creada. Ahora puedes iniciar sesión.',
        });
        router.push('/');
      } else {
        toast({
          title: 'Error de Registro',
          description: result.error || 'No se pudo completar el registro.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error en el formulario de registro:', error);
      toast({
        title: 'Error Inesperado',
        description: 'Ocurrió un error inesperado.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      if (firebaseUser) {
        let userProfile = await getUserByIdFromFirestore(firebaseUser.uid);

        if (!userProfile) {
          const profileCreationResult = await createUserProfileInFirestore(
            firebaseUser.uid,
            firebaseUser.email || '',
            firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario de Google',
            'user',
            {
              photoURL: firebaseUser.photoURL,
              photoPath: null,
              phone1: null,
              address: null,
            }
          );

          if (profileCreationResult.success && profileCreationResult.data) {
            userProfile = profileCreationResult.data as AppUser;
          } else {
            throw new Error(profileCreationResult.error || 'No se pudo crear el perfil de usuario en Firestore después del inicio de sesión con Google.');
          }
        }

        toast({
          title: '¡Inicio de sesión con Google exitoso!',
          description: `Bienvenido/a, ${userProfile?.displayName || firebaseUser.displayName || 'Usuario'}. Redirigiendo...`,
        });
        router.push('/home');
      } else {
        throw new Error('No se pudo obtener el usuario de Firebase después del inicio de sesión con Google.');
      }
    } catch (error: any) {
      console.error('Error durante el inicio de sesión con Google:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      let errorMessage = 'Ocurrió un error durante el inicio de sesión con Google.';
      if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'Ya existe una cuenta con este correo electrónico usando un método de inicio de sesión diferente.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'El proceso de inicio de sesión con Google fue cancelado.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({
        title: 'Error de Inicio de Sesión con Google',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4">
      <div className="flex items-center space-x-3 mb-8">
         <Image
          src={logoImage}
          alt="Pet Link Logo"
          width={120}
          height={48}
          priority
          data-ai-hint="logo brand"
        />
        <h1 className="text-4xl font-bold">Pet Link</h1>
      </div>
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold flex items-center justify-center">
            <UserPlus className="mr-2 h-7 w-7" /> Crear Cuenta
          </CardTitle>
          <CardDescription>
            Completa tus datos para registrarte en Pet Link.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="displayName">Nombre para Mostrar</Label>
              <Input
                id="displayName"
                {...form.register('displayName')}
                disabled={isLoading || isGoogleLoading}
                placeholder=""
              />
              {form.formState.errors.displayName && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.displayName.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register('email')}
                disabled={isLoading || isGoogleLoading}
                placeholder=""
              />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="confirmEmail">Confirmar Email</Label>
              <Input
                id="confirmEmail"
                type="email"
                {...form.register('confirmEmail')}
                disabled={isLoading || isGoogleLoading}
                placeholder=""
              />
              {form.formState.errors.confirmEmail && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.confirmEmail.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                {...form.register('password')}
                disabled={isLoading || isGoogleLoading}
                placeholder=""
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.password.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="phone1">Teléfono Principal</Label>
              <Input
                id="phone1"
                type="tel"
                placeholder=""
                {...form.register('phone1')}
                disabled={isLoading || isGoogleLoading}
              />
              {form.formState.errors.phone1 && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.phone1.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="address">Dirección</Label>
              <Textarea
                id="address"
                placeholder=""
                {...form.register('address')}
                disabled={isLoading || isGoogleLoading}
                rows={3}
              />
              {form.formState.errors.address && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.address.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Crear Cuenta con Email'
              )}
            </Button>
          </form>
          <div className="mt-4 relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                O
              </span>
            </div>
          </div>
          <Button variant="outline" className="w-full mt-4" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
            {isGoogleLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                <path fill="currentColor" d="M488 261.8C488 400.3 381.5 512 244 512 110.5 512 0 399.4 0 259.4 0 123.3 105.3 8 241.7 8c64.8 0 119.8 25.8 157.8 62.5L347.7 129C317.1 100.3 283.6 82.5 241.7 82.5c-81.9 0-148.9 67.7-148.9 151.4 0 83.7 67 151.4 148.9 151.4 90.1 0 131.3-63.5 135.7-95.2H244v-65.7h244.1c2.4 12.9 3.9 26.6 3.9 41.2z"></path>
              </svg>
            )}
            Registrarse con Google
          </Button>
          <p className="mt-6 text-center text-sm">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/" className="font-medium text-primary hover:underline">
              Inicia Sesión Aquí
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
