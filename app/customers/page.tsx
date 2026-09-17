"use client";
import Sidebar from "@/components/Sidebar";

import { FormEvent, useEffect, useState } from "react";

type Customer = {
  id: number;
  name: string;
  phone: string;
  totalPurchases: number;
  totalPaid: number;
  totalDue: number;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error("Failed to load customers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const addCustomer = async (event: FormEvent) => {
    event.preventDefault();

    if (!name.trim() || !phone.trim()) {
      alert("Please enter customer name and phone number.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
        }),
      });

      if (!response.ok) {
        alert("Failed to add customer.");
        return;
      }

      setName("");
      setPhone("");
      await loadCustomers();
    } catch (error) {
      console.error("Failed to add customer:", error);
    } finally {
      setSaving(false);
    }
  };

  const totalCustomers = customers.length;

  const totalSales = customers.reduce(
    (sum, customer) => sum + customer.totalPurchases,
    0
  );

  const totalDue = customers.reduce(
    (sum, customer) => sum + customer.totalDue,
    0
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <Sidebar />

      <section className="ml-64 p-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Customers</h2>
          <p className="mt-1 text-gray-500">
            Manage your customers and track their purchases.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-5">
          <div className="rounded-xl border bg-white p-6">
            <p className="text-sm text-gray-500">Total Customers</p>
            <h3 className="mt-2 text-2xl font-bold">{totalCustomers}</h3>
          </div>

          <div className="rounded-xl border bg-white p-6">
            <p className="text-sm text-gray-500">Total Purchases</p>
            <h3 className="mt-2 text-2xl font-bold">
              ₹{totalSales.toLocaleString("en-IN")}
            </h3>
          </div>

          <div className="rounded-xl border bg-white p-6">
            <p className="text-sm text-gray-500">Pending Dues</p>
            <h3 className="mt-2 text-2xl font-bold text-red-600">
              ₹{totalDue.toLocaleString("en-IN")}
            </h3>
          </div>
        </div>

        <div className="mt-8 rounded-xl border bg-white p-6">
          <h3 className="text-lg font-semibold">Add Customer</h3>

          <form onSubmit={addCustomer} className="mt-5 flex gap-4">
            <input
              type="text"
              placeholder="Customer name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="flex-1 rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-gray-300"
            />

            <input
              type="tel"
              placeholder="Phone number"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="flex-1 rounded-lg border px-4 py-3 outline-none focus:ring-2 focus:ring-gray-300"
            />

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-black px-6 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? "Adding..." : "Add Customer"}
            </button>
          </form>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border bg-white">
          <div className="border-b p-6">
            <h3 className="text-lg font-semibold">Customer List</h3>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading customers...
            </div>
          ) : customers.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No customers yet. Add your first customer above.
            </div>
          ) : (
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Purchases
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Paid
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Due
                  </th>
                </tr>
              </thead>

              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-b last:border-0">
                    <td className="px-6 py-4 font-medium">
                      {customer.name}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {customer.phone}
                    </td>

                    <td className="px-6 py-4">
                      ₹{customer.totalPurchases.toLocaleString("en-IN")}
                    </td>

                    <td className="px-6 py-4 text-green-600">
                      ₹{customer.totalPaid.toLocaleString("en-IN")}
                    </td>

                    <td className="px-6 py-4 font-medium text-red-600">
                      ₹{customer.totalDue.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </main>
  );
}
