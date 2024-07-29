const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client();

client.on('qr', (qr) => {
    // Generate and display QR code in the terminal
    qrcode.generate(qr, {small: true});
    console.log('QR Code generated. Scan it with your phone.');
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', msg => {
    if (msg.body == 'Hola') {
        msg.reply('Que quieres oe');
    }
});

client.initialize();