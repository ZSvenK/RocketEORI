import JSZip from 'jszip';
import { FixedColumnConfig, ReferenceEntry, ReferenceMetadata } from '../../types';

export const DESTATIS_OFFICIAL_CONFIG: FixedColumnConfig = {
  codeStart: 0,
  codeLength: 8,
  descStart: 10,
  descLength: 248,
  unitStart: 258,
  unitLength: 16,
  encoding: 'iso-8859-1'
};

export interface ParseResult {
  metadata: ReferenceMetadata;
  entries: ReferenceEntry[];
  errors: string[];
  conflicts: string[];
}

/**
 * Parst eine Destatis SOVA TXT-Datei mit festen Spaltenbreiten
 */
export function parseFixedColumnTxt(
  content: string,
  fileName: string,
  sha256Hash: string,
  editionYear: number,
  config: FixedColumnConfig = DESTATIS_OFFICIAL_CONFIG,
  isOfficialSpec: boolean = true
): ParseResult {
  const lines = content.split(/\r?\n/);
  const entries: ReferenceEntry[] = [];
  const errors: string[] = [];
  const conflicts: string[] = [];
  const codeMap = new Map<string, string>(); // code -> description

  let lineNr = 0;
  for (const rawLine of lines) {
    lineNr++;
    if (!rawLine || rawLine.trim().length === 0) continue;

    // Mindestlänge prüfen
    if (rawLine.length < config.codeStart + config.codeLength) {
      errors.push(`Zeile ${lineNr}: Zeilenlänge (${rawLine.length}) kürzer als Position der Warennummer.`);
      continue;
    }

    const code = rawLine.substring(config.codeStart, config.codeStart + config.codeLength).trim();
    if (!/^[0-9]{8}$/.test(code)) {
      errors.push(`Zeile ${lineNr}: Ungültiges Warennummernformat "${code}". 8 Ziffern erwartet.`);
      continue;
    }

    let description = '';
    if (rawLine.length >= config.descStart) {
      const endPos = Math.min(rawLine.length, config.descStart + config.descLength);
      description = rawLine.substring(config.descStart, endPos).trim();
    }

    let unitAbbr: string | undefined;
    if (config.unitStart && rawLine.length >= config.unitStart) {
      const endUnit = Math.min(rawLine.length, config.unitStart + (config.unitLength || 16));
      unitAbbr = rawLine.substring(config.unitStart, endUnit).trim() || undefined;
    }

    // Konflikte bei doppelten Nummern mit abweichender Beschreibung prüfen
    if (codeMap.has(code)) {
      const prevDesc = codeMap.get(code)!;
      if (prevDesc !== description) {
        conflicts.push(`Widersprüchliche Beschreibung zu Warennummer ${code}: "${prevDesc}" vs. "${description}"`);
      }
    } else {
      codeMap.set(code, description);
    }

    entries.push({
      code,
      description,
      unitAbbreviation: unitAbbr
    });
  }

  if (entries.length === 0) {
    throw new Error('Die Referenzdatei enthält keine gültigen achtstelligen Warennummern.');
  }

  const parserProfile = isOfficialSpec
    ? `Destatis SOVA Feste Spaltenbreite ${editionYear} (amtlich verifiziert)`
    : 'Manuell konfiguriert (nicht amtlich verifiziert)';

  const metadata: ReferenceMetadata = {
    id: 'ref-' + Date.now(),
    editionYear,
    dataStand: isOfficialSpec ? `Ausgabe ${editionYear}` : 'Benutzerdefiniert',
    importedAt: new Date().toISOString(),
    sourceFileName: fileName,
    sourceUrl: 'https://www.destatis.de/DE/Methoden/Klassifikationen/Aussenhandel/sova-leitdatei.html',
    sha256Hash,
    parserProfile,
    isOfficialVerified: isOfficialSpec,
    isDemo: false,
    totalRecords: entries.length,
    uniqueCodesCount: codeMap.size,
    errorRecordsCount: errors.length,
    conflictsCount: conflicts.length
  };

  return { metadata, entries, errors, conflicts };
}

export interface ZipFileInfo {
  name: string;
  size: number;
  isCandidate: boolean;
  isDescriptionOrPdf: boolean;
}

/**
 * Liest ein ZIP-Archiv sicher aus und verhindert Zip-Bombs
 */
export async function inspectZipArchive(file: File): Promise<{
  zip: JSZip;
  files: ZipFileInfo[];
  candidateFile?: string;
}> {
  const MAX_ENTRIES = 50;
  const MAX_UNCOMPRESSED_SIZE = 50 * 1024 * 1024; // 50 MB

  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  const entries = Object.values(zip.files);
  if (entries.length > MAX_ENTRIES) {
    throw new Error(`ZIP-Archiv enthält ${entries.length} Dateien (maximal ${MAX_ENTRIES} zulässig).`);
  }

  let totalSize = 0;
  const files: ZipFileInfo[] = [];
  let candidateFile: string | undefined;

  for (const entry of entries) {
    if (entry.dir) continue;
    // Größe unkomprimiert schätzen
    const size = (entry as any)._data?.uncompressedSize || 0;
    totalSize += size;
    if (totalSize > MAX_UNCOMPRESSED_SIZE) {
      throw new Error('Sicherheitsabbruch: Entpackte Gesamtgröße des Archivs überschreitet 50 MB.');
    }

    const lowerName = entry.name.toLowerCase();
    const isPdf = lowerName.endsWith('.pdf');
    const isDoc = lowerName.includes('liesmich') || lowerName.includes('datensatzbeschreibung');
    const isTxt = lowerName.endsWith('.txt');
    const isSovaCandidate = isTxt && (lowerName.includes('sova') || lowerName.includes('gueltig'));

    if (isSovaCandidate && !candidateFile) {
      candidateFile = entry.name;
    }

    files.push({
      name: entry.name,
      size,
      isCandidate: isSovaCandidate,
      isDescriptionOrPdf: isPdf || isDoc
    });
  }

  return { zip, files, candidateFile };
}
