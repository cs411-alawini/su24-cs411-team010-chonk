import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  initialColorMode: "dark",
  useSystemColorMode: false,
  colors: {
    valoRed: {
      500: "#ff4454", // Main custom color
      600: "#e03e4b", // Slightly darker shade for hover (optional)
    },
  },
  components: {
    Button: {
      baseStyle: {
        _hover: {
          bg: "valoRed.600",
        },
      },
      variants: {
        valoRed: {
          bg: "valoRed.500",
          color: "white",
        },
      },
    },
  },
});

export default theme;
