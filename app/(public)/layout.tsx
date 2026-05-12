"use client";

import Link from "next/link";
import { useAuthStore } from "@/stores/auth-store";
import { useEffect } from "react";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, fetchUser } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Store
          </Link>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                {user?.roles.includes("admin") && (
                  <Link
                    href="/admin"
                    className="text-sm px-3 py-1.5 bg-gray-900 text-white rounded hover:bg-gray-700 transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <Link href="/profile" className="text-sm text-gray-600 hover:text-gray-900">
                  Profile
                </Link>
                <button
                  onClick={() => useAuthStore.getState().logout()}
                  className="text-sm px-3 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-white border-t py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          Next App By Hand &mdash; Prisma 7 + Zustand + Next.js 16
        </div>
      </footer>
    </div>
  );
}
