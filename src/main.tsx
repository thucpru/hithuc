import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@fontsource/fraunces/400.css";
import "@fontsource/fraunces/500.css";
import "@fontsource/fraunces/600.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";

createRoot(document.getElementById("root")!).render(<App />);
