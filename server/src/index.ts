import { Hono } from "hono";
import { favorite } from "./routes/favorite.routes";
import { movies } from "./routes/movie.routes";
import { recommendations } from "./routes/recommendation.routes";
import { userRoutes } from "./routes/user.routes";
import { authMiddleware } from "./auth/auth.middleware";
import { errorHandler, notFoundHandler } from "./errors/errorHandler";

const app = new Hono();

app.onError(errorHandler);
app.notFound(notFoundHandler);

app.get("/", (c) => c.text("Graphflix API funcionando"));

app.route("/", movies);
app.route("/", userRoutes)

app.use("/favorites/*", authMiddleware);
app.route("/", favorite);
app.route("/", recommendations);

export default {
  port: 3000,
  fetch: app.fetch,
};