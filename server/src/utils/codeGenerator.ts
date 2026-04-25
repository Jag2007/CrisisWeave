const randomPart = (): string => Math.random().toString(36).slice(2, 7).toUpperCase();

export function generateCode(prefix: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  return `${prefix}-${timestamp}-${randomPart()}`;
}
