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
    });

    const products = await prisma.product.findMany({
      where: {
        userId,
      },
    });

    const customers = await prisma.customer.findMany({
      where: {
        userId,
      },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySales = sales.filter(
      (sale) => new Date(sale.createdAt) >= today
    );

    const todaySalesAmount = todaySales.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );

    const pendingPayments = customers.reduce(
      (sum, customer) => sum + customer.totalDue,
      0
    );

    const lowStock = products.filter(
      (product) => product.stock > 0 && product.stock <= 10
    ).length;

    return NextResponse.json({
      todaySales: todaySalesAmount,
      todayOrders: todaySales.length,
      pendingPayments,
      lowStock,
      recentSales: sales.slice(0, 5),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
