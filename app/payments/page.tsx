"use client";
import Sidebar from "@/components/Sidebar";

import { useEffect, useState } from "react";

type Customer = {
  id: number;
  name: string;
  phone: string;
  totalPurchases: number;
  totalPaid: number;
  totalDue: number;
};

type Payment = {
  id: number;
  amount: number;
  createdAt: string;
  customer: Customer;
};

export default function PaymentsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [amount, setAmount] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("ALL");

  const loadData = async () => {
    try {
      const [customersResponse, paymentsResponse] = await Promise.all([
        fetch("/api/customers"),
        fetch("/api/payments"),
      ]);

      setCustomers(await customersResponse.json());
      setPayments(await paymentsResponse.json());
    } catch (error) {
      console.error("Failed to load payment data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredPayments = payments.filter((payment) => {
    const query = search.toLowerCase().trim();

    const matchesSearch =
      !query ||
      String(payment.id).includes(query) ||
      payment.customer.name.toLowerCase().includes(query) ||
      payment.customer.phone.toLowerCase().includes(query);

    const paymentDate = new Date(payment.createdAt);
    const now = new Date();

    let matchesDate = true;

    if (dateFilter === "TODAY") {
      matchesDate =
        paymentDate.toDateString() === now.toDateString();
    }

    if (dateFilter === "WEEK") {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      matchesDate = paymentDate >= weekAgo;
    }

    if (dateFilter === "MONTH") {
      matchesDate =
        paymentDate.getMonth() === now.getMonth() &&
        paymentDate.getFullYear() === now.getFullYear();
    }

    return matchesSearch && matchesDate;
  });

  const selectedCustomer = customers.find(
    (customer) => customer.id === Number(customerId)
  );

  const paymentAmount = Number(amount) || 0;

  const totalDue = customers.reduce(
    (sum, customer) => sum + customer.totalDue,
    0
  );

  const recordPayment = async () => {
    if (!customerId) {
      alert("Please select a customer.");
      return;
    }

    if (!selectedCustomer) {
      alert("Selected customer was not found.");
      return;
    }

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      alert("Payment amount must be greater than zero.");
      return;
    }

    if (
      selectedCustomer &&
      paymentAmount > selectedCustomer.totalDue
    ) {
      alert("Payment cannot exceed the customer's due amount.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: Number(customerId),
          amount: paymentAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to record payment.");
        return;
      }

      setCustomerId("");
      setAmount("");

      await loadData();

      alert("Payment recorded successfully!");
    } catch (error) {
      console.error("Failed to record payment:", error);
      alert("Could not record the payment. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Sidebar />

      <section className="md:ml-64 p-4 md:p-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            Payments & Dues
          </h2>

          <p className="mt-1 text-gray-500">
            Track customer dues and record payments.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-5">
          <div className="rounded-xl border bg-white p-6">
            <p className="text-sm text-gray-500">Total Pending Dues</p>
            <p className="mt-2 text-2xl font-bold text-red-600">
              ₹{totalDue.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6">
            <p className="text-sm text-gray-500">Customers With Dues</p>
            <p className="mt-2 text-2xl font-bold">
              {customers.filter((customer) => customer.totalDue > 0).length}
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6">
            <p className="text-sm text-gray-500">Payment Records</p>
            <p className="mt-2 text-2xl font-bold">
              {payments.length}
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-xl border bg-white p-6">
          <h3 className="text-lg font-semibold">Record Payment</h3>

          <div className="mt-5 grid grid-cols-2 gap-5">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Customer
              </label>

              <select
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
                className="w-full rounded-lg border px-4 py-3"
              >
                <option value="">Select customer</option>

                {customers
                  .filter((customer) => customer.totalDue > 0)
                  .map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} — Due ₹
                      {customer.totalDue.toLocaleString("en-IN")}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Payment Amount
              </label>

              <input
                type="number"
                min="1"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Enter amount"
                className="w-full rounded-lg border px-4 py-3"
              />
            </div>
          </div>

          {selectedCustomer && (
            <div className="mt-5 rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                Current due for {selectedCustomer.name}
              </p>

              <p className="mt-1 text-xl font-bold text-red-600">
                ₹{selectedCustomer.totalDue.toLocaleString("en-IN")}
              </p>
            </div>
          )}

          <button
            onClick={recordPayment}
            disabled={saving}
            className="mt-6 rounded-lg bg-black px-6 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? "Recording..." : "Record Payment"}
          </button>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border bg-white">
          <div className="border-b p-6">
            <h3 className="text-lg font-semibold">
              Customer Dues
            </h3>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading customers...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px]">
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
                  <tr
                    key={customer.id}
                    className="border-b last:border-0"
                  >
                    <td className="px-6 py-4 font-medium">
                      {customer.name}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {customer.phone}
                    </td>

                    <td className="px-6 py-4">
                      ₹
                      {customer.totalPurchases.toLocaleString("en-IN")}
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
            </div>
          )}
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border bg-white">
          <div className="flex flex-col gap-4 border-b p-6 md:flex-row md:items-center md:justify-between">
            <h3 className="text-lg font-semibold">
              Payment History
            </h3>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search payment, customer or phone..."
                className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-black md:w-80"
              />

              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="rounded-lg border px-4 py-2 text-sm outline-none focus:border-black"
              >
                <option value="ALL">All time</option>
                <option value="TODAY">Today</option>
                <option value="WEEK">Last 7 days</option>
                <option value="MONTH">This month</option>
              </select>
            </div>
          </div>

          {payments.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No payments recorded yet.
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No payments match your search.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px]">
                <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Payment ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Customer
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
                {filteredPayments.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b last:border-0"
                  >
                    <td className="px-6 py-4 font-medium">
                      #{payment.id}
                    </td>

                    <td className="px-6 py-4">
                      <p className="font-medium">
                        {payment.customer.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {payment.customer.phone}
                      </p>
                    </td>

                    <td className="px-6 py-4 font-medium text-green-600">
                      ₹{payment.amount.toLocaleString("en-IN")}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {new Date(payment.createdAt).toLocaleString(
                        "en-IN"
                      )}
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
