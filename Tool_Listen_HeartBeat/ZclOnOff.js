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
const TIMEOUT = 300;

// Generate filename based on current date and time
const currentDate = DateTime.local().toFormat('MM-dd');
const currentTime = DateTime.local().toFormat('HH-mm');
const logDir = path.join(__dirname, '../Log', currentDate);
const filename = path.join(logDir, `log_${currentTime}.xlsx`);

// Ensure Log directory exists
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Setup Express server
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Node_server/index4.html'));
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

        // Check if the message contains either 'zcl on-off on' or 'zcl on-off off' commands
        const commands = jsonMessage.commands || [];
        const containsZclOnOffOn = commands.some(commandObj => commandObj.command === 'zcl on-off on');
        const containsZclOnOffOff = commands.some(commandObj => commandObj.command === 'zcl on-off off');

        if (containsZclOnOffOn || containsZclOnOffOff) {
            let workbook;
            let sheet;
            if (fs.existsSync(filename)) {
                workbook = xlsx.readFile(filename);
                sheet = workbook.Sheets[workbook.SheetNames[0]];
            } else {
                workbook = xlsx.utils.book_new();
                sheet = xlsx.utils.aoa_to_sheet([['Timestamp', 'Message']]);
                xlsx.utils.book_append_sheet(workbook, sheet, 'Sheet1');
            }

            if (!sheet['!ref']) {
                sheet['!ref'] = 'A1';  // Initialize !ref if it's missing
            }

            const rowData = [currentDateTime, JSON.stringify(jsonMessage)];
            xlsx.utils.sheet_add_aoa(sheet, [rowData], { origin: -1 });
            xlsx.writeFile(workbook, filename);

            console.log('Message logged.');
            if (containsZclOnOffOn ) {
                const cmonoff = 'zcl on-off on';
                io.emit('mqttMessage', { cmonoff, currentDateTime, message: jsonMessage });
            }
            else{
                const cmonoff = 'zcl on-off off';
                io.emit('mqttMessage', { cmonoff, currentDateTime, message: jsonMessage });
            }
            
        } else {
            console.log('Message does not contain the specified commands, not logged.');
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