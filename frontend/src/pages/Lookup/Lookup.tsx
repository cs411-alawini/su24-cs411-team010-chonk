import React, { useState } from 'react';
import { Box, Button, VStack, HStack, Heading, Select, Text, Grid, GridItem, Image } from '@chakra-ui/react';
import ValoEmblem from "../../assets/ValoEmblem.png";
import config from "../../config.ts";

type LookupType = 'agentSynergies' | 'mostPlayedAgent' | 'agentRecommendations' | 'topMapAgents';

interface OutputItem {
    title: string;
    data: string[];
}


const mapData = [
    { map_id: 'Icebox', map_name: 'Icebox' },
    { map_id: 'Breeze', map_name: 'Breeze' },
    { map_id: 'Haven', map_name: 'Haven' },
    { map_id: 'Bind', map_name: 'Bind' },
    { map_id: 'Split', map_name: 'Split' },
    { map_id: 'Ascent', map_name: 'Ascent' },
    { map_id: 'Sunset', map_name: 'Sunset' },
    { map_id: 'Lotus', map_name: 'Lotus' },
    { map_id: 'Pearl', map_name: 'Pearl' },
    { map_id: 'Fracture', map_name: 'Fracture' },
    { map_id: 'Abyss', map_name: 'Abyss' },
];

// const agentData = [
//     { agent_id: 0, agent_name: 'Reyna' },
//     { agent_id: 1, agent_name: 'Sage' },
//     { agent_id: 2, agent_name: 'Sova' },
//     { agent_id: 3, agent_name: 'Jett' },
//     { agent_id: 4, agent_name: 'Raze' },
//     { agent_id: 5, agent_name: 'Killjoy' },
//     { agent_id: 6, agent_name: 'Yoru' },
//     { agent_id: 7, agent_name: 'Omen' },
//     { agent_id: 8, agent_name: 'Viper' },
//     { agent_id: 9, agent_name: 'Breach' },
//     { agent_id: 10, agent_name: 'Astra' },
//     { agent_id: 11, agent_name: 'Skye' },
//     { agent_id: 12, agent_name: 'Brimstone' },
//     { agent_id: 13, agent_name: 'Cypher' },
//     { agent_id: 14, agent_name: 'Phoenix' },
//     { agent_id: 15, agent_name: 'Kayo' },
//     { agent_id: 16, agent_name: 'Clove' },
//     { agent_id: 17, agent_name: 'Chamber' },
//     { agent_id: 18, agent_name: 'Neon' },
//     { agent_id: 19, agent_name: 'Harbor' },
//     { agent_id: 20, agent_name: 'Gekko' },
//     { agent_id: 21, agent_name: 'Fade' },
//     { agent_id: 22, agent_name: 'Iso' },
//     { agent_id: 23, agent_name: 'Deadlock' },
// ];

const rankData = [
    { tier_id: 3, tier_name: 'Iron 1' },
    { tier_id: 4, tier_name: 'Iron 2' },
    { tier_id: 5, tier_name: 'Iron 3' },
    { tier_id: 6, tier_name: 'Bronze 1' },
    { tier_id: 7, tier_name: 'Bronze 2' },
    { tier_id: 8, tier_name: 'Bronze 3' },
    { tier_id: 9, tier_name: 'Silver 1' },
    { tier_id: 10, tier_name: 'Silver 2' },
    { tier_id: 11, tier_name: 'Silver 3' },
    { tier_id: 12, tier_name: 'Gold 1' },
    { tier_id: 13, tier_name: 'Gold 2' },
    { tier_id: 14, tier_name: 'Gold 3' },
    { tier_id: 15, tier_name: 'Platinum 1' },
    { tier_id: 16, tier_name: 'Platinum 2' },
    { tier_id: 17, tier_name: 'Platinum 3' },
    { tier_id: 18, tier_name: 'Diamond 1' },
    { tier_id: 19, tier_name: 'Diamond 2' },
    { tier_id: 20, tier_name: 'Diamond 3' },
    { tier_id: 21, tier_name: 'Pro' },
];

const Lookup = () => {
    const [lookupType, setLookupType] = useState<LookupType>('agentSynergies');
    const [formData, setFormData] = useState<{ [key: string]: string }>({});
    const [output, setOutput] = useState<string[] | OutputItem[]>([]);

    const handleLookupTypeChange = (type: LookupType) => {
        setLookupType(type);
        setFormData({});
        setOutput([]);
        switch (lookupType) {
            case 'agentSynergies':
                handleLookup();
                break;

            case 'mostPlayedAgent':
                handleLookup();
                break;

            case 'agentRecommendations':
                break;
            
            case  'topMapAgents':
                handleLookup();
                break;

            default:
                break;
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    // const handleLookup = () => {
        // Mock data for output
        // const mockOutput = {
        // agentSynergies: ['Synergy 1', 'Synergy 2'],
        // mostPlayedAgent: ['Agent 1', 'Agent 2'],
        // agentRecommendations: {
        //     mapRank: ['Recommendation 1', 'Recommendation 2'],
        //     overall: ['Overall 1', 'Overall 2'],
        // },
        // };
        // if (lookupType === 'agentRecommendations') {
        //     setOutput([
        //       { title: 'For Current Rank', data: mockOutput.agentRecommendations.mapRank },
        //       { title: 'Overall', data: mockOutput.agentRecommendations.overall }
        //     ]);
        // } else {
        //     setOutput(mockOutput[lookupType] as string[]);
        // }
    // };

    const handleLookup = async () => {
        try {
            let response;
            let data;
    
            switch (lookupType) {
                case 'agentSynergies':
                    response = await fetch(`${config.apiUrl}/agent_synergies`, {
                        headers: { Authorization: `Bearer ${localStorage.token}` },
                    });
                    data = await response.json();
                    console.log('Agent Synergies Response:', data); // Log the response data
                    
                    // Parse the agent_synergies response
                    const parsedSynergies = JSON.parse(data.agent_synergies.replace(/'/g, '"')).map((item: any[]) => item[0]);
                    console.log('Parsed Agent Synergies:', parsedSynergies); // Log the parsed data
    
                    setOutput(parsedSynergies);
                    break;
    
                case 'mostPlayedAgent':
                    response = await fetch(`${config.apiUrl}/player_most_played_agent`, {
                        headers: { Authorization: `Bearer ${localStorage.token}` },
                    });
                    data = await response.json();
                    console.log('Most Played Agent Response:', data); // Log the response data
                    setOutput(data.player_most_played_agent);
                    break;
    
                case 'agentRecommendations':
                    const { map, rank } = formData;
    
                    // Fetch recommendations for current map and rank
                    response = await fetch(`${config.apiUrl}/agent_recommendations?map_name=${map}&tier_id=${rank}`, {
                        headers: { Authorization: `Bearer ${localStorage.token}` },
                    });
                    const mapRankData = await response.json();
                    console.log('Map Rank Recommendations Response:', mapRankData); // Log the response data
    
                    // Fetch overall recommendations
                    const overallResponse = await fetch(`${config.apiUrl}/top_agent_map`, {
                        headers: { Authorization: `Bearer ${localStorage.token}` },
                    });
                    const overallData = await overallResponse.json();
                    console.log('Overall Recommendations Response:', overallData); // Log the response data
    
                    setOutput([
                        { title: 'For Current Rank', data: mapRankData.agent_recommendations },
                        { title: 'Overall', data: overallData  }
                    ]);
                    break;
    
                default:
                    break;
            }
        } catch (error) {
            console.error('Error fetching data:', error);
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
                <Button variant="valoRed" onClick={() => handleLookupTypeChange('topMapAgents')}>Map Top Agents</Button>
            </HStack>

            {/* Swap out as per needed */}
            <Grid templateColumns="1fr 2fr" gap={6}>
                <GridItem>
                    <VStack spacing={4} align="start" mb={6}>

                        {lookupType === 'agentRecommendations' && (
                        <>
                            <Select 
                                placeholder="Select Map" 
                                name="map" 
                                onChange={handleInputChange} 
                                maxW = "200px"
                                style={{backgroundColor: "white"}}
                            >
                            {mapData.map((map) => (
                                <option key={map.map_id} value={map.map_name} style={{ backgroundColor: '#2D3748', color: 'white' }}>
                                {map.map_name}
                                </option>
                            ))}
                            {/* Add more options as needed */}
                            </Select>
                            <Select 
                                placeholder="Select Rank" 
                                name="rank" 
                                onChange={handleInputChange} 
                                maxW = "200px"
                                style={{backgroundColor: "white"}}
                            >
                            {rankData.map((rank) => (
                                <option key={rank.tier_id} value={rank.tier_id} style={{ backgroundColor: '#2D3748', color: 'white' }}>
                                {rank.tier_name}
                                </option>
                            ))}
                            {/* Add more options as needed */}
                            </Select>
                            <Button variant="valoRed" onClick={handleLookup}>Enter</Button>
                        </>
                        )}

                    </VStack>
                </GridItem>

                <GridItem>
                    <VStack spacing={4} align="start">
                        {Array.isArray(output) && typeof output[0] === 'string' && (
                            (output as string[]).map((item, index) => (
                            <Text key={index} style={{ color: "white" }}>{item}</Text>
                            ))
                        )}
                    </VStack>
                </GridItem>
            </Grid>
        </Box>
    );
};

export default Lookup;