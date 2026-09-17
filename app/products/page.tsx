"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  const loadProducts = async () => {
    try {
      const response = await fetch("/api/products");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch products");
      }

      setProducts(data);
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const addProduct = async () => {
    if (!name || !category || !price || !stock) {
      alert("Please fill all fields");
      return;
    }

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          category,
          price,
          stock,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create product");
      }

      setName("");
      setCategory("");
      setPrice("");
      setStock("");
      setShowForm(false);

      await loadProducts();
    } catch (error) {
      console.error(error);
      alert("Failed to add product");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Sidebar />

      <section className="ml-64 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Products</h2>
            <p className="mt-1 text-gray-500">
              Manage your products and pricing.
            </p>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-black px-5 py-3 text-white hover:bg-gray-800"
          >
            + Add Product
          </button>
        </div>

        {showForm && (
          <div className="mt-6 rounded-xl border bg-white p-6">
            <h3 className="text-lg font-semibold">Add New Product</h3>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Product name"
                className="rounded-lg border p-3 outline-none focus:ring-2 focus:ring-gray-300"
              />

              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Category"
                className="rounded-lg border p-3 outline-none focus:ring-2 focus:ring-gray-300"
              />

              <input
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Price"
                type="number"
                className="rounded-lg border p-3 outline-none focus:ring-2 focus:ring-gray-300"
              />

              <input
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="Stock quantity"
                type="number"
                className="rounded-lg border p-3 outline-none focus:ring-2 focus:ring-gray-300"
              />
            </div>

            <button
              onClick={addProduct}
              className="mt-5 rounded-lg bg-black px-5 py-3 text-white hover:bg-gray-800"
            >
              Save Product
            </button>
          </div>
        )}

        <div className="mt-8 overflow-hidden rounded-xl border bg-white">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                No products yet
              </h3>
              <p className="mt-2 text-gray-500">
                Add your first product to get started.
              </p>
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
                    Stock
                  </th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b last:border-0">
                    <td className="px-6 py-4 font-medium">{product.name}</td>

                    <td className="px-6 py-4 text-gray-600">
                      {product.category}
                    </td>

                    <td className="px-6 py-4">
                      ₹{product.price.toLocaleString("en-IN")}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={
                          product.stock <= 10
                            ? "font-medium text-red-600"
                            : "text-gray-700"
                        }
                      >
                        {product.stock}
                      </span>
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
