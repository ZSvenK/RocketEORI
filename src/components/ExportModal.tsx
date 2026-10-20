import React from 'react';
import { X, FileSpreadsheet, FileText, FileCode, Shield, Download } from 'lucide-react';
import { CheckItem, ReferenceMetadata } from '../types';
import {
  generateCsvExport,
  generateXlsxBlob,
  generateJsonAuditReport,
  downloadFile
} from '../features/export/exportService';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CheckItem[];
  metadata?: ReferenceMetadata;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, items, metadata }) => {
  if (!isOpen) return null;

  const dateStr = new Date().toISOString().slice(0, 10);

  const handleExportCsv = () => {
    const csv = generateCsvExport(items, metadata);
    downloadFile(csv, `Warennummern_Pruefbericht_${dateStr}.csv`, 'text/csv;charset=utf-8');
  };

  const handleExportXlsx = () => {
    const blob = generateXlsxBlob(items, metadata);
    downloadFile(blob, `Warennummern_Pruefbericht_${dateStr}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  };

  const handleExportJson = () => {
    if (!metadata) return;
    const report = generateJsonAuditReport(items, metadata);
    const jsonStr = JSON.stringify(report, null, 2);
    downloadFile(jsonStr, `Warennummern_Auditbericht_${dateStr}.json`, 'application/json;charset=utf-8');
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
        maxWidth: '620px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #e5e9ec',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 style={{ fontSize: '17px', fontWeight: 600, color: '#131e29' }}>
            Prüfbericht exportieren ({items.length} Positionen)
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#556b82' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Card XLSX */}
          <div style={{
            border: '1px solid #d5dadd',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            backgroundColor: '#ffffff'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#f1fdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileSpreadsheet size={22} color="#107e3e" />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#131e29' }}>Excel-Datei (.XLSX)</h4>
                <p style={{ fontSize: '12px', color: '#556b82' }}>
                  Warennummern ausdrücklich als Textzellen formatiert (führende Nullen wie 05029000 bleiben garantiert erhalten).
                </p>
              </div>
            </div>
            <button
              onClick={handleExportXlsx}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#107e3e',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Download size={14} /> Download
            </button>
          </div>

          {/* Card CSV */}
          <div style={{
            border: '1px solid #d5dadd',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            backgroundColor: '#ffffff'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#ebf5fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={22} color="#0070f2" />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#131e29' }}>CSV-Datei (Semikolon & UTF-8 BOM)</h4>
                <p style={{ fontSize: '12px', color: '#556b82' }}>
                  Inkl. Formelinjektionsschutz und Excel-BOM. Hinweis: In Excel Spalte als Text importieren.
                </p>
              </div>
            </div>
            <button
              onClick={handleExportCsv}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#0070f2',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Download size={14} /> Download
            </button>
          </div>

          {/* Card JSON */}
          <div style={{
            border: '1px solid #d5dadd',
            borderRadius: '8px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            backgroundColor: '#ffffff'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileCode size={22} color="#7c3aed" />
              </div>
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#131e29' }}>JSON-Auditbericht (Revisionssicher)</h4>
                <p style={{ fontSize: '12px', color: '#556b82' }}>
                  Enthält SHA-256-Hash, Referenzmetadaten, Quell-URL, Statistik und vollständige Einzelergebnisse.
                </p>
              </div>
            </div>
            <button
              onClick={handleExportJson}
              disabled={!metadata}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: metadata ? '#7c3aed' : '#cbd5e1',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '13px',
                cursor: metadata ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Download size={14} /> Download
            </button>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '10px 12px',
            fontSize: '12px',
            color: '#475569'
          }}>
            <Shield size={16} color="#0284c7" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              <strong>Datenschutz & Sicherheit:</strong> Sämtliche Exporte werden vollständig clientseitig im Browser generiert. Es werden zu keinem Zeitpunkt Daten an externe Server übertragen.
            </span>
          </div>
        </div>

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
