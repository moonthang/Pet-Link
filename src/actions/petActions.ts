
"use server";

import type { PetProfile, ScanLocation, AppUser } from "@/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, auth, collection, addDoc, getDoc, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, Timestamp } from "@/lib/firebase";
import { format, subYears, isValid, parseISO } from "date-fns";
import * as dateFnsTz from 'date-fns-tz';
import { deleteImageFromImageKit } from "./imageKitActions";

const BOGOTA_TIMEZONE = 'America/Bogota';

function processPetProfileDocument(docData: any, id: string): PetProfile {
  const pet = { ...docData, id } as PetProfile;
  if (pet.createdAt && pet.createdAt instanceof Timestamp) {
    pet.createdAt = pet.createdAt.toDate().toISOString();
  }
  
  if (pet.fechaNacimiento && pet.fechaNacimiento instanceof Timestamp) {
    pet.fechaNacimiento = pet.fechaNacimiento.toDate().toISOString();
  } else if (typeof pet.fechaNacimiento === 'string' && !isValid(parseISO(pet.fechaNacimiento))) {
      try {
        const parsedDate = parseISO(pet.fechaNacimiento); 
        if (isValid(parsedDate)) {
            pet.fechaNacimiento = parsedDate.toISOString();
        } else {
        }
      } catch (e) {
      }
  }

  if (pet.scanHistory) {
    pet.scanHistory = pet.scanHistory.map(scan => {
      if (scan.timestamp && scan.timestamp instanceof Timestamp) {
        return { ...scan, timestamp: scan.timestamp.toDate().toISOString() };
      }
      return scan;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } else {
    pet.scanHistory = [];
  }
  return pet;
}

export async function getAllPets(currentAppUser: AppUser | null): Promise<PetProfile[]> {
  if (!currentAppUser) {
    return [];
  }

  const mascotasCollectionRef = collection(db, "mascotas");
  let q;

  if (currentAppUser.nivel === 'admin' || currentAppUser.nivel === 'demo') {
    q = query(mascotasCollectionRef, orderBy("createdAt", "desc"));
  } else {
    if (!currentAppUser.uid) {
        return [];
    }
    q = query(mascotasCollectionRef, where("userId", "==", currentAppUser.uid), orderBy("createdAt", "desc"));
  }
  
  try {
    const querySnapshot = await getDocs(q);
    const pets: PetProfile[] = [];
    querySnapshot.forEach((docSnap) => {
      pets.push(processPetProfileDocument(docSnap.data(), docSnap.id));
    });
    return pets;
  } catch (error: any) {
    console.error("[petActions] Error fetching pets from Firestore: ", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    let errorMessage = `Failed to fetch pets. User Nivel: ${currentAppUser.nivel}`;
    if (currentAppUser.nivel !== 'admin' && currentAppUser.uid) {
        errorMessage += `, User UID for filter: ${currentAppUser.uid}`;
    }
     if (error.code === 'failed-precondition') {
      errorMessage += ". Firestore query failed, this often means a required index is missing or being built. Please check your Firestore indexes for 'mascotas' collection with 'userId' (ASC) and 'createdAt' (DESC).";
    }
    console.error(errorMessage);
    return []; 
  }
}

export async function getPetById(id: string): Promise<PetProfile | null> {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    return null;
  }
  const petDocRef = doc(db, "mascotas", id);
  try {
    const docSnap = await getDoc(petDocRef);
    if (docSnap.exists()) {
      return processPetProfileDocument(docSnap.data(), docSnap.id);
    } else {
      return null;
    }
  } catch (error) {
    return null;
  }
}

export async function getPetsByUserId(userId: string): Promise<PetProfile[]> {
  if (!userId) {
    return [];
  }
  const mascotasCollectionRef = collection(db, "mascotas");
  const q = query(mascotasCollectionRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
  
  try {
    const querySnapshot = await getDocs(q);
    const pets: PetProfile[] = [];
    querySnapshot.forEach((docSnap) => {
      pets.push(processPetProfileDocument(docSnap.data(), docSnap.id));
    });
    return pets;
  } catch (error: any) {
    if (error.code === 'failed-precondition') {
    }
    return [];
  }
}

async function addPetToFirestore(data: Omit<PetProfile, "id" | "createdAt" | "scanHistory">, userId: string | null): Promise<PetProfile> {
  let fechaNacimientoToStore: Timestamp | null = null;

  if (data.fechaNacimiento && typeof data.fechaNacimiento === 'string') {
    try {
      const dateInBogota = dateFnsTz.toDate(data.fechaNacimiento + "T00:00:00", { timeZone: BOGOTA_TIMEZONE });
      if (isValid(dateInBogota)) {
        fechaNacimientoToStore = Timestamp.fromDate(dateInBogota);
      } else {
        fechaNacimientoToStore = Timestamp.fromDate(subYears(new Date(), 1));
      }
    } catch (e) {
      fechaNacimientoToStore = Timestamp.fromDate(subYears(new Date(), 1));
    }
  } else {
    fechaNacimientoToStore = Timestamp.fromDate(subYears(new Date(), 1));
  }

  const newPetData: Record<string, any> = {
    ...data,
    userId: userId, 
    createdAt: Timestamp.now(), 
    fechaNacimiento: fechaNacimientoToStore,
    scanHistory: [],
    photoUrl: data.photoUrl || `https://placehold.co/300x200.png?text=${encodeURIComponent(data.name)}&data-ai-hint=${data.tipoAnimal?.toLowerCase() || 'animal'}`,
    photoPath: data.photoPath || null,
    photoFileId: data.photoFileId || null,
    photoUrl2: data.photoUrl2 || null,
    photoPath2: data.photoPath2 || null,
    photoFileId2: data.photoFileId2 || null,
  };

  newPetData.caracteristicaEspecial = data.caracteristicaEspecial || null;
  newPetData.ownerEmail = data.ownerEmail || null;
  newPetData.ownerPhone2 = data.ownerPhone2 || null;
  newPetData.breed = data.breed || null;
  newPetData.sexo = data.sexo || null;
  newPetData.ownerName = data.ownerName || null;
  newPetData.ownerPhone1 = data.ownerPhone1 || null;

  try {
    const docRef = await addDoc(collection(db, "mascotas"), newPetData);
    const newPetDoc = await getDoc(docRef);
    if (!newPetDoc.exists()) {
      throw new Error("No se pudo recuperar la mascota recién agregada de Firestore.");
    }
    const addedPet = processPetProfileDocument(newPetDoc.data(), newPetDoc.id);
    
    revalidatePath("/"); 
    revalidatePath("/home"); 
    revalidatePath(`/pets/${addedPet.id}`);
    revalidatePath(`/public/pets/${addedPet.id}`);
    return addedPet;
  } catch (error: any) {
    throw error; 
  }
}

async function updatePetInFirestore(
  id: string,
  data: Partial<Omit<PetProfile, "id" | "createdAt" | "scanHistory">>
): Promise<PetProfile | null> {
  const petDocRef = doc(db, "mascotas", id);
  try {
    const existingPetSnap = await getDoc(petDocRef);
    if (!existingPetSnap.exists()) return null;
    const existingPetData = existingPetSnap.data() as PetProfile;
    
    const updateData: Record<string, any> = { ...data };

    if (updateData.fechaNacimiento && typeof updateData.fechaNacimiento === 'string') {
      try {
        const dateInBogota = dateFnsTz.toDate(updateData.fechaNacimiento + "T00:00:00", { timeZone: BOGOTA_TIMEZONE });
        if (isValid(dateInBogota)) {
            updateData.fechaNacimiento = Timestamp.fromDate(dateInBogota);
        } else {
            delete updateData.fechaNacimiento; 
        }
      } catch (e) {
        delete updateData.fechaNacimiento;
      }
    }
    
    const optionalFields = ['caracteristicaEspecial', 'ownerEmail', 'ownerPhone2', 'photoUrl', 'photoPath', 'photoFileId', 'photoUrl2', 'photoPath2', 'photoFileId2', 'breed', 'sexo', 'ownerName', 'ownerPhone1'];
    optionalFields.forEach(field => {
        if (field in updateData && (updateData[field] === '' || updateData[field] === undefined)) {
            updateData[field] = null; 
        }
    });
    
    if (!('userId' in data)) { 
        delete updateData.userId; 
    }

    // Image deletion logic
    if (existingPetData.photoFileId && (updateData.photoUrl === null || updateData.photoUrl === '')) {
      await deleteImageFromImageKit(existingPetData.photoFileId);
    }
    if (existingPetData.photoFileId2 && (updateData.photoUrl2 === null || updateData.photoUrl2 === '')) {
      await deleteImageFromImageKit(existingPetData.photoFileId2);
    }

    await updateDoc(petDocRef, updateData);
    const updatedPetDoc = await getDoc(petDocRef);
     if (!updatedPetDoc.exists()) {
      throw new Error("No se pudo recuperar la mascota actualizada de Firestore.");
    }
    const updatedPet = processPetProfileDocument(updatedPetDoc.data(), updatedPetDoc.id);

    revalidatePath("/");
    revalidatePath("/home");
    revalidatePath(`/pets/${id}`);
    revalidatePath(`/public/pets/${id}`);
    revalidatePath(`/pets/${id}/edit`);
    return updatedPet;
  } catch (error: any) {
    throw error; 
  }
}

export async function deletePet(id: string): Promise<{ success: boolean }> {
  const petDocRef = doc(db, "mascotas", id);
  try {
    const petSnap = await getDoc(petDocRef);
    if(petSnap.exists()) {
      const petData = petSnap.data() as PetProfile;
      if (petData.photoFileId) {
        await deleteImageFromImageKit(petData.photoFileId);
      }
      if (petData.photoFileId2) {
        await deleteImageFromImageKit(petData.photoFileId2);
      }
    }
    await deleteDoc(petDocRef);
    revalidatePath("/");
    revalidatePath("/home");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function createPetAction(formData: FormData, creatorUserId: string, creatorName: string): Promise<{ petId?: string; error?: string }> {

  const name = formData.get("name") as string;
  const tipoAnimal = formData.get("tipoAnimal") as PetProfile['tipoAnimal'];
  const breed = formData.get("breed") as string | null; 
  const photoUrl = formData.get("photoUrl") as string;
  const photoPath = formData.get("photoPath") as string | null;
  const photoFileId = formData.get("photoFileId") as string | null;
  const photoUrl2 = formData.get("photoUrl2") as string | null;
  const photoPath2 = formData.get("photoPath2") as string | null;
  const photoFileId2 = formData.get("photoFileId2") as string | null;
  const fechaNacimientoStr = formData.get("fechaNacimiento") as string | null; 
  const sexo = formData.get("sexo") as PetProfile['sexo'] | null;
  const caracteristicaEspecial = formData.get("caracteristicaEspecial") as string | undefined;
  const ownerName = formData.get("ownerName") as string | null;
  const ownerEmail = formData.get("ownerEmail") as string | undefined;
  const ownerPhone1 = formData.get("ownerPhone1") as string | null;
  const ownerPhone2 = formData.get("ownerPhone2") as string | undefined;

  const isAdminCreatingNew = (formData.get("isAdminCreatingNew") as string) === "true";

  if (!name || !tipoAnimal) {
    return { error: "Nombre y Tipo de Animal son obligatorios." };
  }

  if (!isAdminCreatingNew) {
     if (!breed || !fechaNacimientoStr || !sexo || !ownerName || !ownerPhone1) {
      return { error: "Los campos: Raza, Fecha de Nacimiento, Sexo, Nombre del Dueño y Teléfono Principal son obligatorios para este tipo de creación/edición." };
     }
  }
  
  let newPet: PetProfile;
  try {
    const petDataToSave: Omit<PetProfile, "id" | "createdAt" | "scanHistory"> = { 
      name, 
      tipoAnimal,
      breed: breed || null, 
      photoUrl: photoUrl || `https://placehold.co/300x200.png?text=${encodeURIComponent(name || "Mascota")}&data-ai-hint=${tipoAnimal?.toLowerCase() || 'animal'}`,
      photoPath: photoPath || null,
      photoFileId: photoFileId || null,
      photoUrl2: photoUrl2 || null,
      photoPath2: photoPath2 || null,
      photoFileId2: photoFileId2 || null,
      fechaNacimiento: fechaNacimientoStr || format(subYears(new Date(),1), 'yyyy-MM-dd'), 
      sexo: sexo || null,
      caracteristicaEspecial: caracteristicaEspecial || null,
      ownerName: ownerName || null, 
      ownerEmail: ownerEmail || null,
      ownerPhone1: ownerPhone1 || null,
      ownerPhone2: ownerPhone2 || null,
    };

    newPet = await addPetToFirestore(petDataToSave, creatorUserId); 

    return { petId: newPet.id }; 
  } catch (error: any) {
    let errorMessage = "Ocurrió un error inesperado al crear el perfil de la mascota. Por favor, inténtalo de nuevo más tarde.";
    if (error.code) { 
      errorMessage = `Error de Firestore (${error.code}): ${error.message}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return { error: errorMessage };
  }
}

export async function updatePetAction(petId: string, formData: FormData): Promise<{ petId?: string; error?: string }> {
  const name = formData.get("name") as string;
  const breed = formData.get("breed") as string;
  const photoUrl = formData.get("photoUrl") as string;
  const photoPath = formData.get("photoPath") as string | null;
  const photoFileId = formData.get("photoFileId") as string | null;
  const photoUrl2 = formData.get("photoUrl2") as string | null;
  const photoPath2 = formData.get("photoPath2") as string | null;
  const photoFileId2 = formData.get("photoFileId2") as string | null;
  const tipoAnimal = formData.get("tipoAnimal") as PetProfile['tipoAnimal'];
  const fechaNacimientoStr = formData.get("fechaNacimiento") as string;
  const sexo = formData.get("sexo") as PetProfile['sexo'];
  const caracteristicaEspecial = formData.get("caracteristicaEspecial") as string | undefined;
  const ownerName = formData.get("ownerName") as string;
  const ownerEmail = formData.get("ownerEmail") as string | undefined;
  const ownerPhone1 = formData.get("ownerPhone1") as string;
  const ownerPhone2 = formData.get("ownerPhone2") as string | undefined;
  
  if (!name || !tipoAnimal || !fechaNacimientoStr || !sexo || !ownerName || !ownerPhone1) {
      return { error: "Los campos: Nombre, Tipo de Animal, Fecha de Nacimiento, Sexo, Nombre del Dueño y Teléfono Principal son obligatorios." };
  }
  if (!breed) { 
    return { error: "La raza es obligatoria." };
  }
  
  let updatedPet: PetProfile | null;
  try {
    updatedPet = await updatePetInFirestore(petId, { 
      name, 
      breed: breed || null, 
      photoUrl: photoUrl || `https://placehold.co/300x200.png?text=${encodeURIComponent(name || "Mascota")}&data-ai-hint=${tipoAnimal?.toLowerCase() || 'animal'}`,
      photoPath: photoPath || null,
      photoFileId: photoFileId || null,
      photoUrl2: photoUrl2 || null,
      photoPath2: photoPath2 || null,
      photoFileId2: photoFileId2 || null,
      tipoAnimal,
      fechaNacimiento: fechaNacimientoStr,
      sexo,
      caracteristicaEspecial: caracteristicaEspecial && caracteristicaEspecial.trim() !== '' ? caracteristicaEspecial : null,
      ownerName, 
      ownerEmail: ownerEmail && ownerEmail.trim() !== '' ? ownerEmail : null,
      ownerPhone1,
      ownerPhone2: ownerPhone2 && ownerPhone2.trim() !== '' ? ownerPhone2 : null,
    });
  } catch (error: any) {
    let errorMessage = "Ocurrió un error inesperado al guardar los datos de la mascota. Por favor, inténtalo de nuevo más tarde.";
     if (error.code) { 
      errorMessage = `Error de Firestore (${error.code}): ${error.message}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return { error: errorMessage };
  }

  if (!updatedPet) {
      return { error: "Mascota no encontrada, no se puede actualizar." };
  }
  return { petId: updatedPet.id }; 
}

export async function logPetScanLocationAction(petId: string, latitude: number, longitude: number): Promise<ScanLocation | { error: string }> {
  const petDocRef = doc(db, "mascotas", petId);
  
  try {
    const petSnap = await getDoc(petDocRef);
    if (!petSnap.exists()) {
      return { error: "Mascota no encontrada" };
    }

    const petDataFromDB = petSnap.data();
    const existingScanHistory = (petDataFromDB?.scanHistory || []).map((scan: any) => {
      if (scan.timestamp && scan.timestamp instanceof Timestamp) {
        return { ...scan, timestamp: scan.timestamp.toDate().toISOString() };
      }
      return scan;
    });

    const newScan: ScanLocation = {
      id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, 
      latitude,
      longitude,
      timestamp: new Date().toISOString(), 
    };
    
    const newScanHistory = [newScan, ...existingScanHistory]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); 

    await updateDoc(petDocRef, {
      scanHistory: newScanHistory.map(scan => ({
        ...scan,
        timestamp: Timestamp.fromDate(new Date(scan.timestamp)) 
      }))
    });
    
    revalidatePath(`/pets/${petId}`); 
    revalidatePath(`/public/pets/${petId}`);
    
    return newScan; 
  } catch (error: any) {
    let errorMessage = "Error al registrar escaneo en la base de datos.";
    if (error.code) {
      errorMessage = `Error de Firestore (${error.code}): ${error.message}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return { error: errorMessage };
  }
}

export async function claimPetByIdentifier(identifier: string, claimingUserId: string): Promise<{ petId?: string; error?: string; needsProfileCompletion?: boolean }> {
  const petDocRef = doc(db, "mascotas", identifier);
  try {
    const petSnap = await getDoc(petDocRef);
    if (!petSnap.exists()) {
      return { error: "Mascota con ese identificador no encontrada." };
    }

    const petData = petSnap.data() as PetProfile; 
    const updatePayload: Record<string, any> = { userId: claimingUserId };

    await updateDoc(petDocRef, updatePayload);
    
    const claimingUserDocRef = doc(db, 'users', claimingUserId);
    const claimingUserDocSnap = await getDoc(claimingUserDocRef);
    let claimingUserDisplayName = 'Un usuario';
    if (claimingUserDocSnap.exists()) {
      const claimingUserData = claimingUserDocSnap.data() as AppUser;
      claimingUserDisplayName = claimingUserData.displayName || claimingUserData.email || 'Un usuario';
    }
    
    revalidatePath(`/pets/${identifier}/edit`);
    revalidatePath(`/home`);
    revalidatePath(`/admin/users`); 
    
    return { petId: identifier, needsProfileCompletion: true };

  } catch (error: any) {
    let errorMessage = "Error al intentar reclamar la mascota. Por favor, verifica el identificador e inténtalo de nuevo.";
     if (error.code) { 
      errorMessage = `Error de Firestore (${error.code}): ${error.message}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return { error: errorMessage };
  }
}
