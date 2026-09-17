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

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      setProducts(data);
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
    try {
      const response = await fetch("/api/products", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          stockChange,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Failed to update stock");
        return;
      }

      await loadProducts();
    } catch (error) {
      console.error("Failed to update stock:", error);
    }
  };

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

      <section className="ml-64 p-8">
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
          <div className="border-b p-6">
            <h3 className="text-lg font-semibold">Stock Overview</h3>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading inventory...
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No products available.
            </div>
          ) : (
            <table className="w-full">
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
                {products.map((product) => {
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
          )}
        </div>
      </section>
    </main>
  );
}
