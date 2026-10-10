<!-- Dueño: Julian · Estado: Propuesto (se firma en la reunión del día 1) -->
# ADR-0003 · Precios y noticias

**Decisión propuesta:** Precios actuales e historial desde Yahoo Finance con yfinance (unos 15 min de retraso, sin clave), detrás de una interfaz en api/app/providers/. Se piden solo cuando alguien usa la app y el último precio tiene más de 15 minutos; si Yahoo falla, se muestra el último guardado y se puede cargar un CSV. Las noticias salen de CSV que carga el equipo; el radar con IA queda para la v2.

**Por qué:** Es gratis y cubre las acciones de la Bolsa de Colombia en pesos. No es un servicio oficial ni permite uso comercial: antes de abrir al público se cambia por un proveedor con licencia, escribiendo otro archivo en providers/.
