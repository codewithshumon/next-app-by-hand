"use client";

import { useRouter } from "next/navigation";

export default function AdminPostActions({ postId, published }: { postId: string; published: boolean }) {
  const router = useRouter();

  const handleTogglePublish = async () => {
    await fetch(`/api/posts/${postId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !published }),
    });
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm("Delete this post?")) return;
    await fetch(`/api/posts/${postId}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleTogglePublish}
        className={`text-sm px-3 py-1 rounded transition-colors ${
          published
            ? "text-yellow-600 hover:bg-yellow-50"
            : "text-green-600 hover:bg-green-50"
        }`}
      >
        {published ? "Unpublish" : "Publish"}
      </button>
      <button
        onClick={handleDelete}
        className="text-sm px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
      >
        Delete
      </button>
    </div>
  );
}
