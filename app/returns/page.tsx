"use client";

import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";

type Product = {
  id: number;
  name: string;
};

type SaleItem = {
  id: number;
  productId: number;
  quantity: number;
  price: number;
  product: Product;
};

type Customer = {
  id: number;
  name: string;
  phone: string;
};

type Sale = {
  id: number;
  totalAmount: number;
  createdAt: string;
  customer: Customer | null;
  items: SaleItem[];
};

type ReturnItem = {
  id: number;
  productId: number;
  quantity: number;
  price: number;
  total: number;
  product: Product;
};

type ReturnRecord = {
  id: number;
  saleId: number;
  totalAmount: number;
  refundMethod: string;
  refundStatus: string;
  refundReference: string | null;
  createdAt: string;
  sale: {
    customer: Customer | null;
  };
  items: ReturnItem[];
};

type ReturnSelection = {
  [productId: number]: number;
};

export default function ReturnsPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [selectedSaleId, setSelectedSaleId] = useState("");
  const [returnQuantities, setReturnQuantities] =
    useState<ReturnSelection>({});
  const [refundMethod, setRefundMethod] = useState("CASH");
  const [refundReference, setRefundReference] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    try {
      const [salesResponse, returnsResponse] = await Promise.all([
        fetch("/api/sales"),
        fetch("/api/returns"),
      ]);

      const salesData = await salesResponse.json();
      const returnsData = await returnsResponse.json();

      if (salesResponse.ok) {
        setSales(salesData);
      }

      if (returnsResponse.ok) {
        setReturns(returnsData);
      }
    } catch (error) {
      console.error("Failed to load returns:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredReturns = returns.filter((returnRecord) => {
    const query = search.toLowerCase().trim();

    if (!query) return true;

    return (
      String(returnRecord.id).includes(query) ||
      String(returnRecord.saleId).includes(query) ||
      (returnRecord.sale.customer?.name || "Walk-in Customer")
        .toLowerCase()
        .includes(query) ||
      returnRecord.items.some((item) =>
        item.product.name.toLowerCase().includes(query)
      )
    );
  });

  const selectedSale = sales.find(
    (sale) => sale.id === Number(selectedSaleId)
  );

  const getAlreadyReturned = (productId: number) => {
    return returns
      .filter((item) => item.saleId === Number(selectedSaleId))
      .flatMap((item) => item.items)
      .filter((item) => item.productId === productId)
      .reduce((sum, item) => sum + item.quantity, 0);
  };

  const getReturnableQuantity = (item: SaleItem) => {
    return Math.max(0, item.quantity - getAlreadyReturned(item.productId));
  };

  const returnTotal = selectedSale
    ? selectedSale.items.reduce((sum, item) => {
        const quantity = returnQuantities[item.productId] || 0;
        return sum + quantity * item.price;
      }, 0)
    : 0;

  const remainingReturnValue = selectedSale
    ? selectedSale.items.reduce((sum, item) => {
        const returnable = getReturnableQuantity(item);
        return sum + returnable * item.price;
      }, 0)
    : 0;

  const updateQuantity = (productId: number, quantity: number) => {
    setReturnQuantities((current) => ({
      ...current,
      [productId]: quantity,
    }));
  };

  const processReturn = async () => {
    if (!selectedSale) {
      alert("Please select a sale");
      return;
    }

    const items = Object.entries(returnQuantities)
      .filter(([, quantity]) => quantity > 0)
      .map(([productId, quantity]) => ({
        productId: Number(productId),
        quantity,
      }));

    if (items.length === 0) {
      alert("Select at least one product to return");
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch("/api/returns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          saleId: selectedSale.id,
          items,
          refundMethod,
          refundReference,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to process return");
        return;
      }

      alert(
        `Return #${data.id} processed. Refund amount: ₹${data.totalAmount.toLocaleString(
          "en-IN"
        )}`
      );

      setSelectedSaleId("");
      setReturnQuantities({});
      setRefundMethod("CASH");
      setRefundReference("");
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Failed to process return");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />

      <main className="md:ml-64 p-4 md:p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Returns & Refunds
          </h2>
          <p className="mt-1 text-gray-500">
            Return products from previous sales and restore inventory.
          </p>
        </div>

        <div className="rounded-xl border bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Create Return
          </h3>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Select Sale
            </label>

            <select
              value={selectedSaleId}
              onChange={(event) => {
                setSelectedSaleId(event.target.value);
                setReturnQuantities({});
              }}
              className="w-full rounded-lg border px-4 py-3 text-gray-900 md:w-1/2"
            >
              <option value="">Select a sale</option>

              {sales.map((sale) => (
                <option key={sale.id} value={sale.id}>
                  Sale #{sale.id} —{" "}
                  {sale.customer?.name || "Walk-in Customer"} — ₹
                  {sale.totalAmount.toLocaleString("en-IN")} —{" "}
                  {new Date(sale.createdAt).toLocaleDateString("en-IN")}
                </option>
              ))}
            </select>
          </div>

          {selectedSale && (
            <div className="mt-6">
              <div className="mb-4 rounded-lg bg-gray-50 p-4">
                <p className="font-medium text-gray-900">
                  Sale #{selectedSale.id}
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  Customer:{" "}
                  {selectedSale.customer?.name || "Walk-in Customer"}
                </p>
              </div>

              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[900px]">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Product
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Price
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Sold
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Returnable
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">
                        Return Qty
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedSale.items.map((item) => {
                      const returnable = getReturnableQuantity(item);
                      const quantity =
                        returnQuantities[item.productId] || 0;

                      return (
                        <tr
                          key={item.id}
                          className="border-b last:border-0"
                        >
                          <td className="px-4 py-4 font-medium">
                            {item.product.name}
                          </td>

                          <td className="px-4 py-4">
                            ₹{item.price.toLocaleString("en-IN")}
                          </td>

                          <td className="px-4 py-4">
                            {item.quantity}
                          </td>

                          <td className="px-4 py-4">
                            {returnable}
                          </td>

                          <td className="px-4 py-4">
                            <input
                              type="number"
                              min="0"
                              max={returnable}
                              value={quantity}
                              disabled={returnable === 0}
                              onChange={(event) => {
                                const value = Math.min(
                                  returnable,
                                  Math.max(0, Number(event.target.value))
                                );

                                updateQuantity(item.productId, value);
                              }}
                              className="w-24 rounded-lg border px-3 py-2 text-gray-900"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex flex-col gap-5 rounded-lg bg-gray-50 p-5 md:flex-row md:items-end md:justify-between">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                  <div>
                    <p className="text-sm text-gray-500">
                      Refund Amount
                    </p>

                    <p className="text-2xl font-bold text-gray-900">
                      ₹{returnTotal.toLocaleString("en-IN")}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Remaining Return Value: ₹{remainingReturnValue.toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-gray-500">
                      Refund Method
                    </label>

                    <select
                      value={refundMethod}
                      onChange={(event) => setRefundMethod(event.target.value)}
                      className="rounded-lg border bg-white px-3 py-2 text-gray-900"
                    >
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="CARD">Card</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-gray-500">
                      Reference
                    </label>

                    <input
                      type="text"
                      value={refundReference}
                      onChange={(event) =>
                        setRefundReference(event.target.value)
                      }
                      placeholder="Optional"
                      className="w-40 rounded-lg border bg-white px-3 py-2 text-gray-900"
                    />
                  </div>
                </div>

                <button
                  onClick={processReturn}
                  disabled={processing || returnTotal <= 0}
                  className="rounded-lg bg-gray-900 px-6 py-3 font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processing ? "Processing..." : "Process Return"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border bg-white">
          <div className="flex flex-col gap-4 border-b p-6 md:flex-row md:items-center md:justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Return History
            </h3>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search return, sale, customer or product..."
              className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-black md:w-96"
            />
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading returns...
            </div>
          ) : returns.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No returns yet.
            </div>
          ) : filteredReturns.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No returns match your search.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Return
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Sale
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Products
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Refund
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Method
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredReturns.map((returnRecord) => (
                    <tr
                      key={returnRecord.id}
                      className="border-b last:border-0"
                    >
                      <td className="px-6 py-4 font-medium">
                        #{returnRecord.id}
                      </td>

                      <td className="px-6 py-4">
                        #{returnRecord.saleId}
                      </td>

                      <td className="px-6 py-4">
                        {returnRecord.sale.customer?.name ||
                          "Walk-in Customer"}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        <div className="space-y-1">
                          {returnRecord.items.map((item) => (
                            <div key={item.id}>
                              {item.product.name} × {item.quantity}
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="px-6 py-4 font-medium text-red-600">
                        ₹
                        {returnRecord.totalAmount.toLocaleString(
                          "en-IN"
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
                          {returnRecord.refundMethod}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {new Date(
                          returnRecord.createdAt
                        ).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
