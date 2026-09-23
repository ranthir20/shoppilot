import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const customerId = Number(id);

    if (!Number.isInteger(customerId)) {
      return NextResponse.json(
        { error: "Invalid customer ID" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        userId,
      },
      include: {
        sales: {
          orderBy: {
            createdAt: "desc",
          },
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        payments: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch customer details" },
      { status: 500 }
    );
  }
}
