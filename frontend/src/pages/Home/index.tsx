import { BaseSyntheticEvent, useState } from "react";
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
  const [show, setShow] = useState(false);
  const [riotIdError, setRiotIdError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const {
    isFetching: isFetchingProfile,
    error: profileError,
    data: profileData,
  } = useQuery({
    queryKey: ["profileData"],
    queryFn: () =>
      fetch(config.apiUrl + "/users/me", {
        headers: { Authorization: "Bearer " + localStorage.token },
      }).then((res) => res.json()),
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

  if (profileError || agentError) {
    localStorage.removeItem("token");
    setLoggedIn(false);
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

  const handleLogout = (): void => {
    localStorage.removeItem("token");
    setLoggedIn(false);
  };

  return (
    <Flex minH={"100vh"} align={"center"} justify={"center"}>
      <VStack align="unset" spacing={8}>
        <HStack>
          <ValorantIcon boxSize={10}></ValorantIcon>
          <Heading size="lg">Valorant Stats</Heading>
          <Spacer />
          {loggedIn ? <Button onClick={handleLogout}>Log Out</Button> : null}
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
                  <Button minWidth={"20vw"} bgColor="#FF4655">
                    <ChakraLink as={ReactRouterLink} to="/own-stats">
                      View stats
                    </ChakraLink>
                  </Button>
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
            <StatLabel>Best Pro Player</StatLabel>
            <StatNumber>Reyna</StatNumber>
            <StatHelpText>1.13 KD</StatHelpText>
          </Stat>

          <Stat>
            <StatLabel>Most Used Weapon</StatLabel>
            <StatNumber>Vandal</StatNumber>
            <StatHelpText>8900 Games</StatHelpText>
          </Stat>

          <Stat>
            <StatLabel>Most Played Map</StatLabel>
            <StatNumber>Ascent</StatNumber>
            <StatHelpText>4500 Games</StatHelpText>
          </Stat>
        </HStack>

        <Divider></Divider>

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
                <Tr>
                  <Td>1</Td>
                  <Td>Reyna</Td>
                  <Td>25.4%</Td>
                  <Td>25.4%</Td>
                  <Td>1.13</Td>
                  <Td>225</Td>
                  <Td>220,005</Td>
                </Tr>
                <Tr>
                  <Td>2</Td>
                  <Td>Jett</Td>
                  <Td>25.4%</Td>
                  <Td>25.4%</Td>
                  <Td>1.13</Td>
                  <Td>225</Td>
                  <Td>220,005</Td>
                </Tr>
                <Tr>
                  <Td>3</Td>
                  <Td>Raze</Td>
                  <Td>25.4%</Td>
                  <Td>25.4%</Td>
                  <Td>1.13</Td>
                  <Td>225</Td>
                  <Td>220,005</Td>
                </Tr>
                <Tr>
                  <Td>4</Td>
                  <Td>Sage</Td>
                  <Td>25.4%</Td>
                  <Td>25.4%</Td>
                  <Td>1.13</Td>
                  <Td>225</Td>
                  <Td>220,005</Td>
                </Tr>
                <Tr>
                  <Td>5</Td>
                  <Td>Gekko</Td>
                  <Td>25.4%</Td>
                  <Td>25.4%</Td>
                  <Td>1.13</Td>
                  <Td>225</Td>
                  <Td>220,005</Td>
                </Tr>
              </Tbody>
            </Table>
          </TableContainer>
        </VStack>
      </VStack>
    </Flex>
  );
};

export default Home;
