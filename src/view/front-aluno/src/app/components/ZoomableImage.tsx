import { useEffect, useRef, useState } from "react";
import { Maximize2, X } from "lucide-react";

export function ZoomableImage({ src, alt }: { src: string | null; alt: string }) {
  const [open, setOpen] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!src) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative mt-3 block w-full overflow-hidden rounded-lg border border-[#D9D9D9] bg-white"
        aria-label={`Ampliar ${alt}`}
      >
        <img src={src} alt={alt} className="max-h-64 w-full object-contain" />
        <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-[#05245F] px-2 py-1 text-xs font-semibold text-white">
          <Maximize2 size={13} /> Ampliar
        </span>
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-3 sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <button
            ref={closeButton}
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-3 top-3 rounded-full bg-white p-3 text-[#05245F] shadow-lg"
            aria-label="Fechar imagem ampliada"
          >
            <X size={22} />
          </button>
          <img src={src} alt={alt} className="max-h-full max-w-full object-contain" />
        </div>
      )}
    </>
  );
}
