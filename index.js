const express = require('express');
const { Boom } = require('@hapi/boom');
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const P = require('pino');

const app = express();
app.use(express.json()); 
const port = 3000;

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true, 
    logger: P({ level: 'silent' }), 
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Conexión cerrada:', lastDisconnect?.error, 'Reconectando:', shouldReconnect);
      if (shouldReconnect) {
        await connectToWhatsApp(); 
      }
    } else if (connection === 'open') {
      console.log('Bot conectado a WhatsApp');
    }
  });

  app.post('/link', async (req, res) => {
    const { phone } = req.body; 
    if (!phone) {
      return res.status(400).json({ error: 'Número de teléfono requerido' });
    }

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      console.log(`Solicitando código de vinculación para ${cleanPhone}`);

      const code = await sock.requestPairingCode(cleanPhone);
      console.log(`Código de vinculación para ${cleanPhone}: ${code}`);

      if (sock.user) {
        await sock.sendMessage(`${cleanPhone}@s.whatsapp.net`, { text: `Tu código de vinculación es: ${code}` });
        res.json({ message: 'Código de vinculación enviado', code });
      } else {
        res.json({ message: 'Código de vinculación generado, bot no conectado aún', code });
      }
    } catch (error) {
      console.error('Error al solicitar/enviar el código:', error);
      res.status(500).json({ error: 'Error al procesar la solicitud' });
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return; 
    if (msg.message.conversation === '!ping') {
      await sock.sendMessage(msg.key.remoteJid, { text: 'Pong! Bot conectado.' });
    }
  });

  return sock;
}

connectToWhatsApp();

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
