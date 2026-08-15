# UX/UI Guidelines — Plataforma comunitaria de ayuda

## 1. Propósito del documento

Este documento define las directrices de experiencia de usuario (UX), interfaz de usuario (UI), contenido, accesibilidad, responsive design y sistema visual para la plataforma comunitaria de ayuda.

Debe leerse junto con:

- `MVP.md` — define el alcance y comportamiento funcional del producto.
- `ARCHITECTURE_GUIDELINES.md` — define la arquitectura, patrones técnicos, seguridad y organización del código.

Este documento define **cómo debe experimentarse y visualizarse el producto**, no qué funcionalidades adicionales deben implementarse.

No introducir funcionalidades fuera del alcance de `MVP.md` solamente para mejorar la interfaz.

---

# 2. Objetivo de UX

La plataforma debe permitir que una persona pueda entender en pocos segundos:

1. Qué es la plataforma.
2. Qué pedidos de ayuda existen.
3. Cómo puede pedir ayuda.
4. Cómo puede ayudar.
5. Qué debe hacer a continuación.

La experiencia debe transmitir:

- Comunidad.
- Confianza.
- Claridad.
- Tranquilidad.
- Transparencia.
- Utilidad.
- Ausencia de interés comercial.

La interfaz debe sentirse como una herramienta de coordinación comunitaria, no como:

- Un marketplace.
- Una tienda.
- Una plataforma de crowdfunding.
- Una aplicación de contratación tradicional.

---

# 3. Principios UX fundamentales

## 3.1 Acción principal evidente

Cada pantalla debe tener una acción principal claramente identificable.

No presentar múltiples botones primarios compitiendo entre sí.

Ejemplos:

- En un pedido de ayuda abierto: `Quiero ayudar`.
- En creación de pedido de ayuda: `Publicar pedido de ayuda`.
- En una oferta de ayuda: `Enviar oferta`.
- En un pedido de ayuda propio: `Marcar como solucionada`.

---

## 3.2 Menos decisiones por pantalla

Evitar formularios largos, pasos innecesarios y decisiones que el usuario todavía no necesita tomar.

La plataforma debe preguntar información progresivamente.

No pedir durante el registro información que solamente será necesaria posteriormente.

Ejemplo:

- No pedir teléfono obligatoriamente durante el registro.
- Solicitarlo cuando sea necesario establecer contacto.

---

## 3.3 Mobile-first

El diseño debe comenzar por teléfono y escalar hacia tablet y escritorio.

No diseñar primero una interfaz desktop y posteriormente intentar adaptarla a móvil.

Las acciones más importantes deben ser cómodas para uso con una mano.

---

## 3.4 Lenguaje humano

Utilizar español claro y cotidiano.

Preferir:

- `Necesito ayuda`
- `Quiero ayudar`
- `Puedo aportar este material`
- `Marcar como solucionada`
- `Contactar`

Evitar lenguaje técnico o empresarial innecesario como:

- `Crear ticket` como texto visible al usuario.
- `Stakeholder`.
- `Lead`.
- `Provider`.
- `Transaction`.
- `Escalate`.

El concepto interno puede llamarse `Need`, `HelpOffer`, etc.; la interfaz debe utilizar lenguaje humano.

---

## 3.5 No dramatizar la emergencia

La aplicación debe reconocer el contexto de emergencia sin utilizar un diseño visual basado en miedo, alarmismo o tragedia.

Debe transmitir:

> "Hay un problema y podemos organizarnos para ayudar."

No:

> "Situación desesperada / emergencia crítica / desastre."

salvo que una clasificación de prioridad realmente lo justifique.

---

## 3.6 Transparencia

Una persona debe poder distinguir visualmente entre:

- Un pedido de ayuda publicado.
- Una oferta de ayuda.
- Una ayuda confirmada.
- Una sugerencia.
- Un comentario.
- Un material ofrecido.
- Un pedido de ayuda solucionado.

No presentar una oferta como si fuera una ayuda ya realizada.

---

# 4. Principio visual general

La interfaz debe ser limpia, sobria y humana.

Evitar:

- Gradientes excesivos.
- Animaciones decorativas.
- Efectos visuales innecesarios.
- Sombras pesadas.
- Interfaces saturadas.
- Exceso de iconos.
- Elementos que parezcan publicidad.

La jerarquía visual debe venir principalmente de:

- Tipografía.
- Espaciado.
- Tamaño.
- Peso.
- Contraste.
- Estructura.
- Estados.

No depender de ornamentos para comunicar jerarquía.

---

# 5. Arquitectura de información

La aplicación debe organizarse alrededor de los pedidos de ayuda de la comunidad.

Estructura conceptual principal:

```text
Inicio
├── Pedidos de ayuda
│   ├── Lista de pedidos de ayuda
│   └── Detalle de pedido de ayuda
│
├── Publicar pedido de ayuda
│
├── Mis pedidos de ayuda
│
├── Mis ayudas
│
├── Perfil
│
└── Autenticación
    ├── Iniciar sesión
    ├── Crear cuenta
    └── Verificar correo
```

No convertir el perfil profesional en el centro de navegación del MVP.

El pedido de ayuda debe ser el objeto principal de la experiencia.

---

# 6. Navegación

## 6.1 Navegación móvil

En móvil utilizar una barra de navegación inferior fija (`BottomNav`) para personas con sesión iniciada.

Debe facilitar el acceso a las funciones principales:

- Inicio.
- Pedidos de ayuda.
- Avisos (notificaciones).
- Perfil.

La acción `Publicar pedido de ayuda` ocupa una posición central destacada (botón flotante elevado).

La barra inferior solo se muestra en móvil (`md:hidden`) y respeta el área segura inferior (`safe-area-inset-bottom`). Las personas sin sesión ven el header con acciones de acceso (`Ingresar` / `Registrarse`), sin barra inferior.

El header muestra a la izquierda únicamente el logo (marca sin texto), clickeable a la portada. En móvil, el botón de hamburguesa abre un dropdown (`role="menu"`) que, sin sesión, ofrece `Pedidos de ayuda` e `Ingresar`; con sesión añade `Publicar pedido de ayuda`, `Notificaciones` (con contador), `Panel de administración`, `Mi cuenta` y `Salir`. Cierra al seleccionar, con `Escape` o al hacer clic fuera.

No saturar la navegación inferior con más de las opciones necesarias.

---

## 6.2 Navegación desktop

En desktop puede utilizarse una barra superior o estructura equivalente.

Debe mantener la misma lógica mental que móvil.

No crear una experiencia completamente diferente en desktop.

---

# 7. Inicio

La página inicial debe explicar inmediatamente la propuesta de valor.

Concepto recomendado:

> **Ayudemos entre todos**

Contexto (siempre visible en el hero):

> Terremoto del 10 de agosto de 2026

Subtexto:

> Si el terremoto dañó tu casa, pide ayuda para repararla —paredes, techos, escombros—. Si puedes aportar mano de obra, materiales o conocimientos, ofrece tu ayuda a tu comunidad.

Acciones principales:

- `Pedir ayuda` (botón primario teal, hacia `publicar pedido`).
- `Ayudar` (botón terracota/brick, hacia los pedidos de ayuda).

Bajo las acciones, una franja de chips con los oficios de reconstrucción (p. ej. `Reconstrucción de viviendas · Paredes · Techos · Retiro de escombros`) para dejar claro el contexto de construcción.

Debajo debe aparecer un acceso visible a:

> `Pedidos de ayuda recientes`

La página no debe comenzar con un directorio de profesionales.

---

# 8. Pedidos de ayuda públicas

La lista de pedidos de ayuda debe poder consultarse sin iniciar sesión.

Cada elemento debe permitir comprender rápidamente:

- Qué necesita la persona.
- Dónde está aproximadamente.
- Qué tipo de ayuda puede necesitar.
- Estado.
- Hace cuánto se publicó.

Ejemplo conceptual:

```text
Reparación de pared
Pereira · Cuba

Tengo una pared con daños después del sismo...

🔴 Necesita ayuda
Hace 2 horas
```

La lista debe utilizar paginación o carga incremental. No cargar cientos de registros completos de una sola vez.

---

# 9. Tarjeta de pedido de ayuda

La `NeedCard` debe ser una pieza visual reutilizable.

Debe mostrar como mínimo:

- Título.
- Ubicación aproximada.
- Estado.
- Fecha relativa.
- Extracto de descripción.
- Número de ofertas/participaciones cuando sea relevante.
- Imagen principal si existe.

Debe evitar mostrar demasiado texto.

El objetivo de la tarjeta es responder:

> "¿Quiero abrir este pedido de ayuda?"

No contar toda la historia dentro de la tarjeta.

---

# 10. Detalle de pedido de ayuda

El detalle es una de las pantallas más importantes del producto.

Orden recomendado:

```text
Estado
Título
Ubicación aproximada
Descripción
Fotografías

Ayuda que se necesita / contexto

Personas que se ofrecieron

Hilo de colaboración

Acciones
```

La acción principal debe depender del estado.

En un pedido de ayuda abierto:

> `Quiero ayudar`

En un pedido de ayuda propio:

> `Gestionar pedido de ayuda`

En un pedido de ayuda solucionado:

> `Pedido de ayuda solucionado`

---

# 11. Estados de un pedido de ayuda

Los estados deben ser visualmente claros y nunca depender solamente del color.

Estados del MVP:

### 🔴 Necesita ayuda

El pedido de ayuda está abierto y requiere colaboración.

### 🟡 En proceso

Ya hay personas colaborando, pero aún no se ha solucionado.

### 🟢 Solucionada

El creador confirmó que el pedido de ayuda fue solucionada.

### ⚪ Cerrada

El pedido de ayuda fue cerrado sin que necesariamente haya sido solucionado.

Cada estado debe utilizar:

- Texto.
- Iconografía apropiada cuando corresponda.
- Color como refuerzo, no como único indicador.

---

# 12. Publicar un pedido de ayuda

El formulario debe priorizar la facilidad sobre la cantidad de información.

Campos principales:

1. Título.
2. Descripción.
3. Categoría.
4. Municipio.
5. Zona/barrio.
6. Fotografías.

La dirección exacta no debe ser pública.

No obligar al usuario a especificar materiales exactos.

Debe existir una opción natural para expresar:

> `No sé exactamente qué necesito.`

Esto es importante porque la persona afectada puede no tener conocimientos técnicos.

---

# 13. Subida de fotografías

La subida de imágenes debe ser especialmente sencilla en móvil.

Permitir:

- Tomar fotografía desde el dispositivo.
- Seleccionar fotografías existentes.
- Ver miniaturas antes de publicar.
- Eliminar una fotografía seleccionada.

Mostrar límites y errores en lenguaje claro.

Ejemplo:

> `La imagen es demasiado grande. Elige una imagen de menor tamaño.`

Evitar mensajes técnicos como:

> `Payload too large.`

---

# 14. Comentarios y colaboración

El hilo de colaboración es parte central del producto.

Visualmente debe diferenciar los distintos tipos de participación.

Como mínimo:

### Comentario

Una opinión, recomendación o información.

### Oferta de ayuda

Una persona indica que puede ayudar.

### Oferta de material

Una persona indica que puede aportar un recurso físico.

No convertir cada interacción en un formulario complejo.

El usuario debe poder participar desde el propio hilo cuando corresponda.

---

# 15. Oferta de ayuda

Al pulsar `Quiero ayudar`, el usuario debe poder seleccionar el tipo de ayuda y escribir un mensaje breve.

Ejemplo:

```text
¿Cómo puedes ayudar?

[ Mano de obra ]
[ Voluntariado ]
[ Materiales ]
[ Herramientas ]
[ Transporte ]
[ Asesoría ]
[ Otra ]

Cuéntale cómo puedes ayudar:
[____________________________]

[ Enviar oferta ]
```

El formulario debe evitar pedir información que el usuario ya tenga en su perfil.

---

# 16. Diferenciar ofrecimiento de ayuda realizada

La interfaz debe usar lenguaje preciso.

Correcto:

> `Carlos se ofreció a ayudar.`

Correcto:

> `Ayuda confirmada por la persona solicitante.`

Incorrecto:

> `Carlos ayudó.`

cuando solamente existe una oferta.

Esto es una regla de UX y confianza fundamental.

---

# 17. Materiales

No utilizar inicialmente un checkout, carrito o sistema de donación.

Una oferta de material debe expresarse naturalmente dentro del pedido de ayuda.

Ejemplo:

> 🧱 `María se ofrece a aportar 2 bultos de cemento.`

Debe ser visible quién lo ofreció y si el aporte ha sido confirmado por la persona solicitante.

Utilizar estados claros:

- `Ofrecido`.
- `Confirmado por el solicitante`.

No mostrar el aporte como confirmado antes de que exista confirmación.

---

# 18. Contacto

Los datos de contacto nunca deben aparecer públicamente en las tarjetas o listados.

La interfaz debe permitir:

> `Contactar`

únicamente cuando exista una relación válida entre los usuarios y el pedido de ayuda.

El teléfono puede mostrarse solamente a las personas involucradas.

Debe existir un mensaje claro cuando el contacto todavía no está disponible.

---

# 19. Autenticación

El registro debe ser corto.

Campos principales:

- Nombre.
- Correo electrónico.
- Contraseña.
- Municipio.

La selección de capacidades puede incluir:

- `Necesito ayuda`.
- `Quiero ayudar`.
- `Puedo aportar materiales`.
- Otras capacidades disponibles.

Una persona puede seleccionar más de una capacidad.

No tratar estas opciones como roles mutuamente excluyentes.

Implementación: el registro pide al menos una capacidad con `CapabilityPicker` (casillas de
verificación sobre el catálogo `capabilities`, nunca un selector único). Como con la confirmación
de correo activa todavía no hay sesión al terminar el registro, las capacidades viajan como
arreglo de slugs en la metadata del usuario y el trigger `handle_new_user` las materializa en
`profile_capabilities` dentro de la misma transacción que crea el perfil; un slug desconocido se
ignora en vez de romper el registro. Después, `Mi cuenta` permite cambiarlas con el mismo
componente, guardando solo la diferencia.

---

# 20. Verificación de correo

Con `Confirm email` de Supabase habilitado, un usuario que aún no ha verificado su correo no puede realizar acciones comunitarias sensibles.

Debe existir una pantalla específica:

> **Verifica tu correo**
>
> Te enviamos un enlace de verificación a `correo@example.com`.
>
> Revisa tu bandeja de entrada y confirma tu cuenta para poder publicar pedidos de ayuda y ofrecer ayuda.
>
> `Reenviar correo`
>
> `Ya verifiqué mi correo`

Debe existir una ruta clara para recuperar esta pantalla.

La interfaz nunca debe presentar `email no verificado` como un error técnico.

---

# 21. Login y retorno a la acción

Cuando un usuario llegue a una acción que requiera autenticación, la aplicación debe conservar el contexto siempre que sea posible.

Ejemplo:

```text
Pedido de ayuda #123
   ↓
Quiero ayudar
   ↓
Login / registro
   ↓
Verificación de correo
   ↓
Regreso a Pedido de ayuda #123
   ↓
Continúo con la oferta de ayuda
```

No enviar al usuario a una pantalla genérica donde pierda el contexto.

---

# 22. Perfil

El perfil debe ser sencillo.

Debe mostrar como mínimo:

- Nombre.
- Municipio.
- Capacidades declaradas.
- Información breve opcional.
- Participaciones relevantes.

Separar claramente:

- `Correo verificado`.
- `Identidad verificada`, si esta funcionalidad se implementa posteriormente.
- `Profesión declarada`.

No presentar un correo verificado como sinónimo de persona confiable.

---

## 22.1 Mi actividad: mis pedidos y mis ayudas

El historial de participaciones (MVP §24) vive en dos páginas propias, según la arquitectura de
información de §5, y `Mi cuenta` actúa como su punto de entrada junto con el menú móvil:

- **`/my-needs` — Mis pedidos de ayuda**: los pedidos propios en todos sus estados, agrupados en
  `Pedido actual` (abierto o en proceso), `Solucionados` y `Cerrados`. Como solo puede haber un
  pedido activo a la vez (MVP §8), cuando no hay ninguno activo la página ofrece publicar uno.
- **`/my-help` — Mis ayudas**: las ofertas propias agrupadas en `Ayudas pendientes`,
  `Ayudas confirmadas` y `Ofertas canceladas`. Una ayuda marcada como realizada sigue contando
  como pendiente hasta que la confirma quien pidió la ayuda (MVP §11, §16): la interfaz no se
  adelanta a esa confirmación.

Ambas listas reutilizan la paginación por cursor del listado público y muestran el estado exacto
de cada elemento con los mismos badges del resto de la aplicación, sin inventar etiquetas nuevas.
Cuando una oferta apunta a un pedido ocultado por moderación, la tarjeta lo dice en lugar de
mostrar un título que ya no es visible.

---

# 23. Estados de carga

Toda operación asíncrona debe proporcionar feedback visual.

Ejemplos:

- Cargando pedidos de ayuda.
- Subiendo imágenes.
- Publicando pedido de ayuda.
- Enviando oferta.
- Guardando cambios.

Preferir estados contextuales a bloquear toda la pantalla sin pedido de ayuda.

Botones que ejecuten acciones deben deshabilitarse mientras la operación está en progreso para evitar dobles envíos.

---

# 24. Empty states

Las pantallas vacías deben explicar qué ocurre y qué hacer a continuación.

No mostrar simplemente:

> `No data.`

Ejemplo:

> **Todavía no tienes pedidos de ayuda**
>
> Cuando necesites ayuda con una reparación, puedes publicar un pedido de ayuda.
>
> `Publicar pedido de ayuda`

Para pedidos de ayuda públicas:

> **No encontramos pedidos de ayuda con estos filtros.**

---

# 25. Errores

Los errores deben ser comprensibles para personas no técnicas.

Nunca mostrar directamente mensajes crudos de base de datos o errores internos al usuario.

Ejemplos correctos:

> `No pudimos publicar el pedido de ayuda. Comprueba tu conexión e inténtalo de nuevo.`

> `No tienes permiso para realizar esta acción.`

> `Este pedido de ayuda ya no está disponible para recibir ofertas.`

Evitar mostrar:

> `42501: new row violates row-level security policy.`

Los errores técnicos sí deben quedar disponibles para logs/developer tooling cuando corresponda.

---

# 26. Confirmaciones y acciones destructivas

Acciones sensibles como:

- Cerrar un pedido de ayuda.
- Eliminar un pedido de ayuda.
- Eliminar una fotografía.
- Abandonar una participación.

deben utilizar confirmación apropiada cuando exista riesgo de pérdida de información.

El texto debe explicar la consecuencia.

Ejemplo:

> **¿Cerrar este pedido de ayuda?**
>
> Ya no aparecerá como un pedido de ayuda activo y las personas no podrán ofrecer nuevas ayudas.

---

# 27. Accesibilidad

La interfaz debe cumplir buenas prácticas de accesibilidad desde el inicio.

Como mínimo:

- HTML semántico.
- Labels asociados a inputs.
- Focus visible.
- Navegación por teclado.
- Contraste suficiente.
- Botones con nombres comprensibles.
- Estados no comunicados solamente por color.
- Alt text útil para imágenes informativas.
- `aria` solamente cuando sea realmente necesario.
- Orden lógico del foco.

No utilizar iconos como única forma de comunicar una acción importante.

Ejemplo incorrecto:

> Solo un icono de papelera.

Preferir, cuando el contexto lo requiera:

> `Eliminar fotografía` + icono.

---

# 28. Responsive design

Breakpoints y tamaños concretos deben mantenerse centralizados y consistentes con el sistema de estilos del proyecto.

No crear valores arbitrarios en cada componente.

Prioridades móviles:

- Lectura rápida.
- Botones suficientemente grandes.
- Formularios cómodos.
- Fotos visibles.
- Navegación sencilla.
- Pocas columnas.

En desktop puede utilizarse más espacio horizontal, pero no debe aumentarse innecesariamente el ancho de líneas de texto.

---

# 29. Imágenes

Las imágenes de daños son una parte importante del producto.

La UI debe:

- Mantener proporciones.
- Evitar deformación.
- Permitir ampliación cuando sea útil.
- Mostrar una imagen principal y miniaturas cuando corresponda.
- Usar placeholders mientras cargan.
- Proporcionar estados de error si no pueden cargarse.

Las imágenes no deben dominar la pantalla cuando la descripción y el estado del pedido de ayuda son más importantes.

---

# 30. Sistema de componentes

Utilizar componentes reutilizables.

Componentes genéricos esperados:

- `Button`
- `Input`
- `Textarea`
- `Select`
- `Checkbox`
- `Badge`
- `Card`
- `Modal`
- `Alert`
- `Avatar`
- `Skeleton`
- `EmptyState`

Componentes de dominio esperados:

- `NeedCard`
- `NeedStatus`
- `NeedHeader`
- `NeedGallery`
- `HelpOffer`
- `MaterialOffer`
- `CollaborationThread`
- `ContactAction`
- `UserSummary`

No copiar y pegar estilos equivalentes en múltiples componentes.

---

# 31. Design tokens

No definir valores visuales arbitrariamente componente por componente.

Centralizar al menos:

- Colores.
- Tipografía.
- Tamaños de texto.
- Espaciado.
- Radios.
- Sombras.
- Breakpoints.
- Estados.

Los tokens deben ser compatibles con Tailwind y mantener una única fuente de verdad.

No introducir una segunda librería de componentes visuales si no existe un pedido de ayuda clara.

## 31.1 Dirección visual: "Cantera cálida"

El sistema visual se construye alrededor de una cantera cálida: superficies en tonos arena
cálidos y texturizados, acentos teal de confianza (la marca) y terracota ("brick") para las
acciones de ayuda y reconstrucción. Transmite calidez de comunidad, construcción y esperanza,
sin caer en tonos fríos o institucionales.

Definido en `src/styles/tokens.css` (única fuente de verdad, compatible con Tailwind):

- **Neutros arena**: `arena-50 #faf7f1` (fondo general), `arena-100 #f4eee1` (secciones
  alternas), `arena-200 #e9ddc6` (bordes y acentos), `arena-300 #d9c6a3`.
- **Marca (teal)**: escala `brand` existente, invariable (confianza y comunidad).
- **Terracota**: `brick-500 #c96f4a`, `brick-600 #b85c38`, `brick-700 #98492c` para la acción
  `Ayudar` y elementos de reconstrucción.
- **Tipografía**: `Sora` para títulos (`--font-display`) e `Inter` para texto (`--font-sans`),
  cargadas desde Google Fonts en `index.html`. Títulos `h1`–`h3` usan `font-display`.
- **Radios y sombras**: radios mayores (`rounded-lg` 1rem, `rounded-xl` 1.25rem) y sombras
  suaves y amplias.
- **Superficies**: el fondo por defecto es `arena-50`; las tarjetas usan `Card` (fondo blanco,
  borde `arena-200`, `rounded-xl`).

Los botones se definen en `src/shared/components/buttonStyles.ts` con variantes `primary`
(teal), `secondary` (blanco con borde brand), `brick` (ayudar/reconstrucción), `danger` y
`subtle`. El hero de la página de inicio usa una textura de ladrillos decorativa y un mockup
del producto construido en CSS puro (sin imágenes externas): la tarjeta de un pedido de ayuda
cuenta en bucle la historia de una publicación → una oferta (Juan, albañilería) → otro aporte
(Jorge, cemento) → "Ayuda en camino", con una barra de progreso del ciclo (14 s). La
secuencia usa keyframes definidos en `tokens.css` (`animate-story-a/b/c`, `animate-float`,
`animate-pulse-soft`, `animate-progress`) y respeta `prefers-reduced-motion`:
`motion-reduce:animate-none` deja visible la historia completa en estado estático.

Aplicación del patrón (Fase 2): el listado, el detalle y la publicación de pedidos de ayuda
se construyen con superficies `Card` (blanco, borde `arena-200`, `rounded-xl`) sobre fondo
`arena-50`; los selects y textareas usan bordes arena; los estados vacíos usan `EmptyState`;
los hilos, ofertas y el formulario de oferta mantienen los acentos brand/brick. Los estados
de los pedidos (`NeedStatus`) y de las ofertas conservan sus colores semánticos.

---

# 32. Colores y estados

El color debe utilizarse como apoyo semántico.

Debe existir una jerarquía clara entre:

- Estado positivo.
- Estado de advertencia.
- Estado de pedido de ayuda/atención.
- Error.
- Información.

No utilizar rojo como color dominante de toda la aplicación solamente porque el producto surgió en un contexto de desastre.

La sensación general debe ser esperanzadora y comunitaria.

---

# 33. Iconografía

Utilizar un único lenguaje de iconos en toda la aplicación.

Los iconos deben:

- Ser reconocibles.
- Acompañar acciones conocidas.
- No reemplazar texto cuando el significado pueda ser ambiguo.

No utilizar emojis como sistema principal de iconografía de la interfaz.

Los emojis pueden aparecer ocasionalmente en contenido editorial o contextos específicos, pero los controles de UI deben utilizar iconos consistentes.

---

# 34. Microcopy

Los textos de interfaz deben ser breves y orientados a la acción.

Preferir:

> `Publicar pedido de ayuda`

sobre:

> `Haga clic aquí para crear una nueva solicitud de asistencia`

Preferir:

> `Quiero ayudar`

sobre:

> `Registrarme como persona potencialmente colaboradora`

El lenguaje debe ser cálido sin ser excesivamente emocional.

---

# 35. Privacidad visible

La UI debe explicar cuándo determinada información será privada.

Ejemplo al solicitar teléfono:

> `Tu número solo será visible para las personas relacionadas con esta ayuda.`

Ejemplo al solicitar ubicación:

> `Mostraremos solamente tu zona aproximada. No mostraremos públicamente la dirección exacta.`

La privacidad debe explicarse cerca del momento en que se solicita el dato.

---

# 36. Seguridad y confianza en la interfaz

La UI debe comunicar con precisión el nivel de certeza de la información.

Diferenciar:

- `Se ofreció a ayudar`.
- `Contacto establecido`.
- `Ayuda confirmada`.
- `Pedido de ayuda solucionado`.

No utilizar badges como `Confiable`, `Seguro` o `Verificado` salvo que exista una definición funcional real detrás de ellos.

Un correo verificado debe mostrarse como:

> `Correo verificado`

No como:

> `Usuario confiable`

---

## 36.1 Advertencia de daño estructural

Cuando un pedido de ayuda pueda involucrar partes que sostienen la vivienda (columnas, vigas,
muros de carga, cimentación, losas, grietas, fisuras, hundimientos, desplomes o inclinaciones),
la interfaz muestra una advertencia que recomienda una evaluación por parte de un ingeniero o
arquitecto (MVP §22).

La detección es una heurística de presentación, no una evaluación técnica: `hasStructuralRisk()`
(`src/features/needs/types.ts`) compara el título, la descripción y la categoría —normalizados a
minúsculas y sin tildes— contra `STRUCTURAL_HINT_TERMS`, e incluye siempre los pedidos marcados
como `No sé exactamente qué necesito`, por tratarse de un daño de naturaleza no clara. Ante la
duda advierte de más, pero no se dispara por mencionar "pared" o "muro" sin una señal de daño:
esas palabras aparecen en casi cualquier pedido y volverían el aviso ruido constante (§3.5, §38).

Se muestra con el componente `StructuralWarning` (`Alert` variante `warning` + icono
`TriangleAlert`) en dos lugares:

- **Publicación**: aparece mientras la persona escribe, encima del botón de publicar, en cuanto
  el texto o la categoría dan la señal.
- **Detalle**: bajo el encabezado del pedido, visible también para quien está pensando en ayudar.

El texto es informativo, nunca alarmista, y deja explícito que la plataforma **no evalúa ni
certifica** si una vivienda es segura, y que lo que opine allí un profesional que se ofrezca a
ayudar **no es una certificación oficial**. La interfaz nunca afirma que una estructura sea
segura.

---

# 37. Prioridad de información en un pedido de ayuda

Cuando exista mucha información, respetar esta prioridad:

1. Estado.
2. Qué necesita la persona.
3. Dónde se necesita ayuda.
4. Fotografías.
5. Quiénes se ofrecieron.
6. Información de colaboración.
7. Comentarios.
8. Información secundaria.

El usuario no debería tener que leer todos los comentarios para comprender el problema.

---

# 38. Protección contra ruido visual

La plataforma puede llegar a tener cientos de usuarios y múltiples pedidos de ayuda simultáneas.

El diseño debe evitar que el feed se convierta en una pared de contenido.

Utilizar:

- Paginación.
- Filtros.
- Espaciado consistente.
- Jerarquía clara.
- Extractos.
- Agrupación por estado o categoría cuando aporte valor.

No cargar toda la conversación dentro de la tarjeta de un pedido de ayuda.

---

# 39. Filtros

Los filtros iniciales deben ser pocos.

Como mínimo pueden existir:

- Municipio.
- Categoría.
- Estado.

No introducir filtros avanzados hasta que exista un pedido de ayuda real de ellos.

En móvil los filtros pueden abrirse mediante un panel/modal compacto.

---

# 40. Manejo de concurrencia desde UX

La interfaz debe contemplar que dos personas pueden actuar sobre la misma pedido de ayuda simultáneamente.

Ejemplo:

Dos usuarios intentan ofrecer ayuda mientras el pedido de ayuda pasa a `RESOLVED`.

La UI debe responder correctamente a un conflicto del backend:

> `Este pedido de ayuda ya fue solucionada y ya no acepta nuevas ofertas.`

No asumir que el estado mostrado localmente sigue siendo válido indefinidamente.

---

# 41. No usar UI optimista cuando genere ambigüedad importante

Para acciones críticas como:

- Confirmar una ayuda.
- Marcar pedido de ayuda como solucionada.
- Cerrar un pedido de ayuda.
- Compartir contacto.

preferir confirmación real del backend antes de presentar el estado definitivo.

Las actualizaciones optimistas pueden utilizarse únicamente cuando no generen una falsa percepción de que una acción ya ocurrió.

---

# 42. Anti-patrones de UI

No implementar:

- Dashboard sobrecargado inmediatamente después del registro.
- Formularios gigantes.
- Modales para todo.
- Menús con demasiadas opciones.
- Navegación inconsistente.
- Colores usados sin semántica.
- Información privada visible públicamente.
- Controles que dependen únicamente de iconos.
- Estados ambiguos.
- Lenguaje de marketplace comercial.
- Solicitudes de dinero.
- Elementos promocionales o publicidad.
- Animaciones decorativas que retrasen acciones.
- Pantallas que no expliquen qué hacer cuando están vacías.

---

# 43. Regla para futuras funcionalidades

Antes de agregar cualquier funcionalidad visual nueva, responder:

1. ¿Ayuda a pedir ayuda?
2. ¿Ayuda a ofrecer ayuda?
3. ¿Ayuda a coordinar la colaboración?
4. ¿Mejora claramente la seguridad o comprensión?

Si la respuesta es no a todas, probablemente no pertenece al MVP.

---

# 44. Criterio visual de calidad

La interfaz será considerada correcta cuando:

- Una persona pueda entender el propósito de la plataforma al entrar.
- Un afectado pueda publicar un pedido de ayuda sin conocimientos técnicos.
- Un ayudante pueda encontrar un pedido de ayuda y ofrecerse rápidamente.
- Una persona pueda entender el estado real de un pedido de ayuda.
- Los contactos privados no sean expuestos públicamente.
- Los estados de oferta y ayuda confirmada no se confundan.
- La interfaz funcione cómodamente en un teléfono.
- Los errores sean comprensibles.
- Los estados vacíos orienten al usuario.
- La aplicación mantenga una estética comunitaria, sobria y confiable.

---

# 45. Regla final para OpenCode

Antes de crear o modificar cualquier interfaz:

1. Leer `MVP.md` para verificar el alcance funcional.
2. Leer `ARCHITECTURE_GUIDELINES.md` para respetar la estructura técnica.
3. Leer este documento para respetar UX/UI.
4. Reutilizar componentes y tokens existentes antes de crear nuevos.
5. No introducir una nueva librería visual sin justificación.
6. No inventar funcionalidades fuera del alcance.
7. Priorizar claridad, accesibilidad, mobile-first y consistencia.

El objetivo no es construir una interfaz visualmente compleja.

El objetivo es construir una interfaz que haga evidente y sencillo el siguiente ciclo:

```text
Necesito ayuda
      ↓
Publico mi pedido de ayuda
      ↓
Alguien puede ayudar
      ↓
Nos ponemos en contacto
      ↓
La ayuda se realiza
      ↓
La persona confirma
      ↓
El pedido de ayuda queda solucionado
```

La UI debe hacer que ese ciclo sea fácil de entender y completar.
