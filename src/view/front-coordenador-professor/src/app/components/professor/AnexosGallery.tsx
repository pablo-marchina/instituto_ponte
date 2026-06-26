import { useState } from "react";
import { ArrowDownTrayIcon, XMarkIcon } from "@heroicons/react/24/outline";

export type AnexoGalleryItem = {
  id: string;
  urlArquivo: string;
  mimeType: string;
  nomeArquivo?: string | null;
};

type Props = {
  anexos: AnexoGalleryItem[];
};

function isImage(anexo: AnexoGalleryItem) {
  return anexo.mimeType.startsWith("image/");
}

export function AnexosGallery({ anexos }: Props) {
  const [selected, setSelected] = useState<AnexoGalleryItem | null>(null);

  if (anexos.length === 0) return null;

  return (
    <>
      <div className="flex gap-3 flex-wrap">
        {anexos.map((anexo, index) => (
          <button
            key={anexo.id}
            type="button"
            onClick={() => setSelected(anexo)}
            className="rounded-xl overflow-hidden shrink-0 hover:opacity-85 transition-opacity"
            style={{ width: 120, height: 86, backgroundColor: "#E5E7EB", border: "1px solid #D9D9D9" }}
            title={anexo.nomeArquivo ?? `Anexo ${index + 1}`}
          >
            {isImage(anexo) ? (
              <img src={anexo.urlArquivo} alt={anexo.nomeArquivo ?? `Anexo ${index + 1}`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1 px-2">
                <ArrowDownTrayIcon className="w-6 h-6" style={{ color: "#6B6FA3" }} />
                <span className="truncate max-w-full" style={{ fontFamily: "Inter, sans-serif", fontSize: 11, color: "#6A7181" }}>
                  {anexo.nomeArquivo ?? "Arquivo"}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ backgroundColor: "rgba(0,0,0,0.72)" }}>
          <div className="relative bg-white rounded-xl p-4 max-w-[92vw] max-h-[92vh] flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <p className="truncate" style={{ fontFamily: "Poppins, sans-serif", fontWeight: 600, fontSize: 14, color: "#05245F" }}>
                {selected.nomeArquivo ?? "Anexo da resposta"}
              </p>
              <div className="flex items-center gap-2">
                <a
                  href={selected.urlArquivo}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg"
                  style={{ border: "1px solid #6B6FA3", color: "#6B6FA3", fontFamily: "Inter, sans-serif", fontSize: 12 }}
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Abrir
                </a>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="p-1.5 rounded-lg hover:opacity-75 transition-opacity"
                  style={{ backgroundColor: "#F2F2F2" }}
                  aria-label="Fechar galeria"
                >
                  <XMarkIcon className="w-5 h-5" style={{ color: "#05245F" }} />
                </button>
              </div>
            </div>

            {isImage(selected) ? (
              <img
                src={selected.urlArquivo}
                alt={selected.nomeArquivo ?? "Anexo ampliado"}
                className="object-contain rounded-lg"
                style={{ maxWidth: "86vw", maxHeight: "76vh" }}
              />
            ) : (
              <iframe
                src={selected.urlArquivo}
                title={selected.nomeArquivo ?? "Anexo"}
                className="rounded-lg"
                style={{ width: "86vw", height: "76vh", border: "1px solid #D9D9D9" }}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
