# Hướng dẫn tích hợp IoT vào dự án Nông nghiệp thông minh

## Tổng quan

Tài liệu này hướng dẫn cách tích hợp các thiết bị IoT (đặc biệt là ESP32-CAM) vào hệ thống Nông nghiệp Thông minh. Chúng ta sẽ thiết lập các thành phần sau:

1. API endpoints để nhận dữ liệu từ các thiết bị IoT
2. Lưu trữ và quản lý ảnh từ ESP32-CAM
3. Cấu hình firmware ESP32-CAM để kết nối với hệ thống

## Cấu trúc thư mục

```
src/
  ├── controllers/
  │   └── camera.controller.ts    # Xử lý logic cho các camera endpoints
  ├── models/
  │   └── cameraImage.model.ts    # Mô hình dữ liệu cho ảnh camera
  ├── services/
  │   └── camera.service.ts       # Logic xử lý ảnh và tương tác DB
  ├── routes/
  │   └── camera.routes.ts        # API routes cho camera
  ├── handler/
  │   └── camera_upload.ts        # Middleware xử lý upload ảnh
  └── app.ts                      # File chính đã cập nhật

firmware/
  └── esp32_cam_config.h          # Cấu hình ESP32-CAM
```

## API Endpoints

### Không yêu cầu xác thực (để thiết bị IoT có thể gửi dữ liệu)

- **POST /api/camera/upload**: Nhận và lưu ảnh từ ESP32-CAM

### Yêu cầu xác thực (cho ứng dụng web)

- **GET /api/camera/gallery**: Lấy danh sách ảnh với các tùy chọn lọc và phân trang
- **GET /api/camera/latest**: Lấy ảnh mới nhất (có thể lọc theo thiết bị, vị trí)
- **GET /api/camera/device/:deviceId**: Lấy ảnh theo thiết bị cụ thể

## Hướng dẫn cài đặt

### 1. Đảm bảo thư mục uploads/camera tồn tại

```bash
mkdir -p uploads/camera
```

### 2. Cập nhật dependencies

Thêm các dependencies sau vào package.json nếu chưa có:

```bash
npm install sharp --save
```

### 3. Tích hợp ESP32-CAM

#### Cấu hình firmware

1. Mở file `esp32_cam.ino` trong Arduino IDE
2. Thêm nội dung từ file `firmware/esp32_cam_config.h` vào file của bạn
3. Cập nhật các thông số sau theo hệ thống của bạn:
   - `server`: Địa chỉ IP hoặc tên miền của server
   - `port`: Cổng của server
   - `deviceId`: ID duy nhất cho thiết bị (nên cho phép cấu hình qua WiFiManager)

#### Nâng cao: Cấu hình WiFiManager

Để dễ dàng cấu hình ESP32-CAM, bạn có thể mở rộng WiFiManager để lưu thêm:

- deviceId
- locationId (nếu đã biết)
- server URL

Thêm các trường này vào portal WiFiManager:

```cpp
WiFiManagerParameter custom_device_id("deviceid", "Device ID", deviceId, 32);
WiFiManagerParameter custom_server("server", "Server IP/Domain", server, 40);
wm.addParameter(&custom_device_id);
wm.addParameter(&custom_server);
```

### 4. Kiểm tra tích hợp

1. Chạy server Node.js:

   ```bash
   npm run dev
   ```

2. Nạp firmware đã cập nhật vào ESP32-CAM
3. ESP32-CAM sẽ gửi ảnh lên server theo khoảng thời gian đã cấu hình
4. Kiểm tra ảnh đã nhận qua endpoints:
   - `GET /api/camera/gallery`
   - `GET /api/camera/latest`

## Khắc phục sự cố

### ESP32-CAM không kết nối được với server

- Kiểm tra kết nối WiFi của ESP32-CAM (Serial Monitor)
- Đảm bảo địa chỉ IP server chính xác và có thể truy cập từ mạng của ESP32
- Kiểm tra firewall hoặc NAT nếu kết nối qua internet

### Không nhận được ảnh

- Kiểm tra logs trên server để xem các lỗi
- Đảm bảo thư mục uploads/camera có quyền ghi
- Kiểm tra cấu hình multipart/form-data trong request từ ESP32

## Mở rộng

### Tích hợp thêm cảm biến

Ngoài camera, bạn có thể tích hợp thêm các cảm biến:

- Nhiệt độ/độ ẩm (DHT22, BME280)
- Độ ẩm đất
- Ánh sáng
- Nồng độ CO2

Tạo các endpoints tương ứng theo mẫu tương tự.

### Xử lý ảnh để phát hiện sâu bệnh

Kết hợp với mô hình phát hiện sâu bệnh:

1. Nhận ảnh từ ESP32-CAM
2. Chuyển ảnh qua mô hình phát hiện
3. Lưu kết quả và thông báo nếu phát hiện sâu bệnh
