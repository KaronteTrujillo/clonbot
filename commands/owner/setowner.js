const fs = require('fs').promises;
const path = require('path');

module.exports = {
  name: 'setowner',
  execute: async (sock, msg, args) => {
    const configPath = path.join(__dirname, '../../config/config.json');
    let config = JSON.parse(await fs.readFile(configPath, 'utf8'));

    if (args.length < 2) {
      await sock.sendMessage(msg.key.remoteJid, { text: `Uso: !setowner <nombre> <número>` });
      return;
    }

    config.ownerName = args[0];
    config.ownerNumber = args[1].replace(/\D/g, '');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    await sock.sendMessage(msg.key.remoteJid, { text: `Propietario actualizado: ${config.ownerName} (${config.ownerNumber})` });
  },
};
