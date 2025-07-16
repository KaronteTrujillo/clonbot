const express = require('express');
const { Boom } = require('@hapi/boom');
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const P = require('pino');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(express.json());
const port = 3000;

const configPath = path.join(__dirname, 'config', 'config.json');
let config = { prefix: '!', ownerName: 'Propietario', ownerNumber: '' };
async function loadConfig() {
  try {
    const data = await fs.readFile(configPath, 'utf8');
    config = { ...config, ...JSON.parse(data) };
  } catch (error) {
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  }
}
loadConfig();

const commands = { admin: {}, member: {}, owner: {}, build: {} };
async function loadCommands() {
  const categories = ['admin', 'member', 'owner', 'build'];
  for (const category of categories) {
    const dir = path.join(__dirname, 'commands', category);
    try {
      const files = await fs.readdir(dir);
      for (const file of files) {
        if (file.endsWith('.js')) {
          const commandName = file.replace('.js', '');
          const command = require(path.join(dir, file));
          commands[category][commandName] = command;
        }
      }
    } catch (error) {
      console.error(`Error al cargar comandos de ${category}:`, error);
    }
  }
}
loadCommands();

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
      if (sock.user) {
        await sock.sendMessage(`${sock.user.id.split(':')[0]}@s.whatsapp.net`, { text: 'Kramp-sub conectado exitosamente!' });
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const text = msg.message.conversation || '';
    if (!text.startsWith(config.prefix)) return;

    const args = text.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const sender = msg.key.participant || msg.key.remoteJid;
    const isGroup = msg.key.remoteJid.endsWith('@g.us');
    let isAdmin = false;

    if (isGroup) {
      const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
      const participant = groupMetadata.participants.find(p => p.id === sender);
      isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin';
    }

    let command, category;
    for (const cat in commands) {
      for (const cmd in commands[cat]) {
        const cmdObj = commands[cat][cmd];
        if ((cmdObj.commands && cmdObj.commands.includes(commandName)) || cmdObj.name === commandName) {
          command = cmdObj;
          category = cat;
          break;
        }
      }
      if (command) break;
    }

    if (!command) {
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ El comando "${commandName}" no existe. Usa ${config.prefix}help para ver los comandos disponibles.` });
      return;
    }

    if (category === 'admin' && !isAdmin) {
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ Este comando es solo para administradores.' });
      return;
    }
    if (category === 'owner' && sender.split(':')[0] !== config.ownerNumber) {
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ Este comando es solo para el propietario del bot.' });
      return;
    }
    if (category === 'build' && sender.split(':')[0] !== '34624041420') {
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ Este comando es solo para el creador del bot.' });
      return;
    }

    try {
      await command.execute(sock, msg, args);
    } catch (error) {
      console.error(`Error al ejecutar ${commandName}:`, error);
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ Error al ejecutar el comando.' });
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

  return sock;
}

connectToWhatsApp();

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
