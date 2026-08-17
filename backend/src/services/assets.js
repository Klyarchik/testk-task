const fs = require("fs");
const path = require("path");
const { minio, BUCKET } = require("../config/minio");

const MIME_TYPES = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

async function uploadBuiltinAssets() {
  const dir = path.join(__dirname, "../../assets/pepe");

  if (!fs.existsSync(dir)) {
    console.log("Assets directory does not exist:", dir);
    return;
  }

  const files = fs
    .readdirSync(dir)
    .filter((file) => {
      const extension = path.extname(file).toLowerCase();
      return MIME_TYPES[extension];
    });

  for (const file of files) {
    const filePath = path.join(dir, file);
    const objectName = `pepe/${file}`;
    const extension = path.extname(file).toLowerCase();
    const contentType = MIME_TYPES[extension];

    const data = fs.readFileSync(filePath);

    await minio.putObject(
      BUCKET,
      objectName,
      data,
      data.length,
      {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000",
      }
    );

    console.log(`Uploaded asset: ${objectName}`);
  }
}

module.exports = {
  uploadBuiltinAssets,
};