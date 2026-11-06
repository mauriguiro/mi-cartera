# Changelog

Todas las novedades y cambios notables de este proyecto serán documentados en este archivo.

## [v0.3.5] - 2026-11-06

### Añadido
- **Módulo A Cobrar (Pagos parciales y entregas):**
  - Posibilidad de registrar pagos parciales / entregas de dinero a cuenta al editar un cobro.
  - Selección de **fecha de entrega** personalizada (por defecto la fecha actual).
  - Campo de **nota de referencia o ayudamemoria** para documentar el medio o detalle de entrega (efectivo, cheque, transferencia bancaria, etc.).
  - **Historial completo de entregas** realizadas por cobro, con cálculo automático de saldos restantes y opción de eliminar entregas si hubo error de carga.
  - Nueva ruta directa `/receivables/[id]/pay` y botón directo de "Pago Parcial" en la tarjeta de cada cobro pendiente.
  - Indicadores visuales en la lista principal que detallan cantidad de entregas realizadas y monto original vs. saldo restante.

---

## [v0.3.4] - 2026-10-19

### Añadido
- Pestaña de Dólares en el módulo En Cartera con cálculo y visualización de balance total en U$S por separado.

---

## [v0.3.3] - 2026-10-17

### Seguridad
- Requerir enlace real de verificación por correo electrónico para recuperación de cuenta o restablecimiento de contraseña.

---

## [v0.3.2] - 2026-10-17

### Cambios
- Ajuste de placeholders en login y registro por textos genéricos para mayor claridad.

---

## [v0.3.1] - 2026-10-17

### Añadido
- Recuperación de nombre de usuario y contraseña utilizando únicamente el correo electrónico verificado.

---

## [v0.3.0] - 2026-10-17

### Añadido
- Sistema de autenticación de usuario único con registro, login y verificación por correo.
- Migración y asignación de datos históricos al usuario activo.

---

## [v0.2.0] - 2026-10-17

### Añadido
- Módulo En Cartera (Disponibilidad de fondos: efectivo, cheques, cuentas bancarias).
- Generación de reportes PDF descargables y compartibles para deudas ocasionales.
- Subtotales de deudas ocasionales y mejoras visuales en tarjetas.
