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

    if (!customerId || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid customer or payment amount" },
        { status: 400 }
      );
    }

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

    if (amount > customer.totalDue) {
      return NextResponse.json(
        {
          error: `Payment cannot exceed current due of ₹${customer.totalDue}`,
        },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.create({
      data: {
        userId,
        customerId,
        amount,
      },
      include: {
        customer: true,
      },
    });

    await prisma.customer.update({
      where: {
        id: customerId,
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

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to record payment",
      },
      { status: 400 }
    );
  }
}
