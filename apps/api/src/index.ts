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

// Delete a workout by id
app.delete("/workouts/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: "Invalid id" });
    }
    try {
        await prisma.workout.delete({ where: { id } });
        res.status(204).send(); // no content
    } catch (err: any) {
        // If id doesn't exist, Prisma throws
        console.error(err);
        return res.status(404).json({ error: "Workout not found" });
    }
});

// List exercises for a workout
app.get("/workouts/:id/exercises", async (req, res) => {
    const workoutId = Number(req.params.id);
    if (!Number.isInteger(workoutId) || workoutId <= 0) {
        return res.status(400).json({ error: "Invalid workout id" });
    }
    try {
        const exercises = await prisma.exercise.findMany({
            where: { workoutId },
            orderBy: { createdAt: "desc" },
        });
        res.json(exercises);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch exercises" });
    }
});

// Create an exercise under a workout
app.post("/workouts/:id/exercises", async (req, res) => {
    const workoutId = Number(req.params.id);
    if (!Number.isInteger(workoutId) || workoutId <= 0) {
        return res.status(400).json({ error: "Invalid workout id" });
    }

    const Body = z.object({ name: z.string().min(1, "name is required") });
    const parsed = Body.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }

    try {
        const exercise = await prisma.exercise.create({
            data: { name: parsed.data.name, workoutId },
        });
        res.status(201).json(exercise);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create exercise" });
    }
});

// List sets for an exercise
app.get("/exercises/:id/sets", async (req, res) => {
    const exerciseId = Number(req.params.id);
    if (!Number.isInteger(exerciseId) || exerciseId <= 0) {
        return res.status(400).json({ error: "Invalid exercise id" });
    }
    try {
        const sets = await prisma.set.findMany({
            where: { exerciseId },
            orderBy: { createdAt: "desc" },
        });
        res.json(sets);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch sets" });
    }
});

// Create a set under an exercise
app.post("/exercises/:id/sets", async (req, res) => {
    const exerciseId = Number(req.params.id);
    if (!Number.isInteger(exerciseId) || exerciseId <= 0) {
        return res.status(400).json({ error: "Invalid exercise id" });
    }

    const Body = z.object({
        reps: z.number().int().positive(),
        weight: z.number().nonnegative(),
    });

    const parsed = Body.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.flatten() });
    }

    try {
        const set = await prisma.set.create({
            data: { ...parsed.data, exerciseId },
        });
        res.status(201).json(set);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create set" });
    }
});


// read port from .env (fallback to 4000)
const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
});
