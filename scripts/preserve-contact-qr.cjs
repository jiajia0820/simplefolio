const fs = require("node:fs");
const path = require("node:path");

// Keep the contact QR out of Parcel's lossy JPEG optimization.
fs.copyFileSync(
  path.resolve(__dirname, "../src/assets/media/wechat-contact.jpg"),
  path.resolve(__dirname, "../dist/assets/media/wechat-contact.jpg")
);
