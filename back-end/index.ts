import express, { Express, NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import generateRoute from "./routes/generate.route";
import cors from "cors";
import generateImageRoute from "./routes/generateImage.route";
import shareStory from "./routes/shareStory.route";
import internalRoute from "./routes/internal.route";
import favicon from "serve-favicon";
import path from "path";

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

app.use(express.json());

let CLIENT_URL: string | string[] | undefined;

if (process.env.ENV_ARG === "DEV") {
  CLIENT_URL = process.env.CLIENT_URL_DEV;
} else {
  CLIENT_URL = process.env.CLIENT_URLS_PRD
    ? process.env.CLIENT_URLS_PRD.split(",")
    : [];
}

console.log("Origens CORS permitidas:", CLIENT_URL);

app.use(
  cors({
    origin: CLIENT_URL,
    methods: "GET,POST",
    credentials: true,
  })
);

app.use(function (req, res, next) {
  let isOriginAllowed = false;
  const requestOrigin = req.headers.origin;

  if (requestOrigin && CLIENT_URL) {
    // Verifica se ambos existem
    if (typeof CLIENT_URL === "string") {
      isOriginAllowed = requestOrigin === CLIENT_URL;
    } else if (Array.isArray(CLIENT_URL)) {
      isOriginAllowed = CLIENT_URL.includes(requestOrigin);
    }
  } else if (!requestOrigin) {
    isOriginAllowed = false;
  }

  if (
    isOriginAllowed ||
    req.url.startsWith("/shareStory") ||
    req.url.startsWith("/favicon.ico") ||
    req.url.startsWith("/internal")
  ) {
    next();
  } else {
    console.warn(
      `Blocked by custom middleware. Origin: ${requestOrigin}, Allowed: ${CLIENT_URL}, URL: ${req.url}`
    ); // Log para debug
    res
      .status(401)
      .send(
        `Access denied. Origin not permitted. Your IP: ${
          req.headers["X-Forwarded-For"] || req.socket.remoteAddress
        }`
      );
  }
});

app.use("/generate", generateRoute);
app.use("/generateImage", generateImageRoute);
app.use("/shareStory", shareStory);
app.use("/internal", internalRoute);
app.use(express.static("public"));

// Favicon
// Set the view engine to EJS
app.set("view engine", "ejs");
// Serve the favicon
app.use(favicon(path.join(__dirname, "..", "public", "favicon.ico")));
// Serve static files from the public folder
app.use(express.static(path.join(__dirname, "public")));

// Default get
app.get("/", (_req: Request, res: Response) => {
  res.send("Express + Typescript Server");
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err.message) {
    res.status(500).send(err.message);
  } else {
    res.status(500).send(err);
  }
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
