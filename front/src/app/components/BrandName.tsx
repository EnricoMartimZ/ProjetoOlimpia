const LETTERS = ["O", "L", "Í", "M", "P", "I", "A"];
const LETTER_COLORS = [
  "#C8102E",
  "#1D2E36",
  "#009688",
  "#00538C",
  "#2E7D32",
  "#C8102E",
  "#1D2E36",
];

interface BrandNameProps {
  size?: number;
}

export function BrandName({ size = 16 }: BrandNameProps) {
  return (
    <span
      style={{
        fontFamily: "Inter, sans-serif",
        fontWeight: 800,
        fontSize: size,
        letterSpacing: "-0.01em",
        color: "#1D2E36",
      }}
    >
      {LETTERS.map((letter, i) => (
        <span key={i} style={{ color: LETTER_COLORS[i] }}>
          {letter}
        </span>
      ))}
    </span>
  );
}
