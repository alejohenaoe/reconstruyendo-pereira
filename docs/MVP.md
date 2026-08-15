# Prompt de desarrollo — MVP plataforma comunitaria de ayuda

## 1. Objetivo del proyecto

Construir el MVP de una aplicación web comunitaria y gratuita cuyo objetivo sea **conectar personas afectadas por situaciones de emergencia, inicialmente el terremoto ocurrido en la región de Pereira, con personas que puedan ayudar mediante trabajo, conocimientos, voluntariado o aportes de materiales**.

La plataforma **no maneja dinero**, no procesa donaciones económicas, no realiza contrataciones, no cobra comisiones y no actúa como garante de los trabajos.

Su función es ser un **intermediario digital de coordinación de ayuda**:

> Una persona publica un pedido de ayuda → otras personas pueden ofrecer ayuda → pueden aportar conocimientos, trabajo o materiales → se establece contacto → la persona afectada confirma si recibió la ayuda → el pedido de ayuda puede marcarse como solucionada.

El sistema debe ser sencillo, confiable, seguro, completamente en español y orientado inicialmente a **Pereira y Dosquebradas, Risaralda, Colombia**.

---

# 2. Alcance geográfico

El MVP funcionará exclusivamente en:

- Pereira, Risaralda.
- Dosquebradas, Risaralda.

No implementar todavía soporte para otras ciudades.

Sin embargo, evita diseñar el código de forma que sea imposible ampliar posteriormente a otras ciudades o municipios.

La ubicación debe almacenarse de manera estructurada para permitir una futura expansión.

---

# 3. Plataforma y despliegue

La aplicación será una **aplicación web responsive**, no una aplicación móvil nativa.

Debe funcionar correctamente en:

- Computadores.
- Tablets.
- Teléfonos móviles.

## Infraestructura objetivo

### Frontend

- React.
- Vite.
- Tailwind CSS.
- Deploy en Netlify.

### Backend

Supabase como backend principal:

- Supabase Auth.
- PostgreSQL.
- Supabase Storage para imágenes.
- Row Level Security (RLS).
- Realtime solamente cuando aporte valor real al MVP.

No introducir infraestructura innecesaria.

No crear un backend independiente si no es estrictamente necesario.

No implementar microservicios.

No introducir Kubernetes.

No introducir sistemas de colas o infraestructura externa compleja en el MVP.

La solución debe ser compatible con un despliegue gratuito o de muy bajo costo utilizando principalmente **Netlify + Supabase**.

---

# 4. Escalabilidad

Aunque inicialmente la plataforma será utilizada en Pereira y Dosquebradas, debe diseñarse pensando en **cientos de usuarios concurrentes**.

No asumir que solamente existirán unos pocos usuarios.

La implementación debe:

- Evitar consultas innecesarias.
- Utilizar correctamente índices PostgreSQL.
- Utilizar paginación.
- Evitar descargar grandes cantidades de registros.
- Optimizar consultas a Supabase.
- Utilizar Storage correctamente para imágenes.
- Evitar cargar imágenes originales de gran tamaño innecesariamente.
- Evitar lógica de autorización únicamente en el frontend.
- Utilizar RLS para proteger los datos.
- Evitar condiciones de carrera en operaciones críticas.
- Mantener las operaciones de escritura consistentes.

No hacer optimizaciones prematuras o arquitectura innecesariamente compleja, pero sí evitar decisiones que hagan que el MVP sea frágil ante crecimiento moderado.

---

# 5. Usuarios del sistema

El sistema tendrá principalmente dos tipos de usuarios:

## 5.1 Persona que necesita ayuda

Es una persona afectada que desea publicar un pedido de ayuda.

Puede:

- Crear una cuenta.
- Crear un pedido de ayuda.
- Describir su problema.
- Subir fotografías.
- Indicar su ubicación.
- Recibir ofertas de ayuda.
- Ver quién se ofreció.
- Contactar a las personas que ofrecen ayuda.
- Confirmar que recibió ayuda.
- Marcar su pedido de ayuda como solucionada.
- Subir fotografías posteriores opcionalmente.
- Ver su historial de pedidos de ayuda.

## 5.2 Persona que quiere ayudar

Puede ser:

- Maestro de obra.
- Albañil.
- Electricista.
- Plomero.
- Ingeniero.
- Arquitecto.
- Constructor.
- Técnico.
- Voluntario.
- Persona con conocimientos particulares.
- Persona que puede aportar materiales.
- Persona que puede aportar herramientas.
- Persona que puede aportar transporte.
- Cualquier otra persona que pueda prestar una ayuda legítima.

No es obligatorio que quien ayuda sea un profesional.

El sistema debe permitir diferenciar entre:

- Profesional.
- Voluntario.
- Persona que aporta materiales.
- Otro tipo de ayuda.

Un usuario puede tener más de una capacidad.

---

# 6. Principio fundamental del sistema

El objeto principal del sistema es una **Pedido de ayuda**.

La aplicación no debe girar inicialmente alrededor de un directorio de albañiles o profesionales.

Debe girar alrededor de:

> **¿Qué necesita una persona y quién puede ayudarla?**

Un pedido de ayuda puede recibir múltiples ofertas de ayuda.

Ejemplo:

Una persona publica:

> "Tengo una pared dañada y no sé cómo repararla."

Puede recibir:

- Un maestro de obra que ofrece su trabajo.
- Un ingeniero que ofrece evaluar el daño.
- Una persona que ofrece ayudar físicamente.
- Una ferretería que ofrece materiales.
- Una persona que ofrece transportar materiales.

Todas esas participaciones deben poder relacionarse con la misma pedido de ayuda.

---

# 7. Pedidos de ayuda

Un pedido de ayuda debe incluir como mínimo:

- Título.
- Descripción.
- Categoría.
- Municipio.
- Zona o barrio, cuando sea apropiado.
- Fotografías opcionales.
- Fecha de publicación.
- Estado.
- Usuario creador.

Las categorías iniciales deben ser pocas y claras, por ejemplo:

- Albañilería.
- Reparación de vivienda.
- Techo.
- Electricidad.
- Plomería.
- Impermeabilización.
- Pintura.
- Limpieza / retiro de escombros.
- Evaluación profesional.
- Otra.

No crear decenas de categorías innecesarias en el MVP.

---

# 8. Una persona puede tener solamente un pedido de ayuda activo

Implementar la regla de negocio:

> **Un usuario puede tener como máximo un pedido de ayuda activo al mismo tiempo.**

Cuando el pedido de ayuda sea:

- Solucionada.
- Cerrada.
- Cancelada.

el usuario podrá crear una nueva.

El objetivo es evitar abuso del sistema y evitar que una sola persona publique múltiples solicitudes simultáneamente.

Esta regla debe estar protegida también a nivel de base de datos cuando sea posible, no solamente mediante validaciones del frontend.

---

# 9. Estados de un pedido de ayuda

Implementar como mínimo:

- `OPEN` — Necesita ayuda.
- `IN_PROGRESS` — Ya existen personas ayudando, pero el pedido de ayuda aún no está solucionada.
- `RESOLVED` — La persona afectada confirmó que el pedido de ayuda fue solucionada.
- `CLOSED` — El pedido de ayuda fue cerrado sin resolución o dejó de requerir ayuda.

La transición principal debe ser:

`OPEN → IN_PROGRESS → RESOLVED`

También debe ser posible cerrar un pedido de ayuda cuando corresponda.

No permitir que cualquier usuario modifique arbitrariamente el estado de un pedido de ayuda.

El creador del pedido de ayuda es quien puede marcarla como solucionada o cerrarla.

---

# 10. Ofertas de ayuda

Una persona registrada puede entrar a un pedido de ayuda y seleccionar:

> **Quiero ayudar**

Debe poder indicar qué tipo de ayuda ofrece.

Tipos iniciales:

- Mano de obra.
- Conocimientos / asesoría.
- Materiales.
- Herramientas.
- Transporte.
- Voluntariado.
- Otro.

Debe existir un campo de mensaje.

Ejemplo:

> "Soy maestro de obra y puedo ayudar con la reparación el sábado."

Una oferta de ayuda **no significa que la ayuda haya sido realizada**.

El sistema debe diferenciar claramente:

1. Persona se ofreció.
2. Se estableció contacto.
3. La ayuda fue acordada.
4. La ayuda fue realizada.
5. La persona afectada confirmó que recibió la ayuda.

No asumir automáticamente que una oferta significa ayuda realizada.

---

# 11. Confirmación de ayuda

La persona que creó el pedido de ayuda debe poder confirmar que recibió una ayuda.

Ejemplo:

> Carlos se ofreció a ayudar.

Después de que exista contacto:

> Carlos — Ayuda ofrecida.

Finalmente:

> Carlos — Ayuda confirmada por el solicitante.

La persona que ofrece ayuda no debe poder otorgarse a sí misma una confirmación definitiva.

La confirmación debe depender del creador del pedido de ayuda.

Si una ayuda no es confirmada, debe permanecer como pendiente o no confirmada.

No marcar automáticamente una ayuda como realizada simplemente porque haya pasado cierto tiempo.

---

# 12. Personas que se ofrecen y reputación

El MVP no necesita un sistema complejo de estrellas.

Debe priorizar:

- Identidad del usuario.
- Tipo de ayuda que ofrece.
- Historial de participaciones.
- Ayudas confirmadas.
- Pedidos de ayuda en las que participó.

Posteriormente podrá construirse un sistema de reputación.

Por ahora, no inventar un algoritmo de "Trust Score" complejo.

La prioridad es registrar correctamente los hechos:

> Se ofreció.

> Participó.

> Ayuda confirmada.

---

# 13. Materiales

No obligar al afectado a conocer o definir exactamente qué materiales necesita.

Una persona puede describir simplemente:

> "No sé qué materiales hacen falta para reparar esto."

Los profesionales o miembros de la comunidad pueden sugerir materiales mediante comentarios.

Por ejemplo:

> "Para este trabajo probablemente se necesite cemento y arena."

Una persona puede responder:

> "Yo puedo aportar dos bultos de cemento."

La plataforma debe registrar esa interacción.

No implementar inicialmente un sistema rígido de checklist de materiales.

El sistema debe utilizar principalmente un **hilo de colaboración/comentarios asociado a el pedido de ayuda**.

---

# 14. Hilo de colaboración

Cada pedido de ayuda debe tener un espacio donde usuarios registrados puedan participar.

Debe permitir:

- Comentarios.
- Ofertas de ayuda.
- Ofertas de materiales.
- Recomendaciones.
- Información técnica.
- Actualizaciones del estado.

Debe ser claro visualmente cuándo un comentario representa:

- Una opinión.
- Una oferta de ayuda.
- Una oferta de material.
- Una recomendación profesional.

No permitir comentarios anónimos.

Solamente usuarios registrados pueden participar.

---

# 15. Contacto entre personas

La plataforma debe actuar únicamente como intermediario.

No es necesario implementar un sistema de chat complejo en la primera versión.

Puede existir un mecanismo de contacto simple.

El usuario que creó el pedido de ayuda debe poder contactar a las personas que se ofrecieron a ayudar.

Los datos de contacto personales no deben mostrarse públicamente.

El contacto puede implementarse inicialmente mediante:

- Teléfono.
- WhatsApp.
- Correo.

La información de contacto debe ser visible únicamente para las personas involucradas en la ayuda correspondiente.

No mostrar números telefónicos públicamente en la página de pedidos de ayuda.

---

# 16. Privacidad de ubicación

Los pedidos de ayuda deben mostrar públicamente solamente una ubicación aproximada:

- Municipio.
- Barrio o zona.

No mostrar públicamente la dirección exacta de la vivienda.

La dirección exacta, si se requiere, podrá compartirse posteriormente entre las personas involucradas mediante el mecanismo de contacto.

La arquitectura debe permitir almacenar la ubicación necesaria sin exponerla accidentalmente mediante consultas públicas.

---

# 17. Fotografías

Las personas que crean pedidos de ayuda deben poder subir fotografías.

Las imágenes deben almacenarse en Supabase Storage.

Implementar:

- Validación del tipo de archivo.
- Límite razonable de tamaño.
- Límite razonable de cantidad de imágenes.
- Compresión o redimensionamiento cuando sea conveniente.
- Nombres de archivos seguros.
- Organización por pedido de ayuda/usuario.

Las imágenes no deben almacenarse directamente en PostgreSQL.

No permitir que un usuario pueda modificar o eliminar fotografías pertenecientes a otra pedido de ayuda.

---

# 18. Pedidos de ayuda públicas

Los pedidos de ayuda deben poder consultarse sin iniciar sesión.

Un visitante debe poder:

- Ver pedidos de ayuda.
- Ver fotografías.
- Ver descripción.
- Ver municipio/zona.
- Ver estado.
- Ver las ayudas ofrecidas de manera pública cuando no expongan información privada.

Sin embargo, para:

- Crear un pedido de ayuda.
- Comentar.
- Ofrecer ayuda.
- Ofrecer materiales.
- Ver información privada de contacto.

se debe requerir autenticación.

---

# 19. Registro

El registro debe ser sencillo.

Como mínimo:

- Nombre.
- Correo electrónico.
- Contraseña.
- Municipio.
- Tipo de participación.

No pedir información innecesaria.

Debe ser posible indicar que el usuario es:

- Persona afectada.
- Profesional.
- Voluntario.
- Aportante de materiales.
- Otro.

Un usuario puede tener más de una capacidad.

---

# 20. No manejar dinero

Esta es una regla fundamental e innegociable del MVP.

La plataforma:

- No recibe dinero.
- No procesa donaciones monetarias.
- No almacena dinero.
- No solicita transferencias.
- No muestra números de cuentas.
- No permite publicar solicitudes de dinero.
- No cobra comisiones.
- No tiene sistema de pagos.

La ayuda económica queda completamente fuera del alcance del proyecto.

La plataforma se limita a coordinar:

- Trabajo.
- Conocimientos.
- Voluntariado.
- Materiales.
- Herramientas.
- Transporte.
- Otros recursos físicos o humanos.

---

# 21. Seguridad frente a posibles abusos

El sistema debe asumir que algunas personas podrían intentar aprovecharse de la situación.

Implementar mecanismos básicos de seguridad:

- Reportar pedido de ayuda.
- Reportar comentario.
- Reportar usuario.
- Bloquear usuarios.
- Moderación administrativa.
- Suspensión de usuarios.
- Eliminación de contenido.
- Registro de acciones relevantes.

No permitir solicitudes explícitas de dinero.

No permitir publicar información bancaria.

No exponer públicamente datos de contacto personales.

---

# 22. Daños estructurales

La aplicación no debe presentarse como una herramienta para determinar si una vivienda es estructuralmente segura.

Cuando un pedido de ayuda pueda involucrar:

- Columnas.
- Vigas.
- Muros estructurales.
- Cimentación.
- Daños estructurales.
- Grietas importantes.
- Desplazamientos.
- Daños posteriores a un terremoto cuya naturaleza no sea clara.

mostrar una advertencia recomendando evaluación de un profesional competente.

La aplicación no debe afirmar que una estructura es segura.

Una persona que declare ser ingeniero o arquitecto puede ofrecerse para evaluar un pedido de ayuda, pero el sistema no debe presentar dicha evaluación como una certificación oficial.

---

# 23. Finalización de un pedido de ayuda

El creador del pedido de ayuda debe poder:

> **Marcar como solucionada**

Opcionalmente puede:

- Subir fotografías posteriores.
- Escribir una actualización.
- Agradecer públicamente a quienes ayudaron.

El pedido de ayuda pasa a:

> `RESOLVED`

La plataforma debe conservar el historial.

Un pedido de ayuda solucionado no debe poder recibir nuevas ofertas de ayuda normales.

---

# 24. Historial

Cada usuario debe poder consultar sus participaciones.

Por ejemplo:

### Mis pedidos de ayuda

- Pedido de ayuda actual.
- Pedidos de ayuda solucionadas.
- Pedidos de ayuda cerradas.

### Mis ayudas

- Ofertas realizadas.
- Ayudas confirmadas.
- Ayudas pendientes.

Esto permitirá construir posteriormente métricas de impacto.

---

# 25. Panel administrativo

Crear un panel administrativo sencillo.

Debe permitir:

- Ver usuarios.
- Buscar usuarios.
- Suspender usuarios.
- Ver pedidos de ayuda.
- Ocultar pedidos de ayuda.
- Cerrar pedidos de ayuda cuando sea necesario.
- Ver reportes.
- Moderar comentarios.
- Revisar contenido reportado.
- Ver estadísticas básicas.

No construir todavía un CMS complejo.

---

# 26. Moderación

Implementar reportes para:

- Pedido de ayuda sospechosa.
- Información falsa.
- Spam.
- Contenido ofensivo.
- Intento de fraude.
- Solicitud de dinero.
- Otro.

Los reportes deben quedar registrados y ser visibles desde el panel administrativo.

---

# 27. Notificaciones

El MVP puede comenzar con notificaciones simples dentro de la aplicación.

Por ejemplo:

- Alguien se ofreció a ayudar.
- Alguien comentó el pedido de ayuda.
- Alguien ofreció materiales.
- Una ayuda fue confirmada.
- Un pedido de ayuda cambió de estado.

No es necesario implementar inicialmente:

- Push notifications.
- SMS.
- Sistema complejo de email.

Si se implementan notificaciones por correo, hacerlo únicamente si resulta sencillo y compatible con el presupuesto gratuito.

---

# 28. Diseño UX/UI

El sistema completo debe estar en español.

Debe utilizar lenguaje:

- Claro.
- Humano.
- Directo.
- Amigable.
- No excesivamente técnico.

Debe evitar lenguaje comercial innecesario.

La plataforma debe sentirse como una herramienta de ayuda comunitaria, no como una aplicación de contratación.

La interfaz debe ser completamente responsive y mobile-first.

## Directrices de UX/UI

Las instrucciones detalladas de diseño visual, componentes, navegación, accesibilidad, responsive design y patrones de interacción estarán definidas en:

`UX_UI_GUIDELINES.md`

**Debe consultarse y respetarse ese documento antes de implementar cualquier interfaz.**

No inventar un sistema visual independiente si `UX_UI_GUIDELINES.md` establece uno.

---

# 29. Arquitectura y patrones de diseño

Las directrices detalladas de arquitectura, separación de responsabilidades, patrones de diseño, estructura del proyecto, acceso a Supabase, seguridad, manejo de estado y organización del código estarán definidas en:

`ARCHITECTURE_GUIDELINES.md`

**Debe consultarse y respetarse ese documento antes de tomar decisiones arquitectónicas o estructurales.**

Este documento de MVP define el comportamiento del producto.

`ARCHITECTURE_GUIDELINES.md` define cómo debe construirse técnicamente.

En caso de duda:

1. Mantener el alcance funcional definido aquí.
2. Respetar las reglas de arquitectura.
3. Evitar agregar funcionalidades no solicitadas.

---

# 30. Principios de desarrollo

Seguir estos principios:

### Simplicidad

Construir el MVP más pequeño que permita validar la idea.

### Seguridad

Nunca confiar en validaciones únicamente del frontend.

Utilizar RLS y restricciones de base de datos cuando corresponda.

### Trazabilidad

Las acciones importantes deben quedar registradas.

### Privacidad

Exponer únicamente la información necesaria.

### Escalabilidad razonable

Diseñar para cientos de usuarios y concurrencia moderada sin introducir infraestructura innecesaria.

### Mantenibilidad

El código debe ser claro y fácil de extender.

### Mobile-first

La mayoría de usuarios probablemente accederán desde teléfonos.

### Accesibilidad

Utilizar HTML semántico, labels apropiados, contraste suficiente, navegación mediante teclado y estados claros.

---

# 31. Qué NO construir en el MVP

No implementar:

- Pagos.
- Donaciones monetarias.
- Wallet.
- Comisiones.
- Suscripciones.
- Publicidad.
- Marketplace de materiales.
- E-commerce.
- Sistema de contratación formal.
- Sistema de escrow.
- Garantías comerciales.
- Aplicación móvil nativa.
- IA.
- Matching automático complejo.
- Algoritmos de recomendación.
- Sistema avanzado de reputación.
- Videollamadas.
- GPS en tiempo real.
- Chat avanzado.
- Microservicios.
- Kubernetes.
- Infraestructura cloud compleja.

Si una funcionalidad no es necesaria para cumplir el flujo principal de ayuda, dejarla fuera del MVP.

---

# 32. Flujo principal del producto

El flujo principal debe funcionar así:

```text
Visitante
   ↓
Explora pedidos de ayuda públicas
   ↓
Decide ayudar
   ↓
Se registra / inicia sesión
   ↓
Abre un pedido de ayuda
   ↓
Se ofrece a ayudar
   ↓
El creador recibe la oferta
   ↓
Ambas personas establecen contacto
   ↓
Se realiza la ayuda
   ↓
El creador confirma la ayuda
   ↓
El pedido de ayuda continúa abierto o pasa a solucionado
```

Segundo flujo:

```text
Persona afectada
   ↓
Se registra
   ↓
Publica pedido de ayuda
   ↓
Describe problema
   ↓
Sube fotografías
   ↓
La comunidad comenta
   ↓
Personas ofrecen ayuda/materiales/conocimientos
   ↓
Se establece contacto
   ↓
La ayuda se realiza
   ↓
El afectado confirma
   ↓
Pedido de ayuda solucionada
```

---

# 33. Criterio de éxito del MVP

El MVP será considerado funcional cuando una persona pueda realizar de principio a fin este escenario:

1. Registrarse.
2. Crear un pedido de ayuda.
3. Escribir una descripción.
4. Subir fotografías.
5. Publicarla.
6. Otro usuario puede verla sin registrarse.
7. Otro usuario registrado puede ofrecerse a ayudar.
8. El creador puede ver quién se ofreció.
9. El creador puede acceder al mecanismo de contacto.
10. Los usuarios pueden interactuar mediante el hilo del pedido de ayuda.
11. El creador puede confirmar una ayuda.
12. El creador puede marcar el pedido de ayuda como solucionada.
13. El pedido de ayuda queda registrado en el historial.
14. Los usuarios pueden reportar contenido.
15. Un administrador puede moderar contenido.

Si estos flujos funcionan correctamente, el MVP cumple su objetivo.

---

# 34. Forma de trabajo

Antes de comenzar a escribir código:

1. Inspecciona completamente el repositorio actual.
2. Identifica qué tecnologías y estructuras ya existen.
3. Lee `ARCHITECTURE_GUIDELINES.md`.
4. Lee `UX_UI_GUIDELINES.md`.
5. Determina qué partes existentes pueden reutilizarse.
6. Identifica inconsistencias o decisiones que contradigan las directrices.
7. Propón una estructura de implementación antes de realizar cambios importantes.

No sobrescribas ni reemplaces arbitrariamente código existente.

Si el proyecto está vacío, crea la estructura necesaria siguiendo las directrices de arquitectura.

---

# 35. Restricción de alcance

No agregues funcionalidades solamente porque podrían ser útiles en el futuro.

Si una funcionalidad no está especificada en este documento y no es necesaria para que el flujo principal funcione, no la implementes todavía.

El objetivo es producir un **MVP funcional, sencillo, seguro, mantenible y desplegable**, no una plataforma completa.

---

# 36. Resultado esperado

Al finalizar la implementación debe existir una aplicación web funcional en español que permita:

> **Publicar pedidos de ayuda → descubrir pedidos de ayuda → ofrecer ayuda → ofrecer materiales → contactar → confirmar ayuda → solucionar pedidos de ayuda.**

La aplicación debe estar preparada para desplegar:

**Frontend → Netlify**

**Backend → Supabase**

y debe poder manejar cientos de usuarios con una arquitectura sencilla y apropiada para un MVP.

La aplicación debe priorizar siempre:

> **Ayudar a conectar a las personas afectadas con quienes pueden ayudar, sin manejar dinero y sin convertirse en intermediario comercial.**
