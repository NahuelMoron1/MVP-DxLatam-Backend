function sanitizeValue(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v).replace(/[<>"'`]/g, '');
}

export function resolveTemplate(
  template: string,
  contact: Record<string, unknown>,
): string {
  return template
    .replace(/\{\{name\}\}/gi, sanitizeValue(contact['first_name']))
    .replace(/\{\{country\}\}/gi, sanitizeValue(contact['country']))
    .replace(/\{\{city\}\}/gi, sanitizeValue(contact['city']));
}
