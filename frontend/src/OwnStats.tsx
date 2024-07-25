import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  Stat,
  StatLabel,
  StatNumber,
  Button,
  HStack,
  useDisclosure,
  Image,
} from "@chakra-ui/react";
import config from "./config";
import OwnStatsGraph from "./OwnStatsGraph.tsx";
import ValoEmblem from "./assets/ValoEmblem.png";

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

// Mock monthly data for graphing
const mockMonthlyData = [
  {
    month: "Jan",
    avgKillsPerGame: 12,
    avgDeathsPerGame: 6,
    avgAssistsPerGame: 4,
  },
  {
    month: "Feb",
    avgKillsPerGame: 15,
    avgDeathsPerGame: 8,
    avgAssistsPerGame: 5,
  },
  {
    month: "Mar",
    avgKillsPerGame: 17,
    avgDeathsPerGame: 7,
    avgAssistsPerGame: 6,
  },
  {
    month: "Apr",
    avgKillsPerGame: 14,
    avgDeathsPerGame: 9,
    avgAssistsPerGame: 5,
  },
  {
    month: "May",
    avgKillsPerGame: 16,
    avgDeathsPerGame: 8,
    avgAssistsPerGame: 6,
  },
  {
    month: "Jun",
    avgKillsPerGame: 18,
    avgDeathsPerGame: 7,
    avgAssistsPerGame: 7,
  },
  {
    month: "Jul",
    avgKillsPerGame: 20,
    avgDeathsPerGame: 9,
    avgAssistsPerGame: 8,
  },
  {
    month: "Aug",
    avgKillsPerGame: 15,
    avgDeathsPerGame: 8,
    avgAssistsPerGame: 5,
  },
  {
    month: "Sep",
    avgKillsPerGame: 19,
    avgDeathsPerGame: 9,
    avgAssistsPerGame: 7,
  },
  {
    month: "Oct",
    avgKillsPerGame: 21,
    avgDeathsPerGame: 10,
    avgAssistsPerGame: 9,
  },
  {
    month: "Nov",
    avgKillsPerGame: 22,
    avgDeathsPerGame: 11,
    avgAssistsPerGame: 10,
  },
  {
    month: "Dec",
    avgKillsPerGame: 24,
    avgDeathsPerGame: 12,
    avgAssistsPerGame: 11,
  },
];

const PlayerStats: React.FC = () => {
  const [timeSpan, setTimeSpan] = useState<String>("overall");
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [modalData, setModalData] = useState<any[]>([]);
  const [modalTitle, setModalTitle] = useState<string>("");
  const [modalDataKey, setModalDataKey] = useState<string>("");

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
  const handleGraphOpen = (dataKey: string, title: string) => {
    setModalData(mockMonthlyData);
    setModalTitle(title);
    setModalDataKey(dataKey);
    onOpen();
  };

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (!stats) {
    return <Text>No data available</Text>;
  }
  return (
    <Box style={{ padding: "20px", backgroundColor: "#2d3748" }}>
      <Box
        style={{
          backgroundColor: "#1a202c",
          borderRadius: "10px",
          padding: "20px",
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
        }}
      >
        <HStack>
          <Image
            src={ValoEmblem}
            alt="Valo Emblem"
            boxSize="70px"
            objectFit="contain"
          />
          <Heading
            as="h1"
            size="xl"
            style={{ marginBottom: "20px", color: "white" }}
          >
            Player Stats
          </Heading>
        </HStack>

        <HStack spacing={4} justifyContent="center" marginBottom={6}>
          <Button variant="valoRed" onClick={() => setTimeSpan("overall")}>
            Overall
          </Button>
          <Button variant="valoRed" onClick={() => setTimeSpan("3months")}>
            3 Months
          </Button>
          <Button variant="valoRed" onClick={() => setTimeSpan("6months")}>
            6 Months
          </Button>
          <Button variant="valoRed" onClick={() => setTimeSpan("1year")}>
            1 Year
          </Button>
        </HStack>

        <VStack spacing={4} align="start">
          <HStack spacing={2}>
            <Stat>
              <StatLabel style={{ color: "white" }}>Username</StatLabel>
              <StatNumber style={{ color: "white" }}>
                {stats.username}
              </StatNumber>
            </Stat>
          </HStack>

          <HStack spacing="90px">
            <Stat>
              <StatLabel style={{ color: "white" }}>
                Avg Kills per Game
              </StatLabel>
              <StatNumber style={{ color: "white" }}>
                {stats.avgKillsPerGame}
              </StatNumber>
            </Stat>
            <Button
              onClick={() =>
                handleGraphOpen("avgKillsPerGame", "Average Kills per Game")
              }
            >
              Graph
            </Button>
          </HStack>

          <HStack spacing="70px">
            <Stat>
              <StatLabel style={{ color: "white" }}>
                Avg Deaths per Game
              </StatLabel>
              <StatNumber style={{ color: "white" }}>
                {stats.avgDeathsPerGame}
              </StatNumber>
            </Stat>
            <Button
              onClick={() =>
                handleGraphOpen("avgDeathsPerGame", "Average Deaths per Game")
              }
            >
              Graph
            </Button>
          </HStack>

          <HStack spacing="70px">
            <Stat>
              <StatLabel style={{ color: "white" }}>
                Avg Assists per Game
              </StatLabel>
              <StatNumber style={{ color: "white" }}>
                {stats.avgAssistsPerGame}
              </StatNumber>
            </Stat>
            <Button
              onClick={() =>
                handleGraphOpen("avgAssistsPerGame", "Average Assists per Game")
              }
            >
              Graph
            </Button>
          </HStack>

          <HStack spacing="25px">
            <Stat>
              <StatLabel style={{ color: "white" }}>
                Avg Combat Score per Game
              </StatLabel>
              <StatNumber style={{ color: "white" }}>
                {stats.avgCombatScorePerGame}
              </StatNumber>
            </Stat>
            <Button
              onClick={() =>
                handleGraphOpen(
                  "avgCombatScorePerGame",
                  "Average Combat Score per Game"
                )
              }
            >
              Graph
            </Button>
          </HStack>

          <HStack spacing="76px">
            <Stat>
              <StatLabel style={{ color: "white" }}>
                Avg Head Shot Ratio
              </StatLabel>
              <StatNumber style={{ color: "white" }}>
                {stats.avgHeadShotRatio}
              </StatNumber>
            </Stat>
            <Button
              onClick={() =>
                handleGraphOpen("avgHeadShotRatio", "Average Head Shot Ratio")
              }
            >
              Graph
            </Button>
          </HStack>

          <HStack spacing="40px">
            <Stat>
              <StatLabel style={{ color: "white" }}>
                Avg First Bloods per Game
              </StatLabel>
              <StatNumber style={{ color: "white" }}>
                {stats.avgFirstBloodsPerGame}
              </StatNumber>
            </Stat>
            <Button
              onClick={() =>
                handleGraphOpen(
                  "avgFirstBloodsPerGame",
                  "Average First Bloods per Game"
                )
              }
            >
              Graph
            </Button>
          </HStack>

          <HStack spacing={2}>
            <Stat>
              <StatLabel style={{ color: "white" }}>Most Played Map</StatLabel>
              <StatNumber style={{ color: "white" }}>
                {stats.mostPlayedMap}
              </StatNumber>
            </Stat>
          </HStack>

          <HStack spacing={2}>
            <Stat>
              <StatLabel style={{ color: "white" }}>
                Most Played Agent
              </StatLabel>
              <StatNumber style={{ color: "white" }}>
                {stats.mostPlayedAgent}
              </StatNumber>
            </Stat>
          </HStack>

          <HStack spacing={2}>
            <Stat>
              <StatLabel style={{ color: "white" }}>Most Used Weapon</StatLabel>
              <StatNumber style={{ color: "white" }}>
                {stats.mostUsedWeapon}
              </StatNumber>
            </Stat>
          </HStack>

          <HStack spacing={2}>
            <Stat>
              <StatLabel style={{ color: "white" }}>
                Defender Win Rate
              </StatLabel>
              <StatNumber style={{ color: "white" }}>
                {stats.defenderWinRate}%
              </StatNumber>
            </Stat>
          </HStack>

          <HStack spacing={2}>
            <Stat>
              <StatLabel style={{ color: "white" }}>
                Attacker Win Rate
              </StatLabel>
              <StatNumber style={{ color: "white" }}>
                {stats.attackerWinRate}%
              </StatNumber>
            </Stat>
          </HStack>
        </VStack>
      </Box>
      <OwnStatsGraph
        isOpen={isOpen}
        onClose={onClose}
        data={modalData}
        title={modalTitle}
        dataKey={modalDataKey}
      />
    </Box>
  );
};

export default PlayerStats;
