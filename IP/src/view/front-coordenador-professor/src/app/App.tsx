import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Navigate, Route, Routes, useNavigate, useParams } from "react-router";
import { LoginScreen } from "./components/LoginScreen";
import { CadastroScreen } from "./components/CadastroScreen";
import { ProfessorDashboard, type ProfessorTab } from "./components/professor/ProfessorDashboard";
import { CoordenadorDashboard, type CoordenadorTab } from "./components/coordenador/CoordenadorDashboard";
import imgLogo from "../imports/logo-new.png";
import { logout as requestLogout, startGoogleLogin } from "../../../src/features/auth/auth.api";
import {
  clearAuthSession,
  clearPendingAuthRole,
  getStoredAuthSession,
  storePendingAuthRole,
} from "../../../src/features/auth/auth.storage";
import type { AuthRole, AuthSession } from "../../../src/features/auth/auth.types";
import { withAppBasePath } from "../../../src/lib/routing";

const professorTabs: ProfessorTab[] = [
  "painel",
  "provas",
  "banco",
  "correcao",
  "liberacao",
  "nova-prova",
  "prova-detail",
  "nova-questao",
  "nova-questao-banco",
  "questao-correcao",
  "prova-questoes-correcao",
  "correcao-aluno",
];

const coordenadorTabs: CoordenadorTab[] = [
  "painel",
  "provas",
  "banco",
  "correcao",
  "liberacao",
  "gestao-professores",
  "gestao-alunos",
  "perfil-aluno",
  "perfil-professor",
  "nova-prova",
  "prova-detail",
  "nova-questao",
  "nova-questao-banco",
  "questao-correcao",
  "prova-questoes-correcao",
  "correcao-aluno",
];

function AuthLayout({ mode }: { mode: "login" | "cadastro" }) {
  const [selectedRole, setSelectedRole] = useState<AuthRole>("professor");
  const googleLoginMutation = useMutation({
    mutationFn: startGoogleLogin,
    onSuccess: ({ redirectUrl }) => {
      window.location.assign(redirectUrl);
    },
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F2F2F2" }}>
      {/* Header */}
      <header
        className="w-full flex flex-col items-center py-16 px-6 text-center"
        style={{ backgroundColor: "#05245F" }}
      >
        {/* Logo card */}
        <div
          className="mb-8 px-8 py-4 rounded-2xl"
          style={{ backgroundColor: "#FFFFFF", boxShadow: "0px 10px 7.5px rgba(0,0,0,0.1), 0px 4px 3px rgba(0,0,0,0.1)" }}
        >
          <img
            src={imgLogo}
            alt="Corrije Aí"
            style={{ width: 130, height: 150, objectFit: "contain" }}
          />
        </div>
        <h1
          style={{
            fontFamily: "Poppins, sans-serif",
            fontWeight: 500,
            color: "#FFFFFF",
            fontSize: "clamp(36px, 6vw, 80px)",
            lineHeight: 1.15,
            marginBottom: "16px",
          }}
        >
          Bem vindo ao Corrije ai
        </h1>
        <p
          style={{
            fontFamily: "Inter, sans-serif",
            fontWeight: 400,
            color: "#6B6FA3",
            fontSize: "clamp(16px, 2.5vw, 24px)",
          }}
        >
          O sistema de provas do Instituto Ponte
        </p>
      </header>

      {/* Main */}
      <main className="flex flex-1 justify-center items-start py-12 px-4">
        {mode === "login" ? (
          <LoginScreen
            errorMessage={
              googleLoginMutation.isError
                ? googleLoginMutation.error.message
                : undefined
            }
            isLoading={googleLoginMutation.isPending}
            role={selectedRole}
            onRoleChange={setSelectedRole}
            onGoogleLogin={() => {
              storePendingAuthRole(selectedRole);
              googleLoginMutation.mutate();
            }}
          />
        ) : (
          <CadastroScreen
            onNavigateToLogin={() => window.location.assign(withAppBasePath("/login"))}
          />
        )}
      </main>
    </div>
  );
}

function requireSession(role: AuthRole): AuthSession | null {
  const session = getStoredAuthSession();
  if (!session || session.usuario.perfil !== role) {
    return null;
  }

  return session;
}

function ProfessorRoute({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();
  const { tab } = useParams();
  const session = requireSession("professor");
  const initialTab = professorTabs.includes(tab as ProfessorTab)
    ? (tab as ProfessorTab)
    : "painel";

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ProfessorDashboard
      onLogout={onLogout}
      initialTab={initialTab}
      onNavigateTab={(nextTab) => navigate(`/professor/${nextTab}`)}
    />
  );
}

function CoordenadorRoute({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();
  const { tab } = useParams();
  const session = requireSession("coordenador");
  const initialTab = coordenadorTabs.includes(tab as CoordenadorTab)
    ? (tab as CoordenadorTab)
    : "painel";

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <CoordenadorDashboard
      onLogout={onLogout}
      initialTab={initialTab}
      onNavigateTab={(nextTab) => navigate(`/coordenador/${nextTab}`)}
    />
  );
}

export default function App() {
  const navigate = useNavigate();
  const logout = async () => {
    const token = getStoredAuthSession()?.accessToken;
    clearAuthSession();
    clearPendingAuthRole();
    navigate("/login", { replace: true });

    await requestLogout(token).catch(() => undefined);
  };

  return (
    <Routes>
      <Route index element={<Navigate to="/login" replace />} />
      <Route path="login" element={<AuthLayout mode="login" />} />
      <Route path="cadastro" element={<AuthLayout mode="cadastro" />} />
      <Route path="professor" element={<Navigate to="/professor/painel" replace />} />
      <Route path="professor/:tab" element={<ProfessorRoute onLogout={logout} />} />
      <Route path="coordenador" element={<Navigate to="/coordenador/painel" replace />} />
      <Route path="coordenador/:tab" element={<CoordenadorRoute onLogout={logout} />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
