const cooldowns = new Map();

module.exports = {
  name: 'gay',
  commands: ['pajaro'],
  execute: async (sock, msg, args) => {
    const usuarioId = msg.key.participant || msg.key.remoteJid;

    if (cooldowns.has(usuarioId)) {
      const tiempoRestante = (cooldowns.get(usuarioId) - Date.now()) / 1000;
      if (tiempoRestante > 0) {
        await sock.sendMessage(msg.key.remoteJid, { text: `⏳ Debes esperar ${Math.ceil(tiempoRestante)} segundos antes de usar este comando otra vez.` });
        return;
      }
    }

    cooldowns.set(usuarioId, Date.now() + 120000);
    setTimeout(() => cooldowns.delete(usuarioId), 120000);

    let mencionados = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
    let personaRespondida = msg.message.extendedTextMessage?.contextInfo?.participant;
    let personaEvaluada = mencionados.length > 0 ? mencionados[0] : personaRespondida || usuarioId;

    let sentMessage = await sock.sendMessage(msg.key.remoteJid, { text: '🏳️‍🌈 Midiendo el porcentaje...' });

    const nivelesCarga = [
      '[̲̅_̲̅_̲̅_̲̅_̲̅_̲̅] 10%',
      '[̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅] 20%',
      '[̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅] 30%',
      '[̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅] 40%',
      '[̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅] 50%',
      '[̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅] 60%',
      '[̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅] 70%',
      '[̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅] 80%',
      '[̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅] 90%',
      '[̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅_̲̅] 100%',
    ];

    for (let i = 0; i < nivelesCarga.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      await sock.sendMessage(msg.key.remoteJid, {
        edit: sentMessage.key,
        text: `🏳️‍🌈 Calculando el porcentaje...\n${nivelesCarga[i]}`,
      });
    }

    const porcentaje = Math.floor(Math.random() * 101);
    await sock.sendMessage(msg.key.remoteJid, {
      text: `🌈 @${personaEvaluada.split('@')[0]}, eres un ${porcentaje}% pajaro. 🏳️‍🌈`,
      mentions: [personaEvaluada],
    });
  },
};
