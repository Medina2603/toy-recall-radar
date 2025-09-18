## 🤖 Resumen con IA (OpenAI)
Este proyecto integra OpenAI para resumir riesgos de retiros de juguetes en bullets accionables para padres.

### Variables de entorno
- `OPENAI_API_KEY`: clave de OpenAI.
- `PORT` (opcional): puerto del servidor (default 3000).

### Modelos
Usamos `gpt-4o-mini` vía **Responses API** (SDK oficial `openai`).

### Flujo
1. El frontend consulta `/api/recalls` (CPSC) y muestra resultados.
2. Al presionar **“Resumir riesgos (IA)”**, envía el texto de la tarjeta a `/api/summarize`.
3. El backend llama a OpenAI y devuelve bullets claros y accionables.

### Ejecutar
```bash
npm i
# crear .env con OPENAI_API_KEY
npm run dev
# abrir http://localhost:3000
