import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  Stat,
  StatLabel,
  StatNumber,
} from "@chakra-ui/react";
import config from "./config";
import OwnStatsStyles from "./OwnStats.module.css";

// Define the interface for the player stats
interface PlayerStats {
  username: string;
  avgKillsPerGame: number;
  avgDeathsPerGame: number;
  avgAssistsPerGame: number;
  avgCombatScorePerGame: number;
  avgHeadShotRatio: number;
  avgFirstBloodsPerGame: number;
  mostPlayedMap: string;
  mostPlayedAgent: string;
  mostUsedWeapon: string;
  defenderWinRate: number;
  attackerWinRate: number;
}

const PlayerStats: React.FC = () => {
  const [stats, setStats] = useState<PlayerStats | null>(null);

  useEffect(() => {
    // Fetch the player stats from the backend
    const fetchStats = async () => {
      try {
        const response = await fetch(config.apiUrl + "/player-stats");
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error("Error fetching player stats:", error);
      }
    };

    fetchStats();
  }, []);

  if (!stats) {
    return <Text>Loading...</Text>;
  }

  return (
    <Box className={OwnStatsStyles.container}>
      <Box className={OwnStatsStyles.box}>
        <Heading as="h1" size="xl" className={OwnStatsStyles.heading}>
          Player Stats
        </Heading>
        <VStack spacing={4} align="start">
          <Stat className={OwnStatsStyles.stat}>
            <StatLabel className={OwnStatsStyles.statLabel}>Username</StatLabel>
            <StatNumber className={OwnStatsStyles.statNumber}>
              {stats.username}
            </StatNumber>
          </Stat>
          <Stat className={OwnStatsStyles.stat}>
            <StatLabel className={OwnStatsStyles.statLabel}>
              Avg Kills per Game
            </StatLabel>
            <StatNumber className={OwnStatsStyles.statNumber}>
              {stats.avgKillsPerGame}
            </StatNumber>
          </Stat>
          <Stat className={OwnStatsStyles.stat}>
            <StatLabel className={OwnStatsStyles.statLabel}>
              Avg Deaths per Game
            </StatLabel>
            <StatNumber className={OwnStatsStyles.statNumber}>
              {stats.avgDeathsPerGame}
            </StatNumber>
          </Stat>
          <Stat className={OwnStatsStyles.stat}>
            <StatLabel className={OwnStatsStyles.statLabel}>
              Avg Assists per Game
            </StatLabel>
            <StatNumber className={OwnStatsStyles.statNumber}>
              {stats.avgAssistsPerGame}
            </StatNumber>
          </Stat>
          <Stat className={OwnStatsStyles.stat}>
            <StatLabel className={OwnStatsStyles.statLabel}>
              Avg Combat Score per Game
            </StatLabel>
            <StatNumber className={OwnStatsStyles.statNumber}>
              {stats.avgCombatScorePerGame}
            </StatNumber>
          </Stat>
          <Stat className={OwnStatsStyles.stat}>
            <StatLabel className={OwnStatsStyles.statLabel}>
              Avg Head Shot Ratio
            </StatLabel>
            <StatNumber className={OwnStatsStyles.statNumber}>
              {stats.avgHeadShotRatio}
            </StatNumber>
          </Stat>
          <Stat className={OwnStatsStyles.stat}>
            <StatLabel className={OwnStatsStyles.statLabel}>
              Avg First Bloods per Game
            </StatLabel>
            <StatNumber className={OwnStatsStyles.statNumber}>
              {stats.avgFirstBloodsPerGame}
            </StatNumber>
          </Stat>
          <Stat className={OwnStatsStyles.stat}>
            <StatLabel className={OwnStatsStyles.statLabel}>
              Most Played Map
            </StatLabel>
            <StatNumber className={OwnStatsStyles.statNumber}>
              {stats.mostPlayedMap}
            </StatNumber>
          </Stat>
          <Stat className={OwnStatsStyles.stat}>
            <StatLabel className={OwnStatsStyles.statLabel}>
              Most Played Agent
            </StatLabel>
            <StatNumber className={OwnStatsStyles.statNumber}>
              {stats.mostPlayedAgent}
            </StatNumber>
          </Stat>
          <Stat className={OwnStatsStyles.stat}>
            <StatLabel className={OwnStatsStyles.statLabel}>
              Most Used Weapon
            </StatLabel>
            <StatNumber className={OwnStatsStyles.statNumber}>
              {stats.mostUsedWeapon}
            </StatNumber>
          </Stat>
          <Stat className={OwnStatsStyles.stat}>
            <StatLabel className={OwnStatsStyles.statLabel}>
              Defender Win Rate
            </StatLabel>
            <StatNumber className={OwnStatsStyles.statNumber}>
              {stats.defenderWinRate}%
            </StatNumber>
          </Stat>
          <Stat className={OwnStatsStyles.stat}>
            <StatLabel className={OwnStatsStyles.statLabel}>
              Attacker Win Rate
            </StatLabel>
            <StatNumber className={OwnStatsStyles.statNumber}>
              {stats.attackerWinRate}%
            </StatNumber>
          </Stat>
        </VStack>
      </Box>
    </Box>
  );
};

export default PlayerStats;
