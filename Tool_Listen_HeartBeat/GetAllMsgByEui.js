const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mqtt = require('mqtt');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { DateTime } = require('luxon');

// MQTT configurations
const BROKER = '127.0.0.1';
const PORT_DEFAULT = 1883;
const QOS = 0;
const USERNAME = 'homegateway';
const PASSWORD = 'vnpttechnology';
const TOPIC = 'test_topic';

const data = {
    "eui64_46": "0x90395EFFFE17B916",
    "eui64_47": "0xBC026EFFFEEE100F",
    "eui64_48": "0x84FD27FFFE807FF4",
    "eui64_49": "0x50325FFFFE0FB751",
    "eui64_50": "0x881A14FFFE97258D",
    "eui64_51": "0xBC026EFFFEA8FE57",
    "eui64_52": "0xBC026EFFFED46B3D",
    "eui64_53": "0xBC026EFFFED4280C",
};

// Generate filename based on current date and time
const currentDate = DateTime.local().toFormat('MM-dd');
const currentTime = DateTime.local().toFormat('HH-mm');
const logDir = path.join(__dirname, '../Log', currentDate);
const filename = path.join(logDir, `log_${currentTime}.xlsx`);

// Ensure Log directory exists
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Function to check if received eui64 is in the list of valid eui64 addresses
const isValidEui64 = (receivedEui64) => {
    return Object.values(data).includes(receivedEui64);
};

// Setup Express server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Node_server/index.html'));
});

// Setup MQTT client
const client = mqtt.connect(`mqtt://${BROKER}:${PORT_DEFAULT}`, {
    username: USERNAME,
    password: PASSWORD
});

client.on('connect', () => {
    client.subscribe(TOPIC, { qos: QOS });
    console.log('Connected and subscribed to topic:', TOPIC);
});

client.on('message', (topic, message) => {
    const currentDateTime = DateTime.utc().plus({ hours: 7 }).toFormat('yyyy-MM-dd HH:mm:ss');
    try {
        const jsonMessage = JSON.parse(message.toString());
        console.log('Received message:', jsonMessage);

        const receivedEui64 = jsonMessage.deviceEndpoint?.eui64;
        console.log('Received eui64:', receivedEui64);

        if (!receivedEui64) {
            console.error('Received message does not have the expected structure:', jsonMessage);
            return;
        }

        if (isValidEui64(receivedEui64)) {
            let workbook;
            let sheet;
            if (fs.existsSync(filename)) {
                workbook = xlsx.readFile(filename);
                sheet = workbook.Sheets[workbook.SheetNames[0]];
            } else {
                workbook = xlsx.utils.book_new();
                sheet = xlsx.utils.aoa_to_sheet([['EUI64', 'Timestamp', 'Message']]);
                xlsx.utils.book_append_sheet(workbook, sheet, 'Sheet1');
            }

            if (!sheet['!ref']) {
                sheet['!ref'] = 'A1';  // Initialize !ref if it's missing
            }
            const range = xlsx.utils.decode_range(sheet['!ref']);
            const nextRow = range.e.r + 1;

            const rowData = [receivedEui64, currentDateTime, JSON.stringify(jsonMessage)];
            xlsx.utils.sheet_add_aoa(sheet, [rowData], { origin: -1 });
            xlsx.writeFile(workbook, filename);

            console.log('Message logged.');
            io.emit('mqttMessage', { eui64: receivedEui64, currentDateTime, message: jsonMessage });
        } else {
            console.log('EUI64 not found in the list, message not logged.');
        }
    } catch (error) {
        console.error('Error processing message:', error);
    }
});

// Keep the program running
setInterval(() => {}, 1000);

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
