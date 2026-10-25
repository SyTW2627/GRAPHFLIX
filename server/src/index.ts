import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => c.text("Graphflix API funcionando"));

export default {
  port: 3000,
  fetch: app.fetch,
};