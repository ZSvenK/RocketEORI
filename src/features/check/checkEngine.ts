import { CheckItem, ReferenceEntry, ReferenceMetadata } from '../../types';
import { normalizeWarennummer } from '../../utils/normalizer';

export interface CheckStats {
  totalItems: number;
  uniqueCodes: number;
  matchCount: number;
  noMatchCount: number;
  formatErrorCount: number;
  pendingCount: number;
  duplicateRowsCount: number;
}

export function calculateCheckStats(items: CheckItem[]): CheckStats {
  const uniqueCodeSet = new Set<string>();
  let matchCount = 0;
  let noMatchCount = 0;
  let formatErrorCount = 0;
  let pendingCount = 0;
  let duplicateRowsCount = 0;

  for (const item of items) {
    if (item.normalizedCode) {
      uniqueCodeSet.add(item.normalizedCode);
    }
    if (item.isDuplicateCode) duplicateRowsCount++;

    switch (item.status) {
      case 'MATCH':
        matchCount++;
        break;
      case 'NO_MATCH':
        noMatchCount++;
        break;
      case 'FORMAT_ERROR':
        formatErrorCount++;
        break;
      case 'PENDING':
      default:
        pendingCount++;
        break;
    }
  }

  return {
    totalItems: items.length,
    uniqueCodes: uniqueCodeSet.size,
    matchCount,
    noMatchCount,
    formatErrorCount,
    pendingCount,
    duplicateRowsCount
  };
}

/**
 * Führt die Prüfung nach den Abschnitten 4, 8, 9 und 10 durch.
 * Ohne geladene Referenz MUSS die Prüfung blockiert werden!
 */
export function executeCheck(
  items: CheckItem[],
  activeReference: { metadata: ReferenceMetadata; entries: ReferenceEntry[] } | null
): CheckItem[] {
  if (!activeReference) {
    throw new Error('Prüfung blockiert: Es ist keine amtliche Referenzdatei geladen. Eine fachliche Prüfung ohne Referenz ist nicht zulässig.');
  }

  // Erstelle Map für effizienten O(1)-Abgleich
  const refMap = new Map<string, ReferenceEntry>();
  for (const entry of activeReference.entries) {
    refMap.set(entry.code, entry);
  }

  // Zähle Vorkommen normalisierter Nummern zur Duplikat-Erkennung
  const codeCountMap = new Map<string, number>();
  for (const item of items) {
    const norm = normalizeWarennummer(item.rawInput);
    if (norm.isValidFormat) {
      codeCountMap.set(norm.normalized, (codeCountMap.get(norm.normalized) || 0) + 1);
    }
  }

  const checkTimestamp = new Date().toISOString();

  return items.map(item => {
    // 1. Originaleingabe bleibt unverändert
    const normResult = normalizeWarennummer(item.rawInput);

    // 2. Formatprüfung
    if (!normResult.isValidFormat) {
      return {
        ...item,
        normalizedCode: normResult.normalized,
        status: 'FORMAT_ERROR',
        officialDescription: undefined,
        referenceId: activeReference.metadata.id,
        referenceEditionYear: activeReference.metadata.editionYear,
        checkedAt: checkTimestamp,
        warnings: [
          ...(normResult.errorMessage ? [normResult.errorMessage] : []),
          ...normResult.warnings
        ],
        isDuplicateCode: false
      };
    }

    const code = normResult.normalized;
    const isDuplicate = (codeCountMap.get(code) || 0) > 1;

    // 3. Exakter String-Abgleich gegen aktive Referenz
    const match = refMap.get(code);

    const updatedWarnings = [...normResult.warnings];
    if (isDuplicate) {
      updatedWarnings.push('Mehrfacheintrag: Diese Warennummer kommt für mehrere Artikel in der Liste vor.');
    }

    if (match) {
      return {
        ...item,
        normalizedCode: code,
        status: 'MATCH',
        officialDescription: match.description,
        referenceId: activeReference.metadata.id,
        referenceEditionYear: activeReference.metadata.editionYear,
        checkedAt: checkTimestamp,
        warnings: updatedWarnings,
        isDuplicateCode: isDuplicate
      };
    } else {
      return {
        ...item,
        normalizedCode: code,
        status: 'NO_MATCH',
        officialDescription: undefined,
        referenceId: activeReference.metadata.id,
        referenceEditionYear: activeReference.metadata.editionYear,
        checkedAt: checkTimestamp,
        warnings: updatedWarnings,
        isDuplicateCode: isDuplicate
      };
    }
  });
}
