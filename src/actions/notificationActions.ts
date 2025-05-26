
'use server';

import { db, collection, addDoc, Timestamp, getDocs, query, where, orderBy, limit, writeBatch, doc, updateDoc } from '@/lib/firebase';
import type { AppNotification, AppUser } from '@/types';


export async function createNotification(
  notificationData: Omit<AppNotification, 'id' | 'timestamp' | 'read'>
): Promise<{ notificationId?: string; error?: string }> {
  if (!notificationData.userId) {
    console.error('[notificationActions - createNotification] Error: userId no proporcionado en notificationData.');
    return { error: 'Error interno: El destinatario de la notificación no está especificado.' };
  }
  console.log('[notificationActions - createNotification] Intentando crear notificación con datos:', notificationData);
  try {
    const docRef = await addDoc(collection(db, 'notifications'), {
      ...notificationData,
      timestamp: Timestamp.now().toDate().toISOString(),
      read: false,
    });
    console.log(`[notificationActions - createNotification] Notificación creada exitosamente con ID: ${docRef.id} para userId: ${notificationData.userId}`);
    return { notificationId: docRef.id };
  } catch (error: any) {
    console.error(`[notificationActions - createNotification] Error detallado al crear notificación en Firestore para userId ${notificationData.userId}:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { error: `Error al crear notificación: ${error.message || 'Error desconocido de Firestore.'}` };
  }
}

export async function generateQrScanNotification(
  petId: string,
  petName: string,
  ownerId: string,
  scanLocationDetails: { latitude: number; longitude: number }
): Promise<{ notificationId?: string; error?: string }> {
  console.log('[notificationActions - generateQrScanNotification] Llamada con petId:', petId, 'petName:', petName, 'ownerId:', ownerId);
  
  if (!ownerId) {
    console.error('[notificationActions - generateQrScanNotification] Dueño no identificado para la mascota.');
    return { error: 'Dueño no identificado para la mascota.' };
  }

  const title = `Alerta de Escaneo: ${petName}`;
  const message = `El código QR de tu mascota '${petName}' fue escaneado. Revisa la última ubicación en su perfil.`;
  
  const notificationData: Omit<AppNotification, 'id' | 'timestamp' | 'read'> = {
    userId: ownerId,
    title,
    message,
    link: `/pets/${petId}`,
    type: 'qrScan',
    relatedPetId: petId,
    relatedPetName: petName,
  };
  
  console.log('[notificationActions - generateQrScanNotification] Datos de notificación a crear:', notificationData);
  const result = await createNotification(notificationData);

  if (result.error) {
    console.error('[notificationActions - generateQrScanNotification] Error durante createNotification:', result.error);
  }
  return result;
}

export async function getNotificationsForUser(userId: string, limitCount?: number): Promise<AppNotification[]> {
  if (!userId) {
    return [];
  }
  
  try {
    const notificationsRef = collection(db, 'notifications');
    let q;
    if (limitCount && limitCount > 0) {
      q = query(notificationsRef, where('userId', '==', userId), limit(limitCount));
    } else {
      q = query(notificationsRef, where('userId', '==', userId));
    }
    
    const querySnapshot = await getDocs(q);
    const notifications: AppNotification[] = [];
    
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      notifications.push({ id: docSnap.id, ...data } as AppNotification);
    });
    
    notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
    return notifications;
  } catch (error: any) {
    console.error(`[notificationActions - getNotificationsForUser] Error al obtener notificaciones para ${userId}:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    if (error.code === 'failed-precondition') {
        try {
            const notificationsRef = collection(db, 'notifications');
            let qFallback;
            if (limitCount && limitCount > 0) {
                qFallback = query(notificationsRef, where('userId', '==', userId), limit(limitCount));
            } else {
                qFallback = query(notificationsRef, where('userId', '==', userId));
            }
            const fallbackSnapshot = await getDocs(qFallback);
            const fallbackNotifications: AppNotification[] = [];
            fallbackSnapshot.forEach((docSnap) => {
                fallbackNotifications.push({ id: docSnap.id, ...docSnap.data() } as AppNotification);
            });
            
            fallbackNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            
            return fallbackNotifications;
        } catch (fallbackError: any) {
            console.error(`[notificationActions - getNotificationsForUser] Error en query de fallback para ${userId}:`, JSON.stringify(fallbackError, Object.getOwnPropertyNames(fallbackError)));
            return [];
        }
    }
    return [];
  }
}

export async function markNotificationsAsRead(userId: string, notificationIds: string[]): Promise<{ success: boolean; error?: string }> {
  if (!userId || !notificationIds || notificationIds.length === 0) {
    return { success: false, error: 'IDs de notificación o ID de usuario no válidos.' };
  }
  try {
    const batch = writeBatch(db);
    notificationIds.forEach(id => {
      const notifRef = doc(db, 'notifications', id);
      batch.update(notifRef, { read: true });
    });
    await batch.commit();
    return { success: true };
  } catch (error: any) {
    console.error(`[notificationActions - markNotificationsAsRead] Error al marcar notificaciones como leídas para ${userId}:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, error: error.message };
  }
}

export async function generateNewPetAdminNotification(creatorName: string, petName: string, petId: string): Promise<void> {
  console.log(`[notificationActions - generateNewPetAdminNotification] Iniciando para creador: ${creatorName}, mascota: ${petName}, petId: ${petId}`);
  try {
    const usersRef = collection(db, 'users');
    const adminQuery = query(usersRef, where('nivel', '==', 'admin'));
    const adminSnapshot = await getDocs(adminQuery);

    if (adminSnapshot.empty) {
      console.log("[notificationActions - generateNewPetAdminNotification] No se encontraron administradores para notificar.");
      return;
    }

    const title = "Mascota Agregada"; 
    const message = `${creatorName} agregó a la mascota: '${petName}'.`;
    
    const notificationsToCreate: Omit<AppNotification, 'id' | 'timestamp' | 'read'>[] = [];

    adminSnapshot.forEach(adminDoc => {
      const admin = adminDoc.data() as AppUser; 
      if (admin && admin.uid) {
        console.log(`[notificationActions - generateNewPetAdminNotification] Preparando notificación para admin: ${admin.uid} (${admin.email})`);
        notificationsToCreate.push({
          userId: admin.uid,
          title,
          message,
          link: `/pets/${petId}`, 
          type: 'newPetAdmin', 
          relatedPetId: petId,
          relatedPetName: petName,
          relatedUserName: creatorName, 
        });
      } else {
        console.warn("[notificationActions - generateNewPetAdminNotification] Documento de admin encontrado sin UID:", adminDoc.id, adminDoc.data());
      }
    });
    
    console.log(`[notificationActions - generateNewPetAdminNotification] Total de notificaciones a crear para admins: ${notificationsToCreate.length}`);
    const creationPromises = notificationsToCreate.map(notifData => createNotification(notifData));
    const results = await Promise.all(creationPromises);
    
    results.forEach(r => {
      if (r.error) {
        console.error(`[notificationActions - generateNewPetAdminNotification] Error al crear notificación de admin: ${r.error}`);
      }
    });

  } catch (error) {
    console.error('[notificationActions - generateNewPetAdminNotification] Error al generar notificación para administradores:', error);
  }
}

export async function deleteNotifications(userId: string, notificationIds: string[]): Promise<{ success: boolean; error?: string }> {
  if (!userId || !notificationIds || notificationIds.length === 0) {
    return { success: false, error: 'IDs de notificación o ID de usuario no válidos.' };
  }
  try {
    const batch = writeBatch(db);
    notificationIds.forEach(id => {
      const notifRef = doc(db, 'notifications', id);
      batch.delete(notifRef);
    });
    await batch.commit();
    return { success: true };
  } catch (error: any) {
    console.error(`[notificationActions - deleteNotifications] Error al eliminar notificaciones para ${userId}:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return { success: false, error: `No se pudo eliminar las notificaciones: ${error.message}` };
  }
}
