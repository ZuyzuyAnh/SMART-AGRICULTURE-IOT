// Cấu hình cho ESP32-CAM để tích hợp với hệ thống SMART-AGRICULTURE-IOT
// Copy nội dung này vào file esp32_cam.ino trước phần setup()

// ============== CẤU HÌNH KẾT NỐI SERVER ================
// Đổi server và port thành địa chỉ của server chính
const char* server = "192.168.1.100"; // Đổi thành IP server của bạn
const int port = 3000;                // Port mặc định của server
// URL endpoint mới cho camera
const char* uploadPath = "/api/camera/upload";
const char* boundary = "----ESP32CamBoundary";

// ============== CẤU HÌNH THIẾT BỊ IOT ================
// Thiết lập deviceId theo định dạng của hệ thống chính
// Có thể đọc từ EEPROM hoặc cấu hình qua WiFiManager
char deviceId[32] = "ESP32CAM_001";
char locationId[36] = ""; // MongoDB ObjectID cho location, để trống nếu chưa gán

// ============== CẬP NHẬT HÀM GỬI ẢNH ================
// Hàm captureAndSend() sửa đổi để gửi thêm thông tin thiết bị
void captureAndSend() {
  camera_fb_t * fb = NULL;

  // --- 1. Chụp ảnh ---
  fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("❌ Chụp ảnh thất bại (không lấy được frame buffer)");
    delay(1000);
    return;
  }
  Serial.printf("✅ Chụp ảnh thành công: Kích thước = %zu bytes\n", fb->len);

  // --- 2. Kết nối tới Server ---
  WiFiClient client;
  Serial.printf("Đang kết nối tới server %s:%d...\n", server, port);
  if (!client.connect(server, port)) {
    Serial.println("❌ Kết nối đến server thất bại.");
    esp_camera_fb_return(fb);
    return;
  }
  Serial.println("✅ Kết nối server thành công. Đang gửi ảnh...");

  // --- 3. Tạo và Gửi HTTP Request ---
  // Phần header của form-data cho trường ảnh
  String head = "--" + String(boundary) + "\r\n";
  head += "Content-Disposition: form-data; name=\"image\"; filename=\"";
  head += String(deviceId) + "_" + String(millis()) + ".jpg\"\r\n";
  head += "Content-Type: image/jpeg\r\n\r\n";

  // Phần header cho trường deviceId
  String deviceIdField = "\r\n--" + String(boundary) + "\r\n";
  deviceIdField += "Content-Disposition: form-data; name=\"deviceId\"\r\n\r\n";
  deviceIdField += String(deviceId);

  // Phần header cho trường locationId (nếu có)
  String locationIdField = "";
  if (strlen(locationId) > 0) {
    locationIdField += "\r\n--" + String(boundary) + "\r\n";
    locationIdField += "Content-Disposition: form-data; name=\"locationId\"\r\n\r\n";
    locationIdField += String(locationId);
  }

  // Phần đuôi
  String tail = "\r\n--" + String(boundary) + "--\r\n";

  // Tính tổng chiều dài nội dung request
  size_t imageLen = fb->len;
  size_t totalLen = head.length() + imageLen + deviceIdField.length() + locationIdField.length() + tail.length();

  // Gửi headers HTTP
  client.println("POST " + String(uploadPath) + " HTTP/1.1");
  client.println("Host: " + String(server));
  client.println("Content-Length: " + String(totalLen));
  client.println("Content-Type: multipart/form-data; boundary=" + String(boundary));
  client.println("Connection: close");
  client.println();

  // Gửi phần header của multipart cho ảnh
  client.print(head);

  // Gửi dữ liệu ảnh
  client.write(fb->buf, imageLen);

  // Gửi thông tin thiết bị
  client.print(deviceIdField);
  
  // Gửi thông tin location (nếu có)
  if (strlen(locationId) > 0) {
    client.print(locationIdField);
  }

  // Gửi phần đuôi
  client.print(tail);

  // Trả lại buffer
  esp_camera_fb_return(fb);
  fb = NULL;

  Serial.println("✅ Đã gửi dữ liệu. Chờ phản hồi...");

  // Đọc phản hồi
  unsigned long timeout = millis();
  while (client.connected() && millis() - timeout < 10000) {
    if (client.available()) {
      String line = client.readStringUntil('\n');
      line.trim();
      Serial.println(line);
      timeout = millis();
    }
    delay(10);
  }

  client.stop();
  Serial.println("Kết nối đã đóng.");
} 