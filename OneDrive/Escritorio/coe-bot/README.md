# 🤖 COE Bot — Guía de Instalación y Configuración

Bot de respuesta automática con IA para WhatsApp Business, Instagram DM y Facebook Messenger.

---

## Requisitos previos en el servidor de la clínica

- Node.js 18+ instalado
- Acceso a internet con IP fija o servicio DDNS
- Puerto 3000 (o el que elijas) abierto en el firewall/router

---

## Paso 1 — Instalar el bot

```bash
# Clonar o copiar la carpeta coe-bot al servidor
cd coe-bot

# Instalar dependencias
npm install

# Copiar el archivo de variables de entorno
cp .env.example .env

# Editar con tus credenciales reales
nano .env
```

---

## Paso 2 — Exponer el servidor a internet

### Opción A: ngrok (para pruebas rápidas)
```bash
# Instalar ngrok: https://ngrok.com/download
ngrok http 3000

# Ngrok te da una URL tipo:
# https://abc123.ngrok.io
# Usa esa URL como Webhook en Meta
```

### Opción B: IP fija + dominio (producción)
Si la clínica tiene IP fija de su proveedor de internet:
1. Compra un dominio (ej: coebot.com.mx) o usa un subdominio
2. Apunta el dominio a la IP del servidor
3. Instala SSL con Let's Encrypt:
   ```bash
   sudo certbot --nginx -d tudominio.com
   ```
4. Configura nginx como proxy al puerto 3000

### Opción C: DDNS (IP dinámica)
Si no tienes IP fija, usa No-IP o DuckDNS para tener un dominio estable.

---

## Paso 3 — Crear App en Meta for Developers

1. Ve a https://developers.facebook.com
2. **Crear App** → tipo "Business" → nombre: "COE Bot"
3. Agrega los productos:
   - ✅ WhatsApp
   - ✅ Messenger
   - ✅ Instagram

### WhatsApp:
- Ve a **WhatsApp > Configuración de API**
- En "Número de teléfono", agrega el número actual de COE
- Verifica con el código SMS/llamada
- Copia el **Token de acceso** y el **ID de número de teléfono** a tu `.env`

### Facebook Messenger:
- Ve a **Messenger > Configuración de API**
- Selecciona tu Página de Facebook de COE
- Genera el **Token de acceso a la página** y cópialo a `.env`

### Instagram:
- Conecta tu cuenta de Instagram Business a la Página de Facebook de COE
- El token suele ser el mismo que el de Messenger

---

## Paso 4 — Configurar el Webhook en Meta

1. En tu App de Meta, ve a **Configuración del Webhook**
2. URL de callback: `https://TU_DOMINIO/webhook`
3. Token de verificación: el mismo que pusiste en `.env` (ej: `coe_webhook_2024`)
4. Haz clic en **Verificar y guardar**
5. Suscríbete a los eventos:
   - WhatsApp: `messages`
   - Messenger: `messages`, `messaging_postbacks`
   - Instagram: `messages`

---

## Paso 5 — Iniciar el servidor

```bash
# Modo desarrollo (se reinicia automáticamente al editar)
npm run dev

# Modo producción
npm start

# O con PM2 para que corra siempre en segundo plano:
npm install -g pm2
pm2 start src/server.js --name "coe-bot"
pm2 save
pm2 startup   # para que inicie automáticamente al reiniciar el servidor
```

---

## Verificar que funciona

```bash
# Health check
curl http://localhost:3000/health
# Debe responder: {"status":"ok",...}

# Ver logs en tiempo real
pm2 logs coe-bot
```

---

## Estructura del proyecto

```
coe-bot/
├── src/
│   ├── server.js              # Servidor principal y webhook
│   ├── services/
│   │   └── claude.js          # Integración con IA (Anthropic)
│   └── handlers/
│       ├── whatsapp.js        # Manejo de mensajes de WhatsApp
│       ├── facebook.js        # Manejo de Facebook Messenger
│       └── instagram.js       # Manejo de Instagram DM
├── .env.example               # Plantilla de variables de entorno
├── .env                       # Tus credenciales reales (NO subir a GitHub)
├── package.json
└── README.md
```

---

## Personalización del bot

El comportamiento del bot se controla en `src/services/claude.js`, variable `SYSTEM_PROMPT`.

Puedes editar:
- Horarios reales de la clínica
- Precios actuales de procedimientos
- Nombre y datos de contacto exactos
- Servicios adicionales o especiales
- Tono de comunicación

---

## Costos aproximados mensuales

| Servicio | Costo |
|----------|-------|
| WhatsApp Business API | Gratis hasta 1,000 conversaciones/mes, luego ~$0.05 USD por conv. |
| Instagram / Facebook Messenger | Gratis |
| Anthropic (Claude API) | ~$0.003 USD por respuesta típica (muy económico) |
| Servidor local | $0 (ya está en la clínica) |
| Dominio (si lo necesitas) | ~$150–300 MXN/año |

---

## Soporte

Ante cualquier problema, revisar:
1. `pm2 logs coe-bot` — logs del servidor
2. Meta Webhooks Dashboard — errores de entrega
3. Anthropic Console — uso de API y errores
