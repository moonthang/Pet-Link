
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInMonths, isValid } from 'date-fns';
import * as dateFnsTz from 'date-fns-tz';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateAge(birthDateISOString?: string | null): string {
  if (!birthDateISOString) {
    return 'Edad desconocida';
  }
  
  let birthDate;
  try {
    birthDate = new Date(birthDateISOString); 
    if (!isValid(birthDate)) {
      return 'Fecha inválida';
    }
  } catch (e) {
    return 'Fecha inválida';
  }

  const today = new Date();
  if (birthDate > today) {
    return 'Aún no ha nacido';
  }

  const totalMonths = differenceInMonths(today, birthDate);
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  const yearText = years > 0 ? `${years} año${years > 1 ? 's' : ''}` : '';
  const monthText = months > 0 ? `${months} mes${months > 1 ? 'es' : ''}` : '';

  if (years > 0 && months > 0) {
    return `${yearText}, ${monthText}`;
  } else if (years > 0) {
    return yearText;
  } else if (months > 0) {
    return monthText;
  } else {
    return 'Menos de 1 mes';
  }
}
