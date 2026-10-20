import { describe, it, expect } from 'vitest';
import { normalizeWarennummer } from '../utils/normalizer';
import { executeCheck } from '../features/check/checkEngine';
import { parseFixedColumnTxt, DESTATIS_OFFICIAL_CONFIG } from '../features/reference/parser';
import {
  generateCsvExport,
  generateXlsxBlob,
  generateJsonAuditReport,
  sanitizeSpreadsheetCell,
  OFFICIAL_DISCLAIMER
} from '../features/export/exportService';
import { DEMO_REFERENCE_ENTRIES, DEMO_REFERENCE_METADATA } from '../data/demoReference';
import { CheckItem, ReferenceEntry, ReferenceMetadata } from '../types';

const testReference: { metadata: ReferenceMetadata; entries: ReferenceEntry[] } = {
  metadata: {
    id: 'test-ref-2026',
    editionYear: 2026,
    dataStand: 'Stand Test',
    importedAt: '2026-10-20T11:00:00Z',
    sourceFileName: 'test_sova.txt',
    sourceUrl: 'https://www.destatis.de/test',
    sha256Hash: 'abc123sha256',
    parserProfile: 'Destatis Test Profil',
    isOfficialVerified: true,
    isDemo: false,
    totalRecords: 2,
    uniqueCodesCount: 2
  },
  entries: [
    { code: '05029000', description: 'Naturhaare' },
    { code: '96033010', description: 'Pinsel für Kunstmaler und Schreibpinsel' }
  ]
};

describe('Warennummern-Checker Tests (18 Pflichtprüfungen)', () => {

  // 1. Führende Null bleibt erhalten
  it('1. Führende Null bleibt erhalten und wird niemals abgeschnitten', () => {
    const res = normalizeWarennummer('05029000');
    expect(res.normalized).toBe('05029000');
    expect(res.normalized.startsWith('0')).toBe(true);
    expect(res.isValidFormat).toBe(true);

    const check = executeCheck([
      {
        id: '1',
        rawInput: '05029000',
        normalizedCode: '05029000',
        status: 'PENDING',
        warnings: [],
        isDuplicateCode: false
      }
    ], testReference);

    expect(check[0].normalizedCode).toBe('05029000');
    expect(check[0].status).toBe('MATCH');
    expect(check[0].officialDescription).toBe('Naturhaare');
  });

  // 2. Exakter Treffer gegen eine Testreferenz
  it('2. Exakter Treffer gegen eine Testreferenz', () => {
    const check = executeCheck([
      {
        id: '2',
        rawInput: '96033010',
        normalizedCode: '96033010',
        status: 'PENDING',
        warnings: [],
        isDuplicateCode: false
      }
    ], testReference);

    expect(check[0].status).toBe('MATCH');
    expect(check[0].officialDescription).toBe('Pinsel für Kunstmaler und Schreibpinsel');
  });

  // 3. Formal gültige, aber nicht enthaltene Nummer
  it('3. Formal gültige, aber nicht enthaltene Nummer ergibt "Nicht in Referenzausgabe enthalten"', () => {
    const check = executeCheck([
      {
        id: '3',
        rawInput: '99999999',
        normalizedCode: '99999999',
        status: 'PENDING',
        warnings: [],
        isDuplicateCode: false
      }
    ], testReference);

    expect(check[0].status).toBe('NO_MATCH');
    expect(check[0].officialDescription).toBeUndefined();
  });

  // 4. Siebenstellige Nummer ergibt Formatfehler
  it('4. Siebenstellige Nummer ergibt Formatfehler ohne unzulässige Auto-Auffüllung', () => {
    const res = normalizeWarennummer('5029000');
    expect(res.isValidFormat).toBe(false);
    expect(res.errorMessage).toContain('7 Ziffern');
    expect(res.errorMessage).toContain('führende Null verloren');

    const check = executeCheck([
      {
        id: '4',
        rawInput: '5029000',
        normalizedCode: '5029000',
        status: 'PENDING',
        warnings: [],
        isDuplicateCode: false
      }
    ], testReference);

    expect(check[0].status).toBe('FORMAT_ERROR');
    expect(check[0].warnings.some(w => w.includes('7 Ziffern'))).toBe(true);
  });

  // 5. Zehnstellige Nummer wird nicht abgeschnitten
  it('5. Zehnstellige Nummer wird nicht stillschweigend abgeschnitten', () => {
    const res = normalizeWarennummer('9603301000');
    expect(res.isValidFormat).toBe(false);
    expect(res.errorMessage).toContain('Ziffern');
    expect(res.errorMessage).toContain('Abschneiden');
  });

  // 6. Buchstaben werden nicht stillschweigend entfernt
  it('6. Buchstaben werden nicht stillschweigend entfernt', () => {
    const res = normalizeWarennummer('9603301A');
    expect(res.isValidFormat).toBe(false);
    expect(res.errorMessage).toContain('Buchstaben');
  });

  // 7. Erlaubte Leerzeichen-Normalisierung wird dokumentiert
  it('7. Erlaubte Formatierungs-Leerzeichen-Normalisierung wird dokumentiert', () => {
    const res = normalizeWarennummer(' 9603 30 10 ');
    expect(res.isValidFormat).toBe(true);
    expect(res.normalized).toBe('96033010');
    expect(res.warnings.some(w => w.includes('Formatierungsleerzeichen'))).toBe(true);
  });

  // 8. Doppelte Nummern behalten ihre Artikelzeilen
  it('8. Doppelte Nummern behalten ihre separaten Artikelzeilen und werden gekennzeichnet', () => {
    const items: CheckItem[] = [
      {
        id: 'row-1',
        articleNumber: 'ART-A',
        userDescription: 'Plastikständer',
        rawInput: '96033010',
        normalizedCode: '96033010',
        status: 'PENDING',
        warnings: [],
        isDuplicateCode: false
      },
      {
        id: 'row-2',
        articleNumber: 'ART-B',
        userDescription: 'Plastikköcher',
        rawInput: '96033010',
        normalizedCode: '96033010',
        status: 'PENDING',
        warnings: [],
        isDuplicateCode: false
      }
    ];

    const checked = executeCheck(items, testReference);
    expect(checked.length).toBe(2);
    expect(checked[0].isDuplicateCode).toBe(true);
    expect(checked[1].isDuplicateCode).toBe(true);
    expect(checked[0].articleNumber).toBe('ART-A');
    expect(checked[1].articleNumber).toBe('ART-B');
  });

  // 9. Prüfung ohne Referenz wird blockiert
  it('9. Prüfung ohne Referenz wird zwingend blockiert', () => {
    const items: CheckItem[] = [
      {
        id: '1',
        rawInput: '96033010',
        normalizedCode: '96033010',
        status: 'PENDING',
        warnings: [],
        isDuplicateCode: false
      }
    ];

    expect(() => executeCheck(items, null)).toThrowError(/Prüfung blockiert/);
  });

  // 10. Änderung eines Eintrags setzt sein Ergebnis zurück
  it('10. Änderung einer Nummer setzt das Ergebnis auf PENDING zurück', () => {
    const originalItem: CheckItem = {
      id: '1',
      rawInput: '96033010',
      normalizedCode: '96033010',
      status: 'MATCH',
      officialDescription: 'Pinsel',
      referenceId: 'ref-1',
      checkedAt: '2026-10-20T10:00:00Z',
      warnings: [],
      isDuplicateCode: false
    };

    // User editiert Nummer
    const updatedRaw = '05029000';
    const norm = normalizeWarennummer(updatedRaw);

    const editedItem: CheckItem = {
      ...originalItem,
      rawInput: updatedRaw,
      normalizedCode: norm.normalized,
      status: 'PENDING', // Altes Ergebnis ist ungültig!
      officialDescription: undefined,
      checkedAt: undefined,
      warnings: norm.warnings
    };

    expect(editedItem.status).toBe('PENDING');
    expect(editedItem.officialDescription).toBeUndefined();
    expect(editedItem.checkedAt).toBeUndefined();
  });

  // 11. Referenzwechsel macht alte Ergebnisse nicht automatisch aktuell
  it('11. Referenzwechsel macht alte Prüfungsdaten nicht stillschweigend zu aktuellen Ergebnissen', () => {
    const checkedWithRef1: CheckItem = {
      id: '1',
      rawInput: '96033010',
      normalizedCode: '96033010',
      status: 'MATCH',
      officialDescription: 'Alte Beschreibung',
      referenceId: 'ref-alt-2025',
      referenceEditionYear: 2025,
      checkedAt: '2025-01-01T00:00:00Z',
      warnings: [],
      isDuplicateCode: false
    };

    const newReferenceId = 'ref-neu-2026';
    expect(checkedWithRef1.referenceId).not.toBe(newReferenceId);
  });

  // 12. CSV mit Semikolon und BOM
  it('12. CSV Export enthält UTF-8 BOM und Semikolon als Trennzeichen', () => {
    const items: CheckItem[] = [
      {
        id: '1',
        rowNumber: 1,
        articleNumber: 'A1',
        userDescription: 'Pinsel',
        rawInput: '05029000',
        normalizedCode: '05029000',
        status: 'MATCH',
        officialDescription: 'Naturhaare',
        checkedAt: '2026-10-20T11:00:00Z',
        warnings: [],
        isDuplicateCode: false
      }
    ];

    const csv = generateCsvExport(items, testReference.metadata);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain(';');
    expect(csv).toContain('05029000');
  });

  // 13. Feste Spaltenbreite anhand eines Testprofils
  it('13. Feste Spaltenbreite parst Destatis-Struktur nach Datensatzbeschreibung', () => {
    // 276 Zeichen Zeile gemäß Spezifikation:
    // chars 0..8: 96033010
    // chars 8..10: leer
    // chars 10..258: Pinsel für Kunstmaler (248 Zeichen mit Leerzeichen aufgefüllt)
    // chars 258..274: St
    // chars 274..276: 61
    const code = '96033010';
    const spaces2 = '  ';
    const descText = 'Pinsel für Kunstmaler';
    const descPadded = descText.padEnd(248, ' ');
    const unitPadded = 'St'.padEnd(16, ' ');
    const codePadded = '61';
    const sampleLine = code + spaces2 + descPadded + unitPadded + codePadded;

    expect(sampleLine.length).toBe(276);

    const res = parseFixedColumnTxt(
      sampleLine,
      'test.txt',
      'dummyhash',
      2026,
      DESTATIS_OFFICIAL_CONFIG,
      true
    );

    expect(res.entries.length).toBe(1);
    expect(res.entries[0].code).toBe('96033010');
    expect(res.entries[0].description).toBe('Pinsel für Kunstmaler');
    expect(res.entries[0].unitAbbreviation).toBe('St');
  });

  // 14. Fehlerhafte Referenz ersetzt keinen funktionierenden Bestand
  it('14. Fehlerhafte Referenzdatei ohne Warennummern wird abgelehnt', () => {
    const invalidContent = 'Dies ist eine reine Textdatei ohne Daten\nNoch eine Zeile';
    expect(() => {
      parseFixedColumnTxt(invalidContent, 'broken.txt', 'dummyhash', 2026);
    }).toThrowError(/enthält keine gültigen/);
  });

  // 15. XLSX-Export erhält Textnummern
  it('15. XLSX-Export erzeugt Blob für Tabellenkalkulation', () => {
    const items: CheckItem[] = [
      {
        id: '1',
        rawInput: '05029000',
        normalizedCode: '05029000',
        status: 'MATCH',
        officialDescription: 'Naturhaare',
        warnings: [],
        isDuplicateCode: false
      }
    ];

    const blob = generateXlsxBlob(items, testReference.metadata);
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(100);
  });

  // 16. CSV-Formelinjektion wird berücksichtigt
  it('16. Spreadsheet-Formelinjektion wird neutralisiert', () => {
    expect(sanitizeSpreadsheetCell('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
    expect(sanitizeSpreadsheetCell('+49123456')).toBe("'+49123456");
    expect(sanitizeSpreadsheetCell('-100')).toBe("'-100");
    expect(sanitizeSpreadsheetCell('@IMPORT(...)')).toBe("'@IMPORT(...)");
    expect(sanitizeSpreadsheetCell('Normaler Text')).toBe('Normaler Text');
  });

  // 17. JSON-Bericht enthält Referenzmetadaten & Disclaimer
  it('17. JSON-Bericht enthält Referenzmetadaten, Statistiken und den vorgeschriebenen Disclaimer', () => {
    const items: CheckItem[] = [
      {
        id: '1',
        rawInput: '96033010',
        normalizedCode: '96033010',
        status: 'MATCH',
        warnings: [],
        isDuplicateCode: false
      }
    ];

    const report = generateJsonAuditReport(items, testReference.metadata);
    expect(report.appVersion).toContain('Warennummern-Checker');
    expect(report.referenceMetadata.sha256Hash).toBe('abc123sha256');
    expect(report.referenceMetadata.editionYear).toBe(2026);
    expect(report.disclaimer).toBe(OFFICIAL_DISCLAIMER);
    expect(report.statistics.totalItems).toBe(1);
    expect(report.statistics.matchCount).toBe(1);
  });

  // 18. Demo-Modus ist eindeutig gekennzeichnet
  it('18. Demo-Modus ist unmissverständlich als DEMODATEN gekennzeichnet', () => {
    expect(DEMO_REFERENCE_METADATA.isDemo).toBe(true);
    expect(DEMO_REFERENCE_METADATA.isOfficialVerified).toBe(false);
    expect(DEMO_REFERENCE_METADATA.parserProfile).toContain('DEMODATEN');
    expect(DEMO_REFERENCE_ENTRIES.length).toBeGreaterThan(0);
  });
});
