import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminPostActions from "./post-actions";

// SSR: dynamic = force-dynamic ensures fresh data every request (no caching)
export const dynamic = "force-dynamic";

export default async function AdminPostsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const session = token ? await verifyToken(token) : null;

  if (!session?.roles.includes("admin")) redirect("/login");

  const posts = await prisma.post.findMany({
    include: { author: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Posts</h1>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">SSR &middot; force-dynamic</span>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Author</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{post.title}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{post.author.name}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    post.published
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {post.published ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(post.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <AdminPostActions postId={post.id} published={post.published} />
                </td>
              </tr>
            ))}
            {posts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-400">No posts yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
