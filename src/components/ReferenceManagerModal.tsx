import React, { useState } from 'react';
import {
  X,
  Database,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileArchive,
  Info,
  Sparkles,
  Settings,
  Layers,
  Copy,
  Check
} from 'lucide-react';
import { FixedColumnConfig, ReferenceEntry, ReferenceMetadata } from '../types';
import { DEMO_REFERENCE_ENTRIES, DEMO_REFERENCE_METADATA } from '../data/demoReference';
import { loadOfficial2026Reference, OFFICIAL_2026_METADATA } from '../data/officialReferenceBundle';
import {
  parseFixedColumnTxt,
  inspectZipArchive,
  DESTATIS_OFFICIAL_CONFIG,
  ZipFileInfo
} from '../features/reference/parser';
import { calculateSha256 } from '../services/hashService';

interface ReferenceManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeReference: ReferenceMetadata | null;
  onActivateReference: (metadata: ReferenceMetadata, entries: ReferenceEntry[]) => Promise<void>;
}

export const ReferenceManagerModal: React.FC<ReferenceManagerModalProps> = ({
  isOpen,
  onClose,
  activeReference,
  onActivateReference
}) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'upload' | 'config'>('quick');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [zipFiles, setZipFiles] = useState<ZipFileInfo[] | null>(null);
  const [chosenZipEntry, setChosenZipEntry] = useState<string>('');
  const [unzippedZip, setUnzippedZip] = useState<any>(null);
  const [encoding, setEncoding] = useState<'iso-8859-1' | 'utf-8'>('iso-8859-1');
  const [editionYear, setEditionYear] = useState<number>(2026);
  const [previewLines, setPreviewLines] = useState<string[]>([]);
  const [rawFileText, setRawFileText] = useState<string>('');
  const [fileSha256, setFileSha256] = useState<string>('');

  // Config wizard state
  const [customConfig, setCustomConfig] = useState<FixedColumnConfig>({
    codeStart: 0,
    codeLength: 8,
    descStart: 10,
    descLength: 248,
    unitStart: 258,
    unitLength: 16,
    encoding: 'iso-8859-1'
  });

  if (!isOpen) return null;

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  // 1-Click: Amtliche Destatis 2026
  const handleLoadOfficial2026 = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await loadOfficial2026Reference();
      await onActivateReference(res.metadata, res.entries);
      setSuccessMsg(`Amtliche Referenz ${res.metadata.editionYear} erfolgreich geladen (${res.entries.length.toLocaleString('de-DE')} Warennummern).`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg('Fehler beim Laden der amtlichen Referenz: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Click: Demo
  const handleLoadDemo = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      await onActivateReference(DEMO_REFERENCE_METADATA, DEMO_REFERENCE_ENTRIES);
      setSuccessMsg('Künstliche Demodaten erfolgreich aktiviert (15 Muster-Warennummern).');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg('Fehler: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // File chosen in upload tab
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const sha = await calculateSha256(await file.arrayBuffer());
      setFileSha256(sha);

      if (file.name.toLowerCase().endsWith('.zip')) {
        const { zip, files, candidateFile } = await inspectZipArchive(file);
        setUnzippedZip(zip);
        setZipFiles(files);
        if (candidateFile) {
          setChosenZipEntry(candidateFile);
          await loadTextFromZipEntry(zip, candidateFile, encoding);
        }
      } else {
        // Direct TXT / CSV file
        setZipFiles(null);
        await readDirectTextFile(file, encoding);
      }
    } catch (err: any) {
      setErrorMsg('Fehler beim Lesen der Datei: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const readDirectTextFile = async (file: File, enc: 'iso-8859-1' | 'utf-8') => {
    const buffer = await file.arrayBuffer();
    const decoder = new TextDecoder(enc);
    const text = decoder.decode(buffer);
    setRawFileText(text);
    const lines = text.split(/\r?\n/).slice(0, 5);
    setPreviewLines(lines);
  };

  const loadTextFromZipEntry = async (zip: any, entryName: string, enc: 'iso-8859-1' | 'utf-8') => {
    const entry = zip.file(entryName);
    if (!entry) return;
    const buffer = await entry.async('arraybuffer');
    const decoder = new TextDecoder(enc);
    const text = decoder.decode(buffer);
    setRawFileText(text);
    const lines = text.split(/\r?\n/).slice(0, 5);
    setPreviewLines(lines);
  };

  const handleEncodingChange = async (newEnc: 'iso-8859-1' | 'utf-8') => {
    setEncoding(newEnc);
    if (unzippedZip && chosenZipEntry) {
      await loadTextFromZipEntry(unzippedZip, chosenZipEntry, newEnc);
    } else if (selectedFile) {
      await readDirectTextFile(selectedFile, newEnc);
    }
  };

  // Import TXT with official spec
  const handleImportVerified = async () => {
    if (!rawFileText) return;
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const parsed = parseFixedColumnTxt(
        rawFileText,
        selectedFile?.name || 'sova.txt',
        fileSha256,
        editionYear,
        DESTATIS_OFFICIAL_CONFIG,
        true
      );

      await onActivateReference(parsed.metadata, parsed.entries);
      setSuccessMsg(`Erfolgreich importiert: ${parsed.entries.length.toLocaleString('de-DE')} gültige Warennummern.`);
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      setErrorMsg('Import fehlgeschlagen: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Import with custom wizard
  const handleImportCustom = async () => {
    if (!rawFileText) return;
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const parsed = parseFixedColumnTxt(
        rawFileText,
        selectedFile?.name || 'custom_sova.txt',
        fileSha256,
        editionYear,
        customConfig,
        false
      );

      await onActivateReference(parsed.metadata, parsed.entries);
      setSuccessMsg(`Benutzerdefiniert importiert: ${parsed.entries.length.toLocaleString('de-DE')} Datensätze.`);
      setTimeout(() => onClose(), 1200);
    } catch (err: any) {
      setErrorMsg('Import fehlgeschlagen: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(19, 30, 41, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(3px)'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '820px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={20} color="#0070f2" />
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#131e29' }}>
              Amtliche Referenzverwaltung (Destatis Sova-Leitdatei)
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#556b82' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e5e9ec',
          backgroundColor: '#f9fafb',
          padding: '0 24px'
        }}>
          <button
            onClick={() => setActiveTab('quick')}
            style={{
              padding: '12px 16px',
              border: 'none',
              borderBottom: activeTab === 'quick' ? '2px solid #0070f2' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'quick' ? '#0070f2' : '#556b82',
              fontWeight: activeTab === 'quick' ? 600 : 500,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Aktive Referenz & 1-Klick
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            style={{
              padding: '12px 16px',
              border: 'none',
              borderBottom: activeTab === 'upload' ? '2px solid #0070f2' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'upload' ? '#0070f2' : '#556b82',
              fontWeight: activeTab === 'upload' ? 600 : 500,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Offizielle Destatis-Datei hochladen (ZIP / TXT)
          </button>
          <button
            onClick={() => setActiveTab('config')}
            style={{
              padding: '12px 16px',
              border: 'none',
              borderBottom: activeTab === 'config' ? '2px solid #0070f2' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === 'config' ? '#0070f2' : '#556b82',
              fontWeight: activeTab === 'config' ? 600 : 500,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            Manueller Import-Assistent (Spaltenkonfiguration)
          </button>
        </div>

        {/* Messages */}
        {errorMsg && (
          <div style={{ padding: '10px 24px', backgroundColor: '#fff1f0', color: '#bb0000', fontSize: '13px', borderBottom: '1px solid #ffa39e' }}>
            <AlertTriangle size={15} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-2px' }} />
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{ padding: '10px 24px', backgroundColor: '#f1fdf5', color: '#107e3e', fontSize: '13px', borderBottom: '1px solid #8de3ab' }}>
            <CheckCircle2 size={15} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-2px' }} />
            {successMsg}
          </div>
        )}

        {/* Body Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'quick' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Active Reference Details */}
              <div style={{
                border: '1px solid #d5dadd',
                borderRadius: '8px',
                padding: '18px',
                backgroundColor: activeReference ? (activeReference.isDemo ? '#fffbe6' : '#ffffff') : '#fff1f0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#131e29' }}>
                    Aktuell aktivierter Referenzdatenbestand
                  </h4>
                  {activeReference && (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: activeReference.isOfficialVerified ? '#f1fdf5' : '#fffbe6',
                      color: activeReference.isOfficialVerified ? '#107e3e' : '#d46b08',
                      border: `1px solid ${activeReference.isOfficialVerified ? '#8de3ab' : '#ffd591'}`
                    }}>
                      {activeReference.isOfficialVerified ? 'Amtlich verifiziert' : (activeReference.isDemo ? 'Künstliche Demodaten' : 'Nicht amtlich verifiziert')}
                    </span>
                  )}
                </div>

                {activeReference ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '13px' }}>
                    <div>
                      <span style={{ color: '#556b82' }}>Ausgabejahr:</span>{' '}
                      <strong>{activeReference.editionYear}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#556b82' }}>Stand:</span>{' '}
                      <strong>{activeReference.dataStand || 'Unbekannt'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#556b82' }}>Eindeutige Warennummern:</span>{' '}
                      <strong>{activeReference.uniqueCodesCount.toLocaleString('de-DE')}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#556b82' }}>Gesamtdatensätze:</span>{' '}
                      <strong>{activeReference.totalRecords.toLocaleString('de-DE')}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#556b82' }}>Dateiname:</span>{' '}
                      <code>{activeReference.sourceFileName}</code>
                    </div>
                    <div>
                      <span style={{ color: '#556b82' }}>Parserprofil:</span>{' '}
                      <span>{activeReference.parserProfile}</span>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: '#556b82' }}>SHA-256 Hash:</span>{' '}
                      <code style={{ fontSize: '11px', wordBreak: 'break-all', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                        {activeReference.sha256Hash}
                      </code>
                      <button
                        onClick={() => handleCopyHash(activeReference.sha256Hash)}
                        style={{ marginLeft: '8px', border: 'none', background: 'none', cursor: 'pointer', verticalAlign: '-2px' }}
                        title="Hash kopieren"
                      >
                        {copiedHash ? <Check size={14} color="#107e3e" /> : <Copy size={14} color="#556b82" />}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', color: '#bb0000' }}>
                    Derzeit ist keine Referenzdatei geladen. Die Prüfung von Warennummern ist blockiert, bis eine gültige Referenz aktiviert wird.
                  </p>
                )}
              </div>

              {/* 1-Click Load Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div style={{
                  border: '1px solid #b7eb8f',
                  borderRadius: '8px',
                  padding: '16px',
                  backgroundColor: '#f6ffed',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <CheckCircle2 size={18} color="#107e3e" />
                      <strong style={{ fontSize: '14px', color: '#135200' }}>
                        Amtliche Destatis-Ausgabe 2026
                      </strong>
                    </div>
                    <p style={{ fontSize: '12px', color: '#389e0d', lineHeight: 1.5, marginBottom: '12px' }}>
                      Offizieller Datenbestand vom Statistischen Bundesamt (9.834 Warennummern, Stand 23.10.2025). Vollständig offline verifiziert.
                    </p>
                  </div>
                  <button
                    onClick={handleLoadOfficial2026}
                    disabled={isLoading}
                    style={{
                      padding: '9px 16px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#107e3e',
                      color: '#ffffff',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isLoading ? 'Wird geladen...' : '1-Klick: Amtliche Ausgabe 2026 laden'}
                  </button>
                </div>

                <div style={{
                  border: '1px solid #ffe58f',
                  borderRadius: '8px',
                  padding: '16px',
                  backgroundColor: '#fffbe6',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <AlertTriangle size={18} color="#d46b08" />
                      <strong style={{ fontSize: '14px', color: '#ad4e00' }}>
                        Künstliche Demodaten
                      </strong>
                    </div>
                    <p style={{ fontSize: '12px', color: '#d46b08', lineHeight: 1.5, marginBottom: '12px' }}>
                      Kleine Test-Referenz (15 Nummern) nur für Funktions- und UI-Tests. Wird im Prüfbericht ausdrücklich als „DEMODATEN“ ausgewiesen.
                    </p>
                  </div>
                  <button
                    onClick={handleLoadDemo}
                    disabled={isLoading}
                    style={{
                      padding: '9px 16px',
                      borderRadius: '6px',
                      border: '1px solid #ffd591',
                      backgroundColor: '#ffffff',
                      color: '#d46b08',
                      fontWeight: 600,
                      fontSize: '13px',
                      cursor: isLoading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Demodaten aktivieren
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>
                  Offizielle Destatis ZIP- oder TXT-Datei auswählen
                </label>
                <input
                  type="file"
                  accept=".zip,.txt"
                  onChange={handleFileChange}
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

              {zipFiles && (
                <div style={{ border: '1px solid #d5dadd', borderRadius: '6px', padding: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                    Dateiauswahl aus dem ZIP-Archiv:
                  </label>
                  <select
                    value={chosenZipEntry}
                    onChange={e => {
                      setChosenZipEntry(e.target.value);
                      if (unzippedZip) loadTextFromZipEntry(unzippedZip, e.target.value, encoding);
                    }}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d5dadd' }}
                  >
                    {zipFiles.map(f => (
                      <option key={f.name} value={f.name} disabled={f.isDescriptionOrPdf}>
                        {f.name} ({Math.round(f.size / 1024)} KB) {f.isCandidate ? '★ EMPFOHLENE DATENDATEI' : (f.isDescriptionOrPdf ? '⛔ (PDF/Doku - Keine Daten)' : '')}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Zeichenkodierung:
                  </label>
                  <select
                    value={encoding}
                    onChange={e => handleEncodingChange(e.target.value as any)}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d5dadd' }}
                  >
                    <option value="iso-8859-1">ISO-8859-1 / Windows-1252 (Amtlicher Destatis-Standard)</option>
                    <option value="utf-8">UTF-8</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Ausgabejahr explizit bestätigen:
                  </label>
                  <input
                    type="number"
                    value={editionYear}
                    onChange={e => setEditionYear(parseInt(e.target.value) || 2026)}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d5dadd' }}
                  />
                </div>
              </div>

              {/* Preview */}
              {previewLines.length > 0 && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Dateivorschau (Umlautkontrolle: z.B. Färsen, Kühe):
                  </label>
                  <pre style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    backgroundColor: '#1e293b',
                    color: '#f8fafc',
                    padding: '12px',
                    borderRadius: '6px',
                    overflowX: 'auto',
                    whiteSpace: 'pre'
                  }}>
                    {previewLines.join('\n')}
                  </pre>
                </div>
              )}

              <button
                onClick={handleImportVerified}
                disabled={!rawFileText || isLoading}
                style={{
                  padding: '10px 18px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#0070f2',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: (!rawFileText || isLoading) ? 'not-allowed' : 'pointer',
                  opacity: (!rawFileText || isLoading) ? 0.6 : 1
                }}
              >
                {isLoading ? 'Wird geprüft und importiert...' : 'Als amtliche Referenzdatei validieren und aktivieren'}
              </button>
            </div>
          )}

          {activeTab === 'config' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: '#fffbe6', border: '1px solid #ffe58f', borderRadius: '6px', padding: '10px 14px', fontSize: '12px', color: '#d46b08' }}>
                <Info size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-2px' }} />
                Wird dieser Assistent genutzt, wird das Profil im Prüfbericht ausdrücklich als <strong>„manuell konfiguriert, nicht amtlich verifiziert“</strong> gekennzeichnet.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Warennummer Startposition (0-basiert):
                  </label>
                  <input
                    type="number"
                    value={customConfig.codeStart}
                    onChange={e => setCustomConfig({ ...customConfig, codeStart: parseInt(e.target.value) || 0 })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d5dadd' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Warennummer Länge (Stellen):
                  </label>
                  <input
                    type="number"
                    value={customConfig.codeLength}
                    onChange={e => setCustomConfig({ ...customConfig, codeLength: parseInt(e.target.value) || 8 })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d5dadd' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Warenbeschreibung Startposition (0-basiert):
                  </label>
                  <input
                    type="number"
                    value={customConfig.descStart}
                    onChange={e => setCustomConfig({ ...customConfig, descStart: parseInt(e.target.value) || 10 })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d5dadd' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                    Warenbeschreibung Länge:
                  </label>
                  <input
                    type="number"
                    value={customConfig.descLength}
                    onChange={e => setCustomConfig({ ...customConfig, descLength: parseInt(e.target.value) || 248 })}
                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d5dadd' }}
                  />
                </div>
              </div>

              <button
                onClick={handleImportCustom}
                disabled={!rawFileText || isLoading}
                style={{
                  padding: '10px 18px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#d46b08',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: (!rawFileText || isLoading) ? 'not-allowed' : 'pointer'
                }}
              >
                Mit individueller Spaltenkonfiguration importieren
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid #e5e9ec',
          display: 'flex',
          justifyContent: 'flex-end',
          backgroundColor: '#f9fafb'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: '6px',
              border: '1px solid #d5dadd',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '13px'
            }}
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
