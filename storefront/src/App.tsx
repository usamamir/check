import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { CartPage } from "@/pages/CartPage";
import { ContentPage } from "@/pages/ContentPage";
import { CustomBuilderPage } from "@/pages/CustomBuilderPage";
import { FavouritesPage } from "@/pages/FavouritesPage";
import { HomePage } from "@/pages/HomePage";
import { ProductPage } from "@/pages/ProductPage";
import { ShopPage } from "@/pages/ShopPage";

function ScrollAndTitle() {
  const loc = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [loc.pathname]);
  return null;
}

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <main className="page">
        <ScrollAndTitle />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop/:slug" element={<ShopPage />} />
          <Route path="/search" element={<ShopPage mode="search" />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/favourites" element={<FavouritesPage />} />
          <Route path="/custom-gear-builder" element={<CustomBuilderPage />} />
          <Route path="/checkout" element={<ContentPage />} />
          <Route path="/account" element={<ContentPage />} />
          <Route path="/:slug" element={<ContentPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
