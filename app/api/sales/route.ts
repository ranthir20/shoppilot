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

    if (customerId) {
      const customer = await prisma.customer.findFirst({
        where: {
          id: customerId,
          userId,
        },
      });

      if (!customer) {
        return NextResponse.json(
          { error: "Customer not found" },
          { status: 404 }
        );
      }
    }

    const saleItems = [];
    let totalAmount = 0;

    for (const item of body.items) {
      const productId = Number(item.productId);
      const quantity = Number(item.quantity);

      if (quantity <= 0) {
        return NextResponse.json(
          { error: "Quantity must be greater than zero" },
          { status: 400 }
        );
      }

      const product = await prisma.product.findFirst({
        where: {
          id: productId,
          userId,
        },
      });

      if (!product) {
        return NextResponse.json(
          { error: `Product ${productId} not found` },
          { status: 404 }
        );
      }

      if (product.stock < quantity) {
        return NextResponse.json(
          {
            error: `Not enough stock for ${product.name}. Available: ${product.stock}`,
          },
          { status: 400 }
        );
      }

      const itemTotal = product.price * quantity;
      totalAmount += itemTotal;

      saleItems.push({
        productId,
        quantity,
        price: product.price,
        total: itemTotal,
      });
    }

    if (paidAmount < 0 || paidAmount > totalAmount) {
      return NextResponse.json(
        { error: "Invalid paid amount" },
        { status: 400 }
      );
    }

    const dueAmount = totalAmount - paidAmount;

    const sale = await prisma.sale.create({
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

    for (const item of saleItems) {
      await prisma.product.update({
        where: {
          id: item.productId,
        },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    if (customerId) {
      await prisma.customer.update({
        where: {
          id: customerId,
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

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create sale",
      },
      { status: 400 }
    );
  }
}
