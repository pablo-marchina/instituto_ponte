import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Alert, AlertDescription, AlertTitle } from "./alert";
import { Badge } from "./badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb";
import { Button } from "./button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./card";
import { Checkbox } from "./checkbox";
import { Input } from "./input";
import { Label } from "./label";
import { Progress } from "./progress";
import { Skeleton } from "./skeleton";
import { Switch } from "./switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";
import { Textarea } from "./textarea";
import { Toggle } from "./toggle";
import { cn } from "./utils";

describe("basic ui components", () => {
  it("combina classes com cn", () => {
    const includeMiddleClass = false;
    expect(cn("a", includeMiddleClass && "b", "c")).toBe("a c");
  });

  it("renderiza button, badge, alert e card com slots esperados", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Card>
        <CardHeader>
          <CardTitle>Titulo</CardTitle>
          <CardDescription>Descricao</CardDescription>
          <CardAction>Acao</CardAction>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTitle>Aviso</AlertTitle>
            <AlertDescription>Mensagem</AlertDescription>
          </Alert>
          <Badge variant="secondary">Badge</Badge>
          <Button variant="outline" size="sm" onClick={onClick}>Salvar</Button>
        </CardContent>
        <CardFooter>Rodape</CardFooter>
      </Card>,
    );

    expect(screen.getByText("Titulo")).toBeInTheDocument();
    expect(screen.getByText("Badge")).toHaveAttribute("data-slot", "badge");
    await user.click(screen.getByRole("button", { name: "Salvar" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renderiza controles de formulario basicos", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Label htmlFor="nome">Nome</Label>
        <Input id="nome" placeholder="Nome" />
        <Textarea placeholder="Texto" />
        <Checkbox aria-label="Aceite" />
        <Switch aria-label="Ativar" />
        <Toggle aria-label="Negrito">B</Toggle>
      </div>,
    );

    await user.type(screen.getByPlaceholderText("Nome"), "Ada");
    await user.type(screen.getByPlaceholderText("Texto"), "Resposta");
    await user.click(screen.getByLabelText("Aceite"));
    await user.click(screen.getByLabelText("Ativar"));
    await user.click(screen.getByLabelText("Negrito"));

    expect(screen.getByPlaceholderText("Nome")).toHaveValue("Ada");
    expect(screen.getByPlaceholderText("Texto")).toHaveValue("Resposta");
  });

  it("renderiza tabela, breadcrumb, progresso e skeleton", () => {
    render(
      <div>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Inicio</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Atual</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Progress value={40} />
        <Skeleton data-testid="skeleton" />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Ada</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>,
    );

    expect(screen.getByText("Inicio")).toBeInTheDocument();
    expect(screen.getByText("Atual")).toBeInTheDocument();
    expect(screen.getByText("Ada")).toBeInTheDocument();
    expect(screen.getByTestId("skeleton")).toHaveAttribute("data-slot", "skeleton");
  });
});
