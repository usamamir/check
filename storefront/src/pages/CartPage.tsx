import { Link } from "react-router-dom";
import { effectivePrice, formatMoney } from "@/data/products";
import { useCart } from "@/state/CartContext";
import "@/styles/shop.css";

const FREE_SHIP = 400;

export function CartPage() {
  const { items, subtotal, updateQty, removeItem } = useCart();
  const progress = Math.min(100, (subtotal / FREE_SHIP) * 100);
  const remaining = Math.max(0, FREE_SHIP - subtotal);

  return (
    <div className="container">
      <h1 style={{ fontSize: 56, margin: "28px 0 8px" }}>Bag</h1>
      {!items.length ? (
        <div style={{ padding: "24px 0 80px" }}>
          <p style={{ color: "var(--jt-muted)" }}>Your bag is empty.</p>
          <Link className="btn btn-primary" to="/shop/best-sellers">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div>
            {items.map((item) => {
              const price = effectivePrice(item.product) ?? 0;
              return (
                <div className="cart-item" key={item.key}>
                  {item.product.image && <img src={item.product.image} alt="" />}
                  <div>
                    <Link to={`/product/${item.product.slug}`} style={{ fontWeight: 500 }}>
                      {item.product.name}
                    </Link>
                    {item.size && (
                      <div style={{ color: "var(--jt-muted)", fontSize: 13 }}>Size {item.size}</div>
                    )}
                    <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center" }}>
                      <label>
                        Qty{" "}
                        <input
                          type="number"
                          min={1}
                          value={item.qty}
                          onChange={(e) => updateQty(item.key, Number(e.target.value) || 1)}
                          style={{ width: 64, height: 36, padding: "0 8px" }}
                        />
                      </label>
                      <button type="button" onClick={() => removeItem(item.key)} style={{ color: "var(--jt-muted)" }}>
                        Remove
                      </button>
                    </div>
                  </div>
                  <strong>{formatMoney(price * item.qty)}</strong>
                </div>
              );
            })}
          </div>
          <aside className="summary-card">
            <h2 style={{ fontFamily: "var(--font-body)", fontSize: 18, textTransform: "none" }}>
              Order Summary
            </h2>
            <p style={{ fontSize: 13, color: "var(--jt-muted)" }}>
              {remaining > 0
                ? `You're ${formatMoney(remaining)} away from free USA shipping.`
                : "You've unlocked free USA shipping."}
            </p>
            <div className="ship-bar">
              <span style={{ width: `${progress}%` }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <span>Subtotal</span>
              <strong>{formatMoney(subtotal)}</strong>
            </div>
            <Link className="btn btn-primary btn-block" to="/checkout">
              Checkout
            </Link>
          </aside>
        </div>
      )}
    </div>
  );
}
