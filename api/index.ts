import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import sequelize from './db';
import Profile from './profile';

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

sequelize.sync({ force: false }).then(() => {
  console.log('[server] database and tables created');
});

app.get("/", (req: Request, res: Response) => {
  res.send("Official Javascript implementation of the Reforged Public API");
});

app.get("/v1/profile", async (req: Request, res: Response) => {
  try {
    const profiles = await Profile.findAll();
    res.json(profiles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while fetching profiles' });
  }
});

app.listen(port, () => {
  console.log(`[server] server is running at http://localhost:${port}`);
});
