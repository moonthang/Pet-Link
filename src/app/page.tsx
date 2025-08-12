
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  auth,
  signInWithEmailAndPassword,
  doc,
  getDoc,
  setDoc,
  db
} from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LogIn, Loader2, Info } from 'lucide-react';
import type { AppUser } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import logoImage from '@/assets/logo/logo.png';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser, appUser, isLoading: authIsLoading, setAppUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authIsLoading && currentUser && appUser) {
      if (appUser.nivel === 'admin' || appUser.nivel === 'demo') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/home');
      }
    }
  }, [currentUser, appUser, authIsLoading, router]);


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || authIsLoading) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      let appUserData: AppUser;

      if (userDocSnap.exists()) {
        const firestoreData = userDocSnap.data();
        appUserData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          ...firestoreData
        } as AppUser;

        if (typeof appUserData.nivel === 'undefined') {
          appUserData.nivel = 'user';
          await setDoc(userDocRef, { nivel: 'user' }, { merge: true });
        }
      } else {
        const newUserProfileData: AppUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          nivel: 'user',
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Nuevo Usuario',
          phone1: null,
          phone2: null,
          address: null,
          photoURL: firebaseUser.photoURL || null,
          photoPath: null,
        };
        await setDoc(userDocRef, newUserProfileData);
        appUserData = newUserProfileData;
      }

      setAppUser(appUserData);

      toast({
        title: 'Inicio de Sesión Exitoso',
        description: `¡Bienvenido ${appUserData.displayName || appUserData.email}! Redirigiendo...`,
      });

    } catch (e: any) {
      let errorMessage = "Error al iniciar sesión. Por favor, verifica tus credenciales e inténtalo de nuevo.";
      if (e.code) {
        switch (e.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = 'Correo o contraseña inválidos.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'El formato del correo es inválido.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Demasiados intentos fallidos de inicio de sesión. Por favor, inténtalo más tarde.';
            break;
          case 'permission-denied':
            errorMessage = 'Permiso denegado para acceder a los datos del perfil. Verifica las reglas de Firestore.';
            break;
          default:
            errorMessage = `Ocurrió un error: ${e.message || 'Desconocido'}`;
        }
      }
      setError(errorMessage);
      toast({
        title: 'Fallo de Inicio de Sesión',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authIsLoading || (currentUser && appUser)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Image
          src={logoImage}
          alt="Pet Link Logo"
          width={80}
          height={32}
          priority
          data-ai-hint="logo brand"
        />
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4">
      <div className="flex items-center space-x-3 mb-8">
        <Image
          src={logoImage}
          alt="Pet Link Logo"
          width={80}
          height={32}
          priority
          data-ai-hint="logo brand"
        />
        <h1 className="text-4xl font-bold">Pet Link</h1>
      </div>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold flex items-center justify-center">
            <LogIn className="mr-2 h-7 w-7" /> Iniciar Sesión
          </CardTitle>
          <CardDescription>Ingresa tus credenciales para acceder a tu cuenta.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 !text-blue-700" />
              <AlertTitle className="text-blue-800">¡Modo Demostración!</AlertTitle>
              <AlertDescription className="text-blue-700">
                  Para explorar la vista de administrador, usa:
                  <ul className="list-disc pl-5 mt-1">
                      <li><strong>Email:</strong> demo@petlink.com</li>
                      <li><strong>Contraseña:</strong> Petlink</li>
                  </ul>
              </AlertDescription>
          </Alert>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=""
                required
                disabled={isSubmitting || authIsLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=""
                required
                disabled={isSubmitting || authIsLoading}
              />
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting || authIsLoading}>
              {isSubmitting || authIsLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿No tienes cuenta?{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
