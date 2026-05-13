import Link from "next/link";

const navLinks = [
  { href: "/customer", label: "Dashboard" },
  { href: "/customer/posts", label: "My Posts" },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold">My Account</h1>
          <p className="text-sm text-gray-400 mt-1">Customer Portal</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block px-4 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <Link
            href="/"
            className="block px-4 py-2.5 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors text-sm"
          >
            &larr; Back to Store
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <header className="bg-white border-b px-8 py-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Customer</h2>
          <CustomerHeaderActions />
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

function CustomerHeaderActions() {
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-500">Logged in as Customer</span>
      <form action="/api/auth/logout" method="POST">
        <button
          type="submit"
          className="text-sm px-3 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
        >
          Logout
        </button>
      </form>
    </div>
  );
}
