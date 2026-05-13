"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Post {
  id: string;
  title: string;
  content: string | null;
  published: boolean;
  createdAt: string;
}

export default function CustomerPostsPage() {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  // CSR + SWR: data fetched on the client with caching + auto-revalidation
  const { data: posts, isLoading, error, mutate } = useSWR<Post[]>("/api/posts", fetcher);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    setDeleting(id);
    await fetch(`/api/posts/${id}`, { method: "DELETE" });
    mutate();
    setDeleting(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">My Posts</h1>
          <span className="text-xs text-gray-400">CSR + SWR &middot; client-side data fetching with cache revalidation</span>
        </div>
        <Link
          href="/customer/posts/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors"
        >
          New Post
        </Link>
      </div>

      {isLoading && <p className="text-gray-500">Loading...</p>}
      {error && <p className="text-red-500">{error.message}</p>}

      {posts && posts.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>No posts yet.</p>
          <Link href="/customer/posts/new" className="text-blue-600 hover:underline text-sm mt-2 inline-block">Create your first post</Link>
        </div>
      )}

      {posts && posts.length > 0 && (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="border rounded-lg p-5 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{post.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    post.published
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {post.published ? "Published" : "Draft"}
                  </span>
                </div>
                {post.content && (
                  <p className="text-sm text-gray-500 line-clamp-2">{post.content}</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(post.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link
                  href={`/customer/posts/${post.id}/edit`}
                  className="text-sm px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  Edit
                </Link>
                <button
                  onClick={() => handleDelete(post.id)}
                  disabled={deleting === post.id}
                  className="text-sm px-3 py-1.5 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                >
                  {deleting === post.id ? "..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
