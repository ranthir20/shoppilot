"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

type ReportData = {
  summary: {
    totalSales: number;
    totalOrders: number;
    averageOrderValue: number;
    totalPaid: number;
    totalDue: number;
    totalRefunds: number;
  };
  salesTrend: {
    date: string;
    sales: number;
    orders: number;
  }[];
  bestSellingProducts: {
    name: string;
    quantity: number;
    revenue: number;
  }[];
  topCustomers: {
    name: string;
    phone: string;
    purchases: number;
    paid: number;
    due: number;
  }[];
};

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    async function loadReports() {
      try {
        const response = await fetch(`/api/reports?days=${days}`);

        if (!response.ok) {
          throw new Error("Failed to load reports");
        }

        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, [days]);

  if (loading) {
    return (
      <>
        <Sidebar />
        <main className="min-h-screen bg-gray-50 p-4 md:ml-64 md:p-8">
          <p className="text-gray-500">Loading reports...</p>
        </main>
      </>
    );
  }

  if (!data) {
    return (
      <>
        <Sidebar />
        <main className="min-h-screen bg-gray-50 p-4 md:ml-64 md:p-8">
          <p className="text-red-500">Failed to load reports.</p>
        </main>
      </>
    );
  }

  const maxSales = Math.max(
    ...data.salesTrend.map((day) => day.sales),
    1
  );

  return (
    <>
      <Sidebar />

      <main className="min-h-screen bg-gray-50 p-4 md:ml-64 md:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Reports
            </h1>
            <p className="mt-1 text-gray-500">
              Understand your business performance.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Total Sales</p>
              <p className="mt-2 text-2xl font-bold">
                ₹{data.summary.totalSales.toFixed(2)}
              </p>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="mt-2 text-2xl font-bold">
                {data.summary.totalOrders}
              </p>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Average Order Value</p>
              <p className="mt-2 text-2xl font-bold">
                ₹{data.summary.averageOrderValue.toFixed(2)}
              </p>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Total Paid</p>
              <p className="mt-2 text-2xl font-bold text-green-600">
                ₹{data.summary.totalPaid.toFixed(2)}
              </p>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Pending Due</p>
              <p className="mt-2 text-2xl font-bold text-orange-600">
                ₹{data.summary.totalDue.toFixed(2)}
              </p>
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Total Refunds</p>
              <p className="mt-2 text-2xl font-bold text-red-600">
                ₹{data.summary.totalRefunds.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Sales Trend
              </h2>

              <div className="flex flex-wrap gap-2">
                {[
                  { label: "7 Days", value: 7 },
                  { label: "30 Days", value: 30 },
                  { label: "90 Days", value: 90 },
                  { label: "All Time", value: 3650 },
                ].map((period) => (
                  <button
                    key={period.value}
                    onClick={() => setDays(period.value)}
                    className={`rounded-lg px-3 py-2 text-sm font-medium ${
                      days === period.value
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {period.label}
                  </button>
                ))}

                <a
                  href={`/api/reports/export?days=${days}`}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Download CSV
                </a>
              </div>
            </div>

            <div className="mt-6 flex h-64 items-end gap-1 overflow-x-auto">
              {data.salesTrend.map((day) => {
                const height =
                  day.sales === 0
                    ? 2
                    : Math.max((day.sales / maxSales) * 100, 4);

                return (
                  <div
                    key={day.date}
                    className="group flex h-full min-w-3 flex-1 flex-col justify-end"
                    title={`${new Date(day.date).toLocaleDateString()} — ₹${day.sales.toFixed(2)} — ${day.orders} orders`}
                  >
                    <div
                      className="w-full rounded-t bg-blue-500 transition hover:bg-blue-600"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex justify-between text-xs text-gray-400">
              <span>
                {data.salesTrend[0]
                  ? new Date(
                      data.salesTrend[0].date
                    ).toLocaleDateString()
                  : ""}
              </span>
              <span>
                {data.salesTrend[data.salesTrend.length - 1]
                  ? new Date(
                      data.salesTrend[data.salesTrend.length - 1].date
                    ).toLocaleDateString()
                  : ""}
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">
                Best-Selling Products
              </h2>

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-[550px] w-full text-left">
                  <thead>
                    <tr className="border-b text-sm text-gray-500">
                      <th className="pb-3">Product</th>
                      <th className="pb-3">Units</th>
                      <th className="pb-3">Revenue</th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.bestSellingProducts.map((product) => (
                      <tr
                        key={product.name}
                        className="border-b last:border-0"
                      >
                        <td className="py-3 font-medium">
                          {product.name}
                        </td>
                        <td className="py-3">{product.quantity}</td>
                        <td className="py-3">
                          ₹{product.revenue.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data.bestSellingProducts.length === 0 && (
                <p className="mt-4 text-sm text-gray-500">
                  No sales data yet.
                </p>
              )}
            </div>

            <div className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">
                Top Customers
              </h2>

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-[650px] w-full text-left">
                  <thead>
                    <tr className="border-b text-sm text-gray-500">
                      <th className="pb-3">Customer</th>
                      <th className="pb-3">Purchases</th>
                      <th className="pb-3">Due</th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.topCustomers.map((customer) => (
                      <tr
                        key={`${customer.phone}-${customer.name}`}
                        className="border-b last:border-0"
                      >
                        <td className="py-3">
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-xs text-gray-500">
                            {customer.phone}
                          </p>
                        </td>
                        <td className="py-3">
                          ₹{customer.purchases.toFixed(2)}
                        </td>
                        <td className="py-3">
                          ₹{customer.due.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {data.topCustomers.length === 0 && (
                <p className="mt-4 text-sm text-gray-500">
                  No customer data yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
