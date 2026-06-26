import { fireEvent, render, renderHook, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { Line, LineChart } from "recharts";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Calendar } from "./calendar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./carousel";
import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltipContent,
} from "./chart";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "./command";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "./context-menu";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "./drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./form";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "./input-otp";
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from "./menubar";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "./navigation-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination";
import { RadioGroup, RadioGroupItem } from "./radio-group";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./resizable";
import { ScrollArea, ScrollBar } from "./scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "./sheet";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "./sidebar";
import { Slider } from "./slider";
import { Toaster } from "./sonner";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";
import { useIsMobile } from "./use-mobile";

vi.mock("embla-carousel-react", () => ({
  default: () => [
    vi.fn(),
    {
      canScrollPrev: () => true,
      canScrollNext: () => true,
      scrollPrev: vi.fn(),
      scrollNext: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
    },
  ],
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "dark" }),
}));

const installMatchMedia = (matches = false) => {
  const listeners = new Set<() => void>();
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockImplementation(() => ({
      matches,
      media: "",
      onchange: null,
      addEventListener: (_event: string, listener: () => void) =>
        listeners.add(listener),
      removeEventListener: (_event: string, listener: () => void) =>
        listeners.delete(listener),
      dispatchEvent: () => true,
    })),
  });
};

class TestResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

function FormExample() {
  const form = useForm<{ nome: string }>({
    defaultValues: { nome: "Ada" },
  });

  return (
    <Form {...form}>
      <form>
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <input {...field} />
              </FormControl>
              <FormDescription>Nome completo</FormDescription>
              <FormMessage>Mensagem manual</FormMessage>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

function SidebarStateProbe() {
  const sidebar = useSidebar();
  return (
    <button type="button" onClick={sidebar.toggleSidebar}>
      {sidebar.state}
    </button>
  );
}

describe("extended ui wrappers", () => {
  beforeEach(() => {
    installMatchMedia(false);
    vi.stubGlobal("ResizeObserver", TestResizeObserver);
    Element.prototype.scrollIntoView = vi.fn();
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      x: 0,
      y: 0,
      width: 640,
      height: 360,
      top: 0,
      right: 640,
      bottom: 360,
      left: 0,
      toJSON: () => ({}),
    }));
    Object.defineProperty(HTMLElement.prototype, "clientWidth", {
      configurable: true,
      value: 640,
    });
    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      value: 360,
    });
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1024,
    });
  });

  it("renderiza wrappers de formulario, calendario, paginacao e controles", () => {
    render(
      <div>
        <Calendar mode="single" selected={new Date(2026, 5, 16)} />
        <FormExample />
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#prev" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#1" isActive>
                1
              </PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#next" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
        <RadioGroup defaultValue="a">
          <RadioGroupItem value="a" aria-label="Opcao A" />
        </RadioGroup>
        <Slider defaultValue={[20, 80]} />
        <ToggleGroup type="single" defaultValue="bold">
          <ToggleGroupItem value="bold">B</ToggleGroupItem>
        </ToggleGroup>
        <InputOTP maxLength={4} value="12">
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
          </InputOTPGroup>
        </InputOTP>
      </div>,
    );

    expect(screen.getByLabelText("Nome")).toHaveValue("Ada");
    expect(screen.getByRole("navigation", { name: /pagination/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Opcao A")).toBeInTheDocument();
  });

  it("renderiza menus, sheets, drawer, hover card, select e command", async () => {
    render(
      <div>
        <Select defaultValue="a" open>
          <SelectTrigger aria-label="Tema">
            <SelectValue placeholder="Tema" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Temas</SelectLabel>
              <SelectItem value="a">Algebra</SelectItem>
              <SelectSeparator />
              <SelectItem value="b">Geometria</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <DropdownMenu open>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel inset>Opcoes</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem inset>Editar</DropdownMenuItem>
              <DropdownMenuCheckboxItem checked>Ativo</DropdownMenuCheckboxItem>
              <DropdownMenuRadioGroup value="p">
                <DropdownMenuRadioItem value="p">Professor</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuShortcut>Ctrl+E</DropdownMenuShortcut>
              <DropdownMenuSeparator />
              <DropdownMenuSub open>
                <DropdownMenuSubTrigger>Mais</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>Duplicar</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <ContextMenu>
          <ContextMenuTrigger>Area</ContextMenuTrigger>
          <ContextMenuContent forceMount>
            <ContextMenuGroup>
              <ContextMenuLabel inset>Acoes</ContextMenuLabel>
              <ContextMenuItem inset variant="destructive">Copiar</ContextMenuItem>
              <ContextMenuCheckboxItem checked>Visivel</ContextMenuCheckboxItem>
              <ContextMenuRadioGroup value="um">
                <ContextMenuRadioItem value="um">Um</ContextMenuRadioItem>
              </ContextMenuRadioGroup>
              <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
              <ContextMenuSeparator />
              <ContextMenuSub open>
                <ContextMenuSubTrigger inset>Submenu</ContextMenuSubTrigger>
                <ContextMenuSubContent forceMount>
                  <ContextMenuItem>Detalhe</ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>Arquivo</MenubarTrigger>
            <MenubarContent forceMount>
              <MenubarGroup>
                <MenubarLabel inset>Grupo</MenubarLabel>
                <MenubarItem inset variant="destructive">Novo</MenubarItem>
                <MenubarCheckboxItem checked>Fixado</MenubarCheckboxItem>
                <MenubarRadioGroup value="a">
                  <MenubarRadioItem value="a">A</MenubarRadioItem>
                </MenubarRadioGroup>
                <MenubarShortcut>Ctrl+N</MenubarShortcut>
                <MenubarSeparator />
                <MenubarSub open>
                  <MenubarSubTrigger inset>Sub</MenubarSubTrigger>
                  <MenubarSubContent forceMount>
                    <MenubarItem>Interno</MenubarItem>
                  </MenubarSubContent>
                </MenubarSub>
              </MenubarGroup>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Provas</NavigationMenuTrigger>
              <NavigationMenuContent>
                <NavigationMenuLink href="#provas">Todas</NavigationMenuLink>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
          <NavigationMenuIndicator />
          <NavigationMenuViewport />
        </NavigationMenu>
        <Sheet open>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Filtro</SheetTitle>
              <SheetDescription>Escolha filtros</SheetDescription>
            </SheetHeader>
            <SheetFooter>Rodape</SheetFooter>
          </SheetContent>
        </Sheet>
        <Drawer open>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Drawer</DrawerTitle>
              <DrawerDescription>Descricao</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>Fim</DrawerFooter>
          </DrawerContent>
        </Drawer>
        <HoverCard open>
          <HoverCardTrigger>Aluno</HoverCardTrigger>
          <HoverCardContent>Detalhes do aluno</HoverCardContent>
        </HoverCard>
        <Command>
          <CommandInput placeholder="Buscar" />
          <CommandList>
            <CommandEmpty>Nada</CommandEmpty>
            <CommandGroup heading="Acoes">
              <CommandItem>Publicar</CommandItem>
              <CommandSeparator />
              <CommandShortcut>Enter</CommandShortcut>
            </CommandGroup>
          </CommandList>
        </Command>
        <Table className="custom-table">
          <TableCaption>Notas finais</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Nota</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow data-state="selected">
              <TableCell>Ada</TableCell>
              <TableCell>10</TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell>Total</TableCell>
              <TableCell>1</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>,
    );

    fireEvent.click(screen.getByText("Arquivo"));
    expect(screen.getAllByText("Algebra")).toHaveLength(2);
    expect(screen.getByText("Editar")).toBeInTheDocument();
    expect(screen.getByText("Filtro")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Buscar")).toBeInTheDocument();
    expect(screen.getByText("Notas finais")).toBeInTheDocument();
  });

  it("renderiza carousel, chart, resizable, scroll area, sidebar e toaster", async () => {
    render(
      <div>
        <Carousel orientation="vertical" setApi={vi.fn()}>
          <CarouselContent>
            <CarouselItem>Slide 1</CarouselItem>
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
        <ChartContainer
          id="notas"
          config={{
            nota: { label: "Nota", color: "#123456" },
            media: { label: "Media", theme: { light: "#000", dark: "#fff" } },
          }}
        >
          <div>
            <LineChart data={[{ nota: 10 }]}>
              <Line dataKey="nota" />
            </LineChart>
            <ChartTooltipContent
              active
              label="nota"
              payload={[
                {
                  dataKey: "nota",
                  name: "nota",
                  value: 10,
                  color: "#123456",
                  payload: { nota: 10 },
                },
              ]}
            />
            <ChartLegendContent
              payload={[{ value: "nota", dataKey: "nota", color: "#123456" }]}
            />
          </div>
        </ChartContainer>
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={50}>A</ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={50}>B</ResizablePanel>
        </ResizablePanelGroup>
        <ScrollArea className="h-20">
          Conteudo rolavel
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <SidebarProvider defaultOpen>
          <SidebarStateProbe />
          <Sidebar collapsible="icon">
            <SidebarHeader>
              <SidebarInput placeholder="Buscar menu" />
            </SidebarHeader>
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupLabel>Grupo</SidebarGroupLabel>
                <SidebarGroupAction>+</SidebarGroupAction>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton tooltip="Painel" isActive>
                        <span>Painel</span>
                      </SidebarMenuButton>
                      <SidebarMenuAction showOnHover>...</SidebarMenuAction>
                      <SidebarMenuBadge>2</SidebarMenuBadge>
                    </SidebarMenuItem>
                    <SidebarMenuSkeleton showIcon />
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton href="#sub" isActive>
                          Sub
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
            <SidebarSeparator />
            <SidebarFooter>Fim</SidebarFooter>
            <SidebarRail />
          </Sidebar>
          <SidebarInset>
            <SidebarTrigger />
          </SidebarInset>
        </SidebarProvider>
        <Toaster />
      </div>,
    );

    fireEvent.click(screen.getByRole("button", { name: "expanded" }));
    expect(screen.getByText("Slide 1")).toBeInTheDocument();
    expect(screen.getByText("Conteudo rolavel")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Buscar menu")).toBeInTheDocument();
    expect(screen.getByText("collapsed")).toBeInTheDocument();
  });

  it("detecta mobile por matchMedia e largura da janela", () => {
    installMatchMedia(true);
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 375,
    });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(true);
  });
});
