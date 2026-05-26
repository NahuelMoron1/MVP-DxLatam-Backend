type FilterValue = string | number | boolean;

type FilterNode =
  | {
      op: "AND" | "OR";
      conditions: FilterNode[];
    }
  | {
      field: string;
      operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in" | "contains";
      value: FilterValue | FilterValue[];
    };

interface QueryResult {
  where: string;
  replacements: FilterValue[];
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
    const replacements: FilterValue[] = [];

    for (const condition of filter.conditions) {
      const child = buildWhereClause(condition);
      parts.push(`(${child.where})`);
      replacements.push(...child.replacements);
    }

    return { where: parts.join(` ${filter.op} `), replacements };
  }

  const { field, operator, value } = filter;

  // atributos dinámicos JSON
  if (field.startsWith("attributes.")) {
    const key = field.replace("attributes.", "");
    const jsonField = `JSON_UNQUOTE(JSON_EXTRACT(attributes, '$.${key}'))`;

    if (operator === "contains") {
      return { where: `${jsonField} LIKE ?`, replacements: [`%${value as string}%`] };
    }

    if (operator === "in") {
      const list = value as FilterValue[];
      return {
        where: `${jsonField} IN (${list.map(() => "?").join(",")})`,
        replacements: list,
      };
    }

    return { where: `${jsonField} ${operatorMap[operator]} ?`, replacements: [value as FilterValue] };
  }

  // columnas normales
  if (operator === "contains") {
    return { where: `${field} LIKE ?`, replacements: [`%${value as string}%`] };
  }

  if (operator === "in") {
    const list = value as FilterValue[];
    return {
      where: `${field} IN (${list.map(() => "?").join(",")})`,
      replacements: list,
    };
  }

  return { where: `${field} ${operatorMap[operator]} ?`, replacements: [value as FilterValue] };
};
