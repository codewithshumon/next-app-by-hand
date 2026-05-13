"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/posts/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((post) => {
        setTitle(post.title);
        setContent(post.content ?? "");
        setPublished(post.published);
      })
      .catch(() => setError("Post not found"))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const res = await fetch(`/api/posts/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, published }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to update post");
      setSubmitting(false);
      return;
    }

    router.push("/customer/posts");
  };

  if (loading) return <p className="text-gray-500">Loading...</p>;
  if (error && !title) return <p className="text-red-500">{error}</p>;

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Post</h1>
        <span className="text-xs text-gray-400">CSR &middot; client-side fetch + submit</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-y"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="published"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="rounded"
          />
          <label htmlFor="published" className="text-sm text-gray-700">Published</label>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
