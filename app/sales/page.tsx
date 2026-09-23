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

type CartItem = {
  productId: number;
  quantity: number;
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

  const [cart, setCart] = useState<CartItem[]>([]);
  const [productId, setProductId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [paidAmount, setPaidAmount] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

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

  const filteredSales = sales.filter((sale) => {
    const query = search.toLowerCase().trim();

    if (!query) return true;

    return (
      String(sale.id).includes(query) ||
      (sale.customer?.name || "").toLowerCase().includes(query) ||
      (sale.customer?.phone || "").toLowerCase().includes(query)
    );
  });

  const selectedProduct = products.find(
    (product) => product.id === Number(productId)
  );

  const addToCart = () => {
    if (!selectedProduct) {
      alert("Please select a product.");
      return;
    }

    const selectedQuantity = Number(quantity);

    if (selectedQuantity <= 0) {
      alert("Quantity must be greater than zero.");
      return;
    }

    const existingItem = cart.find(
      (item) => item.productId === selectedProduct.id
    );

    const newQuantity = existingItem
      ? existingItem.quantity + selectedQuantity
      : selectedQuantity;

    if (newQuantity > selectedProduct.stock) {
      alert("Not enough stock available.");
      return;
    }

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.productId === selectedProduct.id
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          productId: selectedProduct.id,
          quantity: selectedQuantity,
        },
      ]);
    }

    setProductId("");
    setQuantity("1");
  };

  const updateCartQuantity = (productId: number, newQuantity: number) => {
    const product = products.find((item) => item.id === productId);

    if (!product) return;

    if (newQuantity <= 0) {
      setCart(cart.filter((item) => item.productId !== productId));
      return;
    }

    if (newQuantity > product.stock) {
      alert("Not enough stock available.");
      return;
    }

    setCart(
      cart.map((item) =>
        item.productId === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.productId !== productId));
  };

  const totalAmount = cart.reduce((total, item) => {
    const product = products.find(
      (product) => product.id === item.productId
    );

    return total + (product ? product.price * item.quantity : 0);
  }, 0);

  const paid = Number(paidAmount) || 0;
  const dueAmount = Math.max(totalAmount - paid, 0);

  const createSale = async () => {
    if (cart.length === 0) {
      alert("Please add at least one product.");
      return;
    }

    if (!Number.isFinite(paid) || paid < 0 || paid > totalAmount) {
      alert("Paid amount must be between ₹0 and the sale total.");
      return;
    }

    for (const item of cart) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
        alert("Product quantities must be whole numbers greater than 0.");
        return;
      }

      const product = products.find(
        (product) => product.id === item.productId
      );

      if (!product) {
        alert("A product in the sale is no longer available.");
        return;
      }

      if (item.quantity > product.stock) {
        alert(`${product.name} only has ${product.stock} in stock.`);
        return;
      }
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
          items: cart,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to create sale.");
        return;
      }

      setCart([]);
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

      <section className="md:ml-64 p-4 md:p-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Sales</h2>
          <p className="mt-1 text-gray-500">
            Record sales and track your recent transactions.
          </p>
        </div>

        <div className="mt-8 rounded-xl border bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Create Sale
          </h3>

          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Product
              </label>

              <select
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
                className="w-full rounded-lg border px-4 py-3 text-black"
              >
                <option value="">Select product</option>

                {products.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                    disabled={product.stock === 0}
                  >
                    {product.name} — ₹{product.price.toLocaleString("en-IN")} —
                    Stock: {product.stock}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Quantity
              </label>

              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                className="w-full rounded-lg border px-4 py-3 text-black"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={addToCart}
            className="mt-4 rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-gray-800"
          >
            Add Product
          </button>

          {cart.length > 0 && (
            <div className="mt-6 overflow-hidden rounded-lg border">
              <div className="border-b bg-gray-50 px-5 py-3">
                <h4 className="font-semibold text-gray-900">
                  Current Sale
                </h4>
              </div>

              <div className="divide-y">
                {cart.map((item) => {
                  const product = products.find(
                    (product) => product.id === item.productId
                  );

                  if (!product) return null;

                  const itemTotal = product.price * item.quantity;

                  return (
                    <div
                      key={item.productId}
                      className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900">
                          {product.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          ₹{product.price.toLocaleString("en-IN")} each
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <input
                          type="number"
                          min="1"
                          max={product.stock}
                          value={item.quantity}
                          onChange={(event) =>
                            updateCartQuantity(
                              item.productId,
                              Number(event.target.value)
                            )
                          }
                          className="w-20 rounded-lg border px-3 py-2 text-center text-black"
                        />

                        <p className="w-28 text-right font-semibold text-gray-900">
                          ₹{itemTotal.toLocaleString("en-IN")}
                        </p>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.productId)}
                          className="text-sm font-medium text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Customer
              </label>

              <select
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
                className="w-full rounded-lg border px-4 py-3 text-black"
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
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Amount Paid
              </label>

              <input
                type="number"
                min="0"
                value={paidAmount}
                onChange={(event) => setPaidAmount(event.target.value)}
                placeholder="Enter amount"
                className="w-full rounded-lg border px-4 py-3 text-black placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 rounded-lg bg-gray-50 p-5 sm:grid-cols-3">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
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
            type="button"
            onClick={createSale}
            disabled={saving || cart.length === 0}
            className="mt-6 rounded-lg bg-black px-6 py-3 font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Creating Sale..." : "Create Sale"}
          </button>
        </div>

        <div className="mt-8 rounded-xl border bg-white p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Sales
            </h3>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sale ID, customer or phone..."
              className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:border-black md:w-80"
            />
          </div>

          {loading ? (
            <p className="mt-4 text-gray-500">Loading sales...</p>
          ) : sales.length === 0 ? (
            <p className="mt-4 text-gray-500">No sales recorded yet.</p>
          ) : filteredSales.length === 0 ? (
            <p className="mt-4 text-gray-500">
              No sales match your search.
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead>
                  <tr className="border-b text-sm text-gray-500">
                    <th className="px-3 py-3">Sale</th>
                    <th className="px-3 py-3">Customer</th>
                    <th className="px-3 py-3">Products</th>
                    <th className="px-3 py-3">Total</th>
                    <th className="px-3 py-3">Paid</th>
                    <th className="px-3 py-3">Due</th>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="border-b last:border-0">
                      <td className="px-3 py-4 font-medium text-gray-900">
                        #{sale.id}
                      </td>

                      <td className="px-3 py-4 text-gray-700">
                        {sale.customer?.name || "Walk-in"}
                      </td>

                      <td className="px-3 py-4 text-gray-700">
                        <div className="space-y-1">
                          {sale.items.map((item) => (
                            <p key={item.id}>
                              {item.product.name} × {item.quantity}
                            </p>
                          ))}
                        </div>
                      </td>

                      <td className="px-3 py-4 font-medium text-gray-900">
                        ₹{sale.totalAmount.toLocaleString("en-IN")}
                      </td>

                      <td className="px-3 py-4 text-green-600">
                        ₹{sale.paidAmount.toLocaleString("en-IN")}
                      </td>

                      <td className="px-3 py-4 text-red-600">
                        ₹{sale.dueAmount.toLocaleString("en-IN")}
                      </td>

                      <td className="px-3 py-4 text-gray-500">
                        {new Date(sale.createdAt).toLocaleDateString("en-IN")}
                      </td>

                      <td className="px-3 py-4">
                        <a
                          href={`/sales/${sale.id}`}
                          className="rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Receipt
                        </a>
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
