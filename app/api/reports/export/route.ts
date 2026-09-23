import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const daysParam = Number(searchParams.get("days") || "30");

    const days =
      Number.isFinite(daysParam) && daysParam > 0
        ? Math.min(Math.floor(daysParam), 3650)
        : 30;

    const sales = await prisma.sale.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    const rows = Array.from({ length: days }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (days - 1 - index));

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const daySales = sales.filter((sale) => {
        const saleDate = new Date(sale.createdAt);
        return saleDate >= date && saleDate < nextDate;
      });

      const amount = daySales.reduce(
        (sum, sale) => sum + sale.totalAmount,
        0
      );

      return [
        date.toISOString().split("T")[0],
        amount.toFixed(2),
        daySales.length,
      ];
    });

    const csv = [
      "Date,Sales,Orders",
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="shoppilot-sales-${days}-days.csv"`,
      },
    });
  } catch (error) {
    console.error("Report export error:", error);

    return new Response("Failed to export report", {
      status: 500,
    });
  }
}
