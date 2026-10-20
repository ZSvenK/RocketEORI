import React, { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { X, UploadCloud, ClipboardList, Edit3, AlertTriangle, CheckCircle } from 'lucide-react';
import { CheckItem } from '../types';
import { normalizeWarennummer } from '../utils/normalizer';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportItems: (newItems: CheckItem[], replace: boolean) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImportItems }) => {
  const [tab, setTab] = useState<'file' | 'paste' | 'manual'>('file');
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // File import state
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [fileRows, setFileRows] = useState<any[][]>([]);
  const [codeColIdx, setCodeColIdx] = useState<number>(0);
  const [descColIdx, setDescColIdx] = useState<number>(-1);
  const [artColIdx, setArtColIdx] = useState<number>(-1);
  const [nrColIdx, setNrColIdx] = useState<number>(-1);
  const [numericLeadingZeroWarning, setNumericLeadingZeroWarning] = useState<boolean>(false);

  // Paste state
  const [pasteText, setPasteText] = useState('');

  // Manual list state
  const [manualText, setManualText] = useState('');

  if (!isOpen) return null;

  // Handle CSV / XLSX file selection
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setNumericLeadingZeroWarning(false);
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
      Papa.parse(file, {
        encoding: 'utf-8',
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            processParsedGrid(results.data as any[][]);
          }
        },
        error: (err) => {
          setErrorMsg('Fehler beim CSV-Parsen: ' + err.message);
        }
      });
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary', raw: true });
          const firstSheet = wb.Sheets[wb.SheetNames[0]];
          const data: any[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1, raw: true });
          processParsedGrid(data);
        } catch (err: any) {
          setErrorMsg('Fehler beim XLSX-Parsen: ' + err.message);
        }
      };
      reader.readAsBinaryString(file);
    } else {
      setErrorMsg('Nicht unterstütztes Dateiformat. Bitte CSV oder XLSX verwenden.');
    }
  };

  const processParsedGrid = (grid: any[][]) => {
    if (grid.length === 0) return;
    const headerRow = grid[0].map((h, i) => String(h || `Spalte ${i + 1}`));
    const dataRows = grid.slice(1).filter(r => r && r.length > 0);

    setFileHeaders(headerRow);
    setFileRows(dataRows);

    // Auto-detect columns
    let foundCode = 0;
    let foundDesc = -1;
    let foundArt = -1;
    let foundNr = -1;

    headerRow.forEach((h, idx) => {
      const lower = h.toLowerCase();
      if (lower.includes('warennummer') || lower.includes('zolltarif') || lower.includes('code') || lower.includes('hs-code')) {
        foundCode = idx;
      } else if (lower.includes('bezeichnung') || lower.includes('ware') || lower.includes('artikelname') || lower.includes('desc')) {
        foundDesc = idx;
      } else if (lower.includes('artikel') || lower.includes('artnr') || lower.includes('sku')) {
        foundArt = idx;
      } else if (lower.includes('nr') || lower.includes('pos') || lower.includes('lfd')) {
        foundNr = idx;
      }
    });

    setCodeColIdx(foundCode);
    setDescColIdx(foundDesc);
    setArtColIdx(foundArt);
    setNrColIdx(foundNr);

    // Check for leading zero warning in candidate code column
    const hasLostLeadingZero = dataRows.some(row => {
      const val = String(row[foundCode] ?? '').trim();
      return /^[0-9]{7}$/.test(val);
    });
    setNumericLeadingZeroWarning(hasLostLeadingZero);
  };

  const handleCommitFileImport = () => {
    if (fileRows.length === 0) return;

    const items: CheckItem[] = fileRows.map((row, idx) => {
      const rawCode = String(row[codeColIdx] ?? '').trim();
      const userDesc = descColIdx >= 0 ? String(row[descColIdx] ?? '').trim() : undefined;
      const artNr = artColIdx >= 0 ? String(row[artColIdx] ?? '').trim() : undefined;
      const rowNr = nrColIdx >= 0 ? parseInt(String(row[nrColIdx])) || (idx + 1) : (idx + 1);

      const norm = normalizeWarennummer(rawCode);

      return {
        id: 'item-' + Date.now() + '-' + idx,
        rowNumber: rowNr,
        articleNumber: artNr || undefined,
        userDescription: userDesc || undefined,
        rawInput: rawCode,
        normalizedCode: norm.normalized,
        status: 'PENDING',
        warnings: norm.warnings,
        isDuplicateCode: false
      };
    });

    onImportItems(items, replaceExisting);
    onClose();
  };

  const handleCommitPaste = () => {
    if (!pasteText.trim()) return;
    const lines = pasteText.split(/\r?\n/).filter(l => l.trim().length > 0);

    const items: CheckItem[] = lines.map((line, idx) => {
      const parts = line.split('\t');
      let rawCode = '';
      let desc = '';
      let art = '';

      if (parts.length === 1) {
        rawCode = parts[0].trim();
      } else if (parts.length === 2) {
        // e.g. Code 	 Desc or Desc 	 Code
        if (/^[0-9\s]{6,12}$/.test(parts[0].trim())) {
          rawCode = parts[0].trim();
          desc = parts[1].trim();
        } else {
          desc = parts[0].trim();
          rawCode = parts[1].trim();
        }
      } else {
        // Multi-column
        rawCode = parts[0].trim();
        desc = parts[1].trim();
        art = parts[2]?.trim() || '';
      }

      const norm = normalizeWarennummer(rawCode);

      return {
        id: 'item-' + Date.now() + '-' + idx,
        rowNumber: idx + 1,
        articleNumber: art || undefined,
        userDescription: desc || undefined,
        rawInput: rawCode,
        normalizedCode: norm.normalized,
        status: 'PENDING',
        warnings: norm.warnings,
        isDuplicateCode: false
      };
    });

    onImportItems(items, replaceExisting);
    onClose();
  };

  const handleCommitManual = () => {
    if (!manualText.trim()) return;
    const codes = manualText.split(/[,;\r?\n]+/).map(c => c.trim()).filter(c => c.length > 0);

    const items: CheckItem[] = codes.map((code, idx) => {
      const norm = normalizeWarennummer(code);
      return {
        id: 'item-' + Date.now() + '-' + idx,
        rowNumber: idx + 1,
        rawInput: code,
        normalizedCode: norm.normalized,
        status: 'PENDING',
        warnings: norm.warnings,
        isDuplicateCode: false
      };
    });

    onImportItems(items, replaceExisting);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(19, 30, 41, 0.45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(2px)'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '740px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e5e9ec',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#131e29' }}>
            Eigene Warennummern importieren
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#556b82' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Nav */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e9ec', backgroundColor: '#f9fafb', padding: '0 24px' }}>
          <button
            onClick={() => setTab('file')}
            style={{
              padding: '12px 16px',
              border: 'none',
              borderBottom: tab === 'file' ? '2px solid #0070f2' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: tab === 'file' ? '#0070f2' : '#556b82',
              fontWeight: tab === 'file' ? 600 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <UploadCloud size={16} /> Datei-Upload (CSV / XLSX)
          </button>
          <button
            onClick={() => setTab('paste')}
            style={{
              padding: '12px 16px',
              border: 'none',
              borderBottom: tab === 'paste' ? '2px solid #0070f2' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: tab === 'paste' ? '#0070f2' : '#556b82',
              fontWeight: tab === 'paste' ? 600 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ClipboardList size={16} /> Excel Copy & Paste
          </button>
          <button
            onClick={() => setTab('manual')}
            style={{
              padding: '12px 16px',
              border: 'none',
              borderBottom: tab === 'manual' ? '2px solid #0070f2' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: tab === 'manual' ? '#0070f2' : '#556b82',
              fontWeight: tab === 'manual' ? 600 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Edit3 size={16} /> Schnelleingabe / Nummernliste
          </button>
        </div>

        {errorMsg && (
          <div style={{ padding: '10px 24px', backgroundColor: '#fff1f0', color: '#bb0000', fontSize: '13px', borderBottom: '1px solid #ffa39e' }}>
            {errorMsg}
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {tab === 'file' && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>
                  CSV- oder Excel-Datei auswählen (.csv, .xlsx, .xls)
                </label>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls,.txt"
                  onChange={handleFileUpload}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px',
                    border: '1px dashed #0070f2',
                    borderRadius: '6px',
                    backgroundColor: '#f8fafc'
                  }}
                />
              </div>

              {numericLeadingZeroWarning && (
                <div style={{ backgroundColor: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '6px', padding: '10px 14px', fontSize: '12px', color: '#d46b08' }}>
                  <AlertTriangle size={15} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-2px' }} />
                  <strong>Warnung: Möglicher Verlust führender Nullen erkannt!</strong> Einige Nummern in der Datei haben genau 7 Stellen (z.B. "5029000" statt "05029000"). Die Anwendung ergänzt keine Nullen automatisch.
                </div>
              )}

              {fileHeaders.length > 0 && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                        Spalte: Warennummer *
                      </label>
                      <select
                        value={codeColIdx}
                        onChange={e => setCodeColIdx(parseInt(e.target.value))}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d5dadd' }}
                      >
                        {fileHeaders.map((h, i) => (
                          <option key={i} value={i}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                        Spalte: Eigene Warenbezeichnung (optional)
                      </label>
                      <select
                        value={descColIdx}
                        onChange={e => setDescColIdx(parseInt(e.target.value))}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d5dadd' }}
                      >
                        <option value={-1}>-- Keine / Nicht vorhanden --</option>
                        {fileHeaders.map((h, i) => (
                          <option key={i} value={i}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                        Spalte: Artikelnummer (optional)
                      </label>
                      <select
                        value={artColIdx}
                        onChange={e => setArtColIdx(parseInt(e.target.value))}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d5dadd' }}
                      >
                        <option value={-1}>-- Keine / Nicht vorhanden --</option>
                        {fileHeaders.map((h, i) => (
                          <option key={i} value={i}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                        Spalte: Laufende Nummer (optional)
                      </label>
                      <select
                        value={nrColIdx}
                        onChange={e => setNrColIdx(parseInt(e.target.value))}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d5dadd' }}
                      >
                        <option value={-1}>-- Automatisch nummerieren --</option>
                        {fileHeaders.map((h, i) => (
                          <option key={i} value={i}>{h}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                      Importvorschau ({fileRows.length} Zeilen erkannt, erste 3 Zeilen):
                    </label>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', backgroundColor: '#f9fafb' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #d5dadd', textAlign: 'left' }}>
                          <th style={{ padding: '6px' }}>Warennummer</th>
                          <th style={{ padding: '6px' }}>Eigene Bezeichnung</th>
                          <th style={{ padding: '6px' }}>Artikel-Nr.</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fileRows.slice(0, 3).map((r, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #e5e9ec' }}>
                            <td style={{ padding: '6px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                              {String(r[codeColIdx] ?? '')}
                            </td>
                            <td style={{ padding: '6px' }}>
                              {descColIdx >= 0 ? String(r[descColIdx] ?? '') : '-'}
                            </td>
                            <td style={{ padding: '6px' }}>
                              {artColIdx >= 0 ? String(r[artColIdx] ?? '') : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}

          {tab === 'paste' && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>
                Zellen aus Excel kopieren und hier einfügen:
              </label>
              <textarea
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                rows={10}
                placeholder={"Warennummer\tBezeichnung\tArtikelnummer\n96033010\tPinsel für Kunstmaler\tART-001\n05029000\tNaturhaare\tART-022"}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #d5dadd',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px'
                }}
              />
              <p style={{ fontSize: '11px', color: '#556b82', marginTop: '4px' }}>
                Unterstützt tabulatorgetrennte Zeilen direkt aus Excel.
              </p>
            </div>
          )}

          {tab === 'manual' && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>
                Reine Warennummern eingeben (eine Nummer pro Zeile oder kommagetrennt):
              </label>
              <textarea
                value={manualText}
                onChange={e => setManualText(e.target.value)}
                rows={10}
                placeholder={"96033010\n05029000\n39269097\n44170000"}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #d5dadd',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px'
                }}
              />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '8px', borderTop: '1px solid #e5e9ec' }}>
            <input
              type="checkbox"
              id="replaceList"
              checked={replaceExisting}
              onChange={e => setReplaceExisting(e.target.checked)}
            />
            <label htmlFor="replaceList" style={{ fontSize: '13px', color: '#131e29' }}>
              Bestehende Prüfliste vor dem Import vollständig ersetzen (statt Zeilen anzuhängen)
            </label>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid #e5e9ec',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          backgroundColor: '#f9fafb'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #d5dadd',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '13px'
            }}
          >
            Abbrechen
          </button>
          <button
            onClick={tab === 'file' ? handleCommitFileImport : tab === 'paste' ? handleCommitPaste : handleCommitManual}
            style={{
              padding: '8px 18px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: '#0070f2',
              color: '#ffffff',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px'
            }}
          >
            Importieren
          </button>
        </div>
      </div>
    </div>
  );
};
