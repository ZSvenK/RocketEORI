import React from 'react';
import { Database, UploadCloud, FileDown, ShieldAlert, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { ReferenceMetadata } from '../types';

interface HeaderProps {
  activeReference: ReferenceMetadata | null;
  onOpenReferenceManager: () => void;
  onOpenImportModal: () => void;
  onOpenExportModal: () => void;
  totalItemsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeReference,
  onOpenReferenceManager,
  onOpenImportModal,
  onOpenExportModal,
  totalItemsCount
}) => {
  const currentYear = new Date().getFullYear();
  const isYearMismatch = activeReference && activeReference.editionYear !== currentYear;

  return (
    <header style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid #d5dadd',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            backgroundColor: '#0070f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(0, 112, 242, 0.25)'
          }}>
            <Layers size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '19px', fontWeight: 700, color: '#131e29', letterSpacing: '-0.2px' }}>
                Warennummern-Checker
              </h1>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: '#ebf5fe',
                color: '#0070f2'
              }}>
                v1.0 (Destatis SOVA)
              </span>
            </div>
            <p style={{ fontSize: '12px', color: '#556b82' }}>
              Lokale Offline-Prüfung 8-stelliger deutscher Zolltarifnummern
            </p>
          </div>
        </div>

        {/* Active Reference Badge */}
        <div
          onClick={onOpenReferenceManager}
          style={{
            cursor: 'pointer',
            padding: '8px 14px',
            borderRadius: '8px',
            border: activeReference ? '1px solid #d5dadd' : '1px dashed #ffa39e',
            backgroundColor: activeReference
              ? (activeReference.isDemo ? '#fffbe6' : '#ffffff')
              : '#fff1f0',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            transition: 'all 0.15s ease'
          }}
          title="Klicken, um Referenzdaten zu verwalten"
        >
          {activeReference ? (
            <>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: activeReference.isDemo ? '#ffe58f' : '#f1fdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {activeReference.isDemo ? (
                  <AlertTriangle size={18} color="#d46b08" />
                ) : (
                  <CheckCircle2 size={18} color="#107e3e" />
                )}
              </div>
              <div style={{ fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong style={{ color: '#131e29' }}>
                    {activeReference.isDemo ? 'DEMODATEN' : `Ausgabe ${activeReference.editionYear}`}
                  </strong>
                  <span style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    backgroundColor: activeReference.isOfficialVerified ? '#f1fdf5' : '#fffbe6',
                    color: activeReference.isOfficialVerified ? '#107e3e' : '#d46b08',
                    border: `1px solid ${activeReference.isOfficialVerified ? '#8de3ab' : '#ffd591'}`
                  }}>
                    {activeReference.isOfficialVerified ? 'Amtlich verifiziert' : (activeReference.isDemo ? 'Keine amtliche Prüfung' : 'Nicht verifiziert')}
                  </span>
                  {isYearMismatch && (
                    <span style={{ fontSize: '10px', color: '#cf1322', fontWeight: 600 }}>
                      (≠ ${currentYear})
                    </span>
                  )}
                </div>
                <div style={{ color: '#556b82' }}>
                  {activeReference.totalRecords.toLocaleString('de-DE')} gültige Nummern • Stand: {activeReference.dataStand || '2026'}
                </div>
              </div>
            </>
          ) : (
            <>
              <ShieldAlert size={20} color="#bb0000" />
              <div style={{ fontSize: '12px' }}>
                <strong style={{ color: '#bb0000', display: 'block' }}>Keine Referenz geladen</strong>
                <span style={{ color: '#556b82' }}>Prüfung blockiert – Jetzt Referenzdatei wählen</span>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onOpenReferenceManager}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid #d5dadd',
              backgroundColor: '#ffffff',
              color: '#131e29',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Database size={15} color="#556b82" />
            Referenzverwaltung
          </button>

          <button
            onClick={onOpenImportModal}
            style={{
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid #d5dadd',
              backgroundColor: '#ffffff',
              color: '#131e29',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <UploadCloud size={15} color="#556b82" />
            Liste importieren
          </button>

          <button
            onClick={onOpenExportModal}
            disabled={totalItemsCount === 0}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: totalItemsCount > 0 ? '#0070f2' : '#cbd5e1',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: totalItemsCount > 0 ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FileDown size={15} />
            Exportieren
          </button>
        </div>
      </div>
    </header>
  );
};
