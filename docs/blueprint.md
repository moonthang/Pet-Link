# **App Name**: PetLink

## Core Features:

- Profile Management: Create, edit, and list dog profiles with name, breed, photo, and owner details. // PetForm.tsx, PetList.tsx
- QR Code Generation: Generate a unique QR code for each dog profile that redirects to a public page. // PetQRModal.tsx
- Public Profile Display: Display public dog information (without edit options) when the QR code is scanned. // ViewPetPage.tsx
- Geolocation Integration: Integrate with a map service to show the location of the scan in real-time. // MapView.tsx

## Style Guidelines:

- Primary color: Soft blue (#64B5F6) to convey trust and security, fitting for a pet safety application.
- Background color: Light gray (#ECEFF1), almost white, providing a clean, neutral backdrop that enhances readability.
- Accent color: Muted green (#81C784), an analogous color used to highlight interactive elements like QR code generation buttons and map markers.
- Use clear and accessible typography to ensure readability. Utilize Bootstrap's typography classes for consistent styling.
- Employ simple, recognizable icons that represent common actions and data points (e.g., a paw print for pet profiles, a QR code for sharing, a map marker for location). Consider using Bootstrap's icon library or a similar set.
- Maintain a clean and organized layout for easy navigation. Leverage Bootstrap's grid system and component structure for responsive design.
- Use subtle, non-intrusive animations for feedback. Consider using Bootstrap's transitions or custom CSS animations for a polished user experience.