import express, { Express, Request, Response } from "express";

const app: Express = express();

app.get("/", (req: Request, res: Response) => {
  res.send("Official Javascript implementation of the Reforged Public API");
});

app.listen(3000, () => {
  console.log("[server]: Server is running at http://localhost:3000")
});

module.exports = app;