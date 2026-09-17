import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      name: true,
      userId: true,
    },
  });

  for (const product of products) {
    console.log(
      `Product ${product.id} (${product.name}) owner: ${product.userId}`
    );
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
