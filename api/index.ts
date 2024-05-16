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

app.get("/", async (req: Request, res: Response) => {
  try {
    res.status(200).json({
      message: 'Official Javascript implementation of the Reforged Public API',
      docs: 'https://docs.reforged.world'
    });
  } catch (error) {
    res.status(500).json({
      error: 'An error occurred while fetching data',
      details: error
    });
  }
});

app.get('/v1/users', async (req: Request, res: Response) => {
  try {
    const data = await prisma.mmoprofiles_playerdata.findMany();
    if (data) {
      res.status(200).json(data);
    } else {
      res.status(404).json({ error: 'users not found' });
    }
  } catch (error) {
    res.status(500).json({
      error: 'An error occurred while fetching /v1/users',
      details: error
    });
  }
});

app.get('/v1/user/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const data = await prisma.mmoprofiles_playerdata.findUnique({
      where: { uuid: id }
    });
    if (data) {
      res.status(200).json(data);
    } else {
      res.status(404).json({ error: `user ${id} not found` });
    }
  } catch (error) {
    res.status(500).json({
      error: `An error occurred while fetching /v1/user/${id}`,
      details: error
    });
  }
});

app.get('/v1/profiles', async (req: Request, res: Response) => {
  try {
    const data = await prisma.mmocore_playerdata.findMany();
    if (data) {
      res.status(200).json(data);
    } else {
      res.status(404).json({ error: 'profiles not found' });
    }
  } catch (error) {
    res.status(500).json({
      error: 'An error occurred while fetching /v1/profiles',
      details: error
    });
  }
});

app.get('/v1/profile/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const data = await prisma.mmocore_playerdata.findUnique({
      where: { uuid: id }
    });
    if (data) {
      res.status(200).json(data);
    } else {
      res.status(404).json({ error: `profile ${id} not found` });
    }
  } catch (error) {
    res.status(500).json({
      error: `An error occurred while fetching /v1/profile/${id}`,
      details: error
    });
  }
});

app.listen(port, () => {
  console.log(`[server] server is running at http://localhost:${port}`);
});
