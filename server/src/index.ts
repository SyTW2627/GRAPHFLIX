import { Hono } from "hono";
import { favorite } from "./routes/favorites";
import { movies } from "./routes/movies";

const app = new Hono();

app.get("/", (c) => c.text("Graphflix API funcionando"));
app.route("/", favorite);
app.route("/", movies);

export default {
  port: 3000,
  fetch: app.fetch,
};