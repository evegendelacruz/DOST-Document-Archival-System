import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.local.prisma",
  datasource: {
    url: process.env.LOCAL_DATABASE_URL,
  },
});
