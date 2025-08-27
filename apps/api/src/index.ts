import dotenv from "dotenv";
import express from "express";
import cors from "cors";

dotenv.config();

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// simple health check route
app.get("/health", (_req, res) => {
    res.json({
        ok: true,
        service: "api",
        timestamp: new Date().toISOString(),
    });
});

// read port from .env (fallback to 4000)
const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
});
