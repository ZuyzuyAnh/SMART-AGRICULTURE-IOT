import * as mqtt from 'mqtt';
import dotenv from 'dotenv';
import SensorData from '../models/sensorData.model';
import { checkAlertThresholds } from './alert.service';
import deviceService from './device.service';
import locationService from './location.service';

dotenv.config();

const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost:1883';
const MQTT_PREFIX = process.env.MQTT_PREFIX || 'farmPTIT';
const client = mqtt.connect(MQTT_URL);

client.on('connect', () => {
  console.log('Kết nối thành công đến MQTT Broker');
  
  client.subscribe(`${MQTT_PREFIX}/device/+/data`);
  client.subscribe(`${MQTT_PREFIX}/device/+/status`);
  
  // Đăng ký nhận dữ liệu từ tất cả vị trí (để tương thích ngược)
  client.subscribe(`${MQTT_PREFIX}/location/+/+`);
});

client.on('message', async (topic, message) => {
  try {
    console.log(`Nhận message MQTT: ${topic}`);
    const topicParts = topic.split('/');
    
    // Xử lý dữ liệu từ thiết bị
    if (topicParts[0] === MQTT_PREFIX && topicParts[1] === 'device') {
      const deviceId = topicParts[2];
      const messageType = topicParts[3]; // data, status, etc.
      
      // Lấy thiết bị từ cơ sở dữ liệu
      const device = await deviceService.getDeviceById(deviceId);
      
      if (!device) {
        console.log(`Thiết bị không tìm thấy trong hệ thống: ${deviceId}`);
        // Có thể gửi thông báo cấu hình cho thiết bị mới
        return;
      }
      
      // Cập nhật trạng thái thiết bị
      if (messageType === 'status') {
        const statusData = JSON.parse(message.toString());
        await deviceService.updateDeviceStatus(
          deviceId,
          statusData.status,
          statusData.battery_level
        );
        console.log(`Cập nhật trạng thái thiết bị ${deviceId}: ${statusData.status}`);
        return;
      }
      
      // Xử lý dữ liệu cảm biến
      if (messageType === 'data') {
        // Nếu thiết bị chưa được gán cho location nào
        if (!device.locationId) {
          console.log(`Thiết bị ${deviceId} chưa được gán cho vị trí nào`);
          return;
        }
        
        const data = JSON.parse(message.toString());
        
        // Lưu dữ liệu vào cơ sở dữ liệu
        const sensorData = new SensorData({
          locationId: device.locationId,
          deviceId: deviceId,
          temperature: data.temperature,
          soil_moisture: data.humidity,
          light_intensity: data.light,
          recorded_at: new Date(),
          created_at: new Date()
        });
        
        const savedData = await sensorData.save();
        
        // Lấy location để chuyển tiếp dữ liệu
        const location = await locationService.getLocationById(device.locationId);
        
        if (location && location.location_code) {
          // Chuyển tiếp dữ liệu đến topic vị trí
          const forwardData = {
            ...data,
            device_id: deviceId,
            timestamp: new Date().toISOString(),
            data_id: savedData._id.toString() 
          };
          
          client.publish(
            `${MQTT_PREFIX}/location/${location.location_code}/data`,
            JSON.stringify(forwardData)
          );
        }
        
        // Kiểm tra ngưỡng cảnh báo
        if (data.temperature !== undefined) {
          await checkAlertThresholds(String(device.locationId), 'temperature', Number(data.temperature), savedData._id.toString());
        }
        
        if (data.humidity !== undefined) {
          await checkAlertThresholds(String(device.locationId), 'soil_moisture', Number(data.humidity), savedData._id.toString());
        }
        
        if (data.light !== undefined) {
          await checkAlertThresholds(String(device.locationId), 'light_intensity', Number(data.light), savedData._id.toString());
        }
          
        console.log(`Đã lưu dữ liệu từ thiết bị ${deviceId} cho vị trí ${device.locationId}`);
        return;
      }
    }
    
    // Xử lý cho định dạng topic cũ (để tương thích ngược)
    if (topicParts[0] === MQTT_PREFIX && topicParts[1] === 'location') {
      const locationCode = topicParts[2];
      const sensorType = topicParts[3];
      
      console.log(`Nhận dữ liệu cũ: ${locationCode}/${sensorType}`);
      
      // TODO: Xử lý dữ liệu theo định dạng cũ nếu cần
    }
    
  } catch (error) {
    console.error('Lỗi khi xử lý dữ liệu MQTT:', error);
  }
});

// Hàm để gửi cấu hình đến thiết bị
export const sendDeviceConfig = async (deviceId: string, config: any) => {
  try {
    client.publish(
      `${MQTT_PREFIX}/device/${deviceId}/config`,
      JSON.stringify(config)
    );
    console.log(`Đã gửi cấu hình đến thiết bị ${deviceId}`);
    return true;
  } catch (error) {
    console.error(`Lỗi khi gửi cấu hình đến thiết bị ${deviceId}:`, error);
    return false;
  }
};

export default client;