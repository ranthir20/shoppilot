"use client";

import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import { useEffect, useState } from "react";

type Product = {
  id: number;
  name: string;
};

type SaleItem = {
  id: number;
  quantity: number;
  price: number;
  total: number;
  product: Product;
};

type Sale = {
  id: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  createdAt: string;
  items: SaleItem[];
};

type Payment = {
  id: number;
  amount: number;
  createdAt: string;
};

type Customer = {
  id: number;
  name: string;
  phone: string;
  totalPurchases: number;
  totalPaid: number;
  totalDue: number;
  createdAt: string;
  sales: Sale[];
  payments: Payment[];
};

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCustomer = async () => {
      try {
        const { id } = await params;

        const response = await fetch(`/api/customers/${id}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to load customer");
          return;
        }

        setCustomer(data);
      } catch (error) {
        console.error(error);
        setError("Failed to load customer");
      } finally {
        setLoading(false);
      }
    };

    loadCustomer();
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <main className="md:ml-64 p-4 md:p-8">
          <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
            Loading customer...
          </div>
        </main>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <main className="md:ml-64 p-4 md:p-8">
          <div className="rounded-xl border bg-white p-8 text-center">
            <p className="text-red-600">
              {error || "Customer not found"}
            </p>

            <Link
              href="/customers"
              className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline"
            >
              ← Back to Customers
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <main className="md:ml-64 p-4 md:p-8">
        <div className="mb-8">
          <Link
            href="/customers"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            ← Back to Customers
          </Link>

          <div className="mt-4">
            <h2 className="text-3xl font-bold text-gray-900">
              {customer.name}
            </h2>

            <p className="mt-1 text-gray-500">
              {customer.phone}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border bg-white p-6">
            <p className="text-sm text-gray-500">Total Purchases</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              ₹{customer.totalPurchases.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6">
            <p className="text-sm text-gray-500">Total Paid</p>
            <p className="mt-2 text-2xl font-bold text-green-600">
              ₹{customer.totalPaid.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6">
            <p className="text-sm text-gray-500">Outstanding Due</p>
            <p className="mt-2 text-2xl font-bold text-red-600">
              ₹{customer.totalDue.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border bg-white">
          <div className="border-b p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Purchase History
            </h3>
          </div>

          {customer.sales.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No purchases yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Sale
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Products
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Total
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Paid
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Due
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {customer.sales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="border-b last:border-0"
                    >
                      <td className="px-6 py-4 font-medium">
                        #{sale.id}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        <div className="space-y-1">
                          {sale.items.map((item) => (
                            <div key={item.id}>
                              {item.product.name} × {item.quantity}
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        ₹{sale.totalAmount.toLocaleString("en-IN")}
                      </td>

                      <td className="px-6 py-4 text-green-600">
                        ₹{sale.paidAmount.toLocaleString("en-IN")}
                      </td>

                      <td className="px-6 py-4 font-medium text-red-600">
                        ₹{sale.dueAmount.toLocaleString("en-IN")}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {new Date(sale.createdAt).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border bg-white">
          <div className="border-b p-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Payment History
            </h3>
          </div>

          {customer.payments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No payments recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto"><table className="w-full min-w-[500px]">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Payment
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody>
                {customer.payments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b last:border-0"
                  >
                    <td className="px-6 py-4 font-medium">
                      #{payment.id}
                    </td>

                    <td className="px-6 py-4 font-medium text-green-600">
                      ₹{payment.amount.toLocaleString("en-IN")}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {new Date(payment.createdAt).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </div>
      </main>
    </div>
  );
}
