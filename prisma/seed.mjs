import { PrismaClient } from "@prisma/client";
import defaultPages from "../content/default-pages.json" with { type: "json" };

const prisma = new PrismaClient();

async function main() {
  for (const [slug, data] of Object.entries(defaultPages)) {
    await prisma.pageContent.upsert({
      where: { slug },
      update: { data },
      create: { slug, data },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
