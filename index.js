const express = require("express");

const app = express();

const multer = require("multer");

const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const Storage = multer.diskStorage({
    destination: function (req, file, callback) {
      callback(null, "./attachments");
    },
    filename: function (req, file, callback) {
      callback(null, `${file.fieldname}_${Date.now()}_${file.originalname}`);
    },
  });

  const attachmentUpload = multer({
    storage: Storage,
  }).single("attachment");

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.use(express.static("public"));

app.get("/", (req, res) => {
    res.sendFile("/index.html");
})

app.post("/send_email", (req, res) => {
    attachmentUpload(req, res, (err) => {
        if (err) {
            console.log(err);
            return res.send("Error uploading file");
        } else {
            const recipient = req.body.email;
            const subject = req.body.subject;
            const message = req.body.message;
            const attachmentPath = req.file.path;
            console.log("recipient:", recipient);
            console.log("subject:", subject);
            console.log("message:", message);
            console.log("attachmentPath:", attachmentPath);
            console.log("Email sent successfully");
        }
    });
});
