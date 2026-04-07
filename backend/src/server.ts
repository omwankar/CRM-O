import "dotenv/config";

import cors from "cors";
import express from "express";

import { loadEnv } from "./env.js";
import { registerCustomerRoutes } from "./routes/customers.js";
import { registerHealthRoutes } from "./routes/health.js";

const env = loadEnv();

const app = express();
app.disable("x-powered-by");

app.use(
  cors({
    origin: env.FRONTEND_ORIGIN,
    credentials: true
  })
);
app.use(express.json());

const api = express.Router();
registerHealthRoutes(api);
registerCustomerRoutes(api);
app.use("/api", api);

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${env.PORT}`);
});

