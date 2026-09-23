import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sales = await prisma.sale.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch sales" },
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

    const customerId = body.customerId
      ? Number(body.customerId)
      : null;

    const paidAmount = Number(body.paidAmount);

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: "At least one product is required" },
        { status: 400 }
      );
    }

    if (
      customerId !== null &&
      (!Number.isInteger(customerId) || customerId <= 0)
    ) {
      return NextResponse.json(
        { error: "Invalid customer ID" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(paidAmount) || paidAmount < 0) {
      return NextResponse.json(
        { error: "Invalid paid amount" },
        { status: 400 }
      );
    }

    const sale = await prisma.$transaction(async (tx) => {
      if (customerId !== null) {
        const customer = await tx.customer.findFirst({
          where: {
            id: customerId,
            userId,
          },
        });

        if (!customer) {
          throw new Error("CUSTOMER_NOT_FOUND");
        }
      }

      const requestedItems = body.items.map((item: unknown) => {
        const data = item as {
          productId?: unknown;
          quantity?: unknown;
        };

        const productId = Number(data.productId);
        const quantity = Number(data.quantity);

        if (!Number.isInteger(productId) || productId <= 0) {
          throw new Error("INVALID_PRODUCT_ID");
        }

        if (!Number.isInteger(quantity) || quantity <= 0) {
          throw new Error("INVALID_QUANTITY");
        }

        return { productId, quantity };
      });

      const quantities = new Map<number, number>();

      for (const item of requestedItems) {
        quantities.set(
          item.productId,
          (quantities.get(item.productId) || 0) + item.quantity
        );
      }

      const productIds = Array.from(quantities.keys());

      const products = await tx.product.findMany({
        where: {
          userId,
          id: {
            in: productIds,
          },
        },
      });

      if (products.length !== productIds.length) {
        throw new Error("PRODUCT_NOT_FOUND");
      }

      const productMap = new Map(
        products.map((product) => [product.id, product])
      );

      let totalAmount = 0;

      const saleItems = requestedItems.map((item: { productId: number; quantity: number }) => {
        const product = productMap.get(item.productId);

        if (!product) {
          throw new Error("PRODUCT_NOT_FOUND");
        }

        const itemTotal = product.price * item.quantity;
        totalAmount += itemTotal;

        return {
          productId: item.productId,
          quantity: item.quantity,
          price: product.price,
          total: itemTotal,
        };
      });

      if (paidAmount > totalAmount) {
        throw new Error("INVALID_PAID_AMOUNT");
      }

      for (const [productId, quantity] of quantities) {
        const updated = await tx.product.updateMany({
          where: {
            id: productId,
            userId,
            stock: {
              gte: quantity,
            },
          },
          data: {
            stock: {
              decrement: quantity,
            },
          },
        });

        if (updated.count !== 1) {
          throw new Error("INSUFFICIENT_STOCK");
        }
      }

      const dueAmount = totalAmount - paidAmount;

      const createdSale = await tx.sale.create({
        data: {
          userId,
          customerId,
          totalAmount,
          paidAmount,
          dueAmount,
          items: {
            create: saleItems,
          },
        },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      for (const [productId, quantity] of quantities) {
        await tx.stockMovement.create({
          data: {
            userId,
            productId,
            type: "SALE",
            quantity: -quantity,
            reason: `Sale #${createdSale.id}`,
          },
        });
      }

      if (customerId !== null) {
        await tx.customer.updateMany({
          where: {
            id: customerId,
            userId,
          },
          data: {
            totalPurchases: {
              increment: totalAmount,
            },
            totalPaid: {
              increment: paidAmount,
            },
            totalDue: {
              increment: dueAmount,
            },
          },
        });
      }

      return createdSale;
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error("Sale creation error:", error);

    if (error instanceof Error) {
      if (error.message === "CUSTOMER_NOT_FOUND") {
        return NextResponse.json(
          { error: "Customer not found" },
          { status: 404 }
        );
      }

      if (error.message === "PRODUCT_NOT_FOUND") {
        return NextResponse.json(
          { error: "One or more products were not found" },
          { status: 404 }
        );
      }

      if (error.message === "INVALID_PRODUCT_ID") {
        return NextResponse.json(
          { error: "Invalid product ID" },
          { status: 400 }
        );
      }

      if (error.message === "INVALID_QUANTITY") {
        return NextResponse.json(
          { error: "Quantity must be a positive whole number" },
          { status: 400 }
        );
      }

      if (error.message === "INVALID_PAID_AMOUNT") {
        return NextResponse.json(
          { error: "Paid amount cannot exceed the sale total" },
          { status: 400 }
        );
      }

      if (error.message === "INSUFFICIENT_STOCK") {
        return NextResponse.json(
          { error: "Insufficient stock for one or more products" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to create sale" },
      { status: 500 }
    );
  }
}
