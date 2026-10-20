export interface NormalizationResult {
  raw: string;
  normalized: string;
  isValidFormat: boolean;
  warnings: string[];
  errorMessage?: string;
}

/**
 * Normalisiert eine eingegebene Warennummer nach den strengen Regeln aus Abschnitt 8:
 * - Äußere Leerzeichen entfernen.
 * - Bei eindeutig formatierten Nummern (z.B. "9603 30 10" oder "9603 3010") interne Leerzeichen entfernen.
 * - Jede Normalisierung nachvollziehbar machen (Warnungen/Hinweise).
 * - NICHT erlaubt: pauschal alle Nicht-Ziffern entfernen.
 * - NICHT erlaubt: fehlende Ziffern automatisch ergänzen (z.B. führende Null bei 7 Stellen).
 * - NICHT erlaubt: Nummern abschneiden (z.B. 10/11 Stellen auf 8 Stellen kürzen).
 * - Gültiges Format: genau acht ASCII-Ziffern (Regex: ^[0-9]{8}$).
 */
export function normalizeWarennummer(rawInput: string): NormalizationResult {
  const raw = rawInput ?? '';
  const warnings: string[] = [];

  // Hinweis bezüglich Personenkennzeichnung P1 / P2
  if (/\b(P1|P2)\b/i.test(raw)) {
    warnings.push('Hinweis: Personenkennzeichnung (P1/P2) erkannt und für die Warennummernprüfung ignoriert.');
  }

  // 1. Äußere Leerzeichen entfernen
  let trimmed = raw.trim();
  if (trimmed !== raw && trimmed.length > 0) {
    warnings.push('Äußere Leerzeichen wurden entfernt.');
  }

  // 2. Prüfen auf interne Leerzeichen
  // z.B. "9603 30 10", "9603 3010", "96 03 30 10"
  if (/^[0-9]+(\s+[0-9]+)+$/.test(trimmed)) {
    const withoutSpaces = trimmed.replace(/\s+/g, '');
    if (withoutSpaces.length === 8) {
      warnings.push(`Interne Formatierungsleerzeichen wurden entfernt ("${trimmed}" -> "${withoutSpaces}").`);
      trimmed = withoutSpaces;
    }
  }

  // 3. Strenge Formatprüfung: genau 8 Ziffern
  const isEightDigits = /^[0-9]{8}$/.test(trimmed);

  if (isEightDigits) {
    return {
      raw,
      normalized: trimmed,
      isValidFormat: true,
      warnings
    };
  }

  // Fehleranalyse für nachvollziehbare Fehlermeldungen (keine stille Manipulation!)
  let errorMessage = 'Formatfehler: Keine gültige achtstellige Warennummer.';

  if (/^[0-9]{7}$/.test(trimmed)) {
    errorMessage = 'Formatfehler: Genau 7 Ziffern. Möglicherweise ging beim Excel-Import eine führende Null verloren (z.B. "0..."). Eine automatische Ergänzung ist nicht zulässig.';
  } else if (/^[0-9]{9,11}$/.test(trimmed)) {
    errorMessage = `Formatfehler: ${trimmed.length} Ziffern (z.B. TARIC-/Codenummer). Ein automatisches Abschneiden auf 8 Stellen ist nicht zulässig.`;
  } else if (/^[0-9]{1,6}$/.test(trimmed)) {
    errorMessage = `Formatfehler: Nur ${trimmed.length} Ziffern (mindestens 8 Ziffern erforderlich).`;
  } else if (/[a-zA-Z]/.test(trimmed)) {
    errorMessage = 'Formatfehler: Enthält unzulässige Buchstaben oder Zeichen. Buchstaben dürfen nicht stillschweigend entfernt werden.';
  } else if (trimmed.length === 0) {
    errorMessage = 'Formatfehler: Leere Eingabe.';
  }

  return {
    raw,
    normalized: trimmed,
    isValidFormat: false,
    warnings,
    errorMessage
  };
}
