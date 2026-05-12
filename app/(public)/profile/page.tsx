"use client";

import { useAuthStore } from "@/stores/auth-store";

export default function ProfilePage() {
  const { user } = useAuthStore();

  if (!user) {
    return <div className="max-w-4xl mx-auto px-4 py-16 text-center text-gray-500">Please log in</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">My Profile</h1>
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold text-lg mb-4">Account Info</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Name</p>
            <p className="font-medium">{user.name}</p>
          </div>
          <div>
            <p className="text-gray-500">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-gray-500">Roles</p>
            <p className="font-medium">{user.roles.join(", ")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
