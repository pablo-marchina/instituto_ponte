import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./feedback/ConfirmDialog";
import { MathText } from "./math/MathText";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { AspectRatio } from "./ui/aspect-ratio";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

describe("shared components", () => {
  beforeEach(() => {
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    Object.defineProperty(globalThis, "ResizeObserver", {
      configurable: true,
      value: ResizeObserverMock,
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renderiza texto matematico, latex textual e fallback vazio", () => {
    const { container, rerender } = render(
      <MathText>{"Area $x^2$ \\textbf{forte}\\newline\\begin{itemize}\\item item\\end{itemize}"}</MathText>,
    );

    expect(container.querySelector(".katex")).toBeTruthy();
    expect(container.querySelector("b")?.textContent).toBe("forte");
    expect(container.querySelector("li")?.textContent).toContain("item");

    rerender(<MathText emptyText="Sem texto">{null}</MathText>);
    expect(screen.getByText("Sem texto")).toBeInTheDocument();
  });

  it("confirma e cancela dialogo de confirmacao", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmDialog
        open
        title="Remover item?"
        description="Essa acao pode ser desfeita depois."
        confirmLabel="Remover"
        cancelLabel="Voltar"
        onOpenChange={onOpenChange}
        onConfirm={onConfirm}
      />,
    );

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remover" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Voltar" }));
    expect(onOpenChange).toHaveBeenCalled();
  });

  it("renderiza wrappers Radix basicos e troca estados por interacao", async () => {
    const user = userEvent.setup();

    render(
      <div>
        <Accordion type="single" collapsible>
          <AccordionItem value="a">
            <AccordionTrigger>Detalhes</AccordionTrigger>
            <AccordionContent>Conteudo aberto</AccordionContent>
          </AccordionItem>
        </Accordion>

        <AspectRatio ratio={16 / 9} data-testid="aspect">
          <span>Midia</span>
        </AspectRatio>

        <Avatar>
          <AvatarImage src="/avatar.png" alt="Ada" />
          <AvatarFallback>AD</AvatarFallback>
        </Avatar>

        <Collapsible>
          <CollapsibleTrigger>Expandir</CollapsibleTrigger>
          <CollapsibleContent>Conteudo expansivel</CollapsibleContent>
        </Collapsible>

        <Dialog>
          <DialogTrigger>Abrir dialogo</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Titulo dialogo</DialogTitle>
              <DialogDescription>Descricao dialogo</DialogDescription>
            </DialogHeader>
            <DialogFooter>Rodape dialogo</DialogFooter>
          </DialogContent>
        </Dialog>

        <Popover>
          <PopoverTrigger>Abrir popover</PopoverTrigger>
          <PopoverContent>Conteudo popover</PopoverContent>
        </Popover>

        <Separator data-testid="separator" />

        <Tabs defaultValue="um">
          <TabsList>
            <TabsTrigger value="um">Um</TabsTrigger>
            <TabsTrigger value="dois">Dois</TabsTrigger>
          </TabsList>
          <TabsContent value="um">Painel um</TabsContent>
          <TabsContent value="dois">Painel dois</TabsContent>
        </Tabs>

        <Tooltip>
          <TooltipTrigger>Ajuda</TooltipTrigger>
          <TooltipContent>Dica importante</TooltipContent>
        </Tooltip>
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "Detalhes" }));
    expect(screen.getByText("Conteudo aberto")).toBeInTheDocument();
    expect(screen.getByTestId("aspect")).toHaveAttribute("data-slot", "aspect-ratio");

    await user.click(screen.getByRole("button", { name: "Expandir" }));
    expect(screen.getByText("Conteudo expansivel")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Abrir dialogo" }));
    expect(screen.getByText("Titulo dialogo")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close" }));

    await user.click(screen.getByRole("button", { name: "Abrir popover" }));
    expect(screen.getByText("Conteudo popover")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Dois" }));
    expect(screen.getByText("Painel dois")).toBeInTheDocument();

    await user.hover(screen.getByRole("button", { name: "Ajuda" }));
    expect(await screen.findAllByText("Dica importante")).toHaveLength(2);
  });
});
