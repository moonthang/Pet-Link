
"use client";

import { useEffect } from 'react';
import { logPetScanLocationAction, getPetById } from '@/actions/petActions';
import { generateQrScanNotification } from '@/actions/notificationActions';
import { useToast } from '@/hooks/use-toast';

interface ScanLocationRecorderProps {
  petId: string;
}

export function ScanLocationRecorder({ petId }: ScanLocationRecorderProps) {
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true; 
    const recordScanAndNotify = async (latitude: number, longitude: number) => {
      if (!isMounted) {
        return;
      }
      
      const logResult = await logPetScanLocationAction(petId, latitude, longitude);
      
      if (logResult && 'error' in logResult) {
        if(isMounted) toast({ title: "Error al Registrar Escaneo", description: logResult.error, variant: "destructive"});
      } else {
        if(isMounted) toast({ title: "Ubicación de Escaneo Registrada", description: "La ubicación del escaneo se ha guardado.", variant: "default" });
        try {
          const petProfile = await getPetById(petId);

          if (petProfile && petProfile.userId) {
            const notificationResult = await generateQrScanNotification(
              petId, 
              petProfile.name, 
              petProfile.userId,
              { latitude, longitude }
            );
            if (notificationResult.error) {
              if (isMounted) {
                toast({ title: "Error de Notificación", description: "No se pudo generar la notificación de escaneo.", variant: "destructive"});
              }
            } else {
              if (isMounted) {
                toast({ title: "Notificación de Escaneo Enviada", description: `Notificación enviada al dueño de ${petProfile.name}.`, variant: "default"});
              }
            }
          } else {
            if(isMounted) toast({ title: "Error de Datos", description: "No se pudieron obtener los datos del dueño para notificar.", variant: "destructive"});
          }
        } catch (e) {
          if(isMounted) toast({ title: "Error Inesperado", description: "Error al procesar la notificación.", variant: "destructive"});
        }
      }
    };

    const getPositionAndProcess = () => {
      if (!navigator.geolocation) {
        if (!isMounted) return;
        toast({
          title: "Geolocalización no soportada",
          description: "Tu navegador no soporta geolocalización. No se pudo registrar este escaneo.",
          variant: "destructive",
        });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (!isMounted) {
            return;
          }
          recordScanAndNotify(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          if (!isMounted) {
            return;
          }
          let description = "No se pudo obtener tu ubicación para registrar el escaneo.";
          if (error.code === error.PERMISSION_DENIED) {
            description = "Permiso de ubicación denegado. No se puede registrar el escaneo.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            description = "Información de ubicación no disponible.";
          } else if (error.code === error.TIMEOUT) {
            description = "Se agotó el tiempo de espera para obtener la ubicación.";
          }
          toast({ 
            title: "Error de Geolocalización", 
            description: description,
            variant: "destructive" 
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 20000, 
          maximumAge: 0 
        }
      );
    };

    const timerId = setTimeout(getPositionAndProcess, 500);

    return () => {
      isMounted = false; 
      clearTimeout(timerId); 
    };
  }, [petId, toast]); 

  return null; 
}
