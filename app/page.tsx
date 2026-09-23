"use client";

import { UserButton } from "@clerk/nextjs";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

type DashboardData = {
  todaySales: number;
  todayOrders: number;
  pendingPayments: number;
  lowStock: number;
  lowStockProducts: {
    id: number;
    name: string;
    stock: number;
  }[];
  outOfStockProducts: {
    id: number;
    name: string;
    stock: number;
  }[];
  totalRefunds: number;
  returns: {
    id: number;
    totalAmount: number;
    createdAt: string;
  }[];
  recentSales: {
    id: number;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    createdAt: string;
  }[];
  salesTrend: {
    date: string;
    amount: number;
    orders: number;
  }[];
  bestSellingProducts: {
    name: string;
    quantity: number;
    revenue: number;
  }[];
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>({
    todaySales: 0,
    todayOrders: 0,
    pendingPayments: 0,
    lowStock: 0,
    lowStockProducts: [],
    outOfStockProducts: [],
    totalRefunds: 0,
    returns: [],
    recentSales: [],
    salesTrend: [],
    bestSellingProducts: [],
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
      <Sidebar />

      <section className="md:ml-64 p-4 md:p-8">
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

          <div className="rounded-xl border bg-white p-6">
            <p className="text-sm text-gray-500">
              Total Refunds
            </p>

            <p className="mt-2 text-2xl font-bold text-purple-600">
              {loading
                ? "..."
                : `₹${data.totalRefunds.toLocaleString("en-IN")}`}
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border bg-white p-6">
          <div>
            <h3 className="text-lg font-semibold">Sales Trend</h3>
            <p className="mt-1 text-sm text-gray-500">
              Sales performance over the last 7 days.
            </p>
          </div>

          <div className="mt-6 flex h-64 items-end gap-3">
            {data.salesTrend.map((day) => {
              const maxAmount = Math.max(
                ...data.salesTrend.map((item) => item.amount),
                1
              );

              const height =
                day.amount === 0
                  ? 4
                  : Math.max((day.amount / maxAmount) * 100, 8);

              return (
                <div
                  key={day.date}
                  className="flex h-full flex-1 flex-col items-center justify-end"
                >
                  <p className="mb-2 text-xs font-medium text-gray-700">
                    ₹{day.amount.toLocaleString("en-IN")}
                  </p>

                  <div
                    className="w-full rounded-t-lg bg-black transition-all"
                    style={{ height: `${height}%` }}
                    title={`${day.orders} order${
                      day.orders === 1 ? "" : "s"
                    }`}
                  />

                  <p className="mt-2 text-xs text-gray-500">
                    {new Date(day.date).toLocaleDateString("en-IN", {
                      weekday: "short",
                    })}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-white p-6">
            <h3 className="text-lg font-semibold">Top Products</h3>
            <p className="mt-1 text-sm text-gray-500">
              Best-selling products by quantity.
            </p>

            <div className="mt-5 space-y-4">
              {loading ? (
                <p className="text-sm text-gray-500">Loading...</p>
              ) : data.bestSellingProducts.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No product sales yet.
                </p>
              ) : (
                data.bestSellingProducts.map((product, index) => (
                  <div
                    key={`${product.name}-${index}`}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold">
                        {index + 1}
                      </div>

                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-500">
                          {product.quantity}{" "}
                          {product.quantity === 1 ? "unit" : "units"} sold
                        </p>
                      </div>
                    </div>

                    <p className="font-semibold">
                      ₹{product.revenue.toLocaleString("en-IN")}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-white p-6">
            <h3 className="text-lg font-semibold">Business Snapshot</h3>
            <p className="mt-1 text-sm text-gray-500">
              Current payment and inventory position.
            </p>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                <span className="text-sm text-gray-600">
                  Pending Payments
                </span>
                <span className="font-semibold">
                  ₹{data.pendingPayments.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                <span className="text-sm text-gray-600">
                  Low Stock Products
                </span>
                <span className="font-semibold text-orange-600">
                  {data.lowStock}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                <span className="text-sm text-gray-600">
                  Total Refunds
                </span>
                <span className="font-semibold text-purple-600">
                  ₹{data.totalRefunds.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-xl border bg-white p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Stock Alerts</h3>
              <p className="mt-1 text-sm text-gray-500">
                Products that need inventory attention.
              </p>
            </div>

            <a
              href="/inventory"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              View Inventory →
            </a>
          </div>

          {data.outOfStockProducts.length === 0 &&
          data.lowStockProducts.length === 0 ? (
            <div className="mt-5 rounded-lg bg-green-50 p-4 text-sm text-green-700">
              All products have healthy stock levels.
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              {data.outOfStockProducts.map((product) => (
                <div
                  key={`out-${product.id}`}
                  className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {product.name}
                    </p>
                    <p className="mt-1 text-sm text-red-600">
                      Out of stock
                    </p>
                  </div>

                  <span className="font-bold text-red-600">
                    0
                  </span>
                </div>
              ))}

              {data.lowStockProducts.map((product) => (
                <div
                  key={`low-${product.id}`}
                  className="flex items-center justify-between rounded-lg border border-orange-200 bg-orange-50 p-4"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {product.name}
                    </p>
                    <p className="mt-1 text-sm text-orange-600">
                      Low stock
                    </p>
                  </div>

                  <span className="font-bold text-orange-600">
                    {product.stock}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-semibold">Quick Actions</h3>

          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <a
              href="/sales"
              className="rounded-xl border bg-white p-5 transition hover:border-black hover:shadow-sm"
            >
              <p className="font-semibold">New Sale</p>
              <p className="mt-1 text-sm text-gray-500">
                Create a new customer sale
              </p>
            </a>

            <a
              href="/products"
              className="rounded-xl border bg-white p-5 transition hover:border-black hover:shadow-sm"
            >
              <p className="font-semibold">Add Product</p>
              <p className="mt-1 text-sm text-gray-500">
                Add products to your store
              </p>
            </a>

            <a
              href="/customers"
              className="rounded-xl border bg-white p-5 transition hover:border-black hover:shadow-sm"
            >
              <p className="font-semibold">Add Customer</p>
              <p className="mt-1 text-sm text-gray-500">
                Manage your customers
              </p>
            </a>

            <a
              href="/inventory"
              className="rounded-xl border bg-white p-5 transition hover:border-black hover:shadow-sm"
            >
              <p className="font-semibold">Manage Inventory</p>
              <p className="mt-1 text-sm text-gray-500">
                Check and adjust stock
              </p>
            </a>
          </div>
        </div>

        <div className="mt-8">
          <div className="rounded-xl border bg-white">
            <div className="border-b p-6">
              <h3 className="text-lg font-semibold">
                Recent Returns
              </h3>
            </div>

            <div className="divide-y">
              {loading ? (
                <p className="p-6 text-gray-500">Loading...</p>
              ) : data.returns.length === 0 ? (
                <p className="p-6 text-gray-500">No returns yet.</p>
              ) : (
                data.returns.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-6"
                  >
                    <div>
                      <p className="font-medium">
                        Return #{item.id}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>

                    <p className="font-semibold text-purple-600">
                      ₹{item.totalAmount.toLocaleString("en-IN")}
                    </p>
                  </div>
                ))
              )}
            </div>
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

          <a
            href="/ai"
            className="mt-5 inline-block rounded-lg bg-white px-5 py-3 font-medium text-black transition hover:bg-gray-100"
          >
            Open AI Assistant →
          </a>
        </div>
      </section>
    </main>
  );
}
