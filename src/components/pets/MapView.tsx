
"use client";

import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MapPin, AlertTriangle } from 'lucide-react';

interface MapViewProps {
  petName: string;
  scanLocation: { lat: number; lng: number };
}

const DEFAULT_ZOOM = 15;

export function MapView({ petName, scanLocation }: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(scanLocation);
  const [userLocationError, setUserLocationError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLoading(false);
        },
        (err) => {
          console.warn(`Error de Geolocalización (${err.code}): ${err.message}`);
          setUserLocationError(`No se pudo obtener tu ubicación actual. Mapa centrado en la ubicación del escaneo. Error: ${err.message}`);
          setMapCenter(scanLocation);
          setLoading(false);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      setUserLocationError("La geolocalización no es soportada por este navegador. Mapa centrado en la ubicación del escaneo.");
      setMapCenter(scanLocation);
      setLoading(false);
    }
  }, [scanLocation]);

  if (!apiKey) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Falta Clave API de Google Maps</AlertTitle>
        <AlertDescription>
          La clave API de Google Maps no está configurada. Por favor, establece NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en tus variables de entorno y reinicia el servidor.
        </AlertDescription>
      </Alert>
    );
  }

  if (loading && !mapCenter.lat && !scanLocation.lat) {
    return <Skeleton className="h-[400px] w-full rounded-md" />;
  }

  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden border shadow-md">
      <APIProvider apiKey={apiKey}>
        <Map
          center={mapCenter}
          defaultZoom={DEFAULT_ZOOM}
          gestureHandling={'greedy'}
          disableDefaultUI={true}
          mapId="petlinkmap"
        >
          <AdvancedMarker
            position={scanLocation}
            title={`Última ubicación de escaneo conocida para ${petName}`}
          >
            <div className="flex flex-col items-center">
              <div className="bg-white text-foreground text-xs font-semibold p-1 rounded shadow-md mb-1 whitespace-nowrap">
                Aquí está {petName}
              </div>
              <MapPin className="h-8 w-8 text-destructive" />
            </div>
          </AdvancedMarker>
        </Map>
      </APIProvider>
      {userLocationError && (
         <Alert variant="default" className="mt-2 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Aviso de Ubicación</AlertTitle>
            <AlertDescription>{userLocationError}</AlertDescription>
         </Alert>
      )}
       <p className="text-sm text-muted-foreground mt-2">
        Este mapa muestra la ubicación aproximada donde el código QR de {petName} fue escaneado por última vez.
        {userLocationError ? " " : " El mapa se centra en tu ubicación actual si está disponible. "}
      </p>
    </div>
  );
}
