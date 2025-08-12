
'use client';

import { useState, useRef, useEffect } from 'react';
import { IKContext, IKUpload } from 'imagekitio-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { UploadCloud, XCircle, Loader2 } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Button } from '@/components/ui/button';
import { deleteImageFromImageKit } from '@/actions/imageKitActions';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ImageUploaderProps {
  onUploadSuccess: (imageUrl: string | null, imagePath: string | null, imageFileId: string | null) => void;
  initialImageUrl?: string | null;
  initialImagePath?: string | null; 
  initialImageFileId?: string | null;
  folder?: string;
  fileNamePrefix?: string;
  imageAiHint?: string;
  uploaderId: string; 
  labelTitle?: string;
  disabled?: boolean;
}

const NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
const NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

export function ImageUploader({
  onUploadSuccess,
  initialImageUrl,
  initialImagePath, 
  initialImageFileId,
  folder = 'qrpets_default_folder',
  fileNamePrefix = 'image',
  imageAiHint = "imagen subida",
  uploaderId,
  labelTitle = "Imagen",
  disabled = false,
}: ImageUploaderProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl || null);
  const [currentFileId, setCurrentFileId] = useState<string | null>(initialImageFileId || null);
  const ikUploadRef = useRef<any>(null);

  useEffect(() => {
    setPreviewUrl(initialImageUrl || null);
    setCurrentFileId(initialImageFileId || null);
  }, [initialImageUrl, initialImageFileId]);

  const authenticator = async () => {
    try {
      const response = await fetch('/api/imagekit-auth');
      if (!response.ok) {
        throw new Error(`Authentication request failed: ${response.statusText || response.status}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(`Authentication service error: ${data.error}`);
      }
      return data; 
    } catch (error: any) {
      toast({
        title: 'Error de Autenticación de Subida',
        description: 'No se pudieron obtener los permisos para subir la imagen.',
        variant: 'destructive',
      });
      throw error; 
    }
  };

  const onError = (err: any) => {
    setIsUploading(false);
    if (err && err.message && !err.message.toLowerCase().includes('authentication')) {
      toast({
        title: 'Error al Subir Imagen',
        description: err.message || 'No se pudo subir la imagen a ImageKit.',
        variant: 'destructive',
      });
    } else if (!err || !err.message) {
         toast({
            title: 'Error al Subir Imagen',
            description: 'Ocurrió un error desconocido durante la subida.',
            variant: 'destructive',
        });
    }
    if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(initialImageUrl || null); 
    }
  };

  const onSuccess = (res: any) => {
    setIsUploading(false);
    setPreviewUrl(res.url);
    setCurrentFileId(res.fileId); 
    onUploadSuccess(res.url, res.filePath, res.fileId); 
    toast({
      title: '¡Imagen Subida!',
      description: 'La imagen se ha subido y guardado correctamente.',
    });
  };

  const onUploadStart = () => {
    setIsUploading(true);
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleFileSelectForPreviewAndUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview); 

      if (ikUploadRef.current?.control?.current) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        ikUploadRef.current.control.current.files = dataTransfer.files;
        const changeEvent = new Event('change', { bubbles: true });
        ikUploadRef.current.control.current.dispatchEvent(changeEvent);
      }
    }
  };
  
  const handleRemoveImage = async () => {
    if (disabled) {
      toast({ title: "Acción no permitida", description: "La cuenta de demostración no puede eliminar imágenes.", variant: "destructive"});
      return;
    }
    const fileIdToDelete = currentFileId;
    
    if (fileIdToDelete) {
      setIsDeleting(true);
      const result = await deleteImageFromImageKit(fileIdToDelete);
      setIsDeleting(false);
      
      if (!result.success) {
        toast({
          title: "Error de Eliminación",
          description: result.error || "No se pudo eliminar la imagen de ImageKit.",
          variant: "destructive"
        });
        return; 
      }
      toast({ title: 'Imagen Eliminada de ImageKit', description: 'La imagen anterior ha sido eliminada del servidor.' });
    }
    
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    onUploadSuccess(null, null, null); 
    setCurrentFileId(null); 
    
    if (ikUploadRef.current?.control?.current) {
        ikUploadRef.current.control.current.value = "";
    }
  };

  if (!NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || !NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT) {
    return <p className="text-destructive">Error de configuración del cargador de imágenes.</p>;
  }
  
  const internalInputId = `ik-upload-internal-${uploaderId}`;
  const isLoading = isUploading || isDeleting;

  return (
    <IKContext
      publicKey={NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY}
      urlEndpoint={NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT}
      authenticator={authenticator}
    >
      <div className="space-y-3">
        <Label>{labelTitle}</Label>
        
        {previewUrl && (
          <div className="relative group w-full aspect-[4/3] border rounded-md overflow-hidden shadow-sm bg-muted/30">
            <Image
              src={previewUrl}
              alt="Vista previa"
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-contain"
              data-ai-hint={imageAiHint}
              key={previewUrl}
              onError={(e) => {
                setPreviewUrl(`https://placehold.co/192x108.png?text=Error`);
              }}
            />
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-7 w-7 opacity-50 group-hover:opacity-100 transition-opacity z-10"
                  title="Remover imagen"
                  disabled={isLoading || disabled}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro de eliminar la imagen?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará la imagen del servidor. Si quiere reemplazar la imagen, hacer click en "Sí, eliminar".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isLoading}>No, cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRemoveImage} disabled={isLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {isLoading ? "Eliminando..." : "Sí, eliminar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {isDeleting && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                 <Loader2 className="h-6 w-6 text-white animate-spin" />
              </div>
            )}
          </div>
        )}

        {!previewUrl && !isLoading && (
          <label
            htmlFor={internalInputId}
            className={cn(
              "flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg bg-card transition-colors",
              disabled ? "cursor-not-allowed bg-muted/50" : "cursor-pointer hover:bg-muted/50"
            )}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
              <UploadCloud className="h-8 w-8 mb-3 text-muted-foreground group-hover:text-primary" />
              <p className="mb-1 text-sm text-muted-foreground">
                <span className="font-semibold">Haz clic para subir</span>
              </p>
              <p className="text-xs text-muted-foreground">o arrastra y suelta</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP (MAX. 10MB)</p>
            </div>
             <IKUpload 
              ref={ikUploadRef}
              id={internalInputId}
              fileName={`${fileNamePrefix}-${uploaderId}-${Date.now()}.jpg`}
              folder={`/${folder}/`}
              useUniqueFileName={true}
              isPrivateFile={false}
              onUploadStart={onUploadStart}
              onError={onError}
              onSuccess={onSuccess}
              disabled={isLoading || disabled}
              className="!hidden" 
              onChange={handleFileSelectForPreviewAndUpload} 
              accept="image/png, image/jpeg, image/gif, image/webp"
            />
          </label>
        )}

        {isLoading && !isDeleting && (
          <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg bg-muted/30">
            <Loader2 className="h-8 w-8 mb-3 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Subiendo...</p>
          </div>
        )}

        {previewUrl && !isLoading && (
          <p className="text-xs text-muted-foreground text-center">
             {disabled ? "La carga de imágenes está deshabilitada para la cuenta demo." : "Imagen cargada. Haz clic en la (X) para removerla y subir otra."}
          </p>
        )}
      </div>
    </IKContext>
  );
}
