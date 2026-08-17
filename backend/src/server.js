require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const prisma = require("./db");
const routes = require("./routes");
const { ensureBucket } = require("./config/minio");
const { uploadBuiltinAssets } = require("./services/assets");

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.json({ name: "Pepe Hype Empire API", status: "ok" });
});

app.use("/api", routes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = Number(process.env.PORT || 3000);

async function start() {
  await prisma.$connect();
  await ensureBucket();
  await uploadBuiltinAssets();

  server.listen(PORT, () => {
    console.log(`🐸 Pepe Hype Empire API: http://localhost:${PORT}`);
    console.log(`🪣 MinIO bucket: ${process.env.MINIO_BUCKET || "pepe-hype-assets"}`);
  });
}

start().catch((error) => {
  console.error("Startup failed:", error);
  process.exit(1);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
