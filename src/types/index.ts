
export type CheckItemStatus =
  | 'PENDING'
  | 'FORMAT_ERROR'
  | 'MATCH'
  | 'NO_MATCH'
  | 'TECH_ERROR';

export interface ReferenceEntry {
  code: string; // genau 8 Ziffern
  description: string;
  unitAbbreviation?: string;
  unitCode?: string;
}

export interface ReferenceMetadata {
  id: string;
  editionYear: number;
  dataStand?: string;
  importedAt: string; // ISO 8601
  sourceFileName: string;
  sourceUrl: string;
  sha256Hash: string;
  parserProfile: string;
  isOfficialVerified: boolean;
  isDemo: boolean;
  totalRecords: number;
  uniqueCodesCount: number;
  errorRecordsCount?: number;
  conflictsCount?: number;
}

export interface CheckItem {
  id: string;
  rowNumber?: number;
  articleNumber?: string;
  userDescription?: string;
  rawInput: string;
  normalizedCode: string;
  status: CheckItemStatus;
  officialDescription?: string;
  referenceId?: string;
  referenceEditionYear?: number;
  checkedAt?: string;
  warnings: string[];
  isDuplicateCode: boolean;
}

export interface FixedColumnConfig {
  codeStart: number; // 0-based
  codeLength: number;
  descStart: number;
  descLength: number;
  unitStart?: number;
  unitLength?: number;
  encoding: 'iso-8859-1' | 'utf-8' | 'windows-1252';
}

export interface AuditReport {
  appVersion: string;
  generatedAt: string;
  referenceMetadata: ReferenceMetadata;
  disclaimer: string;
  statistics: {
    totalItems: number;
    uniqueCodes: number;
    matchCount: number;
    noMatchCount: number;
    formatErrorCount: number;
    pendingCount: number;
  };
  items: CheckItem[];
}
