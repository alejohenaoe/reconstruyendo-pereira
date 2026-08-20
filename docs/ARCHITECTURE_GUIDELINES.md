# ARCHITECTURE_GUIDELINES.md

## 1. Propósito del documento

Este documento define las directrices técnicas y arquitectónicas obligatorias para el desarrollo de la plataforma comunitaria de ayuda para Pereira y Dosquebradas.

El documento debe ser leído y aplicado antes de crear o modificar arquitectura, estructura de carpetas, autenticación, acceso a datos, autorización, estado global, componentes de dominio o integración con Supabase.

Este archivo complementa el documento de definición funcional del MVP. El MVP define **qué debe hacer el sistema**; este documento define **cómo debe construirse**.

No implementar funcionalidades fuera del alcance funcional del MVP salvo que sean estrictamente necesarias para satisfacer una directriz de arquitectura o seguridad.

---

# 2. Stack tecnológico

La aplicación utilizará:

- React.
- Vite.
- TypeScript.
- Tailwind CSS.
- Supabase Auth.
- Supabase PostgreSQL.
- Supabase Storage.
- Supabase Row Level Security (RLS).
- Netlify para el frontend.

No introducir un backend independiente durante el MVP salvo un pedido de ayuda técnica concreta que no pueda resolverse de forma razonable con Supabase.

No introducir microservicios, Kubernetes, colas, event buses, CQRS, repositorios distribuidos o infraestructura adicional como solución por defecto.

La arquitectura debe ser deliberadamente simple, pero no ingenua.

---

# 3. Principios arquitectónicos

## 3.1. Simplicidad primero

Elegir la solución más simple que cumpla correctamente el requisito.

No introducir patrones, librerías o capas únicamente porque son populares o porque podrían ser útiles en el futuro.

## 3.2. Seguridad por diseño

Las operaciones sensibles nunca deben depender exclusivamente del frontend.

El frontend guía la experiencia del usuario. Supabase Auth, RLS y las restricciones de base de datos constituyen la autoridad real sobre identidad, autorización e integridad.

## 3.3. Separación de responsabilidades

Separar claramente:

- Autenticación.
- Perfil de usuario.
- Capacidades del usuario.
- Dominio de pedidos de ayuda y ayudas.
- Acceso a datos.
- UI y presentación.

## 3.4. Fuente única de verdad

No duplicar en PostgreSQL datos que Supabase Auth ya mantiene como fuente de verdad, especialmente el estado de verificación del correo.

## 3.5. Trazabilidad

Las acciones importantes del dominio deben quedar representadas mediante entidades y estados explícitos.

## 3.6. Preparación para crecimiento razonable

Diseñar para cientos de usuarios concurrentes en el contexto del MVP sin sobrearquitectura.

---

# 4. Arquitectura de alto nivel

La solución debe seguir aproximadamente este flujo:

```text
React UI
   |
   v
Feature hooks / domain actions
   |
   v
Supabase client
   |
   +--> Supabase Auth
   |
   +--> PostgreSQL + RLS
   |
   +--> Storage
```

El frontend no debe crear una segunda capa backend que duplique las reglas de Supabase.

---

# 5. Estructura de proyecto

Utilizar una estructura orientada a features, manteniendo separadas las responsabilidades de aplicación y dominio.

Una estructura inicial recomendada:

```text
src/
├── app/
│   ├── providers/
│   │   └── AuthProvider.tsx
│   ├── router/
│   └── App.tsx
│
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types.ts
│   │
│   ├── needs/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types.ts
│   │
│   ├── help/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types.ts
│   │
│   └── moderation/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── types.ts
│
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   └── utils/
│
└── main.tsx
```

Esta estructura puede evolucionar si el proyecto crece, pero cualquier cambio debe conservar separación clara entre features y responsabilidades.

---

# 6. Configuración de Supabase

Debe existir una única instancia del cliente de Supabase para la aplicación.

Por ejemplo:

```text
src/shared/lib/supabase.ts
```

No crear clientes independientes de Supabase en cada feature o componente.

La configuración debe leer variables de entorno apropiadas para Vite/Netlify.

Nunca almacenar secretos de Supabase en el frontend.

La clave pública/anon de Supabase no debe tratarse como un secreto. La seguridad depende de Auth y RLS.

Nunca colocar service-role keys en código frontend, variables públicas de Netlify o cualquier recurso accesible desde el navegador.

---

# 7. Autenticación

## 7.1. Supabase Auth es la única fuente de identidad

No implementar un sistema propio de sesiones, JWT, refresh tokens, hashing de contraseñas o recuperación de credenciales.

Supabase Auth debe manejar:

- Registro.
- Inicio de sesión.
- Cierre de sesión.
- Sesiones.
- Persistencia de sesión.
- Recuperación de contraseña.
- Verificación de correo.

## 7.2. Email verificado como requisito de acciones comunitarias

El requisito se expresa en un único lugar, la función `is_email_verified()`, que lee
`auth.users.email_confirmed_at`. Un usuario puede existir y autenticarse, pero no puede realizar
acciones comunitarias sensibles mientras esa función no devuelva verdadero.

Acciones que requieren correo verificado:

- Crear un pedido de ayuda.
- Comentar.
- Ofrecer ayuda.
- Ofrecer materiales.
- Acceder a datos de contacto privados.
- Otras acciones comunitarias que impliquen interacción entre usuarios.

Los pedidos de ayuda públicas pueden consultarse sin iniciar sesión.

### 7.2.1. Cómo se satisface el requisito en el MVP

En el MVP el correo se confirma **en el propio registro**: Supabase Auth está configurado con
`mailer_autoconfirm = true` (remoto) y `enable_confirmations = false` (`supabase/config.toml`), así
que el alta deja `email_confirmed_at` puesto y devuelve sesión inmediatamente. Crear cuenta y entrar
vuelven a ser un solo paso.

Se decidió así porque el enlace por correo era una barrera real, no solo un paso extra: el SMTP
integrado de Supabase admite **2 correos por hora en todo el proyecto**, de modo que en una jornada
de registros la mayoría de las personas nunca recibía el enlace y quedaba sin poder entrar.

Lo importante es que **nada de la autorización cambia**: las políticas RLS, `can_manage_need_images()`,
`get_need_contact()` y los triggers siguen llamando a `is_email_verified()` igual que antes; lo único
distinto es cuándo se cumple la condición. Volver a exigir la confirmación por correo es cambiar esos
dos flags, sin migraciones ni cambios de código.

Contrapartida asumida: no hay prueba de propiedad del correo, así que una dirección mal escrita deja
a esa persona sin recuperación de contraseña y las cuentas falsas cuestan menos. La contención queda
en moderación, reportes, bloqueo y baneo. Con un SMTP propio configurado, reactivar la confirmación
(o añadir un aviso no bloqueante) es el siguiente paso natural.

## 7.3. No duplicar el estado de verificación

No crear un campo `email_verified` en `profiles` como fuente de verdad.

El estado de verificación debe obtenerse de Supabase Auth, por ejemplo mediante `email_confirmed_at`.

## 7.4. AuthProvider

Crear un único `AuthProvider` a nivel de aplicación.

El provider debe encargarse de:

- Estado de sesión.
- Usuario autenticado.
- Estado de carga inicial.
- Estado derivado de autenticación.
- Estado derivado de email verificado.
- Operaciones de sign in/sign up/sign out.
- Reenvío de verificación cuando sea necesario.
- Sincronización con cambios de sesión de Supabase.

El provider no debe contener lógica de dominio de pedidos de ayuda, ofertas, comentarios o moderación.

## 7.5. useAuth

Toda la aplicación debe consumir el estado de autenticación mediante un hook como:

```text
useAuth()
```

Evitar llamadas directas a `supabase.auth.getSession()` o `supabase.auth.getUser()` dispersas por componentes de la UI salvo casos excepcionales y documentados.

---

# 8. Estados de sesión

El estado visible para la aplicación debe distinguir conceptualmente:

```text
AUTH_LOADING
UNAUTHENTICATED
EMAIL_UNVERIFIED
AUTHENTICATED
```

No es obligatorio persistir estos valores como enum si pueden derivarse de forma confiable desde la sesión y el usuario.

La UI debe evitar parpadeos de rutas protegidas mientras se obtiene la sesión inicial.

---

# 9. Guards de navegación

Los guards existen para UX y navegación. No sustituyen la seguridad del backend.

Implementar conceptualmente:

## ProtectedRoute

Requiere usuario autenticado.

## VerifiedRoute

Requiere:

- usuario autenticado;
- email verificado.

## AdminRoute

Requiere autorización administrativa.

El guard debe redirigir de manera clara según el estado:

```text
No autenticado -> /login
Autenticado pero no verificado -> /verify-email
Verificado -> contenido solicitado
```

La lógica de autorización debe seguir validándose en Supabase.

El estado intermedio se conserva en el código aunque en el MVP no se alcance (§7.2.1): con el alta
autoconfirmada nadie llega a `EMAIL_UNVERIFIED`, pero el guard sigue siendo correcto si la
confirmación se reactiva.

---

# 10. Continuación de intención después del login

Si un usuario intenta realizar una acción y necesita autenticarse/verificar el correo, la aplicación debe preservar la intención cuando sea razonable.

Ejemplo:

```text
Pedido de ayuda #123
      |
      +--> Quiero ayudar
              |
              +--> Login / Registro
                      |
                      +--> Verificar correo
                              |
                              +--> regresar a Pedido de ayuda #123
                                   y continuar la acción
```

Utilizar navegación/estado de retorno simple. No introducir un sistema global complejo para este propósito.

---

# 11. Modelo de usuario

No crear distintos tipos de usuario excluyentes como:

```text
AffectedUser
Helper
MaterialDonor
Volunteer
```

El sistema debe tener un único concepto de usuario.

Un mismo usuario puede:

- necesitar ayuda;
- ofrecer mano de obra;
- ofrecer materiales;
- ofrecer herramientas;
- ofrecer transporte;
- participar como voluntario.

Las capacidades deben modelarse independientemente del rol administrativo.

---

# 12. Roles y capacidades

Separar:

## Roles

Se utilizan principalmente para autorización administrativa.

Ejemplo:

```text
USER
ADMIN
```

## Capacidades

Representan cómo participa una persona en el sistema.

Ejemplos:

```text
REQUEST_HELP
LABOR
VOLUNTEER
MATERIALS
TOOLS
TRANSPORT
ADVICE
OTHER
```

No utilizar `role = AFFECTED` o `role = HELPER` como mecanismo principal de autorización.

---

# 13. Perfil de usuario

Mantener una tabla `profiles` separada de `auth.users`.

`auth.users` pertenece a Supabase y maneja identidad/autenticación.

`profiles` contiene datos propios del dominio de la aplicación, por ejemplo:

```text
id
 display_name
 municipality
 phone
 bio
 app_role
 created_at
 updated_at
```

El `profiles.id` debe corresponder al `auth.users.id`.

El teléfono puede ser opcional durante el registro y solicitarse cuando sea necesario para establecer contacto.

---

# 14. Creación del perfil

La existencia del perfil debe quedar garantizada de forma robusta después del registro.

No depender únicamente de dos llamadas secuenciales desde el navegador:

```text
signUp()
createProfile()
```

porque un fallo entre ambas podría dejar una identidad sin perfil.

Preferir un mecanismo backend/database seguro y consistente para garantizar la creación del perfil.

---

# 15. Autorización

La autorización debe modelarse en varios niveles:

```text
Autenticación
+
Email verificado
+
Ownership / propiedad
+
Relación con el recurso
+
Estado del recurso
+
Reglas de negocio
```

Ejemplo:

Para ofrecer ayuda:

```text
usuario autenticado
AND email verificado
AND pedido de ayuda abierto
AND usuario no es dueño del pedido de ayuda
```

Para editar un pedido de ayuda:

```text
usuario autenticado
AND pedido de ayuda.user_id = auth.uid()
```

Para ver un teléfono:

```text
usuario autenticado
AND email verificado
AND usuario está relacionado con el pedido de ayuda
```

Estas reglas deben reflejarse en RLS o en mecanismos backend seguros.

---

# 16. RLS es la autoridad definitiva

Todas las tablas con información sensible o operaciones de escritura deben tener RLS apropiado.

Nunca confiar únicamente en:

- botones ocultos;
- rutas protegidas;
- validaciones de formularios;
- estados React;
- variables enviadas por el cliente.

Un usuario debe estar impedido por Supabase incluso si intenta llamar directamente a la API.

---

# 17. Ownership

El ownership debe ser uno de los mecanismos principales de autorización.

Ejemplos:

- Un usuario puede editar sus propias pedidos de ayuda.
- Un usuario puede cerrar su propia pedido de ayuda.
- Un usuario puede confirmar ayudas relacionadas con sus propias pedidos de ayuda.
- Un usuario no puede modificar los pedidos de ayuda de otra persona.

Evitar permisos del tipo:

```text
if user.role === 'affected'
```

cuando realmente la regla sea:

```text
resource.owner_id === auth.uid()
```

---

# 18. Estado de dominio

Las entidades del dominio deben tener estados explícitos y transiciones controladas.

Pedido de ayuda:

```text
OPEN
IN_PROGRESS
RESOLVED
CLOSED
```

Oferta de ayuda puede evolucionar de forma equivalente, por ejemplo:

```text
OFFERED
CONTACTED
AGREED
COMPLETED
CONFIRMED
CANCELLED
```

No representar estos estados mediante combinaciones ambiguas de booleanos como:

```text
is_active
is_done
is_contacted
is_confirmed
```

cuando un estado explícito sea más apropiado.

---

# 19. Un pedido de ayuda activo por usuario

La regla de negocio es:

> Un usuario puede tener como máximo un pedido de ayuda activo.

No confiar únicamente en el frontend para esta regla.

Debe existir una garantía a nivel de base de datos o una estrategia transaccional robusta que evite que dos solicitudes concurrentes creen dos pedidos de ayuda activas para el mismo usuario.

Preferir índices/constraints PostgreSQL apropiados cuando puedan expresar correctamente la regla.

---

# 20. Concurrencia e integridad

El sistema debe asumir que dos usuarios pueden actuar al mismo tiempo.

Ejemplos:

- Dos personas se ofrecen a ayudar simultáneamente.
- Un usuario intenta cerrar un pedido de ayuda mientras otro intenta ofrecer ayuda.
- Dos usuarios intentan editar el mismo recurso.
- Dos procesos intentan crear registros relacionados con una misma pedido de ayuda.

No confiar en secuencias frontend como mecanismo de consistencia.

Cuando una regla dependa de múltiples operaciones relacionadas, considerar:

- constraints PostgreSQL;
- transacciones;
- funciones RPC seguras;
- operaciones atómicas.

Utilizar RPC solamente cuando aporte una garantía transaccional real o encapsule lógica que no deba ejecutarse como múltiples operaciones independientes.

---

# 21. Datos y consultas

## 21.1. Paginación

No cargar listados completos de pedidos de ayuda, comentarios, ofertas o usuarios.

Todos los listados que puedan crecer deben utilizar paginación o carga incremental.

## 21.2. Índices

Crear índices para campos utilizados frecuentemente en:

- filtros;
- ordenamiento;
- joins;
- foreign keys;
- estado + fecha;
- municipio;
- propietario.

No crear índices indiscriminadamente.

## 21.3. Selección de columnas

Evitar consultas que soliciten `select('*')` cuando la vista solo necesita unos pocos campos, especialmente en listados.

## 21.4. N+1

Evitar consultar individualmente información para cada fila de un listado.

Preferir consultas agrupadas o relaciones apropiadas.

---

# 22. React Query / librería de servidor

No introducir automáticamente React Query/TanStack Query si el MVP puede funcionar correctamente sin ella.

Si la aplicación llega a necesitar:

- caching sofisticado;
- invalidación compleja;
- revalidación frecuente;
- sincronización de consultas entre vistas;

se puede evaluar posteriormente.

No usar una librería de server-state solamente porque sea popular.

---

# 23. Estado global

No introducir Redux, Zustand u otra solución de estado global como requisito inicial.

El estado global inicial debe reducirse principalmente a:

- autenticación/sesión;
- configuración realmente global.

El estado de cada feature debe permanecer en su feature correspondiente.

Usar estado local para formularios y UI transitoria.

Introducir estado global adicional únicamente cuando exista un pedido de ayuda clara y documentada.

---

# 24. Hooks

Los hooks deben tener responsabilidades claras.

Ejemplos:

```text
useAuth()
useNeeds()
useNeed()
useNeedActions()
useHelpOffers()
useProfile()
```

Evitar hooks gigantes que mezclen:

- autenticación;
- datos;
- UI;
- navegación;
- reglas de negocio.

---

# 25. Servicios de feature

Las operaciones de acceso a Supabase específicas de un dominio deben mantenerse agrupadas por feature.

Ejemplo:

```text
features/needs/services/needService.ts
features/help/services/helpOfferService.ts
features/auth/services/authService.ts
```

Los componentes no deberían contener grandes consultas SQL lógicas ni llamadas Supabase complejas.

El componente debe expresar intención:

```text
createNeed()
offerHelp()
confirmHelp()
resolveNeed()
```

La capa de servicio/hook encapsula la interacción con Supabase.

---

# 26. No crear una capa Repository innecesaria

No implementar automáticamente:

```text
Repository
Service
UseCase
Controller
Adapter
Factory
```

para cada entidad únicamente por patrón.

Para el MVP, una estructura feature + service + hooks es suficiente.

Introducir una abstracción adicional solo cuando resuelva un problema real:

- reutilización significativa;
- aislamiento de una dependencia;
- complejidad de dominio;
- pedido de ayuda de testear una frontera concreta.

---

# 27. Validación de datos

Toda entrada del usuario debe validarse.

Separar:

### Validación de UX

React puede mostrar errores rápidamente.

### Validación de seguridad/integridad

La base de datos y las políticas correspondientes deben impedir datos inválidos o no autorizados.

Nunca asumir que una validación de formulario fue respetada.

---

# 28. Tipado

Utilizar TypeScript de forma estricta.

Evitar `any` salvo situaciones excepcionales y justificadas.

Preferir tipos derivados del esquema de Supabase cuando sea posible.

Mantener tipos de dominio claros y pequeños.

No duplicar manualmente decenas de tipos que pueden generarse a partir del esquema.

---

# 29. Errores

Los errores de Supabase no deben llegar sin procesar a la UI.

Crear una estrategia consistente para:

- error de autenticación;
- error de autorización;
- error de validación;
- recurso inexistente;
- conflicto de estado;
- error de red;
- error inesperado.

La interfaz debe mostrar mensajes comprensibles en español.

No exponer detalles técnicos, SQL, stack traces o información sensible al usuario final.

Los errores técnicos deben registrarse apropiadamente para debugging cuando exista infraestructura para ello.

---

# 30. Control de acceso a información de contacto

Los números de teléfono, correos personales u otros datos sensibles nunca deben ser públicos por defecto.

El acceso debe depender de una relación válida con el pedido de ayuda.

Ejemplo:

```text
Usuario verificado
+
Oferta de ayuda relacionada con el pedido de ayuda
+
Permiso para contactar
```

No devolver datos de contacto privados en consultas públicas de pedidos de ayuda.

Preferir que las vistas públicas reciban únicamente los campos públicos necesarios.

---

# 31. Ubicación

Separar:

### Ubicación pública

- Municipio.
- Zona/barrio.

### Ubicación privada

- Dirección exacta.

La dirección exacta nunca debe incluirse en consultas públicas.

Solo usuarios autorizados y relacionados con el pedido de ayuda pueden acceder a ella.

---

# 32. Storage e imágenes

Las imágenes de pedidos de ayuda deben almacenarse en Supabase Storage.

No guardar binarios en PostgreSQL.

Utilizar rutas de Storage que faciliten aislamiento por usuario/pedido de ayuda.

Ejemplo conceptual:

```text
needs/{needId}/{imageId}
```

Las políticas de Storage deben impedir que un usuario modifique o elimine imágenes ajenas.

Optimizar el tamaño de imágenes antes o durante la subida cuando sea posible.

No descargar automáticamente imágenes originales de gran tamaño cuando una vista de miniatura sea suficiente.

---

# 33. Realtime

No hacer toda la aplicación dependiente de Supabase Realtime.

El MVP puede utilizar consultas normales para la mayoría de datos.

Considerar Realtime únicamente donde mejore sustancialmente la experiencia, por ejemplo:

- hilo de colaboración abierto;
- notificaciones de ayuda;
- actualizaciones inmediatas de un pedido de ayuda.

Si Realtime aumenta significativamente la complejidad, priorizar primero la corrección y simplicidad.

---

# 34. Seguridad de comentarios y contenido

Todo contenido generado por usuarios debe tratarse como no confiable.

No utilizar `dangerouslySetInnerHTML` para mostrar contenido de usuarios salvo un caso muy justificado y sanitizado.

Escapar correctamente texto, enlaces y contenido externo.

No permitir HTML arbitrario en comentarios.

---

# 35. Moderación

Reportes, bloqueos y moderación deben considerarse entidades de dominio independientes de Auth.

Un usuario puede reportar un pedido de ayuda o comentario.

Un administrador puede revisar y cambiar el estado del reporte.

La interfaz pública no debe permitir que un usuario normal se asigne capacidades administrativas mediante datos enviados desde el navegador.

---

# 36. Administradores

El rol administrativo debe tener una fuente segura y una política RLS específica.

La UI puede ocultar rutas administrativas para usuarios normales, pero la verdadera protección debe residir en Supabase.

No confiar en un booleano enviado por el cliente como:

```text
isAdmin = true
```

---

# 37. Contacto externo

El MVP puede utilizar teléfono, WhatsApp o correo como mecanismos de contacto.

La aplicación no necesita implementar un sistema de chat propio para resolver el flujo inicial.

Aun así, la base de datos debe registrar la relación entre una oferta de ayuda y el pedido de ayuda correspondiente.

Así el sistema puede determinar quién está autorizado a contactar a quién.

---

# 38. No permitir dinero

La arquitectura no debe incluir:

- tablas de pagos;
- billeteras;
- saldos;
- transacciones monetarias;
- donaciones monetarias;
- datos bancarios.

El dominio está deliberadamente limitado a:

- mano de obra;
- voluntariado;
- conocimiento;
- materiales;
- herramientas;
- transporte;
- otras formas no monetarias de ayuda.

---

# 39. Testing

El MVP debe incluir pruebas donde aporten mayor valor.

Priorizar:

## Unit tests

Para:

- funciones puras;
- validaciones;
- transformaciones;
- lógica de estados.

## Integration tests

Para flujos críticos con Supabase cuando sea razonable:

- registro;
- verificación;
- creación de pedido de ayuda;
- oferta de ayuda;
- confirmación;
- cierre.

## Tests de seguridad

Verificar que un usuario no pueda:

- editar pedidos de ayuda ajenas;
- confirmar ayudas ajenas;
- obtener teléfonos no autorizados;
- modificar perfiles ajenos;
- saltarse restricciones mediante llamadas directas a Supabase.

No buscar cobertura numérica arbitraria. Priorizar comportamiento crítico.

---

# 40. Manejo de concurrencia

Cuando una operación pueda producir conflictos, diseñarla de forma atómica o validarla con una condición de estado en la base de datos.

Ejemplo:

No hacer simplemente:

```text
1. Consultar si pedido de ayuda está abierta
2. En frontend decidir que sí
3. Insertar oferta
```

si existe riesgo de que otro proceso cambie el estado entre los pasos.

La base de datos debe imponer las condiciones críticas.

---

# 41. Paginación y ordenamiento

Los listados públicos de pedidos de ayuda deben estar paginados.

Orden recomendado inicial:

- más recientes primero;
- filtros por municipio;
- filtros por categoría;
- filtros por estado.

No cargar cientos o miles de filas en una sola petición.

---

# 42. Caché

No introducir caching global complejo en el MVP.

Aprovechar patrones simples:

- estado local;
- consultas limitadas;
- re-fetch después de mutaciones importantes.

Evaluar una solución de server-state/caching solamente cuando la carga real lo justifique.

---

# 43. Accesibilidad y responsive

Aunque los detalles visuales están definidos en `UX_UI_GUIDELINES.md`, la arquitectura debe respetar que:

- los componentes sean reutilizables;
- no dependan de un tamaño específico de pantalla;
- puedan renderizar estados de loading/error/empty;
- utilicen formularios semánticos;
- puedan recibir labels y mensajes de validación accesibles.

---

# 44. Observabilidad mínima

El MVP debe ser fácil de diagnosticar.

Al menos deben existir mecanismos claros para identificar:

- errores de autenticación;
- errores de consultas;
- fallos de mutaciones;
- problemas de Storage;
- errores de autorización.

No introducir inicialmente una plataforma de observabilidad compleja si no es necesaria.

---

# 45. Variables de entorno

Toda configuración por entorno debe estar en variables de entorno.

Nunca hardcodear:

- URL de Supabase.
- Claves públicas.
- URLs de producción específicas cuando puedan configurarse.
- Integraciones externas.

Separar claramente:

- desarrollo;
- preview;
- producción.

---

# 46. Migraciones de base de datos

Toda modificación de esquema debe realizarse mediante migraciones versionadas.

No depender de cambios manuales irreproducibles en el dashboard de Supabase.

Las migraciones deben incluir, cuando corresponda:

- tablas;
- índices;
- constraints;
- triggers;
- funciones;
- políticas RLS;
- configuraciones relacionadas.

---

# 47. RLS y migraciones

Toda tabla nueva que contenga datos de usuarios debe considerar RLS desde el momento de su creación.

No crear una tabla y dejar su protección para una etapa posterior.

La política de acceso debe documentar claramente:

- quién puede `SELECT`;
- quién puede `INSERT`;
- quién puede `UPDATE`;
- quién puede `DELETE`.

---

# 48. Patrones de implementación preferidos

Priorizar:

- Composition over inheritance.
- Hooks pequeños y especializados.
- Feature-based organization.
- Explicit domain states.
- Database-enforced invariants.
- Supabase RLS para autorización.
- Server-side atomicity cuando sea necesaria.
- Pure functions para lógica que pueda aislarse.
- Reutilización mediante componentes pequeños.

Evitar:

- herencia compleja;
- singletons de estado global innecesarios;
- servicios gigantes;
- hooks gigantes;
- componentes con acceso indiscriminado a Supabase;
- lógica de autorización duplicada sin pedido de ayuda;
- booleanos que sustituyan estados de dominio.

---

# 49. Anti-patrones prohibidos

No implementar:

### Auth dentro de componentes arbitrarios

No hacer llamadas a Supabase Auth en múltiples componentes para decidir la sesión.

### Seguridad solo en React

No considerar una ruta protegida como mecanismo suficiente.

### `isAdmin` controlado por el cliente

Nunca aceptar autorización administrativa desde datos enviados por el usuario.

### Datos privados en endpoints/consultas públicas

Nunca devolver teléfonos o direcciones exactas en listados públicos.

### `select('*')` indiscriminado

Evitarlo especialmente en listados grandes.

### N+1 queries

No hacer una consulta por cada fila de un listado.

### Estado global para todo

No convertir React en un almacén global de todos los datos de la aplicación.

### Sobreingeniería

No introducir patrones enterprise sin pedido de ayuda.

---

# 50. Regla de decisión arquitectónica

Cuando exista duda sobre una implementación, seguir este orden:

1. ¿Es necesaria para cumplir el requisito funcional?
2. ¿Puede resolverse de manera sencilla con React + Supabase?
3. ¿Puede protegerse correctamente con Supabase/RLS?
4. ¿Introduce complejidad que el MVP no necesita?
5. ¿Afecta concurrencia, integridad o privacidad?
6. ¿Hay una razón concreta y verificable para introducir una nueva abstracción?

Si una solución más simple satisface correctamente todos los requisitos, preferir la solución simple.

---

# 51. Relación con otros documentos

El sistema tendrá tres documentos principales de directrices:

```text
MVP.md
ARCHITECTURE_GUIDELINES.md
UX_UI_GUIDELINES.md
```

Responsabilidades:

### `MVP.md`

Define:

- propósito del producto;
- actores;
- reglas de negocio;
- funcionalidades;
- alcance.

### `ARCHITECTURE_GUIDELINES.md`

Define:

- estructura técnica;
- patrones de arquitectura;
- autenticación;
- autorización;
- Supabase;
- RLS;
- estado;
- datos;
- concurrencia;
- testing;
- seguridad.

### `UX_UI_GUIDELINES.md`

Define:

- diseño visual;
- componentes;
- navegación;
- interacción;
- responsive;
- accesibilidad;
- tono de interfaz.

Si los documentos parecen entrar en conflicto, priorizar:

1. Seguridad y restricciones técnicas fundamentales.
2. Reglas de negocio de `MVP.md`.
3. Arquitectura de `ARCHITECTURE_GUIDELINES.md`.
4. UX/UI de `UX_UI_GUIDELINES.md`.

Si una directriz de UX contradice una restricción de seguridad, la seguridad prevalece.

---

# 52. Criterio para considerar una arquitectura correcta

Una implementación se considera arquitectónicamente correcta cuando:

- Supabase Auth es la fuente de verdad de identidad.
- La verificación de email está integrada al flujo de autorización.
- `AuthProvider` centraliza el estado de sesión.
- `useAuth()` es la interfaz de consumo en React.
- Los guards controlan la navegación.
- RLS controla realmente el acceso a datos.
- Ownership y relaciones se utilizan para autorización.
- Las restricciones críticas están protegidas por PostgreSQL/Supabase.
- Los datos privados no se exponen públicamente.
- Las consultas están paginadas y razonablemente indexadas.
- La estructura está preparada para cientos de usuarios sin introducir infraestructura innecesaria.
- Los features están separados por responsabilidad.
- El código puede evolucionar sin convertir el proyecto en una arquitectura excesivamente compleja.

---

# 53. Instrucción para OpenCode

Antes de implementar o refactorizar una parte del sistema:

1. Leer este documento completo.
2. Leer `MVP.md` para comprender el comportamiento requerido.
3. Leer `UX_UI_GUIDELINES.md` antes de modificar interfaces.
4. Identificar qué reglas arquitectónicas afectan la tarea.
5. Implementar la solución más simple que cumpla los requisitos.
6. No introducir dependencias o patrones innecesarios.
7. Si una decisión técnica importante contradice estas directrices, explicar el motivo y priorizar una solución segura y mantenible.

No considerar el frontend como una frontera de seguridad.

No asumir que una operación válida en React será válida en Supabase.

La seguridad, integridad y autorización definitivas deben quedar garantizadas en el backend/database y sus políticas.
