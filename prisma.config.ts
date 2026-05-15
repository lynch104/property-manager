import path from "node:path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  earlyAccess: true,
  schema: path.join("prisma", "schema.prisma"),
  migrate: {
    datasource: {
      url: `file:${path.join(process.cwd(), "prisma", "dev.db")}`,
    },
  },
});
