
'use server';

import ImageKit from 'imagekit';

const IMAGEKIT_PUBLIC_KEY = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
const IMAGEKIT_PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY;
const IMAGEKIT_URL_ENDPOINT = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

let imagekitInstance: ImageKit | null = null;

if (IMAGEKIT_PUBLIC_KEY && IMAGEKIT_PRIVATE_KEY && IMAGEKIT_URL_ENDPOINT) {
  imagekitInstance = new ImageKit({
    publicKey: IMAGEKIT_PUBLIC_KEY,
    privateKey: IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: IMAGEKIT_URL_ENDPOINT,
  });
} else {
  console.error(
    '[ImageKitActions] Faltan variables de entorno para ImageKit. La subida de imágenes no funcionará.'
  );
}

interface AuthenticationParameters {
  token: string;
  expire: number;
  signature: string;
}

export async function getClientSideAuthParams(): Promise<
  | { success: true; params: AuthenticationParameters }
  | { success: false; error: string }
> {
  if (!imagekitInstance) {
    console.error('[ImageKitActions] El SDK de ImageKit no está inicializado en el servidor.');
    return {
      success: false,
      error:
        'El SDK de ImageKit no está inicializado en el servidor debido a variables de entorno faltantes.',
    };
  }

  try {
    const authenticationParameters = imagekitInstance.getAuthenticationParameters();
    return { success: true, params: authenticationParameters };
  } catch (error: any) {
    console.error(
      '[ImageKitActions] Error al generar parámetros de autenticación de ImageKit:',
      JSON.stringify(error, Object.getOwnPropertyNames(error))
    );
    return {
      success: false,
      error:
        error.message ||
        'No se pudieron generar los parámetros de autenticación.',
    };
  }
}

export async function deleteImageFromImageKit(fileId: string): Promise<{ success: boolean; error?: string }> {
  console.log(`[ImageKitActions - deleteImage] Solicitud para eliminar archivo con fileId: '${fileId}'`);
  if (!imagekitInstance) {
    console.error('[ImageKitActions - deleteImage] El SDK de ImageKit no está inicializado.');
    return { success: false, error: 'El SDK de ImageKit no está inicializado.' };
  }
  if (!fileId || typeof fileId !== 'string' || fileId.trim() === '') {
    console.warn('[ImageKitActions - deleteImage] fileId no válido proporcionado:', fileId);
    return { success: false, error: 'ID de archivo no válido para eliminar.' };
  }
  
  try {
    await imagekitInstance.deleteFile(fileId);
    console.log(`[ImageKitActions - deleteImage] Archivo con ID ${fileId} eliminado exitosamente de ImageKit.`);
    return { success: true };

  } catch (error: any) {
    console.error(
      `[ImageKitActions - deleteImage] Error al interactuar con ImageKit API para eliminar archivo con ID '${fileId}':`,
      JSON.stringify(error, Object.getOwnPropertyNames(error))
    );
    return { success: false, error: error.message || 'Error al eliminar la imagen de ImageKit.' };
  }
}
