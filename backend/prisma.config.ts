import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"] || "mysql://u859677653_camp_david:*Reedb4b4@193.203.168.91:3306/u859677653_camp_david_db",
  },
});
