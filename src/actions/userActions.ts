
"use server";

import { db, doc, setDoc, getDoc, updateDoc, collection, getDocs, query, orderBy, deleteDoc, writeBatch, where } from "@/lib/firebase";
import type { AppUser } from "@/types";
import { revalidatePath } from "next/cache";
import { deleteImageFromImageKit } from "./imageKitActions";


interface ActionResult {
  success: boolean;
  error?: string;
  data?: any;
}


export async function createUserProfileInFirestore(
  uid: string,
  email: string,
  displayName: string,
  nivelParam: 'user' | 'admin',
  additionalData?: {
    photoURL?: string | null;
    photoPath?: string | null;
    phone1?: string | null;
    phone2?: string | null;
    address?: string | null;
  }
): Promise<ActionResult> {
  try {
    const userDocRef = doc(db, "users", uid);
    const newUserProfile: AppUser = {
      uid, 
      email,
      displayName: displayName || email.split('@')[0] || 'Usuario', 
      nivel: nivelParam || 'user', 
      photoURL: additionalData?.photoURL || null,
      photoPath: additionalData?.photoPath || null,
      phone1: additionalData?.phone1 || null,
      phone2: additionalData?.phone2 || null,
      address: additionalData?.address || null,
    };

    await setDoc(userDocRef, newUserProfile);

    return { success: true, data: newUserProfile };
  } catch (error: any) {
    console.error("[userActions - createUserProfile] Error al crear perfil de usuario en Firestore:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    let errorMessage = "Ocurrió un error inesperado al crear el perfil de usuario en Firestore.";
    if (error.code) {
      errorMessage = `Error de Firestore (${error.code}): ${error.message}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}


export async function updateUserProfileAction(
  uid: string, 
  formData: FormData,
  isAdminEditing: boolean = false
): Promise<ActionResult> {
  const displayName = formData.get("displayName") as string;
  const photoURL = formData.get("photoURL") as string | undefined; 
  const photoPath = formData.get("photoPath") as string | undefined; 
  const phone1 = formData.get("phone1") as string; 
  const phone2 = formData.get("phone2") as string | undefined;
  const address = formData.get("address") as string; 
  const nivelForm = formData.get("nivel") as AppUser['nivel'] | undefined; 

  if (!displayName) {
    return { success: false, error: "Nombre para Mostrar es obligatorio." };
  }
  if (!isAdminEditing) { 
    if (!phone1) return { success: false, error: "Teléfono Principal es obligatorio." };
    if (!address) return { success: false, error: "Dirección es obligatoria." };
  }


  const userDocRef = doc(db, "users", uid);
  const batch = writeBatch(db); 

  try {
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) {
      return { success: false, error: "Perfil de usuario no encontrado." };
    }
    const existingUserData = userDocSnap.data() as AppUser;
    const oldPhotoPath = existingUserData.photoPath;

    const updateData: Partial<AppUser> = {
      displayName,
      phone1: phone1 || null, 
      address: address || null, 
    };
    
    if (photoURL !== undefined) {
        updateData.photoURL = photoURL || null; 
    }
    if (photoPath !== undefined) {
        updateData.photoPath = photoPath || null; 
    }
    if (phone2 !== undefined) {
        updateData.phone2 = phone2 || null; 
    }
    
    if (isAdminEditing && nivelForm) { 
        updateData.nivel = nivelForm;
    }
    
    Object.keys(updateData).forEach(keyStr => {
      const key = keyStr as keyof Partial<AppUser>;
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    const newPhotoPath = updateData.photoPath; 
    const newPhotoUrl = updateData.photoURL;

    if (newPhotoPath !== oldPhotoPath) { 
        if (oldPhotoPath && oldPhotoPath.trim() !== '' && !oldPhotoPath.startsWith('http')) {
            deleteImageFromImageKit(oldPhotoPath).catch(e => console.error("[userActions - updateUserProfile] Error no bloqueante al eliminar foto antigua de ImageKit:", e));
        }
    } else if (newPhotoUrl === null && oldPhotoPath && !oldPhotoPath.startsWith('http')) { 
        deleteImageFromImageKit(oldPhotoPath).catch(e => console.error("[userActions - updateUserProfile] Error no bloqueante al eliminar foto (URL nula) de ImageKit:", e));
        updateData.photoPath = null; 
    }

    batch.update(userDocRef, updateData);
    
    const hasRelevantOwnerInfoChanged = 
        (updateData.displayName && updateData.displayName !== existingUserData.displayName) ||
        (updateData.phone1 !== undefined && updateData.phone1 !== existingUserData.phone1) ||
        (updateData.phone2 !== undefined && updateData.phone2 !== existingUserData.phone2);

    if (hasRelevantOwnerInfoChanged) {
      const mascotasCollectionRef = collection(db, "mascotas");
      const qMascotas = query(mascotasCollectionRef, where("userId", "==", uid));
      const mascotasSnapshot = await getDocs(qMascotas);

      if (!mascotasSnapshot.empty) {
        mascotasSnapshot.forEach((petDoc) => {
          const petUpdateData: Record<string, any> = {};
          if (updateData.displayName && updateData.displayName !== existingUserData.displayName) petUpdateData.ownerName = updateData.displayName;
          if (updateData.phone1 !== undefined && updateData.phone1 !== existingUserData.phone1) petUpdateData.ownerPhone1 = updateData.phone1; 
          if (updateData.phone2 !== undefined && updateData.phone2 !== existingUserData.phone2) petUpdateData.ownerPhone2 = updateData.phone2; 
          
          if(Object.keys(petUpdateData).length > 0) {
            batch.update(petDoc.ref, petUpdateData);
          }
        });
      }
    }

    await batch.commit(); 

    const updatedDocSnap = await getDoc(userDocRef); 
    if (updatedDocSnap.exists()) {
      const updatedUserData = { uid, ...updatedDocSnap.data() } as AppUser;
      revalidatePath(`/profile/edit`);
      revalidatePath(`/admin/users/${uid}`);
      revalidatePath(`/admin/users/${uid}/edit`);
      revalidatePath('/admin/users');
      revalidatePath('/home'); 
      return { success: true, data: updatedUserData };
    } else {
      return { success: false, error: "No se pudo recuperar el perfil actualizado." };
    }

  } catch (error: any) {
    console.error("[userActions] Error al actualizar perfil de usuario y/o mascotas asociadas en Firestore:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    let errorMessage = "Ocurrió un error inesperado al actualizar el perfil y/o las mascotas asociadas.";
    if (error.code) {
      errorMessage = `Error de Firestore (${error.code}): ${error.message}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}


export async function getAllUsersFromFirestore(): Promise<AppUser[]> {
  const usersCollectionRef = collection(db, "users");
  const q = query(usersCollectionRef, orderBy("displayName", "asc")); 
  
  try {
    const querySnapshot = await getDocs(q);
    const users: AppUser[] = [];
    querySnapshot.forEach((docSnap) => {
      users.push({ uid: docSnap.id, ...docSnap.data() } as AppUser);
    });
    return users;
  } catch (error: any) {
    console.error("[userActions] Error al obtener usuarios de Firestore:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return [];
  }
}


export async function getUserByIdFromFirestore(userId: string): Promise<AppUser | null> {
  if (!userId) {
    console.warn("[userActions - getUserByIdFromFirestore] Se proporcionó un userId vacío o nulo.");
    return null;
  }
  const userDocRef = doc(db, "users", userId);
  try {
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      return { uid: docSnap.id, ...docSnap.data() } as AppUser;
    } else {
      return null;
    }
  } catch (error: any) {
    console.error(`[userActions] Error al obtener usuario por UID (${userId}) de Firestore:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return null;
  }
}


export async function deleteUserAndPetsAction(userId: string): Promise<ActionResult> {
  const batch = writeBatch(db);

  const userDocRef = doc(db, "users", userId);
  batch.delete(userDocRef);

  const mascotasCollectionRef = collection(db, "mascotas");
  const qMascotas = query(mascotasCollectionRef, where("userId", "==", userId));
  
  try {
    const mascotasSnapshot = await getDocs(qMascotas);
    mascotasSnapshot.forEach((mascotaDoc) => {
      batch.delete(mascotaDoc.ref);
    });

    await batch.commit();
    revalidatePath('/admin/users');
    return { success: true };

  } catch (error: any)
{
    console.error(`[userActions] Error al eliminar usuario ${userId} y/o sus mascotas:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
    let errorMessage = "Ocurrió un error inesperado al eliminar el usuario y sus mascotas.";
    if (error.code) {
      errorMessage = `Error de Firestore (${error.code}): ${error.message}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }
}
