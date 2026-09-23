import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const customers = await prisma.customer.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch customers" },
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
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Name and phone are required" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        userId,
        name,
        phone,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to create customer" },
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
    const id = Number(body.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        { error: "Invalid customer ID" },
        { status: 400 }
      );
    }

    if (!body.name?.trim() || !body.phone?.trim()) {
      return NextResponse.json(
        { error: "Name and phone are required" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        name: body.name.trim(),
        phone: body.phone.trim(),
      },
    });

    if (customer.count !== 1) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const updatedCustomer = await prisma.customer.findFirst({
      where: {
        id,
        userId,
      },
    });

    return NextResponse.json(updatedCustomer);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}
