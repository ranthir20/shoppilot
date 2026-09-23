import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const returns = await prisma.productReturn.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        sale: {
          include: {
            customer: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(returns);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch returns" },
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

    const saleId = Number(body.saleId);

    const refundMethod =
      typeof body.refundMethod === "string"
        ? body.refundMethod
        : "CASH";

    const refundReference =
      typeof body.refundReference === "string" &&
      body.refundReference.trim()
        ? body.refundReference.trim()
        : null;

    const allowedRefundMethods = ["CASH", "UPI", "CARD", "OTHER"];

    if (!allowedRefundMethods.includes(refundMethod)) {
      return NextResponse.json(
        { error: "Invalid refund method" },
        { status: 400 }
      );
    }

    if (!Number.isInteger(saleId) || saleId <= 0) {
      return NextResponse.json(
        { error: "Invalid sale ID" },
        { status: 400 }
      );
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: "At least one product is required" },
        { status: 400 }
      );
    }

    const returnRecord = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findFirst({
        where: {
          id: saleId,
          userId,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          customer: true,
        },
      });

      if (!sale) {
        throw new Error("SALE_NOT_FOUND");
      }

      const existingReturns = await tx.returnItem.findMany({
        where: {
          return: {
            saleId,
            userId,
          },
        },
      });

      const requestedQuantities = new Map<number, number>();

      for (const requestedItem of body.items) {
        const productId = Number(requestedItem.productId);
        const quantity = Number(requestedItem.quantity);

        if (!Number.isInteger(productId) || productId <= 0) {
          throw new Error("INVALID_PRODUCT_ID");
        }

        if (!Number.isInteger(quantity) || quantity <= 0) {
          throw new Error("INVALID_QUANTITY");
        }

        requestedQuantities.set(
          productId,
          (requestedQuantities.get(productId) || 0) + quantity
        );
      }

      const returnItems = [];
      let totalAmount = 0;

      for (const [productId, quantity] of requestedQuantities) {
        const saleItem = sale.items.find(
          (item) => item.productId === productId
        );

        if (!saleItem) {
          throw new Error("PRODUCT_NOT_IN_SALE");
        }

        const alreadyReturned = existingReturns
          .filter((item) => item.productId === productId)
          .reduce((sum, item) => sum + item.quantity, 0);

        const remainingQuantity = saleItem.quantity - alreadyReturned;

        if (quantity > remainingQuantity) {
          throw new Error("QUANTITY_EXCEEDS_RETURNABLE");
        }

        const itemTotal = saleItem.price * quantity;

        totalAmount += itemTotal;

        returnItems.push({
          productId,
          quantity,
          price: saleItem.price,
          total: itemTotal,
        });
      }

      const createdReturn = await tx.productReturn.create({
        data: {
          userId,
          saleId,
          totalAmount,
          refundMethod,
          refundStatus: "COMPLETED",
          refundReference,
          items: {
            create: returnItems,
          },
        },
        include: {
          sale: {
            include: {
              customer: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (sale.customerId && sale.customer) {
        const returnedAmount = totalAmount;

        const dueReduction = Math.min(
          sale.customer.totalDue,
          returnedAmount
        );

        const paidReduction = returnedAmount - dueReduction;

        const updatedCustomer = await tx.customer.updateMany({
          where: {
            id: sale.customerId,
            userId,
            totalPurchases: {
              gte: returnedAmount,
            },
            totalPaid: {
              gte: paidReduction,
            },
            totalDue: {
              gte: dueReduction,
            },
          },
          data: {
            totalPurchases: {
              decrement: returnedAmount,
            },
            totalPaid: {
              decrement: paidReduction,
            },
            totalDue: {
              decrement: dueReduction,
            },
          },
        });

        if (updatedCustomer.count !== 1) {
          throw new Error("CUSTOMER_BALANCE_UPDATE_FAILED");
        }
      }

      for (const item of returnItems) {
        await tx.product.updateMany({
          where: {
            id: item.productId,
            userId,
          },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });

        await tx.stockMovement.create({
          data: {
            userId,
            productId: item.productId,
            type: "RETURN",
            quantity: item.quantity,
            reason: `Return #${createdReturn.id} from Sale #${saleId}`,
          },
        });
      }

      return createdReturn;
    });

    return NextResponse.json(returnRecord, { status: 201 });
  } catch (error) {
    console.error("Return processing error:", error);

    if (error instanceof Error) {
      if (error.message === "SALE_NOT_FOUND") {
        return NextResponse.json(
          { error: "Sale not found" },
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
          { error: "Return quantity must be a positive whole number" },
          { status: 400 }
        );
      }

      if (error.message === "PRODUCT_NOT_IN_SALE") {
        return NextResponse.json(
          { error: "One or more products were not part of this sale" },
          { status: 400 }
        );
      }

      if (error.message === "QUANTITY_EXCEEDS_RETURNABLE") {
        return NextResponse.json(
          { error: "Return quantity exceeds the remaining returnable quantity" },
          { status: 400 }
        );
      }

      if (error.message === "CUSTOMER_BALANCE_UPDATE_FAILED") {
        return NextResponse.json(
          { error: "Customer balance could not be updated" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to process return" },
      { status: 500 }
    );
  }
}
