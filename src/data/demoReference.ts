import { ReferenceEntry, ReferenceMetadata } from '../types';

export const DEMO_REFERENCE_METADATA: ReferenceMetadata = {
  id: 'ref-demo-2026',
  editionYear: 2026,
  dataStand: 'DEMO-STAND (Künstliche Testdaten)',
  importedAt: new Date().toISOString(),
  sourceFileName: 'DEMODATEN_keine_amtliche_Pruefung.txt',
  sourceUrl: 'https://www.destatis.de/DE/Methoden/Klassifikationen/Aussenhandel/sova-leitdatei.html (Muster)',
  sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  parserProfile: 'DEMODATEN – keine amtliche Prüfung',
  isOfficialVerified: false,
  isDemo: true,
  totalRecords: 15,
  uniqueCodesCount: 15
};

export const DEMO_REFERENCE_ENTRIES: ReferenceEntry[] = [
  { code: '05029000', description: 'Naturhaare (ausg. Schweineborsten und Dachshaare)' },
  { code: '96033010', description: 'Pinsel für Kunstmaler und Schreibpinsel' },
  { code: '96033090', description: 'Pinsel für Kosmetik' },
  { code: '96034010', description: 'Lackierpinsel' },
  { code: '96032980', description: 'Rasierpinsel und andere Körperpflegepinsel' },
  { code: '44170000', description: 'Pinselstiele aus Holz' },
  { code: '74112110', description: 'Rohre aus Messing, gerade' },
  { code: '76169990', description: 'Andere Waren aus Aluminium' },
  { code: '73269098', description: 'Andere Waren aus Eisen oder Stahl' },
  { code: '39269097', description: 'Andere Waren aus Kunststoffen' },
  { code: '42029291', description: 'Wasserbehälter und Taschen mit Außenseite aus Kunststoffspinnstoffen' },
  { code: '96083000', description: 'Federhalter aus Holz und andere Federn' },
  { code: '39239000', description: 'Transparente Schutzhülsen und Verpackungsmittel aus Kunststoffen' },
  { code: '84425000', description: 'Druckplatten, Druckzylinder, Klischees' },
  { code: '83052000', description: 'Heftklammern in Streifen' }
];
