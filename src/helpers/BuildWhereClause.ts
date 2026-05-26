type FilterNode =
  | {
      op: "AND" | "OR";
      conditions: FilterNode[];
    }
  | {
      field: string;
      operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "contains";
      value: any;
    };

interface QueryResult {
  where: string;
  replacements: any[];
}

const operatorMap: Record<string, string> = {
  eq: "=",
  neq: "!=",
  gt: ">",
  gte: ">=",
  lt: "<",
  lte: "<=",
};

export const buildWhereClause = (filter: FilterNode): QueryResult => {
  // nodo AND / OR
  if ("op" in filter) {
    const parts: string[] = [];
    const replacements: any[] = [];

    for (const condition of filter.conditions) {
      const child = buildWhereClause(condition);

      parts.push(`(${child.where})`);
      replacements.push(...child.replacements);
    }

    return {
      where: parts.join(` ${filter.op} `),
      replacements,
    };
  }

  const { field, operator, value } = filter;

  // atributos dinámicos JSON
  if (field.startsWith("attributes.")) {
    const key = field.replace("attributes.", "");
    const jsonField = `JSON_UNQUOTE(JSON_EXTRACT(attributes, '$.${key}'))`;

    if (operator === "contains") {
      return {
        where: `${jsonField} LIKE ?`,
        replacements: [`%${value}%`],
      };
    }

    if (operator === "in") {
      const placeholders = value.map(() => "?").join(",");

      return {
        where: `${jsonField} IN (${placeholders})`,
        replacements: value,
      };
    }

    return {
      where: `${jsonField} ${operatorMap[operator]} ?`,
      replacements: [value],
    };
  }

  // columnas normales
  if (operator === "contains") {
    return {
      where: `${field} LIKE ?`,
      replacements: [`%${value}%`],
    };
  }

  if (operator === "in") {
    const placeholders = value.map(() => "?").join(",");

    return {
      where: `${field} IN (${placeholders})`,
      replacements: value,
    };
  }

  return {
    where: `${field} ${operatorMap[operator]} ?`,
    replacements: [value],
  };
};
