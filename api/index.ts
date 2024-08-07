import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import axios from 'axios';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.token as string;

  if (!token) return res.status(401).json({ valid: false, message: 'Token is required' });

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || "", (err, decoded) => {
    if (err) {
      return res.status(403).json({ valid: false, message: 'Invalid token' });
    }
    (req as any).user = decoded;
    next();
  });
};

// ==============================
// Private API
// ==============================

app.post('/auth/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  const user = await prisma.admin.findUnique({
    where: { username: username }
  });

  if (user && await bcrypt.compare(password, user.password)) {
    const accessToken = jwt.sign({ username: user.username }, process.env.ACCESS_TOKEN_SECRET || "", { expiresIn: '7d' });
    res.status(200).json({ accessToken });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/auth/verify', authenticateToken, (req: Request, res: Response) => {
  const user = (req as any).user;

  res.status(200).json({
    signature: user.username,
    valid: true,
    message: 'Token is valid'
  });
});

app.get('/admin/dashboard', authenticateToken, async (req: Request, res: Response) => {
  const luckperms_players = await prisma.luckperms_players.findMany();

  res.status(200).json({
    data: luckperms_players,
  });
});

app.get('/admin/players', authenticateToken, async (req: Request, res: Response) => {
  const aUTH = await prisma.aUTH.findMany({
    select: {
      NICKNAME: true,
      HASH: true,
      IP: true,
      UUID: true,
      LOGINIP: true
    },
    orderBy: {
      REGDATE: 'desc'
    }
  });

  res.status(200).json({
    data: aUTH,
  });
});

app.put('/admin/players/update-password', authenticateToken, async (req: Request, res: Response) => {
  const { nickname, newPassword } = req.body;

  try {
    const player = await prisma.aUTH.findUnique({
      where: { LOWERCASENICKNAME: nickname.toLowerCase() }
    });

    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.aUTH.update({
      where: { LOWERCASENICKNAME: nickname.toLowerCase() },
      data: { HASH: hashedPassword }
    });

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update password' });
  }
});

// ==============================
// Public API
// ==============================

interface CustomRequest extends Request {
  skipRateLimit?: boolean;
}

const checkOrigin = (req: CustomRequest, res: Response, next: NextFunction) => {
  const allowedOrigin = 'https://www.reforged.world';
  const origin = req.get('Origin') || req.get('Referer');
  
  if (origin && origin.startsWith(allowedOrigin)) {
    req.skipRateLimit = true;
  }

  next();
};

const networkRateLimit = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 750,
  message: 'Too many requests from this IP, please try again later.',
  statusCode: 429,
  skip: (req: CustomRequest) => req.skipRateLimit || false,
});

const playerRateLimit = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 750,
  message: 'Too many requests from this IP, please try again later.',
  statusCode: 429,
  skip: (req: CustomRequest) => req.skipRateLimit || false,
});

const townRateLimit = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 750,
  message: 'Too many requests from this IP, please try again later.',
  statusCode: 429,
  skip: (req: CustomRequest) => req.skipRateLimit || false,
});

const nationRateLimit = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 750,
  message: 'Too many requests from this IP, please try again later.',
  statusCode: 429,
  skip: (req: CustomRequest) => req.skipRateLimit || false,
});

const leaderboardRateLimit = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 750,
  message: 'Too many requests from this IP, please try again later.',
  statusCode: 429,
  skip: (req: CustomRequest) => req.skipRateLimit || false,
});

const convertBigIntToString = (obj: any): void => {
  for (const key in obj) {
    if (typeof obj[key] === 'bigint') {
      obj[key] = obj[key].toString();
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      convertBigIntToString(obj[key]);
    }
  }
};

app.get('/v1/network', checkOrigin, networkRateLimit, async (req: CustomRequest, res: Response) => {
  try {
    const playersRegisteredCount = await prisma.aUTH.count();
    const response = await axios.get("https://api.mcstatus.io/v2/status/java/play.reforged.world");
    const playersOnline = response.data.players.online;
    const isOnline = response.data.online;

    res.status(200).json({
      network: {
        players_online: isOnline ? playersOnline : 0,
        players_registered: playersRegisteredCount || 0
      },
      request: {
        timestamp: new Date().toISOString(),
        version: 1
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'An error occurred while fetching /v1/network',
      details: error,
    });
  }
});

app.get('/v1/players', checkOrigin, playerRateLimit, async (req: CustomRequest, res: Response) => {
  try {
    const luckPermsPlayers = await prisma.luckperms_players.findMany();

    res.status(200).json({
      players: luckPermsPlayers,
      request: {
        timestamp: new Date().toISOString(),
        version: 1
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'An error occurred while fetching /v1/players',
      details: error,
    });
  }
});

app.get('/v1/player/:username', checkOrigin, playerRateLimit, async (req: CustomRequest, res: Response) => {
  const { username } = req.params;

  try {
    const playersData = await prisma.luckperms_players.findMany({
      where: { username },
      select: {
        username: true,
        uuid: true,
        primary_group: true
      }
    });

    const player = playersData[0];
    
    const mmoprofileData = await prisma.mmoprofiles_playerdata.findUnique({
      where: { uuid: player.uuid },
      select: { data: true }
    });

    const mmocoreData = await prisma.mmocore_playerdata.findMany();

    const profilesData = mmoprofileData?.data;
    const parsedProfiles = profilesData ? JSON.parse(profilesData) : null;
    const profiles = parsedProfiles ? parsedProfiles.Profiles : null;

    const extractedProfiles = profiles ? Object.entries(profiles).map(([profileId, profileData]: any) => {
      const mmocoreProfile = mmocoreData.find(p => p.uuid === profileId);

      return {
        name: profileData.Name,
        uuid: mmocoreProfile?.uuid,
        health: profileData.Health,
        exp: profileData.Exp,
        level: mmocoreProfile?.level,
        balance: profileData.Balance,
        class: mmocoreProfile?.class
      };
    }) : [];

    const modifiedData = {
      username: player.username,
      uuid: player.uuid,
      primary_group: player.primary_group,
      profiles: extractedProfiles
    };

    res.status(200).json({
      player: modifiedData,
      request: {
        timestamp: new Date().toISOString(),
        version: 1
      }
    });
  } catch (error) {
    res.status(500).json({
      error: `An error occurred while fetching /v1/player/${username}`,
      details: error,
    });
  }
});

app.get('/v1/player/:username/:profile', checkOrigin, playerRateLimit, async (req: CustomRequest, res: Response) => {
  const { username, profile } = req.params;

  try {
    const playersData = await prisma.luckperms_players.findMany({
      where: { username },
      select: {
        username: true,
        uuid: true,
        primary_group: true
      }
    });

    if (playersData.length === 0) {
      res.status(400).json({ error: `Player ${username} not found` });
      return;
    }

    const player = playersData[0];

    const mmoprofileData = await prisma.mmoprofiles_playerdata.findUnique({
      where: { uuid: player.uuid },
      select: { data: true }
    });

    const mmocoreData = await prisma.mmocore_playerdata.findMany();

    const profilesData = mmoprofileData?.data;
    const parsedProfiles = profilesData ? JSON.parse(profilesData) : null;
    const profiles = parsedProfiles ? parsedProfiles.Profiles : null;

    const extractedProfiles = profiles ? Object.entries(profiles).map(([profileId, profileData]: any) => {
      const mmocoreProfile = mmocoreData.find(p => p.uuid === profileId);
      const attributes = mmocoreProfile?.attributes ? JSON.parse(mmocoreProfile.attributes) : null;
      const professions = mmocoreProfile?.professions ? JSON.parse(mmocoreProfile.professions) : null;

      return {
        name: profileData.Name,
        uuid: mmocoreProfile?.uuid,
        health: profileData.Health,
        exp: profileData.Exp,
        level: mmocoreProfile?.level,
        balance: profileData.Balance,
        class: mmocoreProfile?.class,
        attributes: attributes,
        professions: professions
      };
    }).filter(p => p.uuid === profile) : [];

    const modifiedData = {
      username: player.username,
      uuid: player.uuid,
      primary_group: player.primary_group,
      profile: extractedProfiles.length > 0 ? extractedProfiles[0] : null
    };

    if (modifiedData.profile) {
      res.status(200).json({
        player: modifiedData,
        request: {
          timestamp: new Date().toISOString(),
          version: 1
        }
      });
    } else {
      res.status(400).json({ error: `Player ${username} with profile ${profile} not found` });
    }
  } catch (error) {
    res.status(500).json({
      error: `An error occurred while fetching /v1/player/${username}/${profile}`,
      details: error
    });
  }
});

app.get('/v1/towns', checkOrigin, townRateLimit, async (req: CustomRequest, res: Response) => {
  try {
    const data = await prisma.tOWNY_TOWNS.findMany({
      select: {
        name: true,
        mayor: true,
        nation: true
      }
    });

    data.forEach(convertBigIntToString);

    res.status(200).json({
      towns: data,
      request: {
        timestamp: new Date().toISOString(),
        version: 1
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'An error occurred while fetching /v1/towns',
      details: error,
    });
  }
});

app.get('/v1/town/:town', checkOrigin, townRateLimit, async (req: CustomRequest, res: Response) => {
  const { town } = req.params;

  try {
    const data = await prisma.tOWNY_TOWNS.findMany({
      where: { name: town }
    });

    data.forEach(convertBigIntToString);

    if (data.length > 0) {
      res.status(200).json({
        town: data[0],
        request: {
          timestamp: new Date().toISOString(),
          version: 1
        }
      });
    } else {
      res.status(400).json({ error: `Town ${town} not found` });
    }
  } catch (error) {
    res.status(500).json({
      error: `An error occurred while fetching /v1/town/${town}`,
      details: error,
    });
  }
});

app.get('/v1/nations', checkOrigin, nationRateLimit, async (req: CustomRequest, res: Response) => {
  try {
    const data = await prisma.tOWNY_NATIONS.findMany({
      select: {
        name: true,
        capital: true,
        nationBoard: true
      }
    });

    data.forEach(convertBigIntToString);

    res.status(200).json({
      nations: data,
      request: {
        timestamp: new Date().toISOString(),
        version: 1
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'An error occurred while fetching /v1/nations',
      details: error,
    });
  }
});

app.get('/v1/nation/:nation', checkOrigin, nationRateLimit, async (req: CustomRequest, res: Response) => {
  const { nation } = req.params;

  try {
    const data = await prisma.tOWNY_NATIONS.findMany({
      where: { name: nation }
    });

    data.forEach(convertBigIntToString);

    if (data.length > 0) {
      res.status(200).json({
        nation: data[0],
        request: {
          timestamp: new Date().toISOString(),
          version: 1
        }
      });
    } else {
      res.status(400).json({ error: `Nation ${nation} not found` });
    }
  } catch (error) {
    res.status(500).json({
      error: `An error occurred while fetching /v1/nation/${nation}`,
      details: error,
    });
  }
});

app.get('/v1/leaderboard/players', checkOrigin, leaderboardRateLimit, async (req: CustomRequest, res: Response) => {
  try {
    const data = await prisma.gemseconomy_accounts.findMany({
      select: { nickname: true, balance_data: true },
    });

    const filteredData: any = data.filter(item => {
      const nickname = item?.nickname || "";
      return !nickname.startsWith("town-") && !nickname.startsWith("nation-");
    });

    const transformedData = filteredData.map((item: any) => {
      return {
        player: item?.nickname,
        coins: item.balance_data ? JSON.parse(item.balance_data)['74a5fdc3-fbd1-450d-b0bd-dee39ca28503'] : 0.0
      };
    });

    transformedData.sort((a: any, b: any) => b.coins - a.coins);

    const top10Coins = transformedData.slice(0, 10);

    res.status(200).json({
      players: top10Coins,
      request: {
        timestamp: new Date().toISOString(),
        version: 1
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'An error occurred while fetching /v1/leaderboard/players',
      details: error,
    });
  }
});

app.get('/v1/leaderboard/towns', checkOrigin, leaderboardRateLimit, async (req: CustomRequest, res: Response) => {
  try {
    const data = await prisma.gemseconomy_accounts.findMany({
      where: { nickname: { startsWith: 'town-' } },
      select: { nickname: true, balance_data: true },
    });

    const transformedData = data.map(item => {
      return {
        town: item?.nickname?.replace('town-', ''),
        coins: item.balance_data ? JSON.parse(item.balance_data)['74a5fdc3-fbd1-450d-b0bd-dee39ca28503'] : 0.0
      };
    });

    transformedData.sort((a, b) => b.coins - a.coins);

    const top10Towns = transformedData.slice(0, 10);

    res.status(200).json({
      towns: top10Towns,
      request: {
        timestamp: new Date().toISOString(),
        version: 1
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'An error occurred while fetching /v1/leaderboard/towns',
      details: error,
    });
  }
});

app.get('/v1/leaderboard/nations', checkOrigin, leaderboardRateLimit, async (req: CustomRequest, res: Response) => {
  try {
    const data = await prisma.gemseconomy_accounts.findMany({
      where: { nickname: { startsWith: 'nation-' } },
      select: { nickname: true, balance_data: true },
    });

    const transformedData = data.map(item => {
      return {
        nation: item?.nickname?.replace('nation-', ''),
        coins: item.balance_data ? JSON.parse(item.balance_data)['74a5fdc3-fbd1-450d-b0bd-dee39ca28503'] : 0.0
      };
    });

    transformedData.sort((a, b) => b.coins - a.coins);

    const top10Nations = transformedData.slice(0, 10);

    res.status(200).json({
      nations: top10Nations,
      request: {
        timestamp: new Date().toISOString(),
        version: 1
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'An error occurred while fetching /v1/leaderboard/nations',
      details: error,
    });
  }
});

app.use((req: CustomRequest, res: Response) => {
  res.status(404).json({
    message: 'no Route matched with those values'
  });
});

app.listen(port, () => {
  console.log(`[server] server is running at http://localhost:${port}`);
});
