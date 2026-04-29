import { useEffect, useMemo, useState } from "react";
import { RouterProvider } from "react-router-dom";
import { CssBaseline } from "@mui/material";
import type { PaletteMode } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { darkTheme, lightTheme } from "../styles/theme";
import { router } from "./router";
import { COLOR_MODE_STORAGE_KEY, ColorModeContext } from "./colorMode";
import { AuthProvider } from "../auth/AuthContext";

function App() {
  const [mode, setMode] = useState<PaletteMode>(() => {
    const saved = localStorage.getItem(COLOR_MODE_STORAGE_KEY);
    return saved === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode);
  }, [mode]);

  const theme = useMemo(
    () => (mode === "dark" ? darkTheme : lightTheme),
    [mode],
  );
  const colorModeValue = useMemo(
    () => ({
      mode,
      setMode,
      toggleMode: () =>
        setMode((prev) => (prev === "light" ? "dark" : "light")),
    }),
    [mode],
  );

  return (
    <ColorModeContext.Provider value={colorModeValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
