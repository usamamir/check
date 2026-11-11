import { useMemo, useState } from "react";
import "@/styles/shop.css";

const palette = [
  "#111111",
  "#ffffff",
  "#e04040",
  "#4050e8",
  "#f0c14a",
  "#2f6b4f",
  "#ff6a00",
  "#7c3aed",
  "#00b3c7",
  "#c0c0c0",
];

type Zones = {
  chest: string;
  sides: string;
  sleeves: string;
  legs: string;
  trim: string;
  logo: string;
};

const defaults: Zones = {
  chest: "#111111",
  sides: "#4050e8",
  sleeves: "#111111",
  legs: "#111111",
  trim: "#ffffff",
  logo: "#e04040",
};

export function CustomBuilderPage() {
  const [zones, setZones] = useState<Zones>(defaults);
  const [active, setActive] = useState<keyof Zones>("chest");
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [sent, setSent] = useState(false);

  const summary = useMemo(
    () =>
      Object.entries(zones)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", "),
    [zones],
  );

  return (
    <div className="builder">
      <div className="builder-stage">
        <div
          className="builder-suit"
          style={{ background: zones.legs }}
          aria-label="Custom suit preview"
        >
          <div
            className="zone"
            style={{
              left: "18%",
              right: "18%",
              top: "8%",
              height: "28%",
              background: zones.chest,
              borderRadius: "18px 18px 8px 8px",
            }}
          />
          <div
            className="zone"
            style={{ left: 0, top: "18%", width: "18%", height: "40%", background: zones.sides }}
          />
          <div
            className="zone"
            style={{ right: 0, top: "18%", width: "18%", height: "40%", background: zones.sides }}
          />
          <div
            className="zone"
            style={{ left: "8%", top: "12%", width: "14%", height: "46%", background: zones.sleeves, borderRadius: 20 }}
          />
          <div
            className="zone"
            style={{ right: "8%", top: "12%", width: "14%", height: "46%", background: zones.sleeves, borderRadius: 20 }}
          />
          <div
            className="zone"
            style={{
              left: "22%",
              right: "22%",
              bottom: 0,
              height: "48%",
              background: zones.legs,
              borderTop: `6px solid ${zones.trim}`,
            }}
          />
          <div
            className="zone"
            style={{
              left: "50%",
              top: "18%",
              transform: "translateX(-50%)",
              color: zones.logo,
              fontFamily: "var(--font-display)",
              fontSize: 28,
              letterSpacing: "0.08em",
              textAlign: "center",
              width: "70%",
            }}
          >
            {name || "JETTRIBE"}
            <div style={{ fontSize: 42 }}>{number || "00"}</div>
          </div>
        </div>
      </div>

      <aside className="builder-panel">
        <h1>Custom Gear Builder</h1>
        <p style={{ color: "var(--jt-muted)", marginTop: 0 }}>
          Color each zone. Add your name and race number. A `.glb` model will replace this flat preview when supplied.
        </p>

        {(Object.keys(zones) as (keyof Zones)[]).map((zone) => (
          <div className="zone-row" key={zone}>
            <h3>
              <button type="button" onClick={() => setActive(zone)} style={{ fontWeight: active === zone ? 700 : 500 }}>
                {zone}
              </button>
            </h3>
            <div className="swatch-pick">
              {palette.map((c) => (
                <button
                  type="button"
                  key={c}
                  className={zones[zone] === c ? "selected" : ""}
                  style={{ background: c }}
                  aria-label={`${zone} ${c}`}
                  onClick={() => {
                    setActive(zone);
                    setZones((z) => ({ ...z, [zone]: c }));
                  }}
                />
              ))}
            </div>
          </div>
        ))}

        <label style={{ display: "grid", gap: 6, marginTop: 12 }}>
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 16))}
            style={{ height: 44, padding: "0 12px", border: "1px solid var(--jt-border)" }}
          />
        </label>
        <label style={{ display: "grid", gap: 6, marginTop: 12 }}>
          Race number
          <input
            value={number}
            onChange={(e) => setNumber(e.target.value.replace(/[^\d]/g, "").slice(0, 3))}
            style={{ height: 44, padding: "0 12px", border: "1px solid var(--jt-border)" }}
          />
        </label>

        {sent ? (
          <p style={{ marginTop: 20, fontWeight: 600 }}>
            Design saved locally. On WordPress this posts into the customization request / order notes.
          </p>
        ) : (
          <button
            type="button"
            className="btn btn-primary btn-block"
            style={{ marginTop: 20 }}
            onClick={() => {
              localStorage.setItem(
                "jettribe-custom-design",
                JSON.stringify({ zones, name, number, summary, at: Date.now() }),
              );
              setSent(true);
            }}
          >
            Save Design
          </button>
        )}
      </aside>
    </div>
  );
}
