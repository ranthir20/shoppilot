"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/inventory", label: "Inventory" },
  { href: "/customers", label: "Customers" },
  { href: "/sales", label: "Sales" },
  { href: "/reports", label: "Reports" },
  { href: "/returns", label: "Returns" },
  { href: "/payments", label: "Payments" },
  { href: "/ai", label: "AI Assistant" },
];

export default function Sidebar() {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-64 flex-col border-r bg-white md:flex">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">ShopPilot</h1>
          <p className="mt-1 text-sm text-gray-500">
            Business made simple
          </p>
        </div>

        <nav className="space-y-2 px-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-lg px-4 py-3 text-gray-600 hover:bg-gray-100"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t bg-white p-4">
          <div className="flex items-center gap-3">
            <UserButton />
            <span className="text-sm font-medium text-gray-700">
              My Account
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile navigation */}
      <header className="sticky top-0 z-50 border-b bg-white md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">ShopPilot</h1>
            <p className="text-xs text-gray-500">Business made simple</p>
          </div>

          <UserButton />
        </div>

        <nav className="flex gap-2 overflow-x-auto px-4 pb-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="shrink-0 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}
