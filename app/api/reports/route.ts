import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const daysParam = Number(searchParams.get("days") || "30");
    const days =
      Number.isFinite(daysParam) && daysParam > 0
        ? Math.min(Math.floor(daysParam), 3650)
        : 30;
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const [sales, customers, saleItems, returns] = await Promise.all([
      prisma.sale.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
      }),
      prisma.customer.findMany({
        where: { userId },
        orderBy: { totalPurchases: "desc" },
      }),
      prisma.saleItem.findMany({
        where: {
          sale: {
            userId,
          },
        },
        include: {
          product: true,
        },
      }),
      prisma.productReturn.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const totalSales = sales.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );

    const totalPaid = customers.reduce(
      (sum, customer) => sum + customer.totalPaid,
      0
    );

    const totalDue = customers.reduce(
      (sum, customer) => sum + customer.totalDue,
      0
    );

    const totalRefunds = returns.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );

    const averageOrderValue =
      sales.length > 0 ? totalSales / sales.length : 0;

    const productMap = new Map<
      number,
      { name: string; quantity: number; revenue: number }
    >();

    for (const item of saleItems) {
      const existing = productMap.get(item.productId);

      productMap.set(item.productId, {
        name: item.product.name,
        quantity: (existing?.quantity || 0) + item.quantity,
        revenue: (existing?.revenue || 0) + item.total,
      });
    }

    const bestSellingProducts = Array.from(productMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    const topCustomers = customers
      .slice(0, 10)
      .map((customer) => ({
        name: customer.name,
        phone: customer.phone,
        purchases: customer.totalPurchases,
        paid: customer.totalPaid,
        due: customer.totalDue,
      }));

    const salesTrend = Array.from({ length: days }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (days - 1 - index));

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const daySales = sales.filter((sale) => {
        const saleDate = new Date(sale.createdAt);

        return saleDate >= date && saleDate < nextDate;
      });

      return {
        date: date.toISOString(),
        sales: daySales.reduce(
          (sum, sale) => sum + sale.totalAmount,
          0
        ),
        orders: daySales.length,
      };
    });

    return NextResponse.json({
      summary: {
        totalSales,
        totalOrders: sales.length,
        averageOrderValue,
        totalPaid,
        totalDue,
        totalRefunds,
      },
      salesTrend,
      bestSellingProducts,
      topCustomers,
    });
  } catch (error) {
    console.error("Reports error:", error);

    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}
