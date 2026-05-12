"use client";

import { useCounterStore } from "@/stores/counter-store";

export default function Counter() {
  const { count, increment, decrement, reset } = useCounterStore();

  return (
    <div className="flex flex-col items-center gap-6">
      <span className="text-6xl font-bold tabular-nums">{count}</span>
      <div className="flex gap-3">
        <button
          onClick={decrement}
          className="px-5 py-2.5 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors"
        >
          Decrement
        </button>
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
        >
          Reset
        </button>
        <button
          onClick={increment}
          className="px-5 py-2.5 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition-colors"
        >
          Increment
        </button>
      </div>
    </div>
  );
}
