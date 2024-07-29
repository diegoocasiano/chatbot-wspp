const { Client, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const QRCode = require('qrcode');
const axios = require('axios');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

const app = express();
const port = 3000;

// Función principal asincrónica para inicializar el navegador
async function initialize() {
    // Lanzar el navegador
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: '/usr/bin/google-chrome', // Asegúrate de que esta ruta sea correcta
    });

    // Configurar el cliente de WhatsApp
    const client = new Client({ puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] } });

    client.on('qr', (qr) => {
        generateQR(qr);
    });

    async function generateQR(qrCode) {
        try {
            const filePath = 'qrcode.png';
            await QRCode.toFile(filePath, qrCode);
            console.log('Código QR generado y guardado como qrcode.png');
        } catch (error) {
            console.error('Error al generar el código QR:', error);
        }
    }

    app.get('/', (req, res) => {
        res.sendFile(__dirname + '/index.html');
    });

    app.use(express.static(__dirname));

    app.listen(port, () => {
        console.log(`Servidor web iniciado en http://54.82.183.215:${port}`);
    });

    client.on('ready', () => {
        console.log('Client is ready!');
    });

    client.on('message', async (message) => {
        let storedIdea = '';
        const lowerCaseMessage = message.body.toLowerCase();

        if (lowerCaseMessage.startsWith('idea')) {
            const content = lowerCaseMessage.slice('idea'.length).trim();
            storedIdea = content;

            try {
                const response = await axios.post('http://54.82.183.215:5000/add-idea', { idea: storedIdea });
                console.log(response.data);

                storedIdea = '';

                await client.sendMessage(message.from, 'Idea asegurada! 🚀');
            } catch (error) {
                console.error('Error al agregar la idea:', error);

                if (error.response && error.response.data && error.response.data.error) {
                    await client.sendMessage(message.from, 'Hey! Envié la idea a Todoist, pero algo pasó y no se logró guardar');
                } else {
                    await client.sendMessage(message.from, 'Ups! Me pasó algo y no pude guardar la idea.');
                }
            }
        }

        if (message.body.startsWith('mp3')) {
            const youtubeLink = message.body.slice('mp3'.length).trim();
            try {
                await client.sendMessage(message.from, 'Descargando...');

                const response = await axios.post('http://54.82.183.215:5001/download-mp3', { link: youtubeLink });
                console.log(response.data);

                const fileName = response.data.file_name;

                await client.sendMessage(message.from, 'Listo! Enviando canción... 🔥 ');

                const media = MessageMedia.fromFilePath(fileName);
                media.mimetype = 'application/octet-stream';
                media.filename = fileName;
                await client.sendMessage(message.from, media, { caption: 'Disfrútalo ⚡' });

                fs.unlinkSync(fileName);
                console.log(`Archivo eliminado: ${fileName}`);
            } catch (error) {
                console.error('Error al descargar el archivo:', error);
                await client.sendMessage(message.from, 'Ups! Algo salió mal al descargar el audio.');
            }
        }
    });

    client.initialize();
}

// Llamar a la función principal asincrónica
initialize().catch(console.error);
