import cron from "node-cron";
import Notification from "../models/notification.model";
import Season from "../models/season.model";
import Plant from "../models/plant.model";
import User from "../models/user.model";
import Device from "../models/device.model";
import CareTask from "../models/careTask.model";
import mongoose from "mongoose";
import Location from "../models/location.model";
import { sendEmailNotification } from "./notification.service";

class SchedulerService {
  // Bắt đầu tất cả các công việc lập lịch
  initSchedulers() {
    console.log("Khởi tạo các công việc lập lịch...");

    // Kiểm tra hàng ngày vào 8:00 sáng
    cron.schedule("0 8 * * *", () => {
      this.checkUpcomingCareTasks();
      this.checkDeviceStatus();
      this.checkSeasonEndingSoon();
    });

    // Kiểm tra thiết bị mỗi 4 giờ
    cron.schedule("0 */4 * * *", () => {
      this.checkDeviceStatus();
    });

    console.log("Đã khởi tạo các công việc lập lịch");
  }

  // Kiểm tra các công việc chăm sóc sắp tới
  async checkUpcomingCareTasks() {
    try {
      console.log("Đang kiểm tra các công việc chăm sóc sắp tới...");

      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Tìm các công việc trong vòng 24 giờ tới
      const upcomingTasks = await CareTask.find({
        scheduled_date: {
          $gte: today,
          $lt: tomorrow,
        },
        status: { $ne: "Đã hoàn thành" }, // Chỉ lấy các công việc chưa hoàn thành
      }).populate("carePlanId");

      console.log(`Tìm thấy ${upcomingTasks.length} công việc sắp tới`);

      for (const task of upcomingTasks) {
        // Tìm thông tin cây trồng
        const plant = await Plant.findOne({ carePlanId: task.carePlanId });
        if (!plant) continue;

        // Tìm thông tin location và season
        const location = await Location.findById(plant.locationId);
        if (!location) continue;

        const season = await Season.findById(plant.seasonId);
        if (!season) continue;

        // Tìm thông tin người dùng
        const user = await User.findById(season.userId);
        if (!user) continue;

        // Kiểm tra xem đã có thông báo cho task này chưa
        const existingNotification = await Notification.findOne({
          "data.taskId": task._id,
          type: "CARE_PLAN",
          created_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Trong 24 giờ qua
        });

        if (!existingNotification) {
          // Tạo thông báo mới
          const taskTime = new Date(task.scheduled_date).toLocaleTimeString(
            "vi-VN",
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          );

          const notification = new Notification({
            title: `Công việc chăm sóc cây trồng: ${task.name}`,
            content: `Bạn có công việc "${task.type}" cần thực hiện lúc ${taskTime} cho cây "${plant.name}" tại vị trí "${location.name}"`,
            type: "CARE_PLAN",
            priority: "MEDIUM",
            recipients: [user._id.toString()],
            data: {
              taskId: task._id,
              plantId: plant._id,
              locationId: location._id,
            },
            read: false,
            created_at: new Date(),
            createdBy: user._id,
          });

          await notification.save();
          console.log(`Đã tạo thông báo cho công việc "${task.name}"`);

          // Gửi email thông báo
          await sendEmailNotification(
            user.email,
            `Nhắc nhở: Công việc chăm sóc cây trồng ${task.name}`,
            `Xin chào ${user.username || user.email},
            
            Bạn có công việc "${
              task.type
            }" cần thực hiện lúc ${taskTime} cho cây "${
              plant.name
            }" tại vị trí "${location.name}".
            
            Chi tiết công việc: ${task.note || "Không có mô tả chi tiết"}
            
            Trân trọng,
            Hệ thống IoT Nông nghiệp`
          );
        }
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra công việc chăm sóc:", error);
    }
  }

  // Kiểm tra trạng thái thiết bị
  async checkDeviceStatus() {
    try {
      console.log("Đang kiểm tra trạng thái thiết bị...");

      const timeThreshold = new Date();
      timeThreshold.setHours(timeThreshold.getHours() - 4); // Thiết bị không có dữ liệu trong 4 giờ

      // Tìm các thiết bị ngoại tuyến
      const offlineDevices = await Device.find({
        $or: [
          { status: { $ne: "Hoạt động" }, last_seen: { $lt: timeThreshold } },
          { battery_level: { $lte: 20 } }, // Pin dưới 20%
        ],
      });

      console.log(`Tìm thấy ${offlineDevices.length} thiết bị cần thông báo`);

      for (const device of offlineDevices) {
        // Tìm location và người dùng liên quan
        const location = await Location.findOne({ _id: device.locationId });
        if (!location) continue;

        const season = await Season.findById(location.seasonId);
        if (!season) continue;

        const user = await User.findById(season.userId);
        if (!user) continue;

        // Kiểm tra xem đã có thông báo cho thiết bị này trong 4 giờ qua chưa
        const existingNotification = await Notification.findOne({
          "data.deviceId": device._id,
          type: "DEVICE_ALERT",
          created_at: { $gte: new Date(Date.now() - 4 * 60 * 60 * 1000) },
        });

        if (!existingNotification) {
          // Xác định loại thông báo
          let title, content;

          if (device.status !== "Hoạt động" && device.battery_level <= 20) {
            title = `Thiết bị ${device.name} ngoại tuyến và pin yếu`;
            content = `Thiết bị "${device.name}" tại vị trí "${location.name}" hiện đang ngoại tuyến và có pin yếu (${device.battery_level}%). Vui lòng kiểm tra thiết bị.`;
          } else if (device.status !== "Hoạt động") {
            title = `Thiết bị ${device.name} ngoại tuyến`;
            content = `Thiết bị "${device.name}" tại vị trí "${location.name}" hiện đang ngoại tuyến. Vui lòng kiểm tra kết nối.`;
          } else {
            title = `Pin thiết bị ${device.name} yếu`;
            content = `Thiết bị "${device.name}" tại vị trí "${location.name}" đang có mức pin yếu (${device.battery_level}%). Vui lòng sạc hoặc thay pin.`;
          }

          // Tạo thông báo
          const notification = new Notification({
            title,
            content,
            type: "DEVICE_ALERT",
            priority: "HIGH",
            recipients: [user._id.toString()],
            data: {
              deviceId: device._id,
              locationId: location._id,
              battery_level: device.battery_level,
              status: device.status,
            },
            read: false,
            created_at: new Date(),
            createdBy: user._id,
          });

          await notification.save();
          console.log(`Đã tạo thông báo cho thiết bị ${device.name}`);

          // Gửi email thông báo
          await sendEmailNotification(
            user.email,
            title,
            `Xin chào ${user.username || user.email},
            
            ${content}
            
            Trân trọng,
            Hệ thống IoT Nông nghiệp`
          );
        }
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra trạng thái thiết bị:", error);
    }
  }

  // Kiểm tra mùa vụ sắp kết thúc
  async checkSeasonEndingSoon() {
    try {
      console.log("Đang kiểm tra các mùa vụ sắp kết thúc...");

      const today = new Date();
      const twoWeeksLater = new Date(today);
      twoWeeksLater.setDate(twoWeeksLater.getDate() + 14); // Mùa vụ sắp kết thúc trong 2 tuần

      // Tìm các mùa vụ sắp kết thúc
      const endingSeasons = await Season.find({
        end_date: {
          $gte: today,
          $lte: twoWeeksLater,
        },
        status: { $ne: "Đã kết thúc" },
        is_archived: false,
      });

      console.log(`Tìm thấy ${endingSeasons.length} mùa vụ sắp kết thúc`);

      for (const season of endingSeasons) {
        // Tìm thông tin người dùng
        const user = await User.findById(season.userId);
        if (!user) continue;

        // Kiểm tra xem đã có thông báo cho mùa vụ này trong 3 ngày qua chưa
        const existingNotification = await Notification.findOne({
          "data.seasonId": season._id,
          type: "SEASON_ENDING",
          created_at: { $gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        });

        if (!existingNotification) {
          // Tính số ngày còn lại
          const daysLeft = Math.ceil(
            (season.end_date.getTime() - today.getTime()) /
              (1000 * 60 * 60 * 24)
          );

          // Tạo thông báo mới
          const notification = new Notification({
            title: `Mùa vụ "${season.name}" sắp kết thúc`,
            content: `Mùa vụ "${season.name}" của bạn sẽ kết thúc sau ${daysLeft} ngày nữa. Vui lòng kiểm tra và chuẩn bị lưu trữ dữ liệu mùa vụ.`,
            type: "SEASON_ENDING",
            priority: "MEDIUM",
            recipients: [user._id.toString()],
            data: {
              seasonId: season._id,
              daysLeft,
            },
            read: false,
            created_at: new Date(),
            createdBy: user._id,
          });

          await notification.save();
          console.log(`Đã tạo thông báo cho mùa vụ "${season.name}"`);

          // Gửi email thông báo
          await sendEmailNotification(
            user.email,
            `Mùa vụ "${season.name}" sắp kết thúc`,
            `Xin chào ${user.username || user.email},
            
            Mùa vụ "${
              season.name
            }" của bạn sẽ kết thúc sau ${daysLeft} ngày nữa (${season.end_date.toLocaleDateString(
              "vi-VN"
            )}).
            
            Vui lòng kiểm tra và chuẩn bị các thông tin sau:
            - Tổng sản lượng thu hoạch
            - Chất lượng sản phẩm
            - Chi phí và doanh thu
            - Bài học kinh nghiệm
            
            Hệ thống sẽ tự động lưu trữ dữ liệu mùa vụ sau khi kết thúc.
            
            Trân trọng,
            Hệ thống IoT Nông nghiệp`
          );
        }
      }
    } catch (error) {
      console.error("Lỗi khi kiểm tra mùa vụ sắp kết thúc:", error);
    }
  }
}

export default new SchedulerService();
