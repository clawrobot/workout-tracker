import { useEffect, useState } from "react";

type Workout = {
  id: number;
  name: string;
  createdAt: string;
};

const API_URL = import.meta.env.VITE_API_URL as string;

function App() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");

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

    const res = await fetch(`${API_URL}/workouts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });

    if (res.ok) {
      setNewName("");
      load(); // refresh list
    } else {
      console.error("Failed to add workout");
    }
  }

  return (
    <main className="min-h-screen grid place-items-center bg-gray-50">
      <section className="p-8 rounded-2xl shadow bg-white w-full max-w-xl">
        <h1 className="text-3xl font-bold">Workout Tracker</h1>
        <p className="mt-2 text-gray-600">Listing workouts from the API</p>

        <form onSubmit={addWorkout} className="mt-4 flex gap-2">
          <input
            className="border p-2 flex-1 rounded"
            placeholder="Workout name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Add
          </button>
        </form>

        {loading && <p className="mt-4">Loading…</p>}
        {error && <p className="mt-4 text-red-600">Error: {error}</p>}

        {!loading && !error && (
          <ul className="mt-4 space-y-2">
            {workouts.length === 0 ? (
              <li className="text-gray-500">No workouts yet.</li>
            ) : (
              workouts.map((w) => (
                <li key={w.id} className="border rounded p-3">
                  <div className="font-medium">{w.name}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(w.createdAt).toLocaleString()}
                  </div>
                </li>
              ))
            )}
          </ul>
        )}
      </section>
    </main>
  );
}

export default App;
