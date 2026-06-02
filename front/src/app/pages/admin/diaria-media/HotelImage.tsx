import { useState } from "react";
import { ImageOff } from "lucide-react";

/** Imagem da hospedagem com fallback quando a URL falha ou está vazia. */
export function HotelImage({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div className={`bg-gray-100 flex flex-col items-center justify-center gap-2 ${className ?? ""}`}>
        <ImageOff size={28} color="#D1D5DB" />
        <span style={{ fontSize: 11, color: "#D1D5DB" }}>Imagem indisponível</span>
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} onError={() => setError(true)} />;
}

/** Linha de estrelas (0 a 5) no padrão da marca. */
export function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: Math.max(0, Math.min(5, count)) }).map((_, i) => (
        <svg key={i} width={11} height={11} viewBox="0 0 24 24" fill="#F5C100">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}
