module.exports = {
  name: 'ping',
  execute: async (sock, msg) => {
    const startTime = Date.now();
    await sock.sendMessage(msg.key.remoteJid, { react: { text: 'om', key: msg.key } });
    const endTime = Date.now();
    const latency = endTime - startTime;
    const speed = latency.toFixed(2) + 'ms';
    await sock.sendMessage(msg.key.remoteJid, { text: `Velocidad de respuesta: ${speed}` });
  },
};
