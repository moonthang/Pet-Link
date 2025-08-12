
export interface ScanLocation {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: string; 
}

export interface PetProfile {
  id: string; 
  name: string;
  breed: string | null; 
  photoUrl: string;
  photoPath?: string | null; 
  photoFileId?: string | null;
  photoUrl2?: string | null; 
  photoPath2?: string | null; 
  photoFileId2?: string | null;
  tipoAnimal: "Perro" | "Gato";
  fechaNacimiento: string; 
  sexo: "Macho" | "Hembra" | null;
  caracteristicaEspecial?: string | null;

  ownerName: string | null;
  ownerEmail?: string | null;
  ownerPhone1: string | null;
  ownerPhone2?: string | null;

  createdAt: string; 
  scanHistory?: ScanLocation[];
  userId?: string | null; 
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName?: string | null;
  nivel?: 'admin' | 'user' | 'demo';
  photoURL?: string | null;
  photoFileId?: string | null;
  phone1?: string | null;
  phone2?: string | null;
  address?: string | null;
}

export interface AppNotification {
  id: string; 
  userId: string; 
  title: string;
  message: string;
  link?: string; 
  timestamp: string; 
  read: boolean;
  type: 'qrScan' | 'newPetAdmin' | 'generic'; 
  relatedPetId?: string;
  relatedPetName?: string;
  relatedUserId?: string; 
  relatedUserName?: string;
}
