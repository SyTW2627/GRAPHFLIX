import { Hono } from "hono";
import { cors } from "hono/cors";
import { favorite } from "./routes/favorite.routes";
import { movies } from "./routes/movie.routes";
import { recommendations } from "./routes/recommendation.routes";
import { userRoutes } from "./routes/user.routes";
import { map } from "./routes/map.routes";
import { authMiddleware } from "./auth/auth.middleware";
import { errorHandler, notFoundHandler } from "./errors/errorHandler";

export const app = new Hono();

app.onError(errorHandler);
app.notFound(notFoundHandler);

app.get("/", (c) => c.text("Graphflix API funcionando"));

app.use(
  "*",
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"]
  })
);

app.route("/", movies);
app.route("/", userRoutes)
app.route("/", map); 

app.use("/favorites/*", authMiddleware);
app.route("/", favorite);
app.route("/", recommendations);

export default {
  port: 3000,
  fetch: app.fetch,
};