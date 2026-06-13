/** Parse CSV / Excel uploads into a header row + data rows. */

export type SpreadsheetTable = {
  headers: string[];
  rows: string[][];
};

function parseCsvRecords(raw: string): string[][] {
  const records: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQ = false;

  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (c === '"') {
      if (inQ && raw[i + 1] === '"') {
        cur += '"';
        i++;
        continue;
      }
      inQ = !inQ;
      continue;
    }
    if (c === "," && !inQ) {
      row.push(cur.trim());
      cur = "";
      continue;
    }
    if ((c === "\n" || c === "\r") && !inQ) {
      if (c === "\r" && raw[i + 1] === "\n") i++;
      row.push(cur.trim());
      if (row.some((cell) => cell !== "")) records.push(row);
      row = [];
      cur = "";
      continue;
    }
    cur += c;
  }
  if (cur.length || row.length) {
    row.push(cur.trim());
    if (row.some((cell) => cell !== "")) records.push(row);
  }
  return records;
}

function tableFromRecords(records: string[][]): SpreadsheetTable | null {
  if (records.length < 2) return null;
  const headers = records[0].map((h) => h.trim());
  const rows = records.slice(1).filter((r) => r.some((c) => c.trim() !== ""));
  if (!headers.some((h) => h !== "")) return null;
  return { headers, rows };
}

export function parseCsvText(text: string): SpreadsheetTable | null {
  const records = parseCsvRecords(text.replace(/^\uFEFF/, ""));
  return tableFromRecords(records);
}

export async function parseSpreadsheetFile(file: File): Promise<SpreadsheetTable | null> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || name.endsWith(".txt")) {
    const text = await file.text();
    return parseCsvText(text);
  }
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const XLSX = await import("xlsx");
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) return null;
    const sheet = wb.Sheets[sheetName];
    const aoa = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });
    const records = aoa.map((row) =>
      (Array.isArray(row) ? row : []).map((cell) => String(cell ?? "").trim()),
    );
    return tableFromRecords(records);
  }
  return null;
}
