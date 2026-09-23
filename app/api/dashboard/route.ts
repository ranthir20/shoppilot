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

    const returns = await prisma.productReturn.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        sale: {
          include: {
            customer: true,
          },
        },
      },
    });

    const totalRefunds = returns.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );

    const saleItems = await prisma.saleItem.findMany({
      where: {
        sale: {
          userId,
        },
      },
      include: {
        product: true,
      },
    });

    const productSales = new Map<
      number,
      { name: string; quantity: number; revenue: number }
    >();

    for (const item of saleItems) {
      const existing = productSales.get(item.productId);

      productSales.set(item.productId, {
        name: item.product.name,
        quantity: (existing?.quantity || 0) + item.quantity,
        revenue: (existing?.revenue || 0) + item.total,
      });
    }

    const bestSellingProducts = Array.from(productSales.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    const salesTrend = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const daySales = sales.filter((sale) => {
        const saleDate = new Date(sale.createdAt);
        return saleDate >= date && saleDate < nextDate;
      });

      return {
        date: date.toISOString(),
        amount: daySales.reduce(
          (sum, sale) => sum + sale.totalAmount,
          0
        ),
        orders: daySales.length,
      };
    });

    return NextResponse.json({
      todaySales: todaySalesAmount,
      todayOrders: todaySales.length,
      pendingPayments,
      lowStock,
      lowStockProducts: products
        .filter((product) => product.stock > 0 && product.stock <= 10)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 10),
      outOfStockProducts: products
        .filter((product) => product.stock === 0)
        .slice(0, 10),
      recentSales: sales.slice(0, 5),
      returns,
      totalRefunds,
      salesTrend,
      bestSellingProducts,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
