
'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

interface PetDisplayImageProps {
  src?: string | null;
  alt: string;
  petName: string; 
  fill?: boolean;
  priority?: boolean;
  className?: string;
  sizes?: string;
  dataAiHint?: string;
  width?: number; 
  height?: number; 
}

export function PetDisplayImage({
  src,
  alt,
  petName,
  fill = true, 
  priority = false,
  className = "object-cover",
  sizes,
  dataAiHint,
  width,
  height,
}: PetDisplayImageProps) {
  const placeholderBaseWidth = fill ? (width || 600) : (width || 300); 
  const placeholderBaseHeight = fill ? (height || 400) : (height || 200); 
  
  const defaultPlaceholderSrc = `https://placehold.co/${placeholderBaseWidth}x${placeholderBaseHeight}.png?text=${encodeURIComponent(petName || "Mascota")}`;
  const errorFallbackSrc = `https://placehold.co/${placeholderBaseWidth}x${placeholderBaseHeight}.png?text=Error+Img`;

  const [currentSrc, setCurrentSrc] = useState(src || defaultPlaceholderSrc);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
    setCurrentSrc(src || defaultPlaceholderSrc);
  }, [src, petName, defaultPlaceholderSrc]); 

  const handleError = () => {
    if (!hasError) { 
      console.warn(`Error loading image: ${currentSrc}. Falling back to error placeholder.`);
      setCurrentSrc(errorFallbackSrc);
      setHasError(true);
    } else if (currentSrc !== defaultPlaceholderSrc) {
      setCurrentSrc(defaultPlaceholderSrc)
    }
  };
  
  const imageProps = fill 
    ? { fill: true, sizes: sizes } 
    : { width: width || placeholderBaseWidth, height: height || placeholderBaseHeight };


  return (
    <Image
      key={currentSrc} 
      src={currentSrc}
      alt={alt}
      {...imageProps}
      priority={priority}
      className={className}
      data-ai-hint={dataAiHint}
      onError={handleError}
    />
  );
}
