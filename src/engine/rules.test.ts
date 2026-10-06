import { describe, expect, it } from "vitest";
import { applyOutputs, coerce, compare, evaluateRoute } from "./rules";

describe("coerce", () => {
  it("turns numeric and boolean strings into real values", () => {
    expect(coerce("8.0")).toBe(8);
    expect(coerce(" 7.5 ")).toBe(7.5);
    expect(coerce("true")).toBe(true);
    expect(coerce("FALSE")).toBe(false);
    expect(coerce("Band 8")).toBe("Band 8");
    expect(coerce(42)).toBe(42);
  });
});

describe("compare", () => {
  it("compares numbers even when one side is a string from an input box", () => {
    expect(compare("7.5", ">=", 7.5)).toBe(true);
    expect(compare(7, ">=", "7.5")).toBe(false);
    expect(compare(1480, "<", "1520")).toBe(true);
  });

  it("treats == case-insensitively and supports contains", () => {
    expect(compare("Certified", "==", "certified")).toBe(true);
    expect(compare(true, "==", "true")).toBe(true);
    expect(compare("Stanford REA", "contains", "rea")).toBe(true);
    expect(compare("a", "!=", "b")).toBe(true);
  });

  it("never matches an unset variable", () => {
    expect(compare(undefined, ">=", 0)).toBe(false);
    expect(compare(null, "==", "")).toBe(false);
  });

  it("refuses numeric comparison on non-numbers", () => {
    expect(compare("high", ">", 3)).toBe(false);
  });
});

describe("evaluateRoute", () => {
  const groups = [
    { id: "g1", mode: "all" as const, port: "pass" as const, rules: [{ variable: "score", op: ">=" as const, value: 80 }] },
  ];

  it("takes the first matching group", () => {
    expect(evaluateRoute(groups, { score: 90 }, "fail")).toMatchObject({ port: "pass", matchedGroupId: "g1" });
  });

  it("falls back when nothing matches", () => {
    const r = evaluateRoute(groups, { score: 50 }, "fail");
    expect(r.port).toBe("fail");
    expect(r.reason).toMatch(/fallback/);
  });

  it("supports ANY groups", () => {
    const any = [
      {
        id: "g",
        mode: "any" as const,
        port: "true" as const,
        rules: [
          { variable: "a", op: "==" as const, value: 1 },
          { variable: "b", op: "==" as const, value: 1 },
        ],
      },
    ];
    expect(evaluateRoute(any, { a: 0, b: 1 }, "false").port).toBe("true");
    expect(evaluateRoute(any, { a: 0, b: 0 }, "false").port).toBe("false");
  });

  it("ignores empty groups", () => {
    expect(evaluateRoute([{ id: "e", mode: "all", port: "pass", rules: [] }], {}, "fail").port).toBe("fail");
  });
});

describe("applyOutputs", () => {
  it("adds without float noise and sets values", () => {
    const out = applyOutputs({ w: 6.5, s: "1" }, [
      { variable: "w", op: "add", value: 0.1 },
      { variable: "s", op: "add", value: "2" },
      { variable: "flag", op: "set", value: "true" },
    ]);
    expect(out).toEqual({ w: 6.6, s: 3, flag: true });
  });

  it("does not mutate the input", () => {
    const vars = { x: 1 };
    applyOutputs(vars, [{ variable: "x", op: "add", value: 1 }]);
    expect(vars.x).toBe(1);
  });
});
