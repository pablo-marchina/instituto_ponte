import { useEffect } from "react";

export function useUnsavedChangesWarning(hasUnsavedChanges: boolean) {
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);
}

export function confirmDiscardChanges(hasUnsavedChanges: boolean) {
  return !hasUnsavedChanges || window.confirm("Você tem alterações não salvas. Deseja sair sem salvar?");
}
