// express module
const express = require("express");
// create an express application
const app = express();

// import multer
const multer = require("multer");

//project will run on port 3000
const PORT = 3000;

// use static pages from the "public" directory
app.use(express.static("public"));

// body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// setting up dotenv to store credentials
require("dotenv").config();

// import nodemailer module
const nodemailer = require("nodemailer")

// import the node file system module
const fs = require("fs")

// Google APIs
const { google } = require("googleapis");

const OAuth2 = google.auth.OAuth2;


// setting transporter
const createTransporter = async () => {
  // connect to oauth playground
  const oauth2Client = new OAuth2(
    process.env.OAUTH_CLIENT_ID,
    process.env.OAUTH_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  );

  // add refresh token to the oauth2 connection
  oauth2Client.setCredentials({
    refresh_token: process.env.OAUTH_REFRESH_TOKEN,
  });

  // create access token
  const accessToken = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) {
        reject("Failed to create access token :( " + err);
      }
      resolve(token);
    });
  });

  // send mail method
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.SENDER_EMAIL,
      accessToken,
      clientId: process.env.OAUTH_CLIENT_ID,
      clientSecret: process.env.OAUTH_CLIENT_SECRET,
      refreshToken: process.env.OAUTH_REFRESH_TOKEN,
    },
  });

  return transporter;
};


//multer file storage
const Storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./attachments");
  },
  filename: function (req, file, callback) {
    callback(null, `${file.fieldname}_${Date.now()}_${file.originalname}`);
  },
});


// middleware to get attachments
const attachmentUpload = multer({
  storage: Storage,
}).single("attachment");

// routes

// homepage
app.get("/", (req, res) => {
  res.sendFile("/index.html");
})

// route to handle sending emails
app.post("/send_email", (req, res) => {
  attachmentUpload(req, res, async function (error) {
    if (error) {
      return res.send("Error uploading file");
    } else {
      // obtain form data from req body
      const recipient = req.body.email;
      const mailSubject = req.body.subject;
      const mailBody = req.body.message;
      const attachmentPath = req.file?.path;

      let mailOptions = {
        from: process.env.SENDER_EMAIL,
        to: recipient,
        subject: mailSubject,
        text: mailBody,
        attachments: [
          {
            path: attachmentPath,
          },
        ],
      };

      try {
        // wait for createTransport
        let emailTransporter = await createTransporter();

        // send email
        emailTransporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email sent: " + info.response);

            // delete attachment from local file system
            fs.unlink(attachmentPath, function(err) {
              if(err) {
                return res.end(err);
              }
              else {
                console.log(attachmentPath + "has been deleted");

                // redirect to success page
                return res.redirect("/success.html");
              }
            })
          }
        });
      } catch (error) {
        return console.log(error);
      }
    }
  });
});

// triggered when the port 3000 is visited
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
