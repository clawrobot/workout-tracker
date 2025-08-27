import { useState } from "react";

function App() {
  // state: a value that React remembers between renders
  const [count, setCount] = useState(0);

  return (
    <main className="min-h-screen grid place-items-center bg-gray-50">
      <section className="p-8 rounded-2xl shadow bg-white text-center">
        <h1 className="text-3xl font-bold">Workout Tracker</h1>
        <p className="mt-2 text-gray-600">Tailwind is working 🎉</p>

        {/* Counter example */}
        <p className="mt-4 text-lg">You clicked {count} times</p>
        <button
          onClick={() => setCount(count + 1)}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Click me
        </button>
      </section>
    </main>
  );
}

export default App;
