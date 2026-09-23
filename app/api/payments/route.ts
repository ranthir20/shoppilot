import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payments = await prisma.payment.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        customer: true,
      },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch payments" },
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

    const customerId = Number(body.customerId);
    const amount = Number(body.amount);

    if (
      !Number.isInteger(customerId) ||
      customerId <= 0 ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return NextResponse.json(
        { error: "Invalid customer or payment amount" },
        { status: 400 }
      );
    }

    const payment = await prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findFirst({
        where: {
          id: customerId,
          userId,
        },
      });

      if (!customer) {
        throw new Error("CUSTOMER_NOT_FOUND");
      }

      if (amount > customer.totalDue) {
        throw new Error("PAYMENT_EXCEEDS_DUE");
      }

      const updatedCustomer = await tx.customer.updateMany({
        where: {
          id: customerId,
          userId,
          totalDue: {
            gte: amount,
          },
        },
        data: {
          totalPaid: {
            increment: amount,
          },
          totalDue: {
            decrement: amount,
          },
        },
      });

      if (updatedCustomer.count !== 1) {
        throw new Error("PAYMENT_EXCEEDS_DUE");
      }

      return tx.payment.create({
        data: {
          userId,
          customerId,
          amount,
        },
        include: {
          customer: true,
        },
      });
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Payment creation error:", error);

    if (error instanceof Error) {
      if (error.message === "CUSTOMER_NOT_FOUND") {
        return NextResponse.json(
          { error: "Customer not found" },
          { status: 404 }
        );
      }

      if (error.message === "PAYMENT_EXCEEDS_DUE") {
        return NextResponse.json(
          { error: "Payment cannot exceed the customer's current due" },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 }
    );
  }
}
