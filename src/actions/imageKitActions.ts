
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

export async function deleteImageFromImageKit(filePath: string): Promise<{ success: boolean; error?: string }> {
  console.log(`[ImageKitActions - deleteImage] Solicitud para eliminar archivo con filePath: '${filePath}'`);
  if (!imagekitInstance) {
    console.error('[ImageKitActions - deleteImage] El SDK de ImageKit no está inicializado.');
    return { success: false, error: 'El SDK de ImageKit no está inicializado.' };
  }
  if (!filePath || typeof filePath !== 'string' || filePath.trim() === '') {
    console.warn('[ImageKitActions - deleteImage] filePath no válido proporcionado:', filePath);
    return { success: false, error: 'Ruta de archivo no válida para eliminar.' };
  }

  const normalizedPath = filePath.startsWith('/') ? filePath.substring(1) : filePath;
  console.log(`[ImageKitActions - deleteImage] Path normalizado para búsqueda en ImageKit: '${normalizedPath}'`);
  
  try {
    const files = await imagekitInstance.listFiles({
      path: normalizedPath, 
      limit: 1 
    });

    console.log(`[ImageKitActions - deleteImage] Resultado de listFiles para path '${normalizedPath}':`, files);

    if (files && files.length > 0) {
      const fileIdToDelete = files[0].fileId;
      console.log(`[ImageKitActions - deleteImage] Archivo encontrado con ID: '${fileIdToDelete}'. Intentando eliminar...`);
      await imagekitInstance.deleteFile(fileIdToDelete);
      console.log(`[ImageKitActions - deleteImage] Archivo con ID ${fileIdToDelete} (path: ${filePath}) eliminado exitosamente de ImageKit.`);
      return { success: true };
    } else {
      console.warn(`[ImageKitActions - deleteImage] No se encontró archivo en ImageKit con path: '${filePath}' (normalizado: '${normalizedPath}'). No se eliminó nada.`);
      return { success: true, error: 'Archivo no encontrado en ImageKit, no se eliminó.' }; 
    }

  } catch (error: any) {
    console.error(
      `[ImageKitActions - deleteImage] Error al interactuar con ImageKit API para eliminar archivo '${filePath}':`,
      JSON.stringify(error, Object.getOwnPropertyNames(error))
    );
    return { success: false, error: error.message || 'Error al eliminar la imagen de ImageKit.' };
  }
}
