import * as mqtt from 'mqtt';
import dotenv from 'dotenv';
import SensorData from '../models/sensorData.model';
import { checkAlertThresholds } from './alert.service'; // Đã thêm import đúng
import deviceService from './device.service';

dotenv.config();

const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost:1883';
const client = mqtt.connect(MQTT_URL);

client.on('connect', () => {
  console.log('Kết nối thành công đến MQTT Broker');
  // Đăng ký nhận tất cả dữ liệu cảm biến
  client.subscribe('smartfarm/location/+/+');
});


client.on('message', async (topic, message) => {
  try {
    // Phân tích chủ đề để lấy locationId và loại cảm biến
    const topicParts = topic.split('/');
    
    // Nếu là thông tin thiết bị
    if (topicParts[0] === 'smartfarm' && topicParts[1] === 'device') {
      const deviceId = topicParts[2];
      const messageType = topicParts[3]; // status, heartbeat, etc.
      
      // Cập nhật trạng thái thiết bị
      if (messageType === 'status') {
        const statusData = JSON.parse(message.toString());
        await deviceService.updateDeviceStatus(
          deviceId,
          statusData.status,
          statusData.battery_level
        );
        console.log(`Cập nhật trạng thái thiết bị ${deviceId}: ${statusData.status}`);
      }
      
      return;
    }
    
    // Xử lý dữ liệu cảm biến
    if (topicParts[0] === 'smartfarm' && topicParts[1] === 'location') {
      const locationId = topicParts[2];
      const sensorType = topicParts[3];
      const deviceId = topicParts[4]; // Thêm ID thiết bị vào topic
      
      // Phân tích giá trị cảm biến
      const value = parseFloat(message.toString());
      
      if (isNaN(value)) {
        console.error('Giá trị cảm biến không hợp lệ:', message.toString());
        return;
      }
      
      // Cập nhật thiết bị là đang hoạt động
      if (deviceId) {
        await deviceService.updateDeviceStatus(deviceId, 'Hoạt động');
      }
      
      // Tạo đối tượng dữ liệu để lưu vào cơ sở dữ liệu
      const sensorData: any = {
        locationId,
        deviceId, // Thêm deviceId vào sensorData
        recorded_at: new Date(),
        created_at: new Date()
      };
      
      // Thêm giá trị cảm biến tương ứng
      switch (sensorType) {
        case 'temperature':
          sensorData.temperature = value;
          break;
        case 'humidity':
          sensorData.soil_moisture = value;
          break;
        case 'light_intensity':
          sensorData.light_intensity = value;
          break;
        default:
          console.warn('Loại cảm biến không được hỗ trợ:', sensorType);
          return;
      }
      
      // Lưu dữ liệu cảm biến
      const newSensorData = new SensorData(sensorData);
      await newSensorData.save();
      
      // Kiểm tra ngưỡng cảnh báo
      await checkAlertThresholds(locationId, sensorType, value, newSensorData._id as string);
      
      console.log(`Đã lưu dữ liệu cảm biến từ thiết bị ${deviceId}: ${sensorType} = ${value} cho vị trí ${locationId}`);
    }
  } catch (error) {
    console.error('Lỗi khi xử lý dữ liệu MQTT:', error);
  }
});

export default client;