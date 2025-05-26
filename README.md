# Pet Link 🐾🔗

[![Estado del Proyecto](https://img.shields.io/badge/estado-en%20desarrollo-yellowgreen)](https://github.com/moonthang/Pet-Link)
[![Licencia](https://img.shields.io/badge/licencia-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15.x-black?logo=next.js)](https://nextjs.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth,%20Firestore,%20Hosting-orange?logo=firebase)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)

**Pet Link** es un sistema diseñado para la gestión y seguridad de mascotas. Permite a los dueños crear perfiles detallados para sus mascotas, vinculados a placas de identificación con códigos QR únicos. Estos códigos facilitan la rápida recuperación de mascotas perdidas al proporcionar información de contacto crucial a quien las encuentre. La aplicación cuenta con roles de administrador y usuario, notificaciones en tiempo real, y una interfaz moderna y responsiva.

## 📋 Tabla de Contenidos

1.  [Descripción Detallada](#%EF%B8%8F-descripción-detallada)
2.  [🚀 Tecnologías Utilizadas](#-tecnologías-utilizadas)
3.  [✨ Características Principales](#-características-principales)
4.  [📸 Capturas de Pantalla](#-capturas-de-pantalla)
5.  [🧑‍💻 Uso del Sistema](#-uso-del-sistema)
6.  [📂 Estructura del Proyecto](#-estructura-del-proyecto)
7.  [🤝 Contribuciones](#-contribuciones)
8.  [🗺️ Roadmap](#️-roadmap)
9. [👨‍💻 Autor](#-autor)

## 📝 Descripción Detallada

Pet Link es una aplicación web full-stack construida con Next.js y Firebase. Su objetivo principal es ayudar a los dueños de mascotas a mantener a sus compañeros seguros y facilitar su recuperación en caso de pérdida.

**Flujo Principal:**
*   **Administradores:** Pueden gestionar usuarios y crear perfiles iniciales de mascotas (nombre y tipo). Estos perfiles son luego asignados a los dueños mediante un identificador único.
*   **Usuarios (Dueños de Mascotas):** Se registran en el sistema (manualmente o con Google). Ingresan el identificador único de la mascota (proporcionado por un admin) para "reclamarla". Una vez reclamada, pueden completar y editar toda la información del perfil de su mascota, incluyendo raza, fecha de nacimiento, sexo, fotos (principal y secundaria opcional a través de ImageKit.io), características especiales e información de contacto del dueño (que se sincroniza desde su perfil de usuario).
*   **Códigos QR:** Cada mascota tiene un código QR único.
    *   Si el **dueño** escanea el QR de su propia mascota (o accede al perfil desde su cuenta), puede ver el historial de escaneos (última ubicación con mapa) y gestionar el perfil.
    *   Si una **tercera persona** encuentra una mascota perdida y escanea su código QR, se le presenta una página pública con información de contacto crucial del dueño (nombre, teléfono principal) y detalles básicos de la mascota, facilitando su pronta devolución.
*   **Notificaciones:**
    *   Los dueños reciben notificaciones en la aplicación cuando el código QR de su mascota es escaneado por un tercero.
    *   Los administradores reciben notificaciones cuando un usuario reclama una mascota.
*   **Geolocalización:** Cuando se escanea un QR por un tercero y se conceden los permisos, se registra la ubicación del escaneo.

Este proyecto sirve como un portafolio demostrando habilidades en desarrollo full-stack con tecnologías modernas, enfocado en una solución práctica y útil para un problema real.

## 🚀 Tecnologías Utilizadas

*   **Framework Principal:**
    *   <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/nextjs/nextjs-original.svg" alt="Next.js" width="20" height="20"/> **Next.js 15+** (App Router, Server Components, Server Actions)
*   **Frontend:**
    *   <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/react/react-original.svg" alt="React" width="20" height="20"/> **React 18+**
    *   <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/typescript/typescript-original.svg" alt="TypeScript" width="20" height="20"/> **TypeScript 5+**
    *   <img src="https://static-00.iconduck.com/assets.00/tailwind-css-icon-144x86-czphjb87.png" alt="Tailwind CSS" width="20" height="20"/> **Tailwind CSS**
    *   **ShadCN UI** (Componentes de interfaz de usuario)
*   **Backend & Base de Datos:**
    *   <img src="https://raw.githubusercontent.com/devicons/devicon/master/icons/firebase/firebase-plain.svg" alt="Firebase" width="20" height="20"/> **Firebase**
        *   Firebase Authentication (Email/Contraseña, Google Sign-In)
        *   Firebase Firestore (Base de datos NoSQL para perfiles de usuarios, mascotas y notificaciones)
        *   Firebase Hosting (para despliegue)
*   **Gestión de Imágenes:**
    *   <img src="https://media.licdn.com/dms/image/v2/C4D0BAQGFJ1PL2upDCg/company-logo_200_200/company-logo_200_200/0/1630483926785/imagekit_io_logo?e=2147483647&v=beta&t=ilQhn0wSkIYCBBBcp5_G-iZrf-ISHKUNVe-KupdF_48" alt="ImageKit.io" width="20" height="20"/> **ImageKit.io** (Almacenamiento, optimización y entrega de imágenes en tiempo real. Usado para fotos de perfil de usuario y mascotas).
*   **Generación de QR:**
    *   `qrcode.react` (Biblioteca para generar códigos QR dinámicos en el cliente, descargables como SVG).
*   **Geolocalización:**
    *   Browser Geolocation API (para obtener coordenadas en el cliente)
    *   Google Maps JavaScript API (para visualización de mapas, a través de `@vis.gl/react-google-maps`)
*   **Manejo de Formularios y Validación:**
    *   `react-hook-form`
    *   `zod` (Validación de esquemas)
*   **Utilidades y Otros:**
    *   `lucide-react` (Iconos)
    *   `date-fns` & `date-fns-tz` (Manipulación y formateo de fechas y zonas horarias, ej: hora de Bogotá)

## ✨ Características Principales

*   👤 **Autenticación y Roles de Usuario:**
    *   Registro e inicio de sesión con Email/Contraseña y Google Sign-In.
    *   Roles diferenciados: Administrador y Usuario (gestionados en Firestore).
    *   Edición de perfil de usuario (nombre, teléfonos, dirección, foto de perfil subida a ImageKit.io).
*   🐶 **Gestión de Perfiles de Mascotas:**
    *   **Flujo Admin-Usuario:**
        1.  Administrador crea un perfil básico de mascota (nombre, tipo).
        2.  Administrador comparte el ID único de la mascota con el usuario final.
        3.  Usuario ingresa el ID para "reclamar" la mascota, asociándola a su cuenta.
    *   **Edición Completa por Dueño:** Tras reclamar, el dueño completa/edita: raza, fecha de nacimiento (con calendario), sexo (macho/hembra), fotos (principal y secundaria opcional vía ImageKit.io), características especiales.
    *   La información de contacto del dueño (nombre, teléfonos) del perfil de usuario se sincroniza a los perfiles de sus mascotas.
*   🖼️ **Subida de Imágenes con ImageKit.io:**
    *   Carga de fotos de perfil para usuarios y mascotas (principal y secundaria opcional).
    *   Eliminación automática de imágenes antiguas de ImageKit al reemplazar una foto.
*   🔗 **Generación Dinámica de Códigos QR:**
    *   Código QR único (negro sobre blanco) para cada mascota que enlaza a un perfil público simplificado.
    *   Opción de descargar el código QR como imagen SVG.
*   🌍 **Registro de Escaneos y Geolocalización:**
    *   Cuando un tercero escanea un QR y concede permisos, se registra la ubicación del escaneo.
    *   Los dueños pueden ver el historial de escaneos (último con mapa, anteriores como lista) en la zona horaria de Bogotá.
*   🔔 **Notificaciones en la Aplicación:**
    *   **Para Dueños:** Notificación cuando el QR de su mascota es escaneado por un tercero.
    *   **Para Administradores:** Notificación cuando un usuario reclama/asigna una mascota.
    *   Dropdown de notificaciones en la Navbar (con indicador de no leídas) y página dedicada para ver todas las notificaciones, con opciones para marcar como leídas y eliminar.
*   📱 **Interfaz Responsiva:**
    *   Diseño adaptable para escritorio y dispositivos móviles (Navbar con menú hamburguesa).
*   🛠️ **Panel de Administrador:**
    *   Listado y búsqueda de usuarios registrados (perfiles de Firestore).
    *   Opción para copiar enlace de registro público.
    *   Creación de nuevos usuarios (Email/Contraseña, asignación de nivel admin/user).
    *   Visualización y edición de perfiles de usuario (incluyendo su nivel).
    *   Eliminación de usuarios (solo de Firestore y sus mascotas asociadas; Auth requiere Admin SDK para borrado completo).

## 📸 Capturas de Pantalla

*   **Página de Inicio de Sesión:**
![login](https://github.com/user-attachments/assets/77f2cf11-0b5f-431a-ac35-8f8d173982a2)

*   **Página de Registro:**
![registro](https://github.com/user-attachments/assets/b63d3f56-20f0-42bc-a2f8-c236c9b357cb)

*   **Dashboard Principal del Usuario (Lista de Mascotas con Búsqueda):**
![dash-usuario](https://github.com/user-attachments/assets/e47a3526-20c3-4d8d-a118-e678b92c2192)

*   **Perfil de Mascota (Vista Dueño/Admin con Visor de Imágenes y Mapa):**
![perfil-mascota-user](https://github.com/user-attachments/assets/d06e1da7-ebcc-4e14-a765-ddab28e9eb8f)

*   **Perfil Público de Mascota (Vista QR Escaneado):**
![perfil-mascota-publico](https://github.com/user-attachments/assets/7630334c-490d-4421-b7fe-50f612c5e713)

*   **Modal del Código QR:**
![qrMascota](https://github.com/user-attachments/assets/4ebdd8ff-e51d-46e8-9f66-579d3786c62b)

*   **Formulario de Agregar/Editar Mascota:**
![editar-mascota](https://github.com/user-attachments/assets/f0433218-d6f3-4d24-b014-a51139f2798a)

*   **Formulario de Editar Perfil de Usuario:**
![editar-perfil](https://github.com/user-attachments/assets/74d694f9-9e49-451e-9418-462ace5b1df6)

*   **Panel de Administrador (Lista de Usuarios con Búsqueda):**
![lista-usuario-admin](https://github.com/user-attachments/assets/919c5944-4dda-4a8e-8b91-2e389b3fa386)
![perfil-usuario-vistaAdmin](https://github.com/user-attachments/assets/6a42b6a2-76c8-4c77-a634-6d508e695f0e)


*   **Página de Notificaciones:**
![pagina-notificaciones](https://github.com/user-attachments/assets/e608a039-27ce-4f05-bb51-8aea343ef501)
![Notificación-user](https://github.com/user-attachments/assets/4fb4d963-146d-4358-a3a5-62dc23aa7b2c)


* El problema (issue) que aparece en algunas capturas corresponde a que la extensión LanguageTool modifica el DOM, y al deshabilitar la extensión, este problema desaparece.

## 🧑‍💻 Uso del Sistema

1.  **Administrador:**
    *   Inicia sesión con una cuenta configurada con `nivel: "admin"` en Firestore.
    *   **Usuarios:** Puede ir a "Usuarios" para ver la lista, buscar, agregar nuevos usuarios (esto crea la cuenta en Firebase Auth y el perfil en Firestore), editar perfiles (incluyendo nivel) o eliminar usuarios de Firestore (no de Auth). También puede copiar un enlace de registro público.
    *   **Mascotas:** Puede ir a "Mascotas" y usar "Agregar Nueva Mascota". Se le pedirá un nombre y tipo. La mascota se crea asociada al admin inicialmente. El admin copia el ID de la mascota recién creada (visible en la tarjeta) y se lo proporciona al usuario final.

2.  **Usuario Regular:**
    *   Se registra a través de la página `/register` (con email/contraseña o Google).
    *   Una vez logueado, va a "Mascotas" y luego "Agregar Mascota".
    *   Ingresa el ID de la mascota proporcionado por el administrador en el formulario.
    *   Al reclamar, se le redirige al formulario de edición donde puede completar todos los detalles de su mascota (raza, fecha de nacimiento, fotos, etc.). Su propia información de contacto se asocia automáticamente y puede editarla.
    *   Puede ver el código QR de su mascota y descargarlo.
    *   Recibe notificaciones si el QR de su mascota es escaneado.
    *   Puede editar su perfil de usuario (nombre, teléfonos, dirección, foto de perfil).

3.  **Tercero (Persona que Encuentra la Mascota):**
    *   Escanea el código QR de la placa de la mascota.
    *   Se le redirige a una página pública con información del dueño (nombre, teléfono principal) y detalles de la mascota (nombre, tipo, raza, sexo, edad, características, foto).
    *   El escaneo registra la ubicación (si se permite) y notifica al dueño.

## 📂 Estructura del Proyecto

El proyecto sigue la estructura estándar de Next.js con el App Router:

*   `public/`: Archivos estáticos (ej: `assets/logo/logo.png`).
*   `src/`: Código fuente principal.
    *   `app/`: Enrutamiento y páginas.
        *   `(authenticated)/`: Grupo de rutas para páginas que requieren autenticación.
            *   `admin/`: Páginas específicas para administradores (`dashboard`, `users`, `users/[userId]`, `users/[userId]/edit`, `users/new`).
            *   `pets/`: Páginas para la gestión de perfiles de mascotas (`[petId]`, `[petId]/edit`, `new`).
            *   `profile/`: Página para editar el perfil del usuario (`edit`).
            *   `home/page.tsx`: Dashboard principal del usuario (lista de mascotas).
            *   `notifications/page.tsx`: Página para ver todas las notificaciones.
            *   `layout.tsx`: Layout para rutas autenticadas (incluye Navbar y Footer).
        *   `api/`: Rutas de API (ej: `imagekit-auth/route.ts`).
        *   `public/`: Páginas públicas (sin autenticación).
            *   `pets/[petId]/page.tsx`: Perfil público de mascota al escanear QR.
            *   `layout.tsx`: Layout simple para páginas públicas.
        *   `layout.tsx`: Layout raíz de la aplicación (incluye `AuthProvider`).
        *   `page.tsx`: Página de inicio de sesión.
        *   `register/page.tsx`: Página de registro.
    *   `actions/`: Server Actions de Next.js (para interactuar con Firebase e ImageKit).
    *   `assets/logo/logo.png`: Logo de la aplicación.
    *   `components/`: Componentes reutilizables de React.
        *   `pets/`: Componentes específicos para mascotas.
        *   `ui/`: Componentes de ShadCN UI.
        *   `users/`: Componentes específicos para usuarios.
        *   `ImageUploader.tsx`, `Navbar.tsx`.
    *   `contexts/`: Contextos de React (ej: `AuthContext`).
    *   `hooks/`: Hooks personalizados (ej: `useToast`, `useIsMobile`).
    *   `lib/`: Utilidades y configuración de bibliotecas (ej: `firebase.ts`, `utils.ts`).
    *   `types/`: Definiciones de TypeScript.
*   `next.config.ts`: Configuración de Next.js (incluyendo `remotePatterns` para imágenes de ImageKit).
*   `package.json`: Dependencias y scripts del proyecto.

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Si deseas contribuir a Pet Link:

1.  Haz un Fork del repositorio (`https://github.com/moonthang/PetLink`).
2.  Crea una nueva rama para tu característica o corrección (`git checkout -b feature/nueva-caracteristica` o `git checkout -b fix/bug-corregido`).
3.  Realiza tus cambios y haz commit (`git commit -m 'Añade nueva característica X'`).
4.  Haz Push a tu rama (`git push origin feature/nueva-caracteristica`).
5.  Abre un Pull Request describiendo tus cambios.

## 🗺️ Roadmap

Características y mejoras planeadas para el futuro:

*   [ ] 📧 **Notificaciones Externas:** Implementar notificaciones push, por correo electrónico y/o SMS cuando el QR es escaneado.
*   [ ] 📊 **Dashboard de Admin Avanzado:**
    *   Estadísticas de uso (mascotas registradas, escaneos, usuarios activos, etc.).
    *   Posibilidad de que el admin edite directamente el `userId` de una mascota para reasignarla (desde el formulario de edición de mascota).
*   [ ] 🐾 **Soporte para Más Tipos de Animales:** Añadir más opciones además de "Perro" y "Gato".
*   [ ] 🩺 **Sección de Veterinarias Asociadas:** Listado y gestión de veterinarias.
*   [ ] ☁️ **Integración de Admin SDK:** Para eliminación completa de usuarios de Firebase Authentication y otras operaciones privilegiadas desde un backend seguro (ej. Cloud Functions).
*   [ ] ✨ **Mejoras de UI/UX:**
    *   Animaciones y transiciones más pulidas.
    *   Modo oscuro completo.
*   [ ] 🧪 **Pruebas:** Implementar pruebas unitarias y de integración.
*   [ ] 🌐 **Internacionalización (i18n):** Soportar múltiples idiomas.
*   [ ] 🛠️ **Optimización de Rendimiento:** Revisar y optimizar consultas a Firestore y carga de componentes.

## 👨‍💻 Autor

**Pet Link** fue desarrollado por **Miguel Angel Sepulveda Burgos**.

*   <img src="https://cdn.worldvectorlogo.com/logos/github-icon-2.svg" width="20" height="20"/> GitHub: [@moonthang](https://github.com/moonthang)
*   <img src="https://static.vecteezy.com/system/resources/previews/018/930/480/non_2x/linkedin-logo-linkedin-icon-transparent-free-png.png" width="20" height="20"/> LinkedIn: [Miguel Ángel Sepulveda Burgos](https://www.linkedin.com/in/miguel-%C3%A1ngel-sep%C3%BAlveda-burgos-a87808167/)
