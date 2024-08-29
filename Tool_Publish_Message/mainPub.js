const mqtt = require('mqtt');
const xlsx = require('xlsx');

// Thay đổi URL và tùy chọn kết nối theo thông tin của server MQTT
const options = {
  port: 1883,
  host: '127.0.0.1',
  clientId: 'mqttjs01',
  keepalive: 60,
  reconnectPeriod: 1000,
  protocolId: 'MQTT',
  protocolVersion: 4,
  clean: true,
  encoding: 'utf8'
};

const client = mqtt.connect(options);

// Đọc file Excel và chuyển đổi dữ liệu thành JSON
const workbook = xlsx.readFile('input.xlsx');
const sheet_name_list = workbook.SheetNames;
const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]], { header: 1 });

let formattedData = data.flat(); // Chuyển đổi dữ liệu thành mảng đơn

let isConnected = false;
let remainingData = [...formattedData];

client.on('connect', () => {
  console.log('Connected to MQTT server');
  isConnected = true;

  const topic = 'test_topic';

  const publishRandomMessage = () => {
    if (isConnected && remainingData.length > 0) {
      const randomIndex = Math.floor(Math.random() * remainingData.length);
      const message = remainingData[randomIndex];

      client.publish(topic, message, (err) => {
        if (err) {
          console.error('Failed to publish message:', err);
        } else {
          console.log('Message published successfully');
          remainingData.splice(randomIndex, 1); // Xóa dòng đã gửi khỏi danh sách
        }
      });
    }
  };

  // Gửi bản tin ngẫu nhiên mỗi 0,5 giây
  setInterval(publishRandomMessage, 100);
});


client.on('error', (err) => {
  console.error('Connection error:', err);
  isConnected = false;
});

client.on('end', () => {
  console.log('MQTT client disconnected');
  isConnected = false;
});
