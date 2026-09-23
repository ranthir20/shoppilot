"use client";
import Sidebar from "@/components/Sidebar";

import { useEffect, useState } from "react";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
};

type StockMovement = {
  id: number;
  type: string;
  quantity: number;
  reason: string | null;
  createdAt: string;
  product: {
    id: number;
    name: string;
  };
};

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("ALL");
  const [adjustmentReasons, setAdjustmentReasons] = useState<Record<number, string>>({});

  const loadProducts = async () => {
    try {
      const [productsResponse, movementsResponse] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/inventory"),
      ]);

      const productsData = await productsResponse.json();
      const movementsData = await movementsResponse.json();

      setProducts(productsData);

      if (movementsResponse.ok) {
        setMovements(movementsData);
      } else {
        setMovements([]);
      }
    } catch (error) {
      console.error("Failed to load inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, product) => sum + product.stock, 0);
  const lowStock = products.filter(
    (product) => product.stock > 0 && product.stock <= 10
  ).length;
  const outOfStock = products.filter((product) => product.stock === 0).length;

  const updateStock = async (id: number, stockChange: number) => {
    const product = products.find((item) => item.id === id);
    const reason = adjustmentReasons[id]?.trim() || "Stock received";

    if (!product) {
      alert("Product not found.");
      return;
    }

    if (!Number.isInteger(stockChange) || stockChange === 0) {
      alert("Stock change must be a non-zero whole number.");
      return;
    }

    if (product.stock + stockChange < 0) {
      alert("Stock cannot be negative.");
      return;
    }

    try {
      const response = await fetch("/api/products", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          stockChange,
          reason,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Failed to update stock");
        return;
      }

      await loadProducts();

      const movementsResponse = await fetch("/api/inventory");
      if (movementsResponse.ok) {
        const movementsData = await movementsResponse.json();
        setMovements(movementsData);
      }
    } catch (error) {
      console.error("Failed to update stock:", error);
      alert("Failed to update stock. Please try again.");
    }
  };

  const filteredProducts = products.filter((product) => {
    const query = search.toLowerCase().trim();

    const matchesSearch =
      !query ||
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query);

    const matchesStock =
      stockFilter === "ALL" ||
      (stockFilter === "LOW" && product.stock > 0 && product.stock <= 10) ||
      (stockFilter === "OUT" && product.stock === 0);

    return matchesSearch && matchesStock;
  });

  const getStatus = (stock: number) => {
    if (stock === 0) {
      return {
        text: "Out of Stock",
        className: "bg-red-100 text-red-700",
      };
    }

    if (stock <= 10) {
      return {
        text: "Low Stock",
        className: "bg-orange-100 text-orange-700",
      };
    }

    return {
      text: "In Stock",
      className: "bg-green-100 text-green-700",
    };
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Sidebar />

      <section className="md:ml-64 p-4 md:p-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Inventory</h2>
          <p className="mt-1 text-gray-500">
            Monitor your stock and identify products that need attention.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-4 gap-5">
          <div className="rounded-xl border bg-white p-6">
            <p className="text-sm text-gray-500">Total Products</p>
            <h3 className="mt-2 text-2xl font-bold">{totalProducts}</h3>
          </div>

          <div className="rounded-xl border bg-white p-6">
            <p className="text-sm text-gray-500">Total Stock</p>
            <h3 className="mt-2 text-2xl font-bold">{totalStock}</h3>
            <p className="mt-1 text-sm text-gray-500">units</p>
          </div>

          <div className="rounded-xl border bg-white p-6">
            <p className="text-sm text-gray-500">Low Stock</p>
            <h3 className="mt-2 text-2xl font-bold text-orange-600">
              {lowStock}
            </h3>
            <p className="mt-1 text-sm text-gray-500">needs attention</p>
          </div>

          <div className="rounded-xl border bg-white p-6">
            <p className="text-sm text-gray-500">Out of Stock</p>
            <h3 className="mt-2 text-2xl font-bold text-red-600">
              {outOfStock}
            </h3>
            <p className="mt-1 text-sm text-gray-500">products</p>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border bg-white">
          <div className="flex flex-col gap-4 border-b p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Stock Overview</h3>
              <p className="mt-1 text-sm text-gray-500">
                Search and manage your products.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setStockFilter("ALL")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  stockFilter === "ALL"
                    ? "bg-black text-white"
                    : "border bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                All
              </button>

              <button
                onClick={() => setStockFilter("LOW")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  stockFilter === "LOW"
                    ? "bg-black text-white"
                    : "border bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Low Stock
              </button>

              <button
                onClick={() => setStockFilter("OUT")}
                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                  stockFilter === "OUT"
                    ? "bg-black text-white"
                    : "border bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Out of Stock
              </button>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                className="w-64 rounded-lg border px-4 py-2 text-sm outline-none focus:border-black"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading inventory...
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No products available.
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No products match your search.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Product
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Category
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Price
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Quantity
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => {
                  const status = getStatus(product.stock);

                  return (
                    <tr key={product.id} className="border-b last:border-0">
                      <td className="px-6 py-4 font-medium">
                        {product.name}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {product.category}
                      </td>

                      <td className="px-6 py-4">
                        ₹{product.price.toLocaleString("en-IN")}
                      </td>

                      <td className="px-6 py-4 font-medium">
                        {product.stock}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}
                        >
                          {status.text}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={
                              adjustmentReasons[product.id] || "Stock received"
                            }
                            onChange={(event) =>
                              setAdjustmentReasons((previous) => ({
                                ...previous,
                                [product.id]: event.target.value,
                              }))
                            }
                            className="rounded-lg border px-3 py-1.5 text-sm outline-none focus:border-black"
                          >
                            <option>Stock received</option>
                            <option>Damaged</option>
                            <option>Lost</option>
                            <option>Stock correction</option>
                          </select>

                          <button
                            onClick={() => updateStock(product.id, -1)}
                            disabled={product.stock === 0}
                            className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            −
                          </button>

                          <button
                            onClick={() => updateStock(product.id, 1)}
                            className="rounded-lg bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
                          >
                            + Stock
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border bg-white">
          <div className="border-b p-6">
            <h3 className="text-lg font-semibold">Stock Movement History</h3>
            <p className="mt-1 text-sm text-gray-500">
              Recent stock changes from sales and manual adjustments.
            </p>
          </div>

          {movements.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No stock movements yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Quantity
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Reason
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {movements.map((movement) => (
                    <tr
                      key={movement.id}
                      className="border-b last:border-0"
                    >
                      <td className="px-6 py-4 font-medium">
                        {movement.product.name}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            movement.type === "SALE"
                              ? "bg-red-100 text-red-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {movement.type}
                        </span>
                      </td>

                      <td
                        className={`px-6 py-4 font-semibold ${
                          movement.quantity < 0
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {movement.quantity > 0 ? "+" : ""}
                        {movement.quantity}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {movement.reason || "—"}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {new Date(movement.createdAt).toLocaleString("en-IN")}
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
