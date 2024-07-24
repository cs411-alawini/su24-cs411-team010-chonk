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

// Mock data for different time spans
const mockStats = {
  overall: {
    // overall
    username: "testuser",
    avgKillsPerGame: 15.5,
    avgDeathsPerGame: 8.3,
    avgAssistsPerGame: 5.2,
    avgCombatScorePerGame: 250.0,
    avgHeadShotRatio: 45.6,
    avgFirstBloodsPerGame: 3.1,
    mostPlayedMap: "Bind",
    mostPlayedAgent: "Jett",
    mostUsedWeapon: "Vandal",
    defenderWinRate: 52.5,
    attackerWinRate: 47.5,
  },
  "3months": {
    // 3 months
    username: "testuser1",
    avgKillsPerGame: 14.5,
    avgDeathsPerGame: 7.8,
    avgAssistsPerGame: 5.0,
    avgCombatScorePerGame: 245.0,
    avgHeadShotRatio: 46.0,
    avgFirstBloodsPerGame: 2.9,
    mostPlayedMap: "Haven",
    mostPlayedAgent: "Sova",
    mostUsedWeapon: "Phantom",
    defenderWinRate: 54.0,
    attackerWinRate: 49.0,
  },
  "6months": {
    // 6 months
    username: "testuser2",
    avgKillsPerGame: 16.0,
    avgDeathsPerGame: 8.0,
    avgAssistsPerGame: 5.3,
    avgCombatScorePerGame: 260.0,
    avgHeadShotRatio: 44.0,
    avgFirstBloodsPerGame: 3.2,
    mostPlayedMap: "Ascent",
    mostPlayedAgent: "Phoenix",
    mostUsedWeapon: "Operator",
    defenderWinRate: 51.0,
    attackerWinRate: 45.0,
  },
  "1year": {
    // 1 year
    username: "testuser3",
    avgKillsPerGame: 15.0,
    avgDeathsPerGame: 8.5,
    avgAssistsPerGame: 5.1,
    avgCombatScorePerGame: 255.0,
    avgHeadShotRatio: 43.0,
    avgFirstBloodsPerGame: 3.0,
    mostPlayedMap: "Split",
    mostPlayedAgent: "Raze",
    mostUsedWeapon: "Sheriff",
    defenderWinRate: 50.0,
    attackerWinRate: 48.0,
  },
};

const PlayerStats: React.FC = () => {
  const [timeSpan, setTimeSpan] = useState<String>("overall");
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // const fetchStats = async (timeSpan: number) => {
  //     setLoading(true);
  //     try {
  //       const response = await fetch(`${config.apiUrl}/player-stats?timespan=${timeSpan}`);
  //       if (!response.ok) {
  //         throw new Error('Network response was not ok');
  //       }
  //       const data = await response.json();
  //       setStats(data);
  //     } catch (error) {
  //       console.error('Error fetching player stats:', error);
  //     } finally {
  //       setLoading(false);
  //     }
  // };

  useEffect(() => {
    // if (mockStats[timeSpan]) {
    //   setStats(mockStats[timeSpan]);
    // } else {
    //   fetchStats(timeSpan);
    // }
    setStats(mockStats[timeSpan]);
  }, [timeSpan]);

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (!stats) {
    return <Text>No data available</Text>;
  }

  return (
    <Box className={OwnStatsStyles.container}>
      <Box className={OwnStatsStyles.box}>
        <Heading as="h1" size="xl" className={OwnStatsStyles.heading}>
          Player Stats
        </Heading>
        <HStack spacing={4} justifyContent="center" mb={6}>
          <Button colorScheme="teal" onClick={() => setTimeSpan("overall")}>
            Overall
          </Button>
          <Button colorScheme="teal" onClick={() => setTimeSpan("3months")}>
            3 Months
          </Button>
          <Button colorScheme="teal" onClick={() => setTimeSpan("6months")}>
            6 Months
          </Button>
          <Button colorScheme="teal" onClick={() => setTimeSpan("1year")}>
            1 Year
          </Button>
        </HStack>
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
