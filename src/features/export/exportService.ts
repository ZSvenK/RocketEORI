import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { AuditReport, CheckItem, ReferenceMetadata } from '../../types';
import { calculateCheckStats } from '../check/checkEngine';

export const OFFICIAL_DISCLAIMER =
  'Der Bericht dokumentiert den Abgleich der angegebenen Warennummern mit der bezeichneten Referenzausgabe. ' +
  'Er bestätigt weder die korrekte zolltarifliche Einreihung einer Ware noch deren Ursprung oder Präferenzberechtigung.';

/**
 * Schutz vor Spreadsheet-Formelinjektion (CSV/Excel Formula Injection).
 * Wenn ein Text mit =, +, -, @, Tab oder Return beginnt, wird ein Apostroph vorangestellt.
 */
export function sanitizeSpreadsheetCell(value: any): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

export function statusToGermanText(status: string): string {
  switch (status) {
    case 'MATCH':
      return 'In Referenzausgabe enthalten';
    case 'NO_MATCH':
      return 'Nicht in Referenzausgabe enthalten';
    case 'FORMAT_ERROR':
      return 'Formatfehler';
    case 'PENDING':
      return 'Noch nicht geprüft';
    case 'TECH_ERROR':
      return 'Prüfung technisch fehlgeschlagen';
    default:
      return status;
  }
}

/**
 * Erstellt CSV-Export mit UTF-8 BOM und Schutz vor Formelinjektion
 */
export function generateCsvExport(
  items: CheckItem[],
  metadata?: ReferenceMetadata
): string {
  const rows = items.map(item => ({
    'Laufende Nummer': sanitizeSpreadsheetCell(item.rowNumber ?? ''),
    'Artikelnummer': sanitizeSpreadsheetCell(item.articleNumber ?? ''),
    'Eigene Warenbezeichnung': sanitizeSpreadsheetCell(item.userDescription ?? ''),
    'Originaleingabe': sanitizeSpreadsheetCell(item.rawInput),
    'Warennummer (Text)': sanitizeSpreadsheetCell(item.normalizedCode),
    'Prüfergebnis': statusToGermanText(item.status),
    'Amtliche Warenbeschreibung': sanitizeSpreadsheetCell(item.officialDescription ?? ''),
    'Referenzausgabe': sanitizeSpreadsheetCell(item.referenceEditionYear ?? metadata?.editionYear ?? ''),
    'Datenstand': sanitizeSpreadsheetCell(metadata?.dataStand ?? ''),
    'Prüfzeitpunkt': item.checkedAt ?? '',
    'Hinweise und Fehler': sanitizeSpreadsheetCell(item.warnings.join(' | '))
  }));

  const csv = Papa.unparse(rows, {
    delimiter: ';',
    header: true,
    quotes: true
  });

  // UTF-8 BOM für Excel
  return '\uFEFF' + csv;
}

/**
 * Erstellt XLSX-Export mit ausdrücklich als Text formatierten Warennummern
 */
export function generateXlsxBlob(
  items: CheckItem[],
  metadata?: ReferenceMetadata
): Blob {
  const wb = XLSX.utils.book_new();

  const headers = [
    'Laufende Nummer',
    'Artikelnummer',
    'Eigene Warenbezeichnung',
    'Originaleingabe',
    'Warennummer (Text)',
    'Prüfergebnis',
    'Amtliche Warenbeschreibung',
    'Referenzausgabe',
    'Datenstand',
    'Prüfzeitpunkt',
    'Hinweise und Fehler'
  ];

  const dataRows: any[][] = [headers];

  for (const item of items) {
    dataRows.push([
      item.rowNumber ?? '',
      item.articleNumber ?? '',
      item.userDescription ?? '',
      String(item.rawInput),
      String(item.normalizedCode), // Explicit string
      statusToGermanText(item.status),
      item.officialDescription ?? '',
      item.referenceEditionYear ?? metadata?.editionYear ?? '',
      metadata?.dataStand ?? '',
      item.checkedAt ?? '',
      item.warnings.join(' | ')
    ]);
  }

  // Fußzeile mit Disclaimer
  dataRows.push([]);
  dataRows.push(['HINWEIS:', OFFICIAL_DISCLAIMER]);

  const ws = XLSX.utils.aoa_to_sheet(dataRows);

  // WICHTIG: Setze Zelltyp 's' (String) für Spalte D (Index 3, Originaleingabe) und Spalte E (Index 4, Warennummer)
  // damit Excel niemals führende Nullen abschneidet!
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
  for (let R = 1; R <= items.length; ++R) {
    // Spalte D: Originaleingabe
    const cellD = ws[XLSX.utils.encode_cell({ r: R, c: 3 })];
    if (cellD) {
      cellD.t = 's';
      cellD.v = String(cellD.v);
    }
    // Spalte E: Warennummer
    const cellE = ws[XLSX.utils.encode_cell({ r: R, c: 4 })];
    if (cellE) {
      cellE.t = 's';
      cellE.v = String(cellE.v);
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Prüfbericht');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Erstellt den vollständigen JSON-Auditbericht
 */
export function generateJsonAuditReport(
  items: CheckItem[],
  metadata: ReferenceMetadata
): AuditReport {
  const stats = calculateCheckStats(items);
  return {
    appVersion: '1.0.0 (Warennummern-Checker)',
    generatedAt: new Date().toISOString(),
    referenceMetadata: metadata,
    disclaimer: OFFICIAL_DISCLAIMER,
    statistics: {
      totalItems: stats.totalItems,
      uniqueCodes: stats.uniqueCodes,
      matchCount: stats.matchCount,
      noMatchCount: stats.noMatchCount,
      formatErrorCount: stats.formatErrorCount,
      pendingCount: stats.pendingCount
    },
    items
  };
}

export function downloadFile(blob: Blob | string, filename: string, mimeType: string = 'text/plain;charset=utf-8') {
  const dataBlob = typeof blob === 'string' ? new Blob([blob], { type: mimeType }) : blob;
  const url = URL.createObjectURL(dataBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
