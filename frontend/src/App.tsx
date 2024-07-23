import { useState } from 'react'
import { ChakraProvider, Box, Heading, Input, Button, VStack } from '@chakra-ui/react';
import styles from './App.module.css';

function App() {
    // State variables for username and password
    // index 0: variable name
    // index 1: function name to update the variable
    // useState('') initialises state and sets default value to ''
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // function to handle login action
    const handleLogin = async () => {
        // debug logs
        console.log('Username:', username);
        console.log('Password:', password);

        // testing sending JSON to backend RYE python
        try {
            // simple JSON format
            // /login request
            const response = await fetch('http://127.0.0.1:8000/login', {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });
        
            const data = await response.json();
            
            if (response.ok) {
                // Handle successful login
                console.log('Login successful:', data);
            } else {
                // Handle failed login
                console.error('Login failed:', data.message);
            }
        } catch (error) {
            console.error('Error during login:', error);
        }
    };

    return (
        // provider for ChakraUI
        <ChakraProvider>
            {/* centering */}
            <Box className={styles.container}>
                {/* Outer box to contain login forms */}
                <Box className={styles.box}>
                    {/* Vertically stack elements */}
                    <VStack spacing={4}>
                        <Heading as="h1" size="xl" mb={6}>Login</Heading>
                        {/* Username and Password inputs */}
                        <Input
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className={styles.input}
                        />
                        <Input
                            placeholder="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={styles.input}
                        />

                        {/* Login Button, runs handleLogin on click */}
                        <Button colorScheme="teal" onClick={handleLogin}>Login</Button>
                    </VStack>
                </Box>
            </Box>
        </ChakraProvider>
    );
}

export default App;