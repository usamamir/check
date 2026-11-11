import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { CatalogGate } from "./components/CatalogGate";
import { CartProvider } from "./state/CartContext";
import { FavouritesProvider } from "./state/FavouritesContext";
import "./styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <CatalogGate>
        <CartProvider>
          <FavouritesProvider>
            <App />
          </FavouritesProvider>
        </CartProvider>
      </CatalogGate>
    </BrowserRouter>
  </StrictMode>,
);
