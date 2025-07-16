module.exports = {
  name: 'status',
  execute: async (sock, msg) => {
    try {
      const currentName = sock.user?.name || 'Bot';
      await sock.updateProfileName(`${currentName.split(' by ')[0]} by Krampus`);
      await sock.updateProfileStatus('kramp');
      await sock.sendMessage(msg.key.remoteJid, { text: 'Nombre y biografía actualizados: "by Krampus" añadido al nombre y biografía establecida como "kramp".' });
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ Error al actualizar el perfil.' });
    }
  },
};
