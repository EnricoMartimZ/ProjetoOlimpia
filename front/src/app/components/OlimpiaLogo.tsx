import brasaoImg from "../../assets/brasao.png";
import logoImg from "../../assets/logo.png";

interface OlimpiaLogoProps {
  size?: "sm" | "md" | "lg";
  variant?: "full" | "icon";
}

const ICON_SIZES = { sm: 36, md: 52, lg: 72 } as const;
const LOGO_WIDTHS = { sm: 180, md: 260, lg: 400 } as const;

export function OlimpiaLogo({ size = "md", variant = "full" }: OlimpiaLogoProps) {
  if (variant === "icon") {
    const s = ICON_SIZES[size];
    return (
      <img
        src={brasaoImg}
        alt="Brasão de Olímpia"
        width={s}
        height={s}
        style={{ objectFit: "contain", borderRadius: 6 }}
      />
    );
  }

  return (
    <img
      src={logoImg}
      alt="Prefeitura da Estância Turística de Olímpia – Secretaria de Turismo"
      width={LOGO_WIDTHS[size]}
      style={{ objectFit: "contain" }}
    />
  );
}
