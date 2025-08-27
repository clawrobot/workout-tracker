import { useEffect, useState } from "react";

function Spinner({ size = 16 }: { size?: number }) {
  const px = `${size}px`;
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 24 24"
      className="animate-spin"
      aria-label="loading"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        className="opacity-25"
        fill="none"
      />
      <path
        d="M4 12a8 8 0 0 1 8-8"
        stroke="currentColor"
        strokeWidth="4"
        className="opacity-90"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}


type Workout = {
  id: number;
  name: string;
  createdAt: string;
};

const API_URL = import.meta.env.VITE_API_URL as string;

function App() {
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  function showToast(type: "success" | "error", msg: string, ms = 2500) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), ms);
  }

  type Exercise = {
    id: number;
    name: string;
    createdAt: string;
    workoutId: number;
  };
  type SetRow = {
    id: number;
    reps: number;
    weight: number;
    createdAt: string;
    exerciseId: number;
  };
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [addingWorkout, setAddingWorkout] = useState(false);

  const [setsByExercise, setSetsByExercise] = useState<Record<number, SetRow[]>>({});
  const [setInputs, setSetInputs] = useState<Record<number, { reps: string; weight: string }>>({});
  const [openWorkoutId, setOpenWorkoutId] = useState<number | null>(null);
  const [exercises, setExercises] = useState<Record<number, Exercise[]>>({});
  const [newExerciseName, setNewExerciseName] = useState("");


  async function load() {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/workouts`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Workout[];
      setWorkouts(data);
    } catch (err: any) {
      setError(err.message ?? "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addWorkout(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    setAddingWorkout(true);
    try {
      const res = await fetch(`${API_URL}/workouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (res.ok) {
        setNewName("");
        showToast("success", "Workout added");
        await load();
      } else {
        showToast("error", "Failed to add workout");
      }


    } finally {
      setAddingWorkout(false);
    }
  }

  async function deleteWorkout(id: number) {
    const toDelete = workouts.find((w) => w.id === id);
    const name = toDelete ? toDelete.name : "this workout";

    if (!confirm(`Delete "${name}"? This will remove its exercises too.`)) {
      return;
    }

    const res = await fetch(`${API_URL}/workouts/${id}`, { method: "DELETE" });
    if (res.ok) {
      setWorkouts((prev) => prev.filter((w) => w.id !== id));
      showToast("success", "Workout deleted");
    } else {
      showToast("error", `Failed to delete (HTTP ${res.status})`);
    }
  }


  async function loadExercises(workoutId: number) {
    const res = await fetch(`${API_URL}/workouts/${workoutId}/exercises`);
    if (!res.ok) throw new Error("Failed to load exercises");
    const data = (await res.json()) as Exercise[];
    setExercises((prev) => ({ ...prev, [workoutId]: data }));
  }

  async function addExercise(workoutId: number, e: React.FormEvent) {
    e.preventDefault();
    if (!newExerciseName.trim()) return;
    const res = await fetch(`${API_URL}/workouts/${workoutId}/exercises`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newExerciseName }),
    });
    if (res.ok) {
      setNewExerciseName("");
      showToast("success", "Exercise added");
      await loadExercises(workoutId);
    } else {
      showToast("error", "Failed to add exercise");
    }

  }

  async function loadSets(exerciseId: number) {
    const res = await fetch(`${API_URL}/exercises/${exerciseId}/sets`);
    if (!res.ok) throw new Error("Failed to load sets");
    const data = (await res.json()) as SetRow[];
    setSetsByExercise((prev) => ({ ...prev, [exerciseId]: data }));
  }

  async function addSet(exerciseId: number, e: React.FormEvent) {
    e.preventDefault();
    const inputs = setInputs[exerciseId] ?? { reps: "", weight: "" };
    const reps = Number(inputs.reps);
    const weight = Number(inputs.weight);
    if (!Number.isFinite(reps) || reps <= 0) return showToast("error", "Reps must be a positive number");
    if (!Number.isFinite(weight) || weight < 0) return showToast("error", "Weight must be 0 or more");

    const res = await fetch(`${API_URL}/exercises/${exerciseId}/sets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reps, weight }),
    });

    if (res.ok) {
      // clear inputs and refresh
      setSetInputs((prev) => ({ ...prev, [exerciseId]: { reps: "", weight: "" } }));
      showToast("success", "Set added");
      await loadSets(exerciseId);
    } else {
      showToast("error", "Failed to add set");
    }
  }


  function toggleWorkout(id: number) {
    const next = openWorkoutId === id ? null : id;
    setOpenWorkoutId(next);
    if (next) loadExercises(next).catch(console.error);
  }


  return (
    <main className="min-h-screen grid place-items-center bg-gray-50">
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`rounded px-4 py-2 shadow text-white ${toast.type === "success" ? "bg-green-600" : "bg-red-600"
              }`}
          >
            {toast.msg}
          </div>
        </div>
      )}

      <section className="p-8 rounded-2xl shadow bg-white w-full max-w-xl">
        <h1 className="text-3xl font-bold">Evan's Gym Workout Tracker</h1>
        <p className="mt-2 text-gray-600">Listing workouts from the API</p>

        <form onSubmit={addWorkout} className="mt-4 flex gap-2">
          <input
            className="border p-2 flex-1 rounded"
            placeholder="Workout name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            disabled={addingWorkout}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={addingWorkout}
          >
            {addingWorkout ? (
              <>
                <Spinner size={16} />
                Adding…
              </>
            ) : (
              "Add"
            )}
          </button>

        </form>


        {loading && (
          <div className="mt-4 flex items-center gap-2 text-gray-600">
            <Spinner />
            <span>Loading…</span>
          </div>
        )}

        {error && <p className="mt-4 text-red-600">Error: {error}</p>}

        {!loading && !error && (
          <ul className="mt-4 space-y-2">
            {workouts.length === 0 ? (
              <li className="text-gray-500">No workouts yet.</li>
            ) : (
              workouts.map((w) => {
                const isOpen = openWorkoutId === w.id;
                const list = exercises[w.id] ?? [];

                return (
                  <li key={w.id} className="border rounded p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{w.name}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(w.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleWorkout(w.id)}
                          className="border px-3 py-1 rounded"
                        >
                          {isOpen ? "Hide" : "View"} exercises
                        </button>
                        <button
                          onClick={() => deleteWorkout(w.id)}
                          className="text-red-600 hover:bg-red-50 border border-red-200 px-3 py-1 rounded"
                          aria-label={`Delete ${w.name}`}
                          title="Delete"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="mt-3 border-t pt-3">
                        <form
                          onSubmit={(e) => addExercise(w.id, e)}
                          className="flex gap-2 mb-3"
                        >
                          <input
                            className="border p-2 flex-1 rounded"
                            placeholder="Exercise name (e.g., Squat)"
                            value={newExerciseName}
                            onChange={(e) => setNewExerciseName(e.target.value)}
                          />
                          <button
                            type="submit"
                            className="bg-blue-600 text-white px-4 py-2 rounded"
                          >
                            Add
                          </button>
                        </form>

                        {list.length === 0 ? (
                          <p className="text-sm text-gray-500">No exercises yet.</p>
                        ) : (
                          <ul className="space-y-2">
                            {list.map((ex) => (
                              <li key={ex.id} className="p-2 border rounded">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium">{ex.name}</div>
                                    <div className="text-xs text-gray-500">{new Date(ex.createdAt).toLocaleString()}</div>
                                  </div>
                                  <button
                                    className="border px-2 py-1 rounded text-sm"
                                    onClick={() => loadSets(ex.id)}
                                    title="Refresh sets"
                                  >
                                    Refresh sets
                                  </button>
                                </div>

                                {/* Add-set form */}
                                <form
                                  onSubmit={(e) => addSet(ex.id, e)}
                                  className="mt-2 flex items-center gap-2 text-sm"
                                >
                                  <input
                                    className="border p-2 rounded w-24"
                                    placeholder="Reps"
                                    inputMode="numeric"
                                    value={(setInputs[ex.id]?.reps ?? "")}
                                    onChange={(e) =>
                                      setSetInputs((prev) => ({
                                        ...prev,
                                        [ex.id]: { reps: e.target.value, weight: prev[ex.id]?.weight ?? "" },
                                      }))
                                    }
                                  />
                                  <input
                                    className="border p-2 rounded w-28"
                                    placeholder="Weight"
                                    inputMode="decimal"
                                    value={(setInputs[ex.id]?.weight ?? "")}
                                    onChange={(e) =>
                                      setSetInputs((prev) => ({
                                        ...prev,
                                        [ex.id]: { reps: prev[ex.id]?.reps ?? "", weight: e.target.value },
                                      }))
                                    }
                                  />
                                  <button type="submit" className="bg-blue-600 text-white px-3 py-2 rounded">
                                    Add set
                                  </button>
                                </form>

                                {/* Sets list */}
                                <ul className="mt-2 space-y-1">
                                  {(setsByExercise[ex.id] ?? []).length === 0 ? (
                                    <li className="text-xs text-gray-500">No sets yet.</li>
                                  ) : (
                                    (setsByExercise[ex.id] ?? []).map((s) => (
                                      <li key={s.id} className="text-sm flex items-center justify-between border rounded p-2">
                                        <span>
                                          <span className="font-medium">{s.reps}</span> reps @{" "}
                                          <span className="font-medium">{s.weight}</span>
                                        </span>
                                        <span className="text-xs text-gray-500">
                                          {new Date(s.createdAt).toLocaleTimeString()}
                                        </span>
                                      </li>
                                    ))
                                  )}
                                </ul>
                              </li>

                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </li>
                );
              })
            )}
          </ul>

        )}
      </section>
    </main>
  );
}

export default App;
