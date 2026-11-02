# ADR-002: Consultar MockAPI con Fetch API sin añadir Axios
## Estado
Aceptado.
## Fecha
2026-10-26
## Requisitos relacionados
R3 (obtener y almacenar datos de medidores) y R9 (enviar lecturas cuando haya conectividad).
## Contexto
La búsqueda necesita consultar el servicio simulado cuando el medidor todavía no está en el dispositivo y la sincronización debe enviar lecturas a un endpoint remoto. El presupuesto de dependencias de la prueba es limitado, y los teléfonos de campo pueden perder la conexión o recibir respuestas HTTP fallidas en mitad de una operación.
## Alternativas consideradas
| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
|---|---|---|
| Axios | Interceptores y configuración de cliente útiles si hubiera varios servicios, políticas comunes o transformaciones complejas. | Añade una dependencia para dos operaciones HTTP sencillas; no resuelve por sí sola el modo offline ni la cola persistida. |
| Fetch API de la plataforma | Está disponible en el entorno React Native/Expo y cubre GET y POST de este cliente sin costo adicional de paquete. | El equipo debe comprobar explícitamente `response.ok`/códigos, serializar JSON y mantener a mano cualquier política futura de timeout, retry o cancelación. |
| Cliente HTTP propio con una dependencia de caché | Podría centralizar reintentos y caché de respuestas si el backend tuviera políticas más amplias. | Duplica la caché ya resuelta por SQLite y añade configuración que no aporta beneficio verificable para MockAPI en esta prueba. |
## Decisión
Usar Fetch API para `GET /medidores` y `POST /lecturas` en `src/api/mockapi.ts`, sin instalar Axios. El módulo codifica el parámetro de búsqueda, valida el resultado HTTP, transforma el medidor al tipo local y excluye `id` y `estado_sync` del payload de envío. La caché durable pertenece a SQLite, no al cliente HTTP. En `app/_layout.tsx` se importa además `fetch` desde `expo/fetch` para la petición multipart a Cloudinary; esa llamada es distinta del uso global de Fetch API del cliente MockAPI.
## Consecuencias
Se evita una dependencia de red innecesaria y se mantiene el control explícito de los errores HTTP. El módulo requiere que `EXPO_PUBLIC_MOCKAPI_URL` esté configurada y actualmente no implementa timeout ni reintentos; esos casos los debe manejar la capa de sincronización o incorporarse con una necesidad demostrada. MockAPI es un backend simulado y no debe considerarse garantía de disponibilidad o persistencia de producción.

Justificación de dependencias declaradas en `package.json`:

| Dependencia | Uso o justificación verificable en este repositorio |
|---|---|
| `@expo/vector-icons` | Iconos Ionicons/Feather en las pantallas y navegación. |
| `@react-native-async-storage/async-storage` | Persistencia de stores de sesión y borradores. |
| `@react-native-community/netinfo` | Observación de conectividad para la sincronización y el indicador de red. |
| `expo` | Plataforma y comandos del proyecto Expo; versión declarada `~57.0.31`. |
| `expo-blur` | Paneles y fondos con desenfoque en las pantallas. |
| `expo-camera` | Captura de evidencia con `CameraView` y solicitud de permiso; también está configurada como plugin. |
| `expo-constants` | No se encontró importación directa en `app/` ni `src/`; no se identifica uso funcional comprobable en el código actual. |
| `expo-file-system` | Copia de imágenes al directorio de documentos y lectura del archivo para carga. |
| `expo-font` | No se encontró importación directa ni configuración de fuentes propia; uso funcional no comprobado. |
| `expo-linear-gradient` | Fondos y paneles con gradiente de las pantallas. |
| `expo-linking` | No se encontró importación directa; no se identifica uso funcional explícito en el código actual. |
| `expo-router` | Enrutamiento de pantallas, layouts, parámetros y navegación; es también el `main` configurado. |
| `expo-splash-screen` | Configuración del plugin de splash en `app.json`. |
| `expo-sqlite` | Base SQLite local; también está declarada en los plugins de `app.json`. |
| `expo-status-bar` | No se encontró importación directa ni uso explícito en el código actual. |
| `react` | Componentes y hooks de la aplicación. |
| `react-hook-form` | Gestión de campos y validación de formularios de lectura. |
| `react-native` | UI, eventos, formularios nativos, alertas, listas y estilos. |
| `react-native-safe-area-context` | Área segura de la pantalla de acceso. |
| `react-native-screens` | Integración de pantallas nativas usada por la navegación Expo Router. |
| `zustand` | Stores globales de sesión, borradores y sincronización. |
| `@types/react` (desarrollo) | Tipos de React para TypeScript. |
| `eslint` (desarrollo) | Motor de linting declarado para calidad estática. |
| `eslint-config-expo` (desarrollo) | Configuración Expo consumida por `eslint.config.js`. |
| `typescript` (desarrollo) | Compilador y comprobación de tipos del proyecto. |

Las dependencias `expo-constants`, `expo-font`, `expo-linking` y `expo-status-bar` no tienen uso directo verificable en `app/`, `src/` o `app.json` (salvo dependencias transitivas que no se pueden atribuir aquí); se deben confirmar como necesarias para herramientas/plugins o retirar en una limpieza del manifiesto. `zod`, Axios y Cloudinary SDK no están declaradas; la subida a Cloudinary usa HTTP y no requiere SDK.
## Verificación
Implementación: [src/api/mockapi.ts](../../src/api/mockapi.ts), búsqueda con caché en [app/(tabs)/buscar.tsx](<../../app/(tabs)/buscar.tsx>) y envío durante sincronización en [app/_layout.tsx](../../app/_layout.tsx). En un teléfono: configurar la URL de MockAPI en el entorno, buscar un medidor que no esté en la caché y comprobar la respuesta; luego guardar una lectura, recuperar conectividad y comprobar el POST. Verificar una URL mal configurada y un código HTTP de error para confirmar que no se presentan como éxito. No se encontró prueba automatizada del cliente API.
## Uso de IA
Consulta de esta tarea: revisar el cliente de MockAPI y decidir si justifica añadir Axios, además de verificar las dependencias del manifiesto. La IA sugirió mantener un cliente mínimo y asignar cada paquete a una función observable. Se acepta Fetch API porque el código ya realiza GET/POST y maneja códigos HTTP; se descarta afirmar que todos los paquetes del manifiesto están en uso: cuatro no tienen una justificación directa comprobable y quedan señalados para depuración.
