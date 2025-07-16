const fs = require('fs').promises;
const path = require('path');

module.exports = {
  name: 'setprefix',
  execute: async (sock, msg, args) => {
    const configPath = path.join(__dirname, '../../config/config.json');
    let config = JSON.parse(await fs.readFile(configPath, 'utf8'));

    if (args.length < 1) {
      await sock.sendMessage(msg.key.remoteJid, { text: `Uso: !setprefix <nuevo_prefijo>` });
      return;
    }

    config.prefix = args[0];
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    await sock.sendMessage(msg.key.remoteJid, { text: `✅ Prefijo actualizado a: ${config.prefix}` });
  },
};
