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

const EXCEL_EXTENSIONS = [".xlsx", ".xlsm", ".xls", ".xlsb"];
const EXCEL_MIME = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.ms-excel.sheet.macroenabled.12",
]);

function isExcelFile(file: File): boolean {
  const name = file.name.toLowerCase();
  if (EXCEL_EXTENSIONS.some((ext) => name.endsWith(ext))) return true;
  return EXCEL_MIME.has(file.type);
}

function isCsvFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".csv") || name.endsWith(".txt") || file.type === "text/csv";
}

export type ParseSpreadsheetResult =
  | { ok: true; table: SpreadsheetTable }
  | { ok: false; error: string };

export async function parseSpreadsheetFile(file: File): Promise<ParseSpreadsheetResult> {
  if (isCsvFile(file)) {
    const text = await file.text();
    const table = parseCsvText(text);
    if (!table) {
      return {
        ok: false,
        error: "CSV needs a header row plus at least one data row.",
      };
    }
    return { ok: true, table };
  }

  if (isExcelFile(file)) {
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheetName = wb.SheetNames[0];
      if (!sheetName) {
        return { ok: false, error: "Excel workbook has no sheets." };
      }
      const sheet = wb.Sheets[sheetName];
      const aoa = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });
      const records = aoa.map((row) =>
        (Array.isArray(row) ? row : []).map((cell) => String(cell ?? "").trim()),
      );
      const table = tableFromRecords(records);
      if (!table) {
        return {
          ok: false,
          error:
            "First sheet needs a header row and at least one data row. Remove blank title rows above your headers, or save as .csv.",
        };
      }
      return { ok: true, table };
    } catch {
      return {
        ok: false,
        error: "Couldn't parse this Excel file. Try File → Save As → .xlsx or export as .csv.",
      };
    }
  }

  return {
    ok: false,
    error: "Unsupported file type. Use .csv, .xlsx, or .xlsm.",
  };
}

/** @deprecated Prefer parseSpreadsheetFile — returns null on any failure. */
export async function parseSpreadsheetFileLegacy(file: File): Promise<SpreadsheetTable | null> {
  const result = await parseSpreadsheetFile(file);
  return result.ok ? result.table : null;
}
