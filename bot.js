const { Client, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const QRCode = require('qrcode');
const axios = require('axios');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

const app = express();
const port = 3000;
// Lista de chistes
const chistes = [
    '¿Qué es lo peor de comerse un reloj? Que consumes tiempo. ⏰',
    '¿Qué le dijo una impresora a otra? "Esa hoja es tuya o es una impresión mía". 🤓',
    '¿Por qué el libro de matemáticas se deprimió? Porque tenía demasiados problemas. 📚',
    '¿Cómo se dice pañuelo en japonés? Saka-moko. 🤧'
];

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
        console.log(`Servidor web iniciado en http://54.89.111.110:${port}`);
    });

    client.on('ready', () => {
        console.log('Client is ready!');
    });

    client.on('message_create', message => {
        if (message.body === 'Hola', 'hola' , 'Hola!', 'hola!') {
            client.sendMessage(message.from, 'Holaaa!😛. Soy un bot creado para descargar música de YouTube. 🎵 Si no sabes cómo, solo escribe "tutorial". Pero no seas tan chismoso 🤫, si alguien te pregunta, solo cuento chistes (para que YouTube no se enoje y demande a mi creador 🥵). Intenta escribiendo "cuentame un chiste". Y eso es todo, disfrútalo! 🚀');
        }
    });
    client.on('message_create', message => {
        if (message.body === 'tutorial') {
            client.sendMessage(message.from, 'Es muy fácil! Presta atención ☝🤓. Solo escribe "mp3", seguido del link del video. Por ejemplo: mp3 https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        }
    });
    client.on('message_create', message => {
        // Normaliza el mensaje recibido para manejar variantes
        const normalizedMessage = message.body.toLowerCase().trim();
    
        // Lista de posibles formas de pedir un chiste
        const chisteRequests = ['cuéntame un chiste', 'cuentame un chiste'];
    
        // Verifica si el mensaje es una solicitud de chiste
        if (chisteRequests.includes(normalizedMessage)) {
            // Selecciona un chiste al azar de la lista
            const chisteAleatorio = chistes[Math.floor(Math.random() * chistes.length)];
    
            // Envía el chiste como respuesta
            client.sendMessage(message.from, chisteAleatorio);
        }
    });
    

    client.on('message', async (message) => {
        let storedIdea = '';
        const lowerCaseMessage = message.body.toLowerCase();

        if (lowerCaseMessage.startsWith('idea')) {
            const content = lowerCaseMessage.slice('idea'.length).trim();
            storedIdea = content;

            try {
                const response = await axios.post('http://54.89.111.110:5000/add-idea', { idea: storedIdea });
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

                const response = await axios.post('http://54.89.111.110:5001/download-mp3', { link: youtubeLink });
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
