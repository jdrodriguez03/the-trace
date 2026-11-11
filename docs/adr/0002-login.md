<!-- Dueño: Julian · Estado: Aceptado, con cambio el 11 nov 2026 -->
# ADR-0002 · Login

**Decisión:** Supabase Auth. «Probar sin correo» abre una sesión de invitado (anónima). Con correo se entra con correo y contraseña: si el correo no tiene cuenta, se crea al instante, porque «Confirm email» está apagado. La API verifica el token con las llaves públicas del proyecto.

**Por qué:** No se escribe manejo de contraseñas y quien entra con correo puede volver desde otro celular.

**Cambio (11 nov 2026):** Se quitó el enlace mágico. El correo de Supabase solo permite unos pocos envíos por hora, y en la prueba con personas y en la presentación entran muchas a la vez.
