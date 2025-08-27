import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { prisma } from "./db.js";
import { z } from "zod";

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

// List all workouts from the database
app.get("/workouts", async (_req, res) => {
    try {
        const workouts = await prisma.workout.findMany({
            orderBy: { createdAt: "desc" },
        });
        res.json(workouts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch workouts" });
    }
});

app.post("/workouts", async (req, res) => {
    // validate the body: { name: string }
    const Body = z.object({ name: z.string().min(1, "name is required") });

    const parsed = Body.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }

    try {
        const workout = await prisma.workout.create({
            data: { name: parsed.data.name },
        });
        res.status(201).json(workout);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create workout" });
    }
});

// read port from .env (fallback to 4000)
const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
});
