export function exportJsonFile(prefix: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${prefix}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

export async function readJsonFile<T = unknown>(file: File): Promise<T> {
  return JSON.parse(await file.text()) as T;
}
