import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import logoImg from "../../imports/logoCorrijeAi.png";

interface HeaderProps {
  title: string;
  timer?: string;
}

export function Header({ title, timer }: HeaderProps) {
  const [timerVisible, setTimerVisible] = useState(true);
  return (
    <header className="bg-white shadow-sm sticky top-0 z-10 px-4 h-16 flex items-center gap-3">
      <Logo />
      <h1 className="flex-1 text-center font-bold text-xl text-[#000000] truncate">{title}</h1>
      <div className="min-w-20 text-right shrink-0">
        {timer && timerVisible && <span className="block font-bold text-lg text-[#000000] tabular-nums">{timer}</span>}
        {timer && (
          <button
            type="button"
            onClick={() => setTimerVisible((visible) => !visible)}
            className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-[#6B6FA3]"
            aria-label={timerVisible ? "Ocultar cronometro" : "Mostrar cronometro"}
          >
            {timerVisible ? <EyeOff size={12} /> : <Eye size={12} />}
            {timerVisible ? "Ocultar" : "Mostrar"}
          </button>
        )}
      </div>
    </header>
  );
}

export function Logo() {
  return (
    <div className="flex items-center shrink-0">
      <div className="h-12 flex items-center">
        <ImageWithFallback 
          src={logoImg} 
          alt="corrije ai" 
          className="h-10 w-auto object-contain"
        />
      </div>
    </div>
  );
}
