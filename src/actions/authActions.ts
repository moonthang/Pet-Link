
'use server';

import { auth, createUserWithEmailAndPassword } from '@/lib/firebase';
import { createUserProfileInFirestore } from '@/actions/userActions';
import type { AppUser } from '@/types';

interface ActionResult {
  success: boolean;
  error?: string;
  userId?: string;
}

export async function registerUserWithEmailAndPasswordAction(formData: FormData): Promise<ActionResult> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const displayName = formData.get('displayName') as string;
  const phone1 = formData.get('phone1') as string;
  const address = formData.get('address') as string;

  if (!email || !password || !displayName || !phone1 || !address) {
    return { success: false, error: 'Todos los campos son obligatorios.' };
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    if (firebaseUser) {
      const profileResult = await createUserProfileInFirestore(
        firebaseUser.uid,
        email,
        displayName,
        'user',
        { phone1, address }
      );

      if (profileResult.success) {
        return { success: true, userId: firebaseUser.uid };
      } else {
        console.error('[authActions - register] Error creando perfil en Firestore después de Auth:', profileResult.error);
        return {
          success: false,
          error: `Usuario creado en autenticación, pero falló la creación del perfil en base de datos: ${profileResult.error}. Por favor, contacta a soporte.`
        };
      }
    } else {
      throw new Error('No se pudo obtener el usuario de Firebase Auth después de la creación.');
    }
  } catch (error: any) {
    console.error('[authActions - register] Error al registrar usuario:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    let errorMessage = 'Ocurrió un error inesperado durante el registro.';
    if (error.code) {
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Este correo electrónico ya está registrado.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'El formato del correo electrónico es inválido.';
          break;
        case 'auth/weak-password':
          errorMessage = 'La contraseña es demasiado débil (mínimo 6 caracteres).';
          break;
        default:
          errorMessage = `Error de autenticación: ${error.message}`;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}
