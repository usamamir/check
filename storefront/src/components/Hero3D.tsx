import { useEffect, useRef } from "react";

/** Lightweight CSS/3D float — three.js only loads if needed later via model. */
export function Hero3D({ image }: { image: string }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;

    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 18;
      ty = ((e.clientY - r.top) / r.height - 0.5) * -18;
    };

    const onOrient = (e: DeviceOrientationEvent) => {
      tx = Math.max(-18, Math.min(18, (e.gamma || 0) * 0.4));
      ty = Math.max(-18, Math.min(18, (e.beta || 0) * -0.2));
    };

    const tick = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      el.style.transform = `perspective(900px) rotateY(${cx}deg) rotateX(${cy}deg)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("deviceorientation", onOrient);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("deviceorientation", onOrient);
    };
  }, []);

  return (
    <div className="hero-3d" ref={ref} aria-hidden>
      <img
        src={image}
        alt=""
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          filter: "drop-shadow(0 30px 50px rgba(0,0,0,.45))",
        }}
      />
    </div>
  );
}
