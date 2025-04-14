import bodyParser from "body-parser";
import express from "express";
import predictService from "./services/image_predict";
import fileUploadRouter from "./handler/file_upload";

export const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use("/", fileUploadRouter);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

async () => {
  try {
    await predictService.loadModel();
  } catch (error) {
    console.error("Lỗi khi khởi tạo model:", error);
  }
};

app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
