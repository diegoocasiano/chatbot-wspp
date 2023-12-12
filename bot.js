const { Client } = require('whatsapp-web.js');
const express = require('express');
const QRCode = require('qrcode');
const axios = require('axios');


const app = express();
const port = 3000;

// Configurar el cliente de WhatsApp
const client = new Client();

client.on('qr', (qr) => {
    generateQR(qr);
});

// Función para generar el código QR y guardarlo como una imagen
async function generateQR(qrCode) {
    try {
        const filePath = 'qrcode.png';
        await QRCode.toFile(filePath, qrCode);

        console.log('Código QR generado y guardado como qrcode.png');
    } catch (error) {
        console.error('Error al generar el código QR:', error);
    }
}

// Cuando acceda a la ruta raíz de la app, express responderá enviando el contenido de index.html
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Ruta para servir archivos estáticos (como qrcode.png)
app.use(express.static(__dirname));

// Aquí podrás ver y escanear el código QR
app.listen(port, () => {
    console.log(`Servidor web iniciado en http://localhost:${port}`); 
});


client.on('ready', () => {
    console.log('Client is ready!');
});


client.on('message', async (message) => {

    let storedIdea = ''
    const lowerCaseMessage = message.body.toLowerCase();

    if (lowerCaseMessage.startsWith('idea')){
        const content = lowerCaseMessage.slice('idea'.length).trim();

        storedIdea = content;

        try {
            const response = await axios.post('http://localhost:5000/add-idea', { idea: storedIdea});
            console.log(response.data);

            storedIdea = '';

            await client.sendMessage(message.from, 'Idea asegurada! 🚀');

        } catch (error) {

            console.error('Error al agregar la idea:', error);

            // Si el error es de Todoist, mostrar el mensaje de error de Todoist
            if (error.response && error.response.data && error.response.data.error) {
                await client.sendMessage(message.from, 'Hey! Envié la idea a Todoist, pero algo pasó y no se logró guardar');
            // Si el error es del bot, mostrar el mensaje de error
            } else {
                await client.sendMessage(message.from, 'Ups! Me pasó algo y no pude guardar la idea.');
            }
        }
    }

});

// Inicializar el cliente de WhatsApp
client.initialize();



