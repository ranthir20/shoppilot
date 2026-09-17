"use client";
import Sidebar from "@/components/Sidebar";

import { useEffect, useState } from "react";

type Product = {
  id: number;
  name: string;
  price: number;
  stock: number;
};

type Customer = {
  id: number;
  name: string;
  phone: string;
};

type Sale = {
  id: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  createdAt: string;
  customer: Customer | null;
  items: {
    id: number;
    quantity: number;
    price: number;
    total: number;
    product: Product;
  }[];
};

export default function SalesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  const [productId, setProductId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [paidAmount, setPaidAmount] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const [productsResponse, customersResponse, salesResponse] =
        await Promise.all([
          fetch("/api/products"),
          fetch("/api/customers"),
          fetch("/api/sales"),
        ]);

      setProducts(await productsResponse.json());
      setCustomers(await customersResponse.json());
      setSales(await salesResponse.json());
    } catch (error) {
      console.error("Failed to load sales data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedProduct = products.find(
    (product) => product.id === Number(productId)
  );

  const selectedQuantity = Number(quantity) || 0;

  const totalAmount = selectedProduct
    ? selectedProduct.price * selectedQuantity
    : 0;

  const paid = Number(paidAmount) || 0;
  const dueAmount = Math.max(totalAmount - paid, 0);

  const createSale = async () => {
    if (!productId) {
      alert("Please select a product.");
      return;
    }

    if (selectedQuantity <= 0) {
      alert("Quantity must be greater than zero.");
      return;
    }

    if (!selectedProduct || selectedQuantity > selectedProduct.stock) {
      alert("Not enough stock available.");
      return;
    }

    if (paid < 0 || paid > totalAmount) {
      alert("Invalid paid amount.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: customerId ? Number(customerId) : null,
          paidAmount: paid,
          items: [
            {
              productId: Number(productId),
              quantity: selectedQuantity,
            },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to create sale.");
        return;
      }

      setProductId("");
      setCustomerId("");
      setQuantity("1");
      setPaidAmount("");

      await loadData();

      alert("Sale created successfully!");
    } catch (error) {
      console.error("Failed to create sale:", error);
      alert("Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Sidebar />

      <section className="ml-64 p-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Sales</h2>
          <p className="mt-1 text-gray-500">
            Record sales and track your recent transactions.
          </p>
        </div>

        <div className="mt-8 rounded-xl border bg-white p-6">
          <h3 className="text-lg font-semibold">Create Sale</h3>

          <div className="mt-5 grid grid-cols-2 gap-5">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Product
              </label>

              <select
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
                className="w-full rounded-lg border px-4 py-3"
              >
                <option value="">Select product</option>

                {products.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                    disabled={product.stock === 0}
                  >
                    {product.name} — ₹{product.price} — Stock:{" "}
                    {product.stock}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Customer
              </label>

              <select
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
                className="w-full rounded-lg border px-4 py-3"
              >
                <option value="">Walk-in Customer</option>

                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} — {customer.phone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Quantity
              </label>

              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                className="w-full rounded-lg border px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Amount Paid
              </label>

              <input
                type="number"
                min="0"
                value={paidAmount}
                onChange={(event) => setPaidAmount(event.target.value)}
                placeholder="Enter amount"
                className="w-full rounded-lg border px-4 py-3"
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-5 rounded-lg bg-gray-50 p-5">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="mt-1 text-xl font-bold">
                ₹{totalAmount.toLocaleString("en-IN")}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Paid</p>
              <p className="mt-1 text-xl font-bold text-green-600">
                ₹{paid.toLocaleString("en-IN")}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Due</p>
              <p className="mt-1 text-xl font-bold text-red-600">
                ₹{dueAmount.toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <button
            onClick={createSale}
            disabled={saving}
            className="mt-6 rounded-lg bg-black px-6 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? "Creating Sale..." : "Create Sale"}
          </button>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border bg-white">
          <div className="border-b p-6">
            <h3 className="text-lg font-semibold">Recent Sales</h3>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading sales...
            </div>
          ) : sales.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No sales yet.
            </div>
          ) : (
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Product
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
                </tr>
              </thead>

              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-b last:border-0">
                    <td className="px-6 py-4 font-medium">
                      {sale.customer?.name || "Walk-in"}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {sale.items
                        .map(
                          (item) =>
                            `${item.product.name} × ${item.quantity}`
                        )
                        .join(", ")}
                    </td>

                    <td className="px-6 py-4 font-medium">
                      ₹{sale.totalAmount.toLocaleString("en-IN")}
                    </td>

                    <td className="px-6 py-4 text-green-600">
                      ₹{sale.paidAmount.toLocaleString("en-IN")}
                    </td>

                    <td className="px-6 py-4 text-red-600">
                      ₹{sale.dueAmount.toLocaleString("en-IN")}
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
