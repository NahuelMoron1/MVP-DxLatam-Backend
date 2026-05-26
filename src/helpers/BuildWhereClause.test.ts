import { buildWhereClause } from "./BuildWhereClause";

describe("buildWhereClause — leaf operators", () => {
  test("eq on a regular field", () => {
    const result = buildWhereClause({ field: "country", operator: "eq", value: "GT" });
    expect(result.where).toBe("country = ?");
    expect(result.replacements).toEqual(["GT"]);
  });

  test("neq operator", () => {
    const result = buildWhereClause({ field: "status", operator: "neq", value: "INACTIVE" });
    expect(result.where).toBe("status != ?");
    expect(result.replacements).toEqual(["INACTIVE"]);
  });

  test("gt operator", () => {
    const result = buildWhereClause({ field: "age", operator: "gt", value: 18 });
    expect(result.where).toBe("age > ?");
    expect(result.replacements).toEqual([18]);
  });

  test("gte operator", () => {
    const result = buildWhereClause({ field: "created_at", operator: "gte", value: "2025-01-01" });
    expect(result.where).toBe("created_at >= ?");
    expect(result.replacements).toEqual(["2025-01-01"]);
  });

  test("lt operator", () => {
    const result = buildWhereClause({ field: "age", operator: "lt", value: 65 });
    expect(result.where).toBe("age < ?");
    expect(result.replacements).toEqual([65]);
  });

  test("lte operator", () => {
    const result = buildWhereClause({ field: "age", operator: "lte", value: 65 });
    expect(result.where).toBe("age <= ?");
    expect(result.replacements).toEqual([65]);
  });

  test("contains wraps value in %", () => {
    const result = buildWhereClause({ field: "city", operator: "contains", value: "Mar" });
    expect(result.where).toBe("city LIKE ?");
    expect(result.replacements).toEqual(["%Mar%"]);
  });

  test("in generates placeholders for each value", () => {
    const result = buildWhereClause({ field: "country", operator: "in", value: ["AR", "GT"] });
    expect(result.where).toBe("country IN (?,?)");
    expect(result.replacements).toEqual(["AR", "GT"]);
  });
});

describe("buildWhereClause — dynamic JSON attributes", () => {
  test("attributes.plan eq", () => {
    const result = buildWhereClause({ field: "attributes.plan", operator: "eq", value: "premium" });
    expect(result.where).toBe("JSON_UNQUOTE(JSON_EXTRACT(attributes, '$.plan')) = ?");
    expect(result.replacements).toEqual(["premium"]);
  });

  test("attributes.age gt", () => {
    const result = buildWhereClause({ field: "attributes.age", operator: "gt", value: 18 });
    expect(result.where).toBe("JSON_UNQUOTE(JSON_EXTRACT(attributes, '$.age')) > ?");
    expect(result.replacements).toEqual([18]);
  });

  test("attributes.bio contains", () => {
    const result = buildWhereClause({ field: "attributes.bio", operator: "contains", value: "dev" });
    expect(result.where).toBe("JSON_UNQUOTE(JSON_EXTRACT(attributes, '$.bio')) LIKE ?");
    expect(result.replacements).toEqual(["%dev%"]);
  });

  test("attributes.plan in", () => {
    const result = buildWhereClause({
      field: "attributes.plan",
      operator: "in",
      value: ["basic", "premium"],
    });
    expect(result.where).toBe(
      "JSON_UNQUOTE(JSON_EXTRACT(attributes, '$.plan')) IN (?,?)",
    );
    expect(result.replacements).toEqual(["basic", "premium"]);
  });
});

describe("buildWhereClause — logical groups", () => {
  test("AND combines conditions with AND", () => {
    const result = buildWhereClause({
      op: "AND",
      conditions: [
        { field: "country", operator: "eq", value: "GT" },
        { field: "status", operator: "eq", value: "ACTIVE" },
      ],
    });
    expect(result.where).toBe("(country = ?) AND (status = ?)");
    expect(result.replacements).toEqual(["GT", "ACTIVE"]);
  });

  test("OR combines conditions with OR", () => {
    const result = buildWhereClause({
      op: "OR",
      conditions: [
        { field: "country", operator: "eq", value: "GT" },
        { field: "country", operator: "eq", value: "MX" },
      ],
    });
    expect(result.where).toBe("(country = ?) OR (country = ?)");
    expect(result.replacements).toEqual(["GT", "MX"]);
  });

  test("nested AND/OR resolves correctly", () => {
    const result = buildWhereClause({
      op: "AND",
      conditions: [
        { field: "country", operator: "eq", value: "AR" },
        {
          op: "OR",
          conditions: [
            { field: "attributes.plan", operator: "eq", value: "premium" },
            { field: "attributes.age", operator: "gt", value: 18 },
          ],
        },
      ],
    });
    expect(result.where).toBe(
      "(country = ?) AND ((JSON_UNQUOTE(JSON_EXTRACT(attributes, '$.plan')) = ?) OR (JSON_UNQUOTE(JSON_EXTRACT(attributes, '$.age')) > ?))",
    );
    expect(result.replacements).toEqual(["AR", "premium", 18]);
  });

  test("replacements order matches conditions order", () => {
    const result = buildWhereClause({
      op: "AND",
      conditions: [
        { field: "country", operator: "eq", value: "MX" },
        { field: "status", operator: "eq", value: "INACTIVE" },
        { field: "attributes.age", operator: "lt", value: 30 },
      ],
    });
    expect(result.replacements).toEqual(["MX", "INACTIVE", 30]);
  });
});

describe("buildWhereClause — SQL injection safety", () => {
  test("malicious value is passed as parameter, never concatenated", () => {
    const result = buildWhereClause({
      field: "country",
      operator: "eq",
      value: "'; DROP TABLE Contacts; --",
    });
    // The WHERE string still uses a placeholder — the dangerous value is in replacements
    expect(result.where).toBe("country = ?");
    expect(result.replacements).toEqual(["'; DROP TABLE Contacts; --"]);
  });

  test("malicious value in IN array is parametrized", () => {
    const result = buildWhereClause({
      field: "status",
      operator: "in",
      value: ["ACTIVE", "' OR '1'='1"],
    });
    expect(result.where).toBe("status IN (?,?)");
    expect(result.replacements).toEqual(["ACTIVE", "' OR '1'='1"]);
  });
});
