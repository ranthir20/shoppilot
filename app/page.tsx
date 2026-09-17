"use client";

import { UserButton } from "@clerk/nextjs";

import { useEffect, useState } from "react";

type DashboardData = {
  todaySales: number;
  todayOrders: number;
  pendingPayments: number;
  lowStock: number;
  recentSales: {
    id: number;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    createdAt: string;
  }[];
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>({
    todaySales: 0,
    todayOrders: 0,
    pendingPayments: 0,
    lowStock: 0,
    recentSales: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await fetch("/api/dashboard");
        const result = await response.json();

        if (response.ok) {
          setData(result);
        }
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r bg-white">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">ShopPilot</h1>
          <p className="mt-1 text-sm text-gray-500">
            Business made simple
          </p>
        </div>

        <nav className="space-y-2 px-4">
          <a
            href="/"
            className="block rounded-lg bg-gray-100 px-4 py-3 font-medium"
          >
            Dashboard
          </a>

          <a
            href="/products"
            className="block rounded-lg px-4 py-3 text-gray-600 hover:bg-gray-100"
          >
            Products
          </a>

          <a
            href="/inventory"
            className="block rounded-lg px-4 py-3 text-gray-600 hover:bg-gray-100"
          >
            Inventory
          </a>

          <a
            href="/customers"
            className="block rounded-lg px-4 py-3 text-gray-600 hover:bg-gray-100"
          >
            Customers
          </a>

          <a
            href="/sales"
            className="block rounded-lg px-4 py-3 text-gray-600 hover:bg-gray-100"
          >
            Sales
          </a>

          <a
            href="/payments"
            className="block rounded-lg px-4 py-3 text-gray-600 hover:bg-gray-100"
          >
            Payments
          </a>

          <a
            href="/ai"
            className="block rounded-lg px-4 py-3 text-gray-600 hover:bg-gray-100"
          >
            AI Assistant
          </a>
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

      <section className="ml-64 p-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Dashboard
          </h2>

          <p className="mt-1 text-gray-500">
            Overview of your store.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-4 gap-5">
          <div className="rounded-xl border bg-white p-6">
            <p className="text-sm text-gray-500">
              Today&apos;s Sales
            </p>

            <p className="mt-2 text-2xl font-bold">
              {loading
                ? "..."
                : `₹${data.todaySales.toLocaleString("en-IN")}`}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6">
            <p className="text-sm text-gray-500">
              Orders Today
            </p>

            <p className="mt-2 text-2xl font-bold">
              {loading ? "..." : data.todayOrders}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6">
            <p className="text-sm text-gray-500">
              Pending Payments
            </p>

            <p className="mt-2 text-2xl font-bold text-red-600">
              {loading
                ? "..."
                : `₹${data.pendingPayments.toLocaleString("en-IN")}`}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6">
            <p className="text-sm text-gray-500">
              Low Stock
            </p>

            <p className="mt-2 text-2xl font-bold text-orange-600">
              {loading ? "..." : data.lowStock}
            </p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-6">
          <div className="rounded-xl border bg-white">
            <div className="border-b p-6">
              <h3 className="text-lg font-semibold">
                Recent Sales
              </h3>
            </div>

            {loading ? (
              <div className="p-8 text-center text-gray-500">
                Loading...
              </div>
            ) : data.recentSales.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No sales yet.
              </div>
            ) : (
              <div>
                {data.recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between border-b px-6 py-4 last:border-0"
                  >
                    <div>
                      <p className="font-medium">
                        Sale #{sale.id}
                      </p>

                      <p className="text-sm text-gray-500">
                        {new Date(
                          sale.createdAt
                        ).toLocaleString("en-IN")}
                      </p>
                    </div>

                    <p className="font-semibold">
                      ₹{sale.totalAmount.toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-white">
            <div className="border-b p-6">
              <h3 className="text-lg font-semibold">
                Quick Actions
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 p-6">
              <a
                href="/products"
                className="rounded-lg border p-5 hover:bg-gray-50"
              >
                <p className="font-semibold">Add Product</p>
                <p className="mt-1 text-sm text-gray-500">
                  Add a new product to inventory.
                </p>
              </a>

              <a
                href="/customers"
                className="rounded-lg border p-5 hover:bg-gray-50"
              >
                <p className="font-semibold">Add Customer</p>
                <p className="mt-1 text-sm text-gray-500">
                  Save a customer&apos;s details.
                </p>
              </a>

              <a
                href="/sales"
                className="rounded-lg border p-5 hover:bg-gray-50"
              >
                <p className="font-semibold">Create Sale</p>
                <p className="mt-1 text-sm text-gray-500">
                  Record a new sale.
                </p>
              </a>

              <a
                href="/payments"
                className="rounded-lg border p-5 hover:bg-gray-50"
              >
                <p className="font-semibold">Record Payment</p>
                <p className="mt-1 text-sm text-gray-500">
                  Collect a customer&apos;s due.
                </p>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-xl bg-black p-8 text-white">
          <h3 className="text-xl font-semibold">
            AI Assistant
          </h3>

          <p className="mt-2 text-gray-300">
            Ask ShopPilot about your sales, inventory,
            customers, and business performance.
          </p>

          <button className="mt-5 rounded-lg bg-white px-5 py-3 font-medium text-black">
            Coming Soon
          </button>
        </div>
      </section>
    </main>
  );
}
