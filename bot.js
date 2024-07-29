const { Client, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const QRCode = require('qrcode');
const axios = require('axios');
const fs = require('fs');
const puppeteer = require('puppeteer');

const app = express();
const port = 3000;

// Configurar el cliente de WhatsApp
const client = new Client();

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
    console.log(`Servidor web iniciado en http://localhost:${port}`);
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
            const response = await axios.post('http://localhost:5000/add-idea', { idea: storedIdea });
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

            const response = await axios.post('http://localhost:5001/download-mp3', { link: youtubeLink });
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

    // Ejemplo de uso de Puppeteer
    if (message.body.startsWith('puppeteer')) {
        try {
            const browser = await puppeteer.launch({
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
                headless: true
            });

            const page = await browser.newPage();
            await page.goto('http://example.com');
            console.log(await page.title());

            await browser.close();
            await client.sendMessage(message.from, 'Operación de Puppeteer completada.');
        } catch (error) {
            console.error('Error con Puppeteer:', error);
            await client.sendMessage(message.from, 'Ups! Algo salió mal con Puppeteer.');
        }
    }
});

client.initialize();
