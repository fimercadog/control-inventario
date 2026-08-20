type TableExportData = {
  headers: string[];
  rows: string[][];
};

function sanitizeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "tabla";
}

function tableData(table: HTMLTableElement): TableExportData {
  const headerCells = Array.from(table.tHead?.rows.item(0)?.cells ?? []);
  const includedIndexes = headerCells
    .map((cell, index) => ({ index, label: cell.textContent?.trim() ?? "" }))
    .filter(({ label }) => label.toLowerCase() !== "acciones");

  return {
    headers: includedIndexes.map(({ label }) => label),
    rows: Array.from(table.tBodies.item(0)?.rows ?? []).map((row) =>
      includedIndexes.map(({ index }) => row.cells.item(index)?.textContent?.trim().replace(/\s+/g, " ") ?? ""),
    ),
  };
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadTableCsv(table: HTMLTableElement, title: string) {
  const { headers, rows } = tableData(table);
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  const csv = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
  download(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }), `${sanitizeFileName(title)}.csv`);
}

function pdfText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "?")
    .replace(/([\\()])/g, "\\$1");
}

function wrapLine(line: string, maxLength = 105) {
  const words = line.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
    } else current = next;
  }
  if (current) lines.push(current);
  return lines;
}

/** Minimal, dependency-free PDF for the table currently visible in the UI. */
export function downloadTablePdf(table: HTMLTableElement, title: string) {
  const { headers, rows } = tableData(table);
  const lines = [title, "", headers.join(" | "), ...rows.flatMap((row) => wrapLine(row.join(" | ")))];
  const pageLines: string[][] = [];
  for (let index = 0; index < lines.length; index += 46) pageLines.push(lines.slice(index, index + 46));

  const objects: string[] = ["", "", "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"];
  const pageIds: number[] = [];
  for (const page of pageLines) {
    const contentId = objects.length + 1;
    const content = `BT\n/F1 10 Tf\n40 800 Td\n15 TL\n${page.map((line) => `(${pdfText(line)}) Tj\nT*`).join("\n")}\nET`;
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    const pageId = objects.length + 1;
    objects.push(`<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 3 0 R >> >> /MediaBox [0 0 595 842] /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  }
  objects[0] = `<< /Type /Catalog /Pages 2 0 R >>`;
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  download(new Blob([pdf], { type: "application/pdf" }), `${sanitizeFileName(title)}.pdf`);
}
