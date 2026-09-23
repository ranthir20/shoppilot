import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    const sales = await prisma.sale.findMany({
      where: {
        userId,
      },
      include: {
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalProducts = products.length;

    const totalCustomers = customers.length;

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

    const totalOrders = sales.length;

    const lowStockProducts = products.filter(
      (product) => product.stock > 0 && product.stock <= 10
    );

    const outOfStockProducts = products.filter(
      (product) => product.stock === 0
    );

    const restockProducts = products
      .filter((product) => product.stock > 0 && product.stock <= 10)
      .sort((a, b) => a.stock - b.stock);

    const productSales = new Map<
      number,
      { quantity: number; revenue: number }
    >();

    for (const sale of sales) {
      for (const item of sale.items) {
        const existing = productSales.get(item.productId) || {
          quantity: 0,
          revenue: 0,
        };

        productSales.set(item.productId, {
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + item.total,
        });
      }
    }

    const bestSellingProducts = products
      .map((product) => {
        const salesData = productSales.get(product.id);

        return {
          id: product.id,
          name: product.name,
          quantitySold: salesData?.quantity || 0,
          revenue: salesData?.revenue || 0,
        };
      })
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);

    return NextResponse.json({
      summary: {
        totalProducts,
        totalCustomers,
        totalSales,
        totalPaid,
        totalDue,
        totalOrders,
        lowStockCount: lowStockProducts.length,
        outOfStockCount: outOfStockProducts.length,
      },
      products,
      lowStockProducts,
      outOfStockProducts,
      customers,
      sales,
      bestSellingProducts,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to fetch AI data" },
      { status: 500 }
    );
  }
}



export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const question = String(body.question || "").trim().toLowerCase();

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 }
      );
    }

    const [products, customers, sales] = await Promise.all([
      prisma.product.findMany({
        where: { userId },
      }),
      prisma.customer.findMany({
        where: { userId },
      }),
      prisma.sale.findMany({
        where: { userId },
        include: {
          items: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    const formatMoney = (value: number) =>
      `₹${value.toLocaleString("en-IN", {
        maximumFractionDigits: 2,
      })}`;

    const now = new Date();

    const startOfThisMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const startOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );

    const endOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999
    );

    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const startOfTomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );

    const dayOfWeek = now.getDay();

    const daysSinceMonday =
      dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const startOfThisWeek = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() - daysSinceMonday
    );

    const startOfNextWeek = new Date(
      startOfThisWeek.getFullYear(),
      startOfThisWeek.getMonth(),
      startOfThisWeek.getDate() + 7
    );

    const thisMonthSales = sales.filter(
      (sale) => new Date(sale.createdAt) >= startOfThisMonth
    );

    const lastMonthSales = sales.filter((sale) => {
      const date = new Date(sale.createdAt);

      return (
        date >= startOfLastMonth &&
        date <= endOfLastMonth
      );
    });

    const todaySales = sales.filter((sale) => {
      const date = new Date(sale.createdAt);

      return date >= startOfToday && date < startOfTomorrow;
    });

    const thisWeekSales = sales.filter((sale) => {
      const date = new Date(sale.createdAt);

      return date >= startOfThisWeek && date < startOfNextWeek;
    });

    const todayTotal = todaySales.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );

    const thisWeekTotal = thisWeekSales.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );

    const thisMonthTotal = thisMonthSales.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );

    const lastMonthTotal = lastMonthSales.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );

    const difference = thisMonthTotal - lastMonthTotal;

    const percentageChange =
      lastMonthTotal === 0
        ? null
        : (difference / lastMonthTotal) * 100;

    const totalSales = sales.reduce(
      (sum, sale) => sum + sale.totalAmount,
      0
    );

    const totalOrders = sales.length;

    const totalProducts = products.length;
    const totalCustomers = customers.length;

    const totalPaid = customers.reduce(
      (sum, customer) => sum + customer.totalPaid,
      0
    );

    const averageOrderValue =
      totalOrders === 0 ? 0 : totalSales / totalOrders;

    const highestSale = sales.reduce(
      (highest, sale) =>
        sale.totalAmount > (highest?.totalAmount || 0)
          ? sale
          : highest,
      sales[0] || null
    );

    const totalDue = customers.reduce(
      (sum, customer) => sum + customer.totalDue,
      0
    );

    const lowStockProducts = products.filter(
      (product) => product.stock > 0 && product.stock <= 10
    );

    const outOfStockProducts = products.filter(
      (product) => product.stock === 0
    );

    const restockProducts = products
      .filter((product) => product.stock > 0 && product.stock <= 10)
      .sort((a, b) => a.stock - b.stock);

    const productSales = new Map<
      number,
      { quantity: number; revenue: number }
    >();

    for (const sale of sales) {
      for (const item of sale.items) {
        const existing = productSales.get(item.productId) || {
          quantity: 0,
          revenue: 0,
        };

        productSales.set(item.productId, {
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + item.total,
        });
      }
    }

    const bestSellingProducts = products
      .map((product) => {
        const salesData = productSales.get(product.id);

        return {
          name: product.name,
          quantity: salesData?.quantity || 0,
          revenue: salesData?.revenue || 0,
        };
      })
      .filter((product) => product.quantity > 0)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    let answer =
      "I can help with sales, inventory, customers, and payments. Try asking about sales, low stock, pending dues, or best-selling products.";

    const asksAboutSales =
      question.includes("sales") ||
      question.includes("sale") ||
      question.includes("sell") ||
      question.includes("sold") ||
      question.includes("revenue") ||
      question.includes("made") ||
      question.includes("make") ||
      question.includes("earned") ||
      question.includes("earn") ||
      question.includes("income") ||
      question.includes("turnover");

    const asksThisMonth =
      question.includes("this month") ||
      question.includes("current month") ||
      question.includes("this month's") ||
      question.includes("current month's");

    const asksLastMonth =
      question.includes("last month") ||
      question.includes("previous month") ||
      question.includes("prior month") ||
      question.includes("last month's") ||
      question.includes("previous month's");

    const asksForComparison =
      question.includes("compare") ||
      question.includes("compared") ||
      question.includes("comparison") ||
      question.includes("versus") ||
      question.includes("vs") ||
      question.includes("better") ||
      question.includes("increase") ||
      question.includes("decrease") ||
      question.includes("grew") ||
      question.includes("growth") ||
      question.includes("change") ||
      question.includes("improved") ||
      question.includes("improvement");

    if (
      (asksAboutSales || asksForComparison) &&
      (
        (asksThisMonth && asksLastMonth) ||
        (asksForComparison && asksLastMonth)
      )
    ) {
      if (percentageChange === null) {
        answer =
          `This month you have made ${formatMoney(
            thisMonthTotal
          )} in sales across ${thisMonthSales.length} order(s). ` +
          `Last month had no recorded sales.`;
      } else {
        const direction =
          difference > 0
            ? "increase"
            : difference < 0
              ? "decrease"
              : "no change";

        answer =
          `This month: ${formatMoney(
            thisMonthTotal
          )} from ${thisMonthSales.length} order(s).\n\n` +
          `Last month: ${formatMoney(
            lastMonthTotal
          )} from ${lastMonthSales.length} order(s).\n\n` +
          `That's a ${direction} of ${formatMoney(
            Math.abs(difference)
          )} (${Math.abs(percentageChange).toFixed(1)}%).`;
      }
    } else if (
      asksAboutSales &&
      (
        question.includes("today") ||
        question.includes("today's")
      )
    ) {
      answer =
        `Today you have made ${formatMoney(
          todayTotal
        )} from ${todaySales.length} order(s).`;
    } else if (
      asksAboutSales &&
      (
        question.includes("this week") ||
        question.includes("current week") ||
        question.includes("this week's")
      )
    ) {
      answer =
        `This week you have made ${formatMoney(
          thisWeekTotal
        )} from ${thisWeekSales.length} order(s).`;
    } else if (
      asksAboutSales &&
      (
        question.includes("this month") ||
        question.includes("current month") ||
        question.includes("this month's")
      )
    ) {
      answer =
        `This month you have made ${formatMoney(
          thisMonthTotal
        )} from ${thisMonthSales.length} order(s).`;
    } else if (
      asksAboutSales &&
      (
        question.includes("last month") ||
        question.includes("previous month") ||
        question.includes("last month's")
      )
    ) {
      answer =
        `Last month you made ${formatMoney(
          lastMonthTotal
        )} from ${lastMonthSales.length} order(s).`;
    } else if (
      question.includes("low stock") ||
      question.includes("running low") ||
      question.includes("low on stock") ||
      question.includes("running out") ||
      question.includes("restock")
    ) {
      if (lowStockProducts.length === 0) {
        answer = "You currently have no low-stock products.";
      } else {
        answer =
          "These products are running low:\n\n" +
          lowStockProducts
            .map(
              (product) =>
                `• ${product.name}: ${product.stock} left`
            )
            .join("\n");
      }
    } else if (
      question.includes("out of stock") ||
      question.includes("sold out")
    ) {
      if (outOfStockProducts.length === 0) {
        answer = "You currently have no out-of-stock products.";
      } else {
        answer =
          "These products are out of stock:\n\n" +
          outOfStockProducts
            .map((product) => `• ${product.name}`)
            .join("\n");
      }
    } else if (
      question.includes("best selling") ||
      question.includes("best-selling") ||
      question.includes("top selling")
    ) {
      if (bestSellingProducts.length === 0) {
        answer = "There are no sales yet to determine best-selling products.";
      } else {
        answer =
          "Your best-selling products are:\n\n" +
          bestSellingProducts
            .map(
              (product, index) =>
                `${index + 1}. ${product.name} — ${product.quantity} sold`
            )
            .join("\n");
      }
    } else if (
      asksAboutSales &&
      (
        question.includes("total") ||
        question.includes("overall") ||
        question.includes("all time") ||
        question.includes("how much")
      ) &&
      !asksForComparison
    ) {
      answer =
        `Your total recorded sales are ${formatMoney(
          totalSales
        )} across ${totalOrders} order(s).`;
    } else if (
      question.includes("who owes me the most") ||
      question.includes("owes me the most") ||
      question.includes("biggest debtor") ||
      question.includes("highest due") ||
      question.includes("largest due")
    ) {
      const customersWithDue = customers
        .filter((customer) => customer.totalDue > 0)
        .sort((a, b) => b.totalDue - a.totalDue);

      if (customersWithDue.length === 0) {
        answer = "No customers currently have pending dues.";
      } else {
        const topCustomer = customersWithDue[0];

        answer =
          `${topCustomer.name} owes you the most: ${formatMoney(
            topCustomer.totalDue
          )}.`;
      }
    } else if (
      question.includes("due") ||
      question.includes("owe") ||
      question.includes("pending payment")
    ) {
      const customersWithDue = customers.filter(
        (customer) => customer.totalDue > 0
      );

      if (customersWithDue.length === 0) {
        answer = "You currently have no pending customer dues.";
      } else {
        answer =
          `Total pending dues: ${formatMoney(totalDue)}\n\n` +
          customersWithDue
            .sort((a, b) => b.totalDue - a.totalDue)
            .map(
              (customer) =>
                `• ${customer.name}: ${formatMoney(
                  customer.totalDue
                )}`
            )
            .join("\n");
      }
    } else if (
      question.includes("average order") ||
      question.includes("average sale") ||
      question.includes("average bill") ||
      question.includes("average purchase")
    ) {
      answer =
        totalOrders === 0
          ? "There are no recorded sales yet to calculate an average order value."
          : `Your average order value is ${formatMoney(
              averageOrderValue
            )} across ${totalOrders} order(s).`;
    } else if (
      question.includes("how many orders today") ||
      question.includes("number of orders today") ||
      question.includes("orders today")
    ) {
      answer =
        `You have ${todaySales.length} order(s) today, totaling ${formatMoney(
          todayTotal
        )}.`;
    } else if (
      question.includes("highest sale") ||
      question.includes("biggest sale") ||
      question.includes("largest sale") ||
      question.includes("highest order")
    ) {
      if (!highestSale) {
        answer = "There are no recorded sales yet.";
      } else {
        answer =
          `Your highest recorded sale is Sale #${highestSale.id} ` +
          `for ${formatMoney(highestSale.totalAmount)}.`;
      }
    } else if (
      question.includes("what should i restock") ||
      question.includes("what should i restock first") ||
      question.includes("what needs restocking") ||
      question.includes("what needs to be restocked")
    ) {
      if (restockProducts.length === 0) {
        answer = "No products are currently in the low-stock range.";
      } else {
        answer =
          "These products should be checked for restocking first:\n\n" +
          restockProducts
            .map(
              (product) =>
                `• ${product.name}: ${product.stock} left`
            )
            .join("\n");
      }
    } else if (
      question.includes("how many products") ||
      question.includes("number of products")
    ) {
      answer =
        `You currently have ${totalProducts} product(s) in your inventory.`;
    } else if (
      question.includes("how many customers") ||
      question.includes("number of customers")
    ) {
      answer =
        `You currently have ${totalCustomers} customer(s) registered.`;
    } else if (
      question.includes("paid") &&
      (
        question.includes("how much") ||
        question.includes("total")
      )
    ) {
      answer =
        `Customers have paid ${formatMoney(
          totalPaid
        )} against recorded sales. Current pending dues are ${formatMoney(
          totalDue
        )}.`;
    } else if (
      question.includes("performance") ||
      question.includes("business summary") ||
      question.includes("business overview") ||
      question.includes("how is my business")
    ) {
      answer =
        `Business summary:\n\n` +
        `• Sales: ${formatMoney(totalSales)}\n` +
        `• Orders: ${totalOrders}\n` +
        `• Customers: ${totalCustomers}\n` +
        `• Products: ${totalProducts}\n` +
        `• Pending dues: ${formatMoney(totalDue)}\n` +
        `• Low stock: ${lowStockProducts.length} product(s)\n` +
        `• Out of stock: ${outOfStockProducts.length} product(s)`;
    } else if (
      question.includes("customer") ||
      question.includes("customers")
    ) {
      answer =
        `You currently have ${customers.length} customer(s) registered.`;
    } else if (
      question.includes("product") ||
      question.includes("inventory") ||
      question.includes("stock")
    ) {
      answer =
        `You have ${products.length} product(s), ` +
        `${lowStockProducts.length} low-stock product(s), ` +
        `and ${outOfStockProducts.length} out-of-stock product(s).`;
    } else if (
      question.includes("hello") ||
      question === "hi" ||
      question.startsWith("hi ")
    ) {
      answer =
        "Hello! Ask me about your sales, stock, customers, or pending payments.";
    }

    return NextResponse.json({ answer });
  } catch (error) {
    console.error("AI engine error:", error);

    return NextResponse.json(
      { error: "Failed to process AI question" },
      { status: 500 }
    );
  }
}
