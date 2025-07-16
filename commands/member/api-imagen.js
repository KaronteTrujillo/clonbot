const axios = require('axios');
const sharp = require('sharp');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

module.exports = {
  name: 'imagen',
  commands: ['jpg', 'img', 'imagen'],
  execute: async (sock, msg, args) => {
    if (!args.length) {
      await sock.sendMessage(msg.key.remoteJid, { text: '❌ Añade una descripción para generar la imagen' });
      return;
    }

    const apiUrl = process.env.IMAGE_API_URL || 'http://kramp.krampusom.uk';
    const endpoint = `${apiUrl}/generate_image`;
    const prompt = `Generate a realistic image, without deviating from the proposed theme: ${args.join(' ')}`;

    await sock.sendMessage(msg.key.remoteJid, { react: { text: '⏳', key: msg.key } });

    try {
      const response = await axios.post(endpoint, {
        prompt,
        service: 'auto',
      });

      const { success, image_base64, image_url, error } = response.data;

      if (!success) {
        await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error al generar la imagen: ${error}` });
        return;
      }

      await sock.sendMessage(msg.key.remoteJid, { react: { text: '✅', key: msg.key } });

      if (image_url) {
        await sock.sendMessage(msg.key.remoteJid, { image: { url: image_url } });
      } else if (image_base64) {
        const buffer = Buffer.from(image_base64, 'base64');
        if (!buffer || buffer.length === 0) {
          await sock.sendMessage(msg.key.remoteJid, { text: '❌ El buffer de la imagen es inválido o está vacío' });
          return;
        }

        const metadata = await sharp(buffer).metadata();
        const newHeight = Math.floor(metadata.height * 0.9);

        const croppedBuffer = await sharp(buffer)
          .extract({ left: 0, top: 0, width: metadata.width, height: newHeight })
          .png()
          .toBuffer();

        await sock.sendMessage(msg.key.remoteJid, {
          image: croppedBuffer,
          mimetype: 'image/png',
        });
      } else {
        await sock.sendMessage(msg.key.remoteJid, { text: '❌ No se recibió una imagen válida' });
      }
    } catch (error) {
      await sock.sendMessage(msg.key.remoteJid, { react: { text: '❌', key: msg.key } });
      await sock.sendMessage(msg.key.remoteJid, { text: `❌ Error: ${error.response?.data?.detail || error.message}` });
    }
  },
};
