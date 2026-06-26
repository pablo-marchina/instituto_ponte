import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { XMarkIcon, ClipboardDocumentIcon, CheckIcon } from "@heroicons/react/24/outline";

interface Props {
  onClose: () => void;
  urlAcesso: string;
  qrCode?: string;
}

export function CompartilharModal({ onClose, urlAcesso, qrCode }: Props) {
  const [copied, setCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const qrPayload = qrCode || urlAcesso;

  useEffect(() => {
    setQrCodeDataUrl(null);
    setQrError(null);

    QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 240,
      color: {
        dark: "#111111",
        light: "#FFFFFF",
      },
    })
      .then(setQrCodeDataUrl)
      .catch(() => setQrError("Não foi possível gerar o QR Code."));
  }, [qrPayload]);

  function handleCopy() {
    navigator.clipboard.writeText(urlAcesso).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Card */}
      <div
        className="bg-white rounded-2xl flex flex-col gap-5 relative"
        style={{
          width: 625,
          padding: "32px 32px 36px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg hover:opacity-70 transition-opacity"
          style={{ backgroundColor: "#F2F2F2" }}
        >
          <XMarkIcon className="w-4 h-4" style={{ color: "#6A7181" }} />
        </button>

        {/* Title */}
        <h2 style={{ fontFamily: "Poppins, sans-serif", fontWeight: 700, fontSize: 20, color: "#000" }}>
          Publicar e Compartilhar
        </h2>

        {/* URL row */}
        <div className="flex gap-2 items-center">
          <div
            className="flex-1 flex items-center px-3 rounded-xl"
            style={{
              height: 44,
              border: "1px solid #D7D7D9",
              backgroundColor: "#F7F8FA",
            }}
          >
            <span
              style={{
                fontFamily: "Inter, sans-serif",
                fontSize: 13,
                color: "#444",
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}
            >
              {urlAcesso}
            </span>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center justify-center rounded-xl shrink-0 hover:opacity-80 transition-all"
            style={{
              width: 44,
              height: 44,
              border: "1.5px solid #D7D7D9",
              backgroundColor: copied ? "#6B6FA3" : "#fff",
            }}
            title="Copiar link"
          >
            {copied
              ? <CheckIcon className="w-[18px] h-[18px]" style={{ color: "#F9B233" }} />
              : <ClipboardDocumentIcon className="w-[18px] h-[18px]" style={{ color: "#6A7181" }} />
            }
          </button>
        </div>

        {/* QR Code area */}
        <div
          className="rounded-2xl flex flex-col items-center justify-center gap-4"
          style={{
            backgroundColor: "#F7F8FA",
            border: "1px solid #E6E6E6",
            padding: "32px 0 28px",
          }}
        >
          <div
            className="rounded-2xl flex items-center justify-center bg-white"
            style={{ width: 240, height: 240, border: "1px solid #E0E0E0" }}
          >
            {qrCodeDataUrl ? (
              <img src={qrCodeDataUrl} alt="QR Code da prova" width={240} height={240} />
            ) : (
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#6A7181", padding: 16, textAlign: "center" }}>
                {qrError ?? "Gerando QR Code..."}
              </span>
            )}
          </div>

          <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#6A7181" }}>
            QR Code da prova
          </p>
        </div>
      </div>
    </div>
  );
}
