"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Sale = {
  id: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  createdAt: string;
  customer?: {
    name: string;
    phone: string;
  } | null;
  items: {
    id: number;
    quantity: number;
    price: number;
    total: number;
    product: {
      name: string;
    };
  }[];
};

export default function ReceiptPage() {
  const params = useParams();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSale = async () => {
      try {
        const response = await fetch("/api/sales");
        const data = await response.json();

        const found = data.find(
          (item: Sale) => item.id === Number(params.id)
        );

        setSale(found || null);
      } catch {
        setSale(null);
      } finally {
        setLoading(false);
      }
    };

    loadSale();
  }, [params.id]);

  if (loading) {
    return <div className="p-8 text-gray-500">Loading receipt...</div>;
  }

  if (!sale) {
    return <div className="p-8 text-red-600">Sale not found.</div>;
  }

  return (
    <main className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:justify-between print:hidden">
          <a
            href="/sales"
            className="rounded-lg border bg-white px-4 py-2 text-sm font-medium"
          >
            ← Back to Sales
          </a>

          <button
            onClick={() => window.print()}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Print Receipt
          </button>
        </div>

        <div className="rounded-xl bg-white p-4 shadow-sm sm:p-8 print:rounded-none print:shadow-none">
          <div className="border-b pb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              ShopPilot
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Sales Receipt
            </p>
          </div>

          <div className="flex justify-between border-b py-5 text-sm">
            <div>
              <p className="text-gray-500">Receipt</p>
              <p className="font-medium">#{sale.id}</p>
            </div>

            <div className="text-right">
              <p className="text-gray-500">Date</p>
              <p className="font-medium">
                {new Date(sale.createdAt).toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <div className="border-b py-5 text-sm">
            <p className="text-gray-500">Customer</p>
            <p className="font-medium">
              {sale.customer?.name || "Walk-in Customer"}
            </p>

            {sale.customer?.phone && (
              <p className="text-gray-500">{sale.customer.phone}</p>
            )}
          </div>

          <div className="py-5">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-3">Product</th>
                  <th className="pb-3 text-center">Qty</th>
                  <th className="pb-3 text-right">Price</th>
                  <th className="pb-3 text-right">Total</th>
                </tr>
              </thead>

              <tbody>
                {sale.items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-3">{item.product.name}</td>
                    <td className="py-3 text-center">{item.quantity}</td>
                    <td className="py-3 text-right">
                      ₹{item.price.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 text-right font-medium">
                      ₹{item.total.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t pt-5 text-sm">
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Total</span>
              <span className="font-semibold">
                ₹{sale.totalAmount.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="flex justify-between py-1 text-green-600">
              <span>Paid</span>
              <span>
                ₹{sale.paidAmount.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="flex justify-between py-1 text-red-600">
              <span>Due</span>
              <span>
                ₹{sale.dueAmount.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="mt-8 border-t pt-5 text-center text-xs text-gray-500">
            Thank you for shopping with us.
          </div>
        </div>
      </div>
    </main>
  );
}
