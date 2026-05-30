import { describe, expect, it } from "@jest/globals";
import { toIsoString } from "../../helpers/date.js";

describe("date - unitário", () => {
describe("toIsoString", () => {
  it("deve converter objeto Date para ISO string no formato UTC", () => {
    const date = new Date("2024-01-15T10:30:00Z");
    expect(toIsoString(date)).toBe("2024-01-15T10:30:00.000Z");
  });

  it("deve converter string ISO já formatada para ISO string padronizada", () => {
    expect(toIsoString("2024-01-15T10:30:00Z")).toBe("2024-01-15T10:30:00.000Z");
  });

  it("deve retornar null quando o valor de entrada é null", () => {
    expect(toIsoString(null)).toBeNull();
  });

  it("deve converter string de data sem fuso horário para ISO string", () => {
    const result = toIsoString("2024-01-15T10:30:00");
    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
  });

  it("deve lançar erro quando a string não é uma data ISO válida", () => {
    expect(() => toIsoString("invalido")).toThrow();
  });
});
});
