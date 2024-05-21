import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

const playerRateLimit = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 750,
  message: 'Too many requests from this IP, please try again later.',
  statusCode: 429,
  skip: (req: CustomRequest) => req.skipRateLimit || false,
});

const guildRateLimit = rateLimit({
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

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Official JavaScript implementation of the Reforged Public API',
    docs: 'https://docs.reforged.world',
  });
});

app.get("/v1", (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Official JavaScript implementation of the Reforged Public API',
    docs: 'https://docs.reforged.world',
    request: {
      timestamp: new Date().toISOString(),
      version: 1,
    },
  });
});

app.get('/v1/players', checkOrigin, playerRateLimit, async (req: CustomRequest, res: Response) => {
  try {
    const data = await prisma.aUTH.findMany({
      select: {
        NICKNAME: true,
        UUID: true,
        mmoprofiles_playerdata: { select: { data: true } }
      },
      orderBy: { REGDATE: 'desc' }
    });

    const modifiedData = data.map(user => {
      const profilesData = user.mmoprofiles_playerdata?.data;
      const parsedProfiles = profilesData ? JSON.parse(profilesData) : null;
      const profiles = parsedProfiles ? parsedProfiles.Profiles : null;

      const extractedProfiles = profiles ? Object.fromEntries(
        Object.entries(profiles).map(([profileId, profileData]: any) => [
          profileId,
          { name: profileData.Name }
        ])
      ) : null;

      return {
        username: user.NICKNAME,
        uuid: user.UUID,
        profiles: extractedProfiles
      };
    });

    res.status(200).json({
      players: modifiedData,
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
    const data = await prisma.aUTH.findMany({
      where: { NICKNAME: username },
      select: {
        NICKNAME: true,
        UUID: true,
        mmoprofiles_playerdata: { select: { data: true } }
      }
    });

    const mmocoreData = await prisma.mmocore_playerdata.findMany();

    const modifiedData = data.map(user => {
      const profilesData = user.mmoprofiles_playerdata?.data;
      const parsedProfiles = profilesData ? JSON.parse(profilesData) : null;
      const profiles = parsedProfiles ? parsedProfiles.Profiles : null;

      const extractedProfiles = profiles ? Object.fromEntries(
        Object.entries(profiles).map(([profileId, profileData]: any) => {
          const mmocoreProfile = mmocoreData.find(p => p.uuid === profileId);
          const attributes = mmocoreProfile?.attributes ? JSON.parse(mmocoreProfile.attributes) : null;
          const professions = mmocoreProfile?.professions ? JSON.parse(mmocoreProfile.professions) : null;

          return [
            profileId,
            {
              name: profileData.Name,
              class: mmocoreProfile?.class || null,
              attributes: attributes,
              professions: professions
            }
          ];
        })
      ) : null;

      return {
        username: user.NICKNAME,
        uuid: user.UUID,
        profiles: extractedProfiles
      };
    });

    if (modifiedData.length > 0) {
      res.status(200).json({
        player: modifiedData[0],
        request: {
          timestamp: new Date().toISOString(),
          version: 1
        }
      });
    } else {
      res.status(400).json({ error: `Player ${username} not found` });
    }
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
    const data = await prisma.aUTH.findMany({
      where: { NICKNAME: username },
      select: {
        NICKNAME: true,
        UUID: true,
        mmoprofiles_playerdata: { select: { data: true } }
      }
    });

    const mmocoreData = await prisma.mmocore_playerdata.findMany();

    const modifiedData = data.map(user => {
      const profilesData = user.mmoprofiles_playerdata?.data;
      const parsedProfiles = profilesData ? JSON.parse(profilesData) : null;
      const profiles = parsedProfiles ? parsedProfiles.Profiles : null;

      const extractedProfiles = profiles ? Object.fromEntries(
        Object.entries(profiles).map(([profileId, profileData]: any) => {
          const mmocoreProfile = mmocoreData.find(p => p.uuid === profileId);
          const attributes = mmocoreProfile?.attributes ? JSON.parse(mmocoreProfile.attributes) : null;
          const professions = mmocoreProfile?.professions ? JSON.parse(mmocoreProfile.professions) : null;

          return [
            profileId,
            {
              name: profileData.Name,
              class: mmocoreProfile?.class || null,
              attributes: attributes,
              professions: professions
            }
          ];
        })
      ) : null;

      return {
        username: user.NICKNAME,
        uuid: user.UUID,
        profiles: extractedProfiles
      };
    });

    if (modifiedData.length > 0) {
      const playerData = modifiedData[0];
      const profileData = playerData.profiles?.[profile] || null;

      if (profileData) {
        const response = {
          player: {
            username: playerData.username,
            uuid: playerData.uuid,
            profile: {
              [profile]: profileData
            }
          },
          request: {
            timestamp: new Date().toISOString(),
            version: 1
          }
        };
        res.status(200).json(response);
      } else {
        res.status(400).json({ error: `Profile ${profile} not found for player ${username}` });
      }
    } else {
      res.status(400).json({ error: `player ${username} not found` });
    }
  } catch (error) {
    res.status(500).json({
      error: `An error occurred while fetching /v1/player/${username}/${profile}`,
      details: error
    });
  }
});

app.get('/v1/guilds', checkOrigin, guildRateLimit, async (req: CustomRequest, res: Response) => {
  try {
    const data = await prisma.guilds_guild.findMany({
      select: { data: true },
    });

    const beautifiedData = data.map((item: any) => {
      return JSON.parse(item.data);
    });

    res.status(200).json({
      guilds: beautifiedData,
      request: {
        timestamp: new Date().toISOString(),
        version: 1
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'An error occurred while fetching /v1/guilds',
      details: error,
    });
  }
});

app.get('/v1/guild/:name', checkOrigin, guildRateLimit, async (req: CustomRequest, res: Response) => {
  const { name } = req.params;

  try {
    const allGuilds = await prisma.guilds_guild.findMany({
      select: { data: true },
    });

    const guild: any = allGuilds.map((item: any) => JSON.parse(item.data)).find((g: any) => g.name === name);

    if (guild) {
      res.status(200).json({
        guild: guild,
        request: {
          timestamp: new Date().toISOString(),
          version: 1
        }
      });
    } else {
      res.status(400).json({ error: `Guild ${name} not found` });
    }
  } catch (error) {
    res.status(500).json({
      error: `An error occurred while fetching /v1/guild/${name}`,
      details: error,
    });
  }
});

app.get('/v1/leaderboard/players/:category', checkOrigin, leaderboardRateLimit, async (req: CustomRequest, res: Response) => {
  const { category } = req.params;

  try {
    const data = await prisma.guilds_guild.findMany({
      select: { data: true },
    });

    if (data) {
      res.status(200).json({
        [category]: data,
        request: {
          timestamp: new Date().toISOString(),
          version: 1
        }
      });
    } else {
      res.status(400).json({ error: `Category ${category} not found` });
    }
  } catch (error) {
    res.status(500).json({
      error: `An error occurred while fetching /v1/leaderboard/players/${category}`,
      details: error,
    });
  }
});

app.get('/v1/leaderboard/guilds/:category', checkOrigin, leaderboardRateLimit, async (req: CustomRequest, res: Response) => {
  const { category } = req.params;

  try {
    const data = await prisma.guilds_guild.findMany({
      select: { data: true },
    });

    if (data) {
      res.status(200).json({
        [category]: data,
        request: {
          timestamp: new Date().toISOString(),
          version: 1
        }
      });
    } else {
      res.status(400).json({ error: `Category ${category} not found` });
    }
  } catch (error) {
    res.status(500).json({
      error: `An error occurred while fetching /v1/leaderboard/guilds/${category}`,
      details: error,
    });
  }
});

app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found'
  });
});

app.listen(port, () => {
  console.log(`[server] server is running at http://localhost:${port}`);
});
