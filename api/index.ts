import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
  res.send("Official Javascript implementation of the Reforged Public API");
});

app.get('/v1/profile', async (req, res) => {
  const data = await prisma.mmoprofiles_playerdata.findMany();
  res.json(data);
});

app.listen(port, () => {
  console.log(`[server] server is running at http://localhost:${port}`);
});
