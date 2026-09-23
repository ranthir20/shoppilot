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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

  const saveProduct = async () => {
    const trimmedName = name.trim();
    const trimmedCategory = category.trim();
    const numericPrice = Number(price);
    const numericStock = Number(stock);

    if (!trimmedName || !trimmedCategory || !price || (!editingId && !stock)) {
      alert("Please fill all fields");
      return;
    }

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      alert("Price must be greater than 0.");
      return;
    }

    if (!editingId && (!Number.isInteger(numericStock) || numericStock < 0)) {
      alert("Stock must be a whole number and cannot be negative.");
      return;
    }

    try {
      const response = await fetch("/api/products", {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          editingId
            ? {
                id: editingId,
                name: trimmedName,
                category: trimmedCategory,
                price: numericPrice,
              }
            : {
                name: trimmedName,
                category: trimmedCategory,
                price: numericPrice,
                stock,
              }
        ),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save product");
      }

      setName("");
      setCategory("");
      setPrice("");
      setStock("");
      setEditingId(null);
      setShowForm(false);

      await loadProducts();
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to save product");
    }
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setName(product.name);
    setCategory(product.category);
    setPrice(String(product.price));
    setStock(String(product.stock));
    setShowForm(true);
  };

  const filteredProducts = products.filter((product) => {
    const query = search.toLowerCase().trim();

    if (!query) return true;

    return (
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <Sidebar />

      <section className="md:ml-64 p-4 md:p-8">
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
            <h3 className="text-lg font-semibold">{editingId ? "Edit Product" : "Add New Product"}</h3>

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

              {!editingId && (
                <input
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="Stock quantity"
                  type="number"
                  className="rounded-lg border p-3 outline-none focus:ring-2 focus:ring-gray-300"
                />
              )}
            </div>

            <button
              onClick={saveProduct}
              className="mt-5 rounded-lg bg-black px-5 py-3 text-white hover:bg-gray-800"
            >
              {editingId ? "Update Product" : "Save Product"}
            </button>
          </div>
        )}

        <div className="mt-8 overflow-hidden rounded-xl border bg-white">
          <div className="overflow-x-auto">
          <div className="border-b p-4">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products or categories..."
              className="w-full rounded-lg border px-4 py-3 text-sm outline-none focus:border-black"
            />
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading products...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                No matching products
              </h3>
              <p className="mt-2 text-gray-500">
                Try a different product name or category.
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[650px]">
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
                  <th className="px-6 py-4 text-left text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => (
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

                    <td className="px-6 py-4">
                      <button
                        onClick={() => startEdit(product)}
                        className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          </div>
        </div>
      </section>
    </main>
  );
}
