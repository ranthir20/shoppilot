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
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

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

  const startEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setName(customer.name);
    setPhone(customer.phone);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName("");
    setPhone("");
  };

  const updateCustomer = async (event: FormEvent) => {
    event.preventDefault();

    if (!editingId || !name.trim() || !phone.trim()) {
      alert("Please enter customer name and phone number.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/customers", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingId,
          name: name.trim(),
          phone: phone.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Failed to update customer.");
        return;
      }

      cancelEdit();
      await loadCustomers();
    } catch (error) {
      console.error("Failed to update customer:", error);
      alert("Could not update the customer. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const addCustomer = async (event: FormEvent) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const phoneDigits = trimmedPhone.replace(/\D/g, "");

    if (!trimmedName || !trimmedPhone) {
      alert("Please enter customer name and phone number.");
      return;
    }

    if (trimmedName.length < 2) {
      alert("Customer name must be at least 2 characters.");
      return;
    }

    if (phoneDigits.length !== 10) {
      alert("Phone number must contain exactly 10 digits.");
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
          name: trimmedName,
          phone: phoneDigits,
        }),
      });

      if (!response.ok) {
        alert("Could not add the customer. Please check the details and try again.");
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

  const filteredCustomers = customers.filter((customer) => {
    const query = search.toLowerCase().trim();

    if (!query) return true;

    return (
      customer.name.toLowerCase().includes(query) ||
      customer.phone.toLowerCase().includes(query)
    );
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <Sidebar />

      <section className="md:ml-64 p-4 md:p-8">
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

          <form
            onSubmit={editingId ? updateCustomer : addCustomer}
            className="mt-5 flex gap-4"
          >
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
              {saving
                ? editingId
                  ? "Updating..."
                  : "Adding..."
                : editingId
                  ? "Update Customer"
                  : "Add Customer"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={cancelEdit}
                className="rounded-lg border px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </form>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border bg-white">
          <div className="flex flex-col gap-4 border-b p-6 md:flex-row md:items-center md:justify-between">
            <h3 className="text-lg font-semibold">Customer List</h3>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or phone..."
              className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-black md:w-72"
            />
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading customers...
            </div>
          ) : customers.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No customers yet. Add your first customer above.
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No customers match your search.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
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
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b last:border-0">
                    <td className="px-6 py-4 font-medium">
                      <a
                        href={`/customers/${customer.id}`}
                        className="hover:underline"
                      >
                        {customer.name}
                      </a>
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

                    <td className="px-6 py-4">
                      <button
                        onClick={() => startEdit(customer)}
                        className="rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
