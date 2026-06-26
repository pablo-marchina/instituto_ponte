import { ArrowRightIcon } from "@heroicons/react/24/outline";
import type { AuthRole } from "../../../../src/features/auth/auth.types";

interface Props {
  errorMessage?: string;
  isLoading?: boolean;
  role: AuthRole;
  onRoleChange: (role: AuthRole) => void;
  onGoogleLogin: () => void;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66 2.84-.18-.68z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export function LoginScreen({
  errorMessage,
  isLoading = false,
  role,
  onRoleChange,
  onGoogleLogin,
}: Props) {
  return (
    <div
      className="bg-white rounded-2xl w-full max-w-[480px] px-10 py-10 flex flex-col gap-6"
      style={{ boxShadow: "0px 4px 24px rgba(0,0,0,0.10)" }}
    >
      <div className="flex flex-col gap-2">
        <p
          style={{
            fontFamily: "Poppins, sans-serif",
            fontWeight: 600,
            fontSize: "24px",
            color: "#6B6FA3",
          }}
        >
          Acesso interno
        </p>
        <p style={{ fontFamily: "Inter, sans-serif", fontSize: "15px", color: "#6A7181", lineHeight: 1.55 }}>
          Professores e coordenadores entram com a conta Google autorizada pela instituição.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3" role="group" aria-label="Perfil de acesso">
        {(["professor", "coordenador"] as const).map((option) => {
          const isSelected = role === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onRoleChange(option)}
              className="px-4 py-3 rounded-full border transition-colors"
              style={{
                borderColor: isSelected ? "#05245F" : "#D1D5DB",
                backgroundColor: isSelected ? "#05245F" : "#FFFFFF",
                color: isSelected ? "#FFFFFF" : "#05245F",
                fontFamily: "Poppins, sans-serif",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              {option === "professor" ? "Professor" : "Coordenador"}
            </button>
          );
        })}
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl px-4 py-3"
          style={{ backgroundColor: "#FCE8E6", color: "#9A3412", fontFamily: "Inter, sans-serif", fontSize: "14px" }}
        >
          {errorMessage}
        </div>
      )}

      <button
        onClick={onGoogleLogin}
        disabled={isLoading}
        className="flex items-center justify-center gap-3 px-5 py-4 rounded-full transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-60"
        style={{
          backgroundColor: "#F9B233",
          color: "#05245F",
          fontFamily: "Poppins, sans-serif",
          fontWeight: 600,
          fontSize: "16px",
        }}
      >
        <GoogleIcon />
        {isLoading ? "Abrindo Google..." : "Entrar com Google"}
        <ArrowRightIcon className="w-5 h-5" aria-hidden="true" />
      </button>

      <div style={{ borderTop: "1px solid #E5E7EB" }} />

      <p style={{ fontFamily: "Inter, sans-serif", fontSize: "13px", color: "#6A7181", lineHeight: 1.5 }}>
        O Google valida sua identidade; o backend libera apenas se esse e-mail estiver cadastrado no perfil escolhido.
      </p>
    </div>
  );
}
