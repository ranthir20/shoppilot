import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Failed to fetch products",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const category =
      typeof body.category === "string" ? body.category.trim() : "";
    const price = Number(body.price);
    const stock = Number(body.stock);

    if (!name || !category) {
      return NextResponse.json(
        { error: "Name and category are required" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { error: "Price must be greater than zero" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(stock) || stock < 0) {
      return NextResponse.json(
        { error: "Stock must be a non-negative whole number" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        userId,
        name,
        category,
        price,
        stock,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const productId = Number(body.id);

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        userId,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Product details update
    if (
      typeof body.name === "string" ||
      typeof body.category === "string" ||
      body.price !== undefined
    ) {
      const name =
        typeof body.name === "string"
          ? body.name.trim()
          : existingProduct.name;

      const category =
        typeof body.category === "string"
          ? body.category.trim()
          : existingProduct.category;

      const price =
        body.price !== undefined
          ? Number(body.price)
          : existingProduct.price;

      if (!name || !category || !Number.isFinite(price) || price <= 0) {
        return NextResponse.json(
          { error: "Invalid product details" },
          { status: 400 }
        );
      }

      const updatedProduct = await prisma.product.updateMany({
        where: {
          id: productId,
          userId,
        },
        data: {
          name,
          category,
          price,
        },
      });

      if (updatedProduct.count !== 1) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }

      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          userId,
        },
      });

      return NextResponse.json(product);
    }

    // Stock adjustment
    const stockChange = Number(body.stockChange);

    if (!Number.isInteger(stockChange) || stockChange === 0) {
      return NextResponse.json(
        { error: "Invalid stock change" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: {
          id: productId,
          userId,
        },
      });

      if (!product) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      const newStock = product.stock + stockChange;

      if (newStock < 0) {
        throw new Error("STOCK_NEGATIVE");
      }

      const updated = await tx.product.updateMany({
        where: {
          id: productId,
          userId,
          stock: product.stock,
        },
        data: {
          stock: stockChange > 0
            ? { increment: stockChange }
            : { decrement: Math.abs(stockChange) },
        },
      });

      if (updated.count !== 1) {
        throw new Error("STOCK_UPDATE_CONFLICT");
      }

      const movement = await tx.stockMovement.create({
        data: {
          userId,
          productId,
          type: "ADJUSTMENT",
          quantity: stockChange,
          reason:
            typeof body.reason === "string" && body.reason.trim()
              ? body.reason.trim()
              : stockChange > 0
                ? "Stock added"
                : "Stock removed",
        },
      });

      return { stock: newStock, movement };
    });

    return NextResponse.json({
      id: productId,
      stock: result.stock,
    });
  } catch (error) {
    console.error("Product update error:", error);

    if (error instanceof Error) {
      if (error.message === "PRODUCT_NOT_FOUND") {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }

      if (error.message === "STOCK_NEGATIVE") {
        return NextResponse.json(
          { error: "Stock cannot be negative" },
          { status: 400 }
        );
      }

      if (error.message === "STOCK_UPDATE_CONFLICT") {
        return NextResponse.json(
          { error: "Stock changed. Please try again." },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}
