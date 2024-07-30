import React, { useState } from 'react';
import { Box, Button, VStack, HStack, Heading, Select, Input, Text, Grid, GridItem, Image } from '@chakra-ui/react';
import ValoEmblem from "../../assets/ValoEmblem.png";

type LookupType = 'agentSynergies' | 'mostPlayedAgent' | 'agentRecommendations';

interface OutputItem {
    title: string;
    data: string[];
}

const Lookup = () => {
    const [lookupType, setLookupType] = useState<LookupType>('agentSynergies');
    const [formData, setFormData] = useState<{ [key: string]: string }>({});
    const [output, setOutput] = useState<string[] | OutputItem[]>([]);

    const handleLookupTypeChange = (type: LookupType) => {
        setLookupType(type);
        setFormData({});
        setOutput([]);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({
          ...formData,
          [name]: value,
        });
    };

    const handleLookup = () => {
        // Mock data for output
        const mockOutput = {
        agentSynergies: ['Synergy 1', 'Synergy 2'],
        mostPlayedAgent: ['Agent 1', 'Agent 2'],
        agentRecommendations: {
            mapRank: ['Recommendation 1', 'Recommendation 2'],
            overall: ['Overall 1', 'Overall 2'],
        },
        };
        if (lookupType === 'agentRecommendations') {
            setOutput([
              { title: 'For Current Rank', data: mockOutput.agentRecommendations.mapRank },
              { title: 'Overall', data: mockOutput.agentRecommendations.overall }
            ]);
        } else {
            setOutput(mockOutput[lookupType] as string[]);
        }
    };

    return (
        <Box p={4} style={{backgroundColor: "#1a202c", minHeight: "100vh", width: "100vw"}}>
            <HStack>
                <Image
                    src={ValoEmblem}
                    alt="Valo Emblem"
                    boxSize="70px"
                    objectFit="contain"
                />
                <Heading as="h1" size="xl" mb={6} style={{color: "white"}}>
                    Information Lookup
                </Heading>
            </HStack>
            <HStack spacing={4} mb={6}>
                <Button variant="valoRed" onClick={() => handleLookupTypeChange('agentSynergies')}>Agent Synergies</Button>
                <Button variant="valoRed" onClick={() => handleLookupTypeChange('mostPlayedAgent')}>Player Most Played Agent</Button>
                <Button variant="valoRed" onClick={() => handleLookupTypeChange('agentRecommendations')}>Agent Recommendations</Button>
            </HStack>

            {/* Swap out as per needed */}
            <Grid templateColumns="1fr 2fr" gap={6}>
                <GridItem>
                    <VStack spacing={4} align="start" mb={6}>

                        {lookupType === 'agentSynergies' && (
                        <>
                            <Select 
                                placeholder="Select Agent" 
                                name="agent" 
                                onChange={handleInputChange}
                                maxW = "200px"
                                style={{backgroundColor: "white"}}
                            >
                            <option value="agent1">Agent 1</option>
                            <option value="agent2">Agent 2</option>
                            {/* Add more options as needed */}
                            </Select>
                            <Button variant="valoRed" onClick={handleLookup}>Enter</Button>
                        </>
                        )}

                        {lookupType === 'mostPlayedAgent' && (
                        <>
                            <Input 
                                placeholder="Enter Player Name" 
                                name="playerName" 
                                onChange={handleInputChange} 
                                maxW = "200px"
                                style={{backgroundColor: "white"}}
                            />
                            <Button variant="valoRed" onClick={handleLookup}>Enter</Button>
                        </>
                        )}

                        {lookupType === 'agentRecommendations' && (
                        <>
                            <Select 
                                placeholder="Select Map" 
                                name="map" 
                                onChange={handleInputChange} 
                                maxW = "200px"
                                style={{backgroundColor: "white"}}
                            >
                            <option value="map1">Map 1</option>
                            <option value="map2">Map 2</option>
                            {/* Add more options as needed */}
                            </Select>
                            <Select 
                                placeholder="Select Rank" 
                                name="rank" 
                                onChange={handleInputChange} 
                                maxW = "200px"
                                style={{backgroundColor: "white"}}
                            >
                            <option value="rank1">Rank 1</option>
                            <option value="rank2">Rank 2</option>
                            {/* Add more options as needed */}
                            </Select>
                            <Button variant="valoRed" onClick={handleLookup}>Enter</Button>
                        </>
                        )}

                    </VStack>
                </GridItem>

                <GridItem>
                    {lookupType === 'agentRecommendations' && Array.isArray(output) && typeof output[0] === 'object' ? (
                        <HStack spacing={4} align="start">
                        {(output as OutputItem[]).map((section, index) => (
                            <Box key={index}>
                            <Heading as="h3" size="md" style={{color: "white"}}>{section.title}</Heading>
                            {section.data.map((item, idx) => (
                                <Text key={idx} style={{color: "white"}}>{item}</Text>
                            ))}
                            </Box>
                        ))}
                        </HStack>
                    ) : (
                        <VStack spacing={4} align="start">
                        {Array.isArray(output) && typeof output[0] === 'string' && (
                            (output as string[]).map((item, index) => (
                            <Text key={index} style={{color: "white"}}>{item}</Text>
                            ))
                        )}
                        </VStack>
                    )}
                </GridItem>
            </Grid>
        </Box>
    );
};

export default Lookup;