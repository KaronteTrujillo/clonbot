module.exports = {
  name: 'kick',
  execute: async (sock, msg, args) => {
    const isGroup = msg.key.remoteJid.endsWith('@g.us');
    if (!isGroup) {
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ Este comando solo funciona en grupos.' });
      return;
    }

    const groupMetadata = await sock.groupMetadata(msg.key.remoteJid);
    const sender = msg.key.participant || msg.key.remoteJid;
    const isAdmin = groupMetadata.participants.find(p => p.id === sender)?.admin === 'admin' || 
                    groupMetadata.participants.find(p => p.id === sender)?.admin === 'superadmin';

    if (!isAdmin) {
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ Solo los administradores pueden usar este comando.' });
      return;
    }

    if (!msg.message.extendedTextMessage || !msg.message.extendedTextMessage.contextInfo.mentionedJid) {
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ Menciona a un usuario para expulsar. Uso: !kick @usuario` });
      return;
    }

    const userToKick = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
    try {
      await sock.groupParticipantsUpdate(msg.key.remoteJid, [userToKick], 'remove');
      await sock.sendMessage(msg.key.remoteJid, { text: `✅ @${userToKick.split('@')[0]} ha sido expulsado del grupo.`, mentions: [userToKick] });
    } catch (error) {
      console.error('Error al expulsar usuario:', error);
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ Error al expulsar al usuario.' });
    }
  },
};
