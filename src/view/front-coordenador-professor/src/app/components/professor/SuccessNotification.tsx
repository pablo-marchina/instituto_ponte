import { useEffect } from "react";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

interface Props {
  isVisible: boolean;
  onClose: () => void;
  message?: string;
}

export function SuccessNotification({ isVisible, onClose, message = "Correção salva com sucesso!" }: Props) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl animate-slide-in"
      style={{
        backgroundColor: "#fff",
        boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.15)",
        border: "2px solid #16A34A",
      }}
    >
      <div
        className="flex items-center justify-center rounded-full shrink-0"
        style={{ width: 32, height: 32, backgroundColor: "#DCFCE7" }}
      >
        <CheckCircleIcon className="w-5 h-5" style={{ color: "#16A34A" }} />
      </div>
      <p style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: "14px", color: "#6B6FA3" }}>
        {message}
      </p>
    </div>
  );
}
