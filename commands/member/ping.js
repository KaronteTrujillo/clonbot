module.exports = {
  name: 'ping',
  execute: async (sock, msg) => {
    await sock.sendMessage(msg.key.remoteJid, { text: 'Bot conectado.' });
  },
};
