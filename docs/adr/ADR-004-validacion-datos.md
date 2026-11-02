# ADR-004: Validar entradas con esquemas Zod y el formato estricto del medidor
## Estado
Aceptado.
## Fecha
2026-10-26
## Requisitos relacionados
R2 (rechazar códigos de medidor mal formados antes de consultar), R5 (validar campos según el estado del medidor) y R6 (detectar consumos anómalos).
## Contexto
Un código mal formado no debe originar llamadas de red ni consultas locales inútiles. Además, los campos requeridos cambian según el técnico marque el medidor normal, inaccesible o dañado; una lectura numérica inválida o un consumo fuera del comportamiento esperado puede producir un registro incorrecto en una zona donde no sea posible confirmar los datos con el sistema central.
## Alternativas consideradas
| Alternativa | Ventajas en este proyecto | Desventajas en este proyecto |
|---|---|---|
| Validaciones manuales con `if/else` y expresiones regulares | No requiere dependencia y permite resolver las reglas actuales directamente en pantalla. | Las reglas pueden divergir entre búsqueda, formulario y persistencia; el proyecto ya repite la expresión del código en más de una pantalla y las condiciones se vuelven difíciles de auditar al crecer. |
| Zod con esquemas de entrada y refinamientos por estado | Expresa formatos, tipos y reglas condicionales en un esquema comprobable; puede reutilizarse en el formulario y en los límites de datos. | Añade una dependencia que no está en `package.json`; requiere integrar el esquema con React Hook Form y definir mensajes y pruebas para los casos condicionales. |
| Yup integrado al formulario | Alternativa madura para esquemas y validaciones de formulario. | Sería otra dependencia y no cumple la decisión de estandarizar el proyecto en Zod; la validación del código de búsqueda también necesitaría reutilización explícita. |
## Decisión
Adoptar Zod para validar los datos de entrada y aplicar el patrón exacto `/^MED-\d{6}$/` al código del medidor antes de acceder a SQLite o a la red. El esquema de lectura debe condicionar los campos a `NORMAL`, `INACCESIBLE` y `DAÑADO`; la detección de consumo se calcula como lectura actual menos última lectura y se considera anómala cuando supera tres veces el promedio. La confirmación de una anomalía no sustituye la validación ni el requisito de foto establecido para ese caso.
## Consecuencias
Las reglas quedan centralizables y reutilizables entre rutas, lo que reduce discrepancias de datos. El esquema debe probarse con formatos inválidos y con cada combinación de estado y campos, y se debe presentar al técnico un error accionable. Riesgo/estado actual: aunque la decisión está aceptada, Zod no está instalado ni se encontró en el código; `buscar.tsx` y `[id].tsx` usan el regex directamente y el formulario define reglas con React Hook Form. Por tanto, esta ADR documenta la decisión arquitectónica, pero no afirma que la validación Zod esté implementada; hasta integrarla, existe riesgo de duplicación o divergencia.
## Verificación
Implementación parcial: regex y bloqueo de búsqueda en [app/(tabs)/buscar.tsx](<../../app/(tabs)/buscar.tsx>), reglas de formulario y umbral de anomalía en [app/lectura/[id].tsx](<../../app/lectura/[id].tsx>). Requisito pendiente: añadir Zod al manifiesto y un esquema compartido; actualmente no existe archivo de esquema ni prueba automatizada de validación. En el teléfono, introducir códigos con longitud incorrecta, caracteres adicionales y dígitos no válidos y comprobar que no se inicia búsqueda; probar estado normal sin lectura, inaccesible sin motivo y daño sin descripción; ingresar un consumo superior a tres veces el promedio y confirmar que solicita advertencia y foto.
## Uso de IA
Consulta de esta tarea: contrastar validación manual y esquemas para los campos condicionales y el código de medidor. La IA sugirió un esquema reutilizable con una expresión exacta y reglas refinadas por estado. Se acepta el diseño porque limita divergencias y se ajusta a R2/R5/R6; no se acepta presentar la app como ya protegida por Zod, pues la inspección de `package.json` y del código confirma que esa integración sigue pendiente.
