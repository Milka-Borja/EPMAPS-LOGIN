# Animaciones con React Native Reanimated

La aplicación usa Reanimated 4, instalado con `npx expo install` para el SDK de
Expo del proyecto. Las animaciones se ejecutan en los componentes nativos y
acompañan interacciones concretas:

1. **Pulso de agua** — `src/components/WaterPulse.tsx`: `withRepeat` y
   `useAnimatedStyle` animan los anillos y la gota de marca en las pantallas de
   acceso y registro.
2. **Entradas con rebote** — `app/login.tsx`, `app/registro.tsx` y
   `app/perfil/editar.tsx`: `BounceInDown`, `ZoomInRotate`, `FadeInUp` y
   `FadeInDown` presentan la marca, el encabezado, las tarjetas y los campos en
   secuencia.
3. **Respuesta de formularios** — `app/login.tsx`, `app/registro.tsx` y
   `app/perfil/editar.tsx`: `withSequence`, `withTiming` y `withSpring` sacuden
   y comprimen brevemente la tarjeta si una operación falla o faltan datos.
   Los avisos y la confirmación de registro/guardado también entran animados.
4. **Seguridad de contraseña** — `src/components/PasswordStrengthIndicator.tsx`:
   `useAnimatedStyle` con `withTiming` interpola el ancho y color de la barra
   entre débil, media y fuerte.
5. **Micro-interacción de botones** — `src/components/PressableButton.tsx`:
   al presionar, el componente reduce su escala a `0.96` con `withSpring` y
   vuelve a `1` al soltar.
6. **Transición de layout** — `app/(tabs)/pendientes.tsx`: `LinearTransition`
   con `springify()` anima la posición de las filas de lecturas cuando cambia
   el contenido de la lista.
