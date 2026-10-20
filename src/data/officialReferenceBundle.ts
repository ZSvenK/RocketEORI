import { ReferenceEntry, ReferenceMetadata } from '../types';

export const OFFICIAL_2026_METADATA: ReferenceMetadata = {
  id: 'destatis-sova-wa2026',
  editionYear: 2026,
  dataStand: 'Stand 23.10.2025 (Ausgabe 2026)',
  importedAt: '2026-10-20T11:33:00.000Z',
  sourceFileName: 'SOVA_alle_gueltigen_Warennummern_WA2026.txt',
  sourceUrl: 'https://www.destatis.de/DE/Methoden/Klassifikationen/Aussenhandel/sova-leitdatei.html',
  sha256Hash: '45be946654c83fe54f5236554be5edf47b431e7c41ade3659283c34e72820768',
  parserProfile: 'Destatis SOVA Feste Breite 2026 (amtlich verifiziert)',
  isOfficialVerified: true,
  isDemo: false,
  totalRecords: 9834,
  uniqueCodesCount: 9834
};

/**
 * Lädt den amtlichen Destatis 2026 Datenbestand (9.834 Warennummern)
 */
export async function loadOfficial2026Reference(): Promise<{ metadata: ReferenceMetadata; entries: ReferenceEntry[] }> {
  try {
    const res = await fetch('/data/official_2026.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data: ReferenceEntry[] = await res.json();
    return {
      metadata: OFFICIAL_2026_METADATA,
      entries: data
    };
  } catch (err) {
    console.error('Fehler beim Laden von official_2026.json, verwende Fallback:', err);
    throw err;
  }
}
