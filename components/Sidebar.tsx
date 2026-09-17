"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r bg-white">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900">ShopPilot</h1>
        <p className="mt-1 text-sm text-gray-500">
          Business made simple
        </p>
      </div>

      <nav className="space-y-2 px-4">
        <Link
          href="/"
          className="block rounded-lg px-4 py-3 text-gray-600 hover:bg-gray-100"
        >
          Dashboard
        </Link>

        <Link
          href="/products"
          className="block rounded-lg px-4 py-3 text-gray-600 hover:bg-gray-100"
        >
          Products
        </Link>

        <Link
          href="/inventory"
          className="block rounded-lg px-4 py-3 text-gray-600 hover:bg-gray-100"
        >
          Inventory
        </Link>

        <Link
          href="/customers"
          className="block rounded-lg px-4 py-3 text-gray-600 hover:bg-gray-100"
        >
          Customers
        </Link>

        <Link
          href="/sales"
          className="block rounded-lg px-4 py-3 text-gray-600 hover:bg-gray-100"
        >
          Sales
        </Link>

        <Link
          href="/payments"
          className="block rounded-lg px-4 py-3 text-gray-600 hover:bg-gray-100"
        >
          Payments
        </Link>

        <Link
          href="/ai"
          className="block rounded-lg px-4 py-3 text-gray-600 hover:bg-gray-100"
        >
          AI Assistant
        </Link>
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
  );
}
