const Minio = require("minio");

const minio = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || "localhost",
  port: Number(process.env.MINIO_PORT || 9000),
  useSSL: String(process.env.MINIO_USE_SSL).toLowerCase() === "true",
  accessKey: process.env.MINIO_ACCESS_KEY || "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY || "minioadmin"
});

const BUCKET = process.env.MINIO_BUCKET || "pepe-hype-assets";

async function ensureBucket() {
  const exists = await minio.bucketExists(BUCKET);
  if (!exists) {
    await minio.makeBucket(BUCKET, "us-east-1");
  }

  const policy = {
    Version: "2012-10-17",
    Statement: [{
      Effect: "Allow",
      Principal: { AWS: ["*"] },
      Action: ["s3:GetObject"],
      Resource: [`arn:aws:s3:::${BUCKET}/*`]
    }]
  };

  await minio.setBucketPolicy(BUCKET, JSON.stringify(policy));
}

function publicUrl(objectName) {
  const protocol = process.env.MINIO_USE_SSL === "true" ? "https" : "http";
  return `${protocol}://${process.env.MINIO_ENDPOINT || "localhost"}:${process.env.MINIO_PORT || 9000}/${BUCKET}/${objectName}`;
}

module.exports = { minio, BUCKET, ensureBucket, publicUrl };
