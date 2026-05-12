"use client";

import { useRouter } from "next/navigation";

export default function UserActions({ userId }: { userId: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Are you sure?")) return;
    await fetch(`/api/users/${userId}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleDelete}
        className="text-sm px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
      >
        Delete
      </button>
    </div>
  );
}
