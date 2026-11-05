export function LogoMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 15c3.5-7 7.5-12 9-13 1.5 1 5.5 6 9 13-2.5-1.5-5.5-2.2-9-2.2S5.5 13.5 3 15z"
        fill="currentColor"
      />
      <circle cx="12" cy="17.5" r="1.6" fill="currentColor" />
    </svg>
  );
}
