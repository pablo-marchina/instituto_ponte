interface Props {
  onNavigateToLogin: () => void;
}

export function CadastroScreen({ onNavigateToLogin }: Props) {
  return (
    <div
      className="bg-white rounded-2xl w-full max-w-[480px] px-10 py-10 flex flex-col gap-5"
      style={{ boxShadow: "0px 4px 24px rgba(0,0,0,0.10)" }}
    >
      <p
        style={{
          fontFamily: "Poppins, sans-serif",
          fontWeight: 600,
          fontSize: "24px",
          color: "#6B6FA3",
        }}
      >
        Cadastro interno
      </p>

      <p style={{ fontFamily: "Inter, sans-serif", fontSize: "15px", color: "#6A7181", lineHeight: 1.6 }}>
        O acesso de professores e coordenadores não é criado pelo frontend. O e-mail precisa estar cadastrado no backend como usuário autorizado.
      </p>

      <button
        onClick={onNavigateToLogin}
        className="py-3 rounded-full transition-opacity hover:opacity-85"
        style={{
          backgroundColor: "#F9B233",
          color: "#05245F",
          fontFamily: "Poppins, sans-serif",
          fontWeight: 600,
          fontSize: "16px",
        }}
      >
        Voltar para login
      </button>
    </div>
  );
}
