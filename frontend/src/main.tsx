import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ChakraProvider } from "@chakra-ui/react";
import OwnStats from "./pages/PlayerStats/OwnStats";
import Home from "./pages/Home";
import theme from "./theme";
import { QueryClient, QueryClientProvider } from "react-query";
import Lookup from "./pages/Lookup/Lookup";

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/own-stats" element={<OwnStats />} />
            <Route path="/lookup" element={<Lookup />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </ChakraProvider>
  </React.StrictMode>
);
