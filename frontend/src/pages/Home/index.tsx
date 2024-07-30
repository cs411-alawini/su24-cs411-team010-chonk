import { BaseSyntheticEvent, useState, useRef } from "react";
import {
  InputGroup,
  Input,
  InputRightElement,
  Button,
  VStack,
  Text,
  Heading,
  Flex,
  useToast,
  FormControl,
  FormErrorMessage,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  InputLeftElement,
  HStack,
  Box,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Spacer,
  createIcon,
  Divider,
  Skeleton,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from "@chakra-ui/react";
import { Link as ReactRouterLink } from "react-router-dom";
import { Link as ChakraLink } from "@chakra-ui/react";
import { AtSignIcon, UnlockIcon } from "@chakra-ui/icons";
import config from "../../config";
import { useQuery } from "react-query";

export const ValorantIcon = createIcon({
  displayName: "ValorantIcon",
  viewBox: "0 0 24 24",
  path: (
    <path
      fill="#FF4655"
      d="m2.2 4 .1.1c.2.3 11.8 14.8 12.8 16v.1a.1.1 0 0 1-.1.1H8.8a.52.52 0 0 1-.4-.2c-.2-.2-4.4-5.4-6.3-7.9A.31.31 0 0 0 2 12V4.1a.349.349 0 0 1 .2-.1Zm19.8.2c0-.1-.1-.1-.1-.2h-.1l-.2.2c-.9 1.1-8.1 10.1-8.3 10.3l-.1.1c0 .1 0 .1.1.1h6.2c.1 0 .2-.1.3-.2l.2-.2c.5-.7 1.7-2.2 1.8-2.3 0-.1 0-.1.1-.2v-.1c.1-2.4.1-4.9.1-7.5Z"
    />
  ),
});

export interface Profile {
  events: Event[];
  points: number;
  role: string;
}

const Home = (): React.ReactElement => {
  const [riotId, setRiotId] = useState("");
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem("token"));
  const [magic, setMagic] = useState([]);
  const [show, setShow] = useState(false);
  const [riotIdError, setRiotIdError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const { isFetching: isFetchingStats, data: statsData } = useQuery({
    queryKey: ["statsData"],
    queryFn: () =>
      fetch(config.apiUrl + "/homepage-stats", {
        headers: { Authorization: "Bearer " + localStorage.token },
      }).then((res) => res.json()),
  });

  const {
    isFetching: isFetchingProfile,
    error: profileError,
    data: profileData,
  } = useQuery({
    queryKey: ["profileData"],
    queryFn: async () => {
      const response = await fetch(config.apiUrl + "/users/me", {
        headers: { Authorization: "Bearer " + localStorage.token },
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        setLoggedIn(false);
      }

      return response.json();
    },
    enabled: !!loggedIn,
  });

  const {
    isFetching: isFetchingAgent,
    error: agentError,
    data: agentData,
  } = useQuery({
    queryKey: ["mostPlayedAgentData"],
    queryFn: () =>
      fetch(config.apiUrl + "/most_played_agent", {
        headers: { Authorization: "Bearer " + localStorage.token },
      }).then((res) => res.json()),
    enabled: !!isFetchingProfile,
  });

  const {
    isFetching: isFetchingMatchData,
    error: matchDataError,
    data: matchData,
  } = useQuery({
    queryKey: ["matchData"],
    queryFn: () =>
      fetch(config.apiUrl + "/matches", {
        headers: { Authorization: "Bearer " + localStorage.token },
      }).then((res) => res.json()),
    enabled: !!isFetchingProfile,
  });

  if (profileError || agentError || matchDataError) {
    localStorage.removeItem("token");
    setLoggedIn(false);
    setMagic([]);
  }

  const toast = useToast();

  const handleClick = () => setShow(!show);

  const handleRiotIdChange = (event: BaseSyntheticEvent) => {
    if (event.target.value === "") {
      setRiotIdError(true);
    } else {
      setRiotId(event.target.value);
      setRiotIdError(false);
    }
  };

  const handlePasswordChange = (event: BaseSyntheticEvent) => {
    if (event.target.value === "") {
      setPasswordError(true);
    } else {
      setPassword(event.target.value);
      setPasswordError(false);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    if (riotIdError || passwordError) {
      return;
    }

    const formData = new FormData();
    formData.append("username", riotId);
    formData.append("password", password);

    const response = await fetch(config.apiUrl + "/token", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("token", data.access_token);
      setLoggedIn(true);
    } else {
      toast({
        title: "Login failed",
        status: "error",
        position: "top",
        duration: 5000,
      });
    }
  };

  const handleUpdateInfo = async (): Promise<void> => {
    if (!loggedIn) {
      return;
    }

    const response = await fetch(config.apiUrl + "/update_user_data", {
      headers: { Authorization: "Bearer " + localStorage.token ,method: "POST"},
    });

    const data = await response.json();

    if (data.success === true) {
      window.location.reload();
    } else {
      toast({
        title: "Update failed",
        status: "error",
        position: "top",
        duration: 5000,
      });
    }
  };

  const handleMagic = async (): Promise<void> => {
    if (!loggedIn) {
      return;
    }

    const response = await fetch(config.apiUrl + "/model_matches", {
      headers: { Authorization: "Bearer " + localStorage.token },
    });

    const data = await response.json();

    if (response.ok) {
      setMagic(data);
    } else {
      toast({
        title: "Magic failed",
        status: "error",
        position: "top",
        duration: 5000,
      });
    }
  };

  const handleLogout = (): void => {
    localStorage.removeItem("token");
    setLoggedIn(false);
    setMagic([]);
  };

  const [isOpen, setIsOpen] = useState(false);
  const onClose = () => setIsOpen(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  
  const handleDeleteConfirm = () => {
    setIsOpen(false);
    handleDelete();
  };

  const handleDelete = async (): Promise<void> => {
    console.log("Attempting to delete account");
    
    try {
      const response = await fetch(`${config.apiUrl}/delete_user`, {
        method: "POST",
        headers: {"Authorization": `Bearer ${localStorage.token}`}
      });
      
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
  
      const data = await response.json();
      console.log("Delete account response:", data);
  
      if (data.status === "success") {
        alert("Account deleted successfully.");
      } else {
        alert("Failed to delete account. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("An error occurred while trying to delete the account. Please try again.");
    }
  }

  return (
    <Flex minH={"100vh"} align={"center"} justify={"center"}>
      <VStack align="unset" spacing={8}>
        <HStack>
          <ValorantIcon boxSize={10}></ValorantIcon>
          <Heading size="lg">Valorant Stats</Heading>
          <Spacer />
          {loggedIn ? (
            <HStack>
              <Button onClick={handleUpdateInfo}>Refresh Data</Button>
              <Button onClick={() => setIsOpen(true)}>Delete Account</Button>
              <Button onClick={handleLogout}>Log Out</Button>
            </HStack>
          ) : null}
        </HStack>

        <HStack>
          <VStack minWidth={"30vw"}>
            {loggedIn ? (
              <Skeleton isLoaded={!isFetchingAgent && !isFetchingProfile}>
                <Text>
                  Welcome back, <b>{profileData?.username}</b>!
                </Text>
                {agentData?.most_played_agent ? (
                  <Text>
                    Your most played agent is:{" "}
                    <b>{agentData?.most_played_agent}</b>
                  </Text>
                ) : null}
                <Box paddingTop={2}>
                  <ChakraLink as={ReactRouterLink} to="/own-stats">
                    <Button minWidth={"20vw"} bgColor="#FF4655">
                      View stats
                    </Button>
                  </ChakraLink>
                </Box>
              </Skeleton>
            ) : (
              <Box>
                <FormControl isInvalid={riotIdError}>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <AtSignIcon color="gray.300" />
                    </InputLeftElement>
                    <Input
                      placeholder="Riot ID"
                      onChange={handleRiotIdChange}
                    />
                  </InputGroup>
                  <FormErrorMessage>Riot ID is required.</FormErrorMessage>
                </FormControl>
                <FormControl isInvalid={passwordError} paddingTop={2}>
                  <InputGroup>
                    <InputLeftElement pointerEvents="none">
                      <UnlockIcon color="gray.300" />
                    </InputLeftElement>
                    <Input
                      placeholder="Password"
                      type={show ? "text" : "password"}
                      onChange={handlePasswordChange}
                    />
                    <InputRightElement width="4.5rem">
                      <Button h="1.75rem" size="sm" onClick={handleClick}>
                        {show ? "Hide" : "Show"}
                      </Button>
                    </InputRightElement>
                  </InputGroup>

                  <InputGroup size="md"></InputGroup>
                  <FormErrorMessage>Password is required.</FormErrorMessage>
                </FormControl>
                <Box paddingTop={2}>
                  <Button
                    minWidth={"20vw"}
                    bgColor="#FF4655"
                    onClick={handleSubmit}
                  >
                    Login
                  </Button>
                </Box>
              </Box>
            )}
          </VStack>

          <Spacer />

          <Stat>
            <StatLabel>Best Agent</StatLabel>
            <Skeleton isLoaded={!isFetchingStats}>
              <StatNumber>{statsData?.best_agent.agent_name}</StatNumber>
              <StatHelpText>
                {Number(statsData?.best_agent.kd.toFixed(2))} KD
              </StatHelpText>
            </Skeleton>
          </Stat>

          <Stat>
            <StatLabel>Most Used Weapon</StatLabel>
            <Skeleton isLoaded={!isFetchingStats}>
              <StatNumber>{statsData?.best_weapon.weapon_name}</StatNumber>
              <StatHelpText>
                {statsData?.best_weapon.game_count} Games
              </StatHelpText>
            </Skeleton>
          </Stat>

          <Stat>
            <StatLabel>Most Played Map</StatLabel>
            <Skeleton isLoaded={!isFetchingStats}>
              <StatNumber>{statsData?.best_map.map_name}</StatNumber>
              <StatHelpText>
                {statsData?.best_map.game_count} Games
              </StatHelpText>
            </Skeleton>
          </Stat>
        </HStack>

        <Divider></Divider>
        {loggedIn ? (
          <Skeleton isLoaded={!isFetchingMatchData && !isFetchingProfile}>
            <VStack align="unset" minWidth={"70vw"}>
              <HStack>
                <Heading size="md">Match History</Heading>
                <Spacer></Spacer>
                <Button onClick={handleMagic}>Magic ✨</Button>
              </HStack>
              <Spacer />
              <Text>
                Click the magic button to see your calculated win rate
                percentage!
              </Text>

              <TableContainer>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Date</Th>
                      <Th>Agent Name</Th>
                      <Th>Map Name</Th>
                      <Th>Kills</Th>
                      <Th>Deaths</Th>
                      <Th>Assists</Th>
                      <Th>ACS</Th>
                      <Th>Headshot Ratio</Th>
                      <Th>First Kills</Th>
                      <Th>First Deaths</Th>
                      {magic.length > 0 ? <Th>Magic</Th> : null}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {matchData?.map((match: any, idx: number) => (
                      <Tr key={idx}>
                        <Td>{match.date_info.split(" ")[0]}</Td>
                        <Td>{match.agent_name}</Td>
                        <Td>{match.map_name}</Td>
                        <Td>{match.kills}</Td>
                        <Td>{match.deaths}</Td>
                        <Td>{match.assists}</Td>
                        <Td>{match.average_combat_score}</Td>
                        <Td>{match.headshot_ratio}%</Td>
                        <Td>{match.first_kills}</Td>
                        <Td>{match.first_deaths}</Td>
                        {magic.length > 0 ? (
                          <Td>{Number(magic[idx] * 100).toFixed(2)}%</Td>
                        ) : null}
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </VStack>
          </Skeleton>
        ) : (
          <VStack align="unset" minWidth={"70vw"}>
            <Heading size="md">Current Top Agents</Heading>
            <Text>
              Find out which Agents perform best based on their win rates, pick
              rates, average scores, and more.
            </Text>
            <Spacer />

            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Rank</Th>
                    <Th>Agent Name</Th>
                    <Th>Win Rate</Th>
                    <Th>Pick Rate</Th>
                    <Th>K/D</Th>
                    <Th>ACS</Th>
                    <Th>Matches</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {statsData?.top_agents.map((agent: any, idx: number) => (
                    <Tr>
                      <Td>{idx + 1}</Td>
                      <Td>{agent.agent_name}</Td>
                      <Td>{Number(agent.avg_win_rate.toFixed(2))}%</Td>
                      <Td>{Number(agent.avg_pick_rate.toFixed(2))}%</Td>
                      <Td>{Number(agent.avg_kd.toFixed(2))}</Td>
                      <Td>{Math.round(agent.average_acs)}</Td>
                      <Td>{agent.match_count.toLocaleString()}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </VStack>
        )}

        <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        >
        <AlertDialogOverlay>
            <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Delete Account
            </AlertDialogHeader>

            <AlertDialogBody>
                Are you sure you want to delete your account? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onClose}>
                Cancel
                </Button>
                <Button colorScheme="red" onClick={handleDeleteConfirm} ml={3}>
                Delete
                </Button>
            </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialogOverlay>
        </AlertDialog>

      </VStack>
    </Flex>
  );
};

export default Home;
