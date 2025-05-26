
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QrCode as QrCodeIcon, Download } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { PetProfile } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface PetQRModalProps {
  pet: PetProfile;
}

export function PetQRModal({ pet }: PetQRModalProps) {
  const [profileUrl, setProfileUrl] = useState("");
  const [isClient, setIsClient] = useState(false);
  const qrSVGRef = useRef<SVGSVGElement | null>(null); 
  const { toast } = useToast();

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/public/pets/${pet.id}`;
      setProfileUrl(url);
    }
  }, [pet.id]);

  const handleDownloadQR = () => {
    if (!qrSVGRef.current || !profileUrl) {
      toast({
        title: "Error de Descarga",
        description: "No se pudo obtener la referencia del SVG del QR o la URL del perfil no está lista.",
        variant: "destructive",
      });
      return;
    }

    try {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(qrSVGRef.current);
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `QR-${pet.name || "mascota"}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url); 

      toast({
        title: "Descarga Iniciada",
        description: `QR-${pet.name || "mascota"}.svg se está descargando.`,
      });
    } catch (error: any) {
      console.error("Error al descargar QR SVG:", error);
      toast({
        title: "Error de Descarga",
        description: error.message || "No se pudo procesar el QR para la descarga como SVG.",
        variant: "destructive",
      });
    }
  };

  if (!isClient) {
    return (
      <Button variant="outline" size="sm" disabled>
        <QrCodeIcon className="mr-2 h-4 w-4" />
        Mostrar QR (Cargando...)
      </Button>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
          <QrCodeIcon className="mr-2 h-4 w-4" />
          Mostrar QR
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Código QR para {pet.name}</DialogTitle>
          <DialogDescription>
            Escanea este código QR para ver el perfil público de {pet.name}.
            Esta página está diseñada para quien encuentre a tu mascota.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex flex-col items-center bg-white p-2 inline-block rounded shadow mx-auto">
          {profileUrl ? (
            <QRCodeSVG
              value={profileUrl}
              size={256}
              level={"H"}
              bgColor={"#FFFFFF"}
              fgColor={"#000000"}
              ref={qrSVGRef}
              key={profileUrl} 
            />
          ) : (
            <p>Generando código QR...</p>
          )}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2 break-all">
          URL: {profileUrl || "Cargando..."}
        </p>
        {profileUrl && (
          <Button
            onClick={handleDownloadQR}
            variant="outline"
            className="w-full mt-4"
            disabled={!profileUrl} 
          >
            <Download className="mr-2 h-4 w-4" />
            Descargar QR
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
