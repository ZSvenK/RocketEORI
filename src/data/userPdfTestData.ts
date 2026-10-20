import { CheckItem } from '../types';
import { normalizeWarennummer } from '../utils/normalizer';

export interface UserPdfItemRaw {
  nr: number;
  description: string;
  code: string;
  note: string; // P1 / P2
}

export const USER_PDF_ITEMS_RAW: UserPdfItemRaw[] = [
  { nr: 1, description: 'Pinsel für Kunstmaler und Schreibpinsel', code: '96033010', note: 'P1 + P2' },
  { nr: 2, description: 'Pinsel für Kosmetik', code: '96033090', note: 'P1 + P2' },
  { nr: 3, description: 'Lackierpinsel', code: '96034010', note: 'P1 + P2' },
  { nr: 4, description: 'Rasierpinsel', code: '96032980', note: 'P1 + P2' },
  { nr: 5, description: 'Farbroller, Kissen und Roller zum Auftragen', code: '96034090', note: 'P2' },
  { nr: 6, description: 'Pinselstiele aus Holz', code: '44170000', note: 'P1 + P2' },
  { nr: 7, description: 'Zwingen aus Messing', code: '74112110', note: 'P1 + P2' },
  { nr: 8, description: 'Zwingen aus Aluminium', code: '76169990', note: 'P1 + P2' },
  { nr: 9, description: 'Zwingen aus Weißblech/Edelstahl', code: '73269098', note: 'P1 + P2' },
  { nr: 10, description: 'Rohre aus Kupfer-Zink-Legierung „Messing“ gerade', code: '74112110', note: 'P1' },
  { nr: 11, description: 'Plastikständer zur Präsentation von Pinseln', code: '39269097', note: 'P2' },
  { nr: 12, description: 'Plastikköcher zur Präsentation von Pinseln', code: '39269097', note: 'P2' },
  { nr: 13, description: 'Holzpinselständer', code: '44151010', note: 'P2' },
  { nr: 14, description: 'Pinsel und Pinselsortimente', code: '96033010', note: 'P1 + P2' },
  { nr: 15, description: 'Wasserbehälter mit Außenseite aus Kunststoffspinnstoffen', code: '42029291', note: 'P2' },
  { nr: 16, description: 'Pinselwascher aus Aluminium', code: '76129080', note: 'P2' },
  { nr: 17, description: 'Federhalter aus Holz', code: '96083000', note: 'P2' },
  { nr: 18, description: 'Teile für Applikatoren/ Schaumstoffköpfe', code: '96162000', note: 'P1' },
  { nr: 19, description: 'Transparente Haarschutzhülsen aus Butyrat', code: '39239000', note: 'P1' },
  { nr: 20, description: 'Gummikissen, Gummikamm', code: '40169997', note: 'P2' },
  { nr: 21, description: 'Modellier-Stäbchen aus Holz', code: '44219999', note: 'P2' },
  { nr: 22, description: 'Naturhaare', code: '05029000', note: 'P1 + P2' }, // WICHTIG: Führende Null!
  { nr: 23, description: 'Kunsthaare', code: '54041100', note: 'P1 + P2' },
  { nr: 24, description: 'Nickelzwingen', code: '74198090', note: 'P1 + P2' },
  { nr: 25, description: 'Acrylstiele', code: '39269097', note: 'P1' },
  { nr: 26, description: 'Rakelmesser', code: '82089000', note: 'P2' },
  { nr: 27, description: 'Drucktampon, Klischee', code: '84425000', note: 'P1' },
  { nr: 28, description: 'Heftklammern, zusammenhängend in Streifen', code: '83052000', note: 'P1 + P2' },
  { nr: 29, description: 'Druckfarbe, flüssig', code: '32151900', note: 'P1' },
  { nr: 30, description: 'Pinselmappen aus Leder', code: '42023100', note: 'P2' },
  { nr: 31, description: 'Pinselmappen aus Spinnstoffen', code: '42023290', note: 'P2' },
  { nr: 32, description: 'Geflochtene Matten aus Bambus', code: '46012110', note: 'P2' },
  { nr: 33, description: 'Papiertüten', code: '48194000', note: 'P2' },
  { nr: 34, description: 'Tüten aus Polymeren des Ethylens', code: '39232100', note: 'P1' },
  { nr: 35, description: 'Klebstoff', code: '35061000', note: 'P1' },
  { nr: 36, description: 'Metalladapter für Display', code: '73269098', note: 'P2' },
  { nr: 37, description: 'Entferner für Druckfarbe', code: '29269070', note: 'P1' },
  { nr: 38, description: 'Pinselreiniger', code: '34029090', note: 'P1' },
  { nr: 39, description: 'Puderquasten u. Kissen zum Auftragen von Kosmetik- oder Körperpflegemitteln', code: '96162000', note: 'P2' },
  { nr: 40, description: 'Durchflusspinsel, Pinsel für Industrieanwendungen', code: '96035000', note: 'P1' },
  { nr: 41, description: 'Gummikappe für Nailpinsel', code: '39235090', note: 'P2' },
  { nr: 42, description: 'Verpackungsmittel aus Pappe', code: '48195000', note: 'P2' },
  { nr: 43, description: 'Haushaltswerkzeuge, nicht mechanisch, mit arbeitendem Teil aus unedlen Metallen (Mini-Scraper)', code: '82055100', note: 'P2' },
  { nr: 44, description: 'Pinselglas zum Auswaschen der Farbe', code: '70139900', note: 'P2' },
  { nr: 45, description: 'Etiketten aller Art aus Papier oder Pappe, auch bedruckt (Pos. 1)', code: '48211010', note: 'P2' },
  { nr: 45, description: 'Etiketten aller Art aus Papier oder Pappe, auch bedruckt (Pos. 2)', code: '48211090', note: 'P2' },
  { nr: 45, description: 'Etiketten aller Art aus Papier oder Pappe, auch bedruckt (Pos. 3)', code: '48219010', note: 'P2' },
  { nr: 45, description: 'Etiketten aller Art aus Papier oder Pappe, auch bedruckt (Pos. 4)', code: '48219090', note: 'P2' }
];

export function createInitialUserCheckItems(): CheckItem[] {
  return USER_PDF_ITEMS_RAW.map((item, index) => {
    const norm = normalizeWarennummer(item.code);
    return {
      id: 'pdf-item-' + (index + 1),
      rowNumber: item.nr,
      articleNumber: 'ART-' + String(item.nr).padStart(3, '0'),
      userDescription: item.description,
      rawInput: item.code,
      normalizedCode: norm.normalized,
      status: 'PENDING',
      warnings: [
        'Kürzel "' + item.note + '" ist reine Personenkennzeichnung und für Prüfung irrelevant.',
        ...norm.warnings
      ],
      isDuplicateCode: false
    };
  });
}
