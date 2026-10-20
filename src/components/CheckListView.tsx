import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Play,
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  FileSpreadsheet,
  AlertCircle,
  Copy,
  Layers
} from 'lucide-react';
import { CheckItem, CheckItemStatus, ReferenceMetadata } from '../types';
import { calculateCheckStats } from '../features/check/checkEngine';

interface CheckListViewProps {
  items: CheckItem[];
  activeReference: ReferenceMetadata | null;
  isChecking: boolean;
  onRunCheck: () => void;
  onLoadPdfSampleData: () => void;
  onClearList: () => void;
  onAddNewRow: () => void;
  onEditItem: (item: CheckItem) => void;
  onDeleteItem: (id: string) => void;
}

export const CheckListView: React.FC<CheckListViewProps> = ({
  items,
  activeReference,
  isChecking,
  onRunCheck,
  onLoadPdfSampleData,
  onClearList,
  onAddNewRow,
  onEditItem,
  onDeleteItem
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CheckItemStatus | 'DUPLICATES'>('ALL');

  const stats = useMemo(() => calculateCheckStats(items), [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Status filter
      if (statusFilter === 'DUPLICATES') {
        if (!item.isDuplicateCode) return false;
      } else if (statusFilter !== 'ALL') {
        if (item.status !== statusFilter) return false;
      }

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchCode = item.normalizedCode?.toLowerCase().includes(q) || item.rawInput?.toLowerCase().includes(q);
        const matchDesc = item.userDescription?.toLowerCase().includes(q) || item.officialDescription?.toLowerCase().includes(q);
        const matchArt = item.articleNumber?.toLowerCase().includes(q);
        return matchCode || matchDesc || matchArt;
      }

      return true;
    });
  }, [items, statusFilter, searchTerm]);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
      {/* Metrics Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Total rows */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #d5dadd',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#556b82', textTransform: 'uppercase' }}>
            Gesamtzeilen
          </span>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#131e29', marginTop: '4px' }}>
            {stats.totalItems.toLocaleString('de-DE')}
          </div>
          <span style={{ fontSize: '12px', color: '#556b82' }}>
            Artikelpositionen
          </span>
        </div>

        {/* Unique codes */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #d5dadd',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#556b82', textTransform: 'uppercase' }}>
            Eindeutige Nummern
          </span>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#0070f2', marginTop: '4px' }}>
            {stats.uniqueCodes.toLocaleString('de-DE')}
          </div>
          <span style={{ fontSize: '12px', color: '#556b82' }}>
            {stats.duplicateRowsCount > 0 ? `(${stats.duplicateRowsCount} Duplikate)` : 'Keine Duplikate'}
          </span>
        </div>

        {/* Matches */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #8de3ab',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#107e3e', textTransform: 'uppercase' }}>
            In Referenz enthalten
          </span>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#107e3e', marginTop: '4px' }}>
            {stats.matchCount.toLocaleString('de-DE')}
          </div>
          <span style={{ fontSize: '12px', color: '#107e3e' }}>
            Treffer im amtlichen Verzeichnis
          </span>
        </div>

        {/* No Matches */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #ffa39e',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#bb0000', textTransform: 'uppercase' }}>
            Nicht enthalten
          </span>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#bb0000', marginTop: '4px' }}>
            {stats.noMatchCount.toLocaleString('de-DE')}
          </div>
          <span style={{ fontSize: '12px', color: '#bb0000' }}>
            Kein Treffer in Ausgabe
          </span>
        </div>

        {/* Format Errors */}
        <div style={{
          backgroundColor: '#ffffff',
          border: '1px solid #ffe58f',
          borderRadius: '8px',
          padding: '16px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#d46b08', textTransform: 'uppercase' }}>
            Formatfehler
          </span>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#d46b08', marginTop: '4px' }}>
            {stats.formatErrorCount.toLocaleString('de-DE')}
          </div>
          <span style={{ fontSize: '12px', color: '#d46b08' }}>
            Ungültige Nummernstruktur
          </span>
        </div>
      </div>

      {/* Main Card */}
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #d5dadd',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden'
      }}>
        {/* Action Toolbar */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e5e9ec',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={onRunCheck}
              disabled={isChecking || !activeReference || items.length === 0}
              style={{
                padding: '9px 18px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: (activeReference && items.length > 0) ? '#0070f2' : '#cbd5e1',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '13px',
                cursor: (activeReference && items.length > 0) ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: (activeReference && items.length > 0) ? '0 2px 4px rgba(0, 112, 242, 0.2)' : 'none'
              }}
            >
              <Play size={16} fill="#ffffff" />
              {isChecking ? 'Prüfung läuft...' : 'Prüfung starten'}
            </button>

            <button
              onClick={onLoadPdfSampleData}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: '1px solid #91caff',
                backgroundColor: '#ebf5fe',
                color: '#0050b3',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <FileSpreadsheet size={15} />
              Musterdaten laden (45 Positionen aus PDF)
            </button>

            <button
              onClick={onAddNewRow}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: '1px solid #d5dadd',
                backgroundColor: '#ffffff',
                color: '#131e29',
                fontWeight: 500,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Plus size={15} />
              Neue Zeile erfassen
            </button>

            {items.length > 0 && (
              <button
                onClick={onClearList}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: '1px solid #ffa39e',
                  backgroundColor: '#ffffff',
                  color: '#cf1322',
                  fontWeight: 500,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Trash2 size={15} />
                Liste leeren
              </button>
            )}
          </div>

          {/* Search box */}
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={16} color="#556b82" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Warennummer, Bezeichnung..."
              style={{
                width: '100%',
                padding: '8px 10px 8px 34px',
                borderRadius: '6px',
                border: '1px solid #d5dadd',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Filter Chips Bar */}
        <div style={{
          padding: '10px 20px',
          borderBottom: '1px solid #e5e9ec',
          backgroundColor: '#f9fafb',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          fontSize: '13px'
        }}>
          <span style={{ color: '#556b82', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={14} /> Filter:
          </span>

          <button
            onClick={() => setStatusFilter('ALL')}
            style={{
              padding: '4px 10px',
              borderRadius: '16px',
              border: statusFilter === 'ALL' ? '1px solid #0070f2' : '1px solid #d5dadd',
              backgroundColor: statusFilter === 'ALL' ? '#ebf5fe' : '#ffffff',
              color: statusFilter === 'ALL' ? '#0070f2' : '#556b82',
              fontWeight: statusFilter === 'ALL' ? 600 : 400,
              cursor: 'pointer'
            }}
          >
            Alle ({stats.totalItems})
          </button>

          <button
            onClick={() => setStatusFilter('MATCH')}
            style={{
              padding: '4px 10px',
              borderRadius: '16px',
              border: statusFilter === 'MATCH' ? '1px solid #8de3ab' : '1px solid #d5dadd',
              backgroundColor: statusFilter === 'MATCH' ? '#f1fdf5' : '#ffffff',
              color: statusFilter === 'MATCH' ? '#107e3e' : '#556b82',
              fontWeight: statusFilter === 'MATCH' ? 600 : 400,
              cursor: 'pointer'
            }}
          >
            Treffer ({stats.matchCount})
          </button>

          <button
            onClick={() => setStatusFilter('NO_MATCH')}
            style={{
              padding: '4px 10px',
              borderRadius: '16px',
              border: statusFilter === 'NO_MATCH' ? '1px solid #ffa39e' : '1px solid #d5dadd',
              backgroundColor: statusFilter === 'NO_MATCH' ? '#fff1f0' : '#ffffff',
              color: statusFilter === 'NO_MATCH' ? '#bb0000' : '#556b82',
              fontWeight: statusFilter === 'NO_MATCH' ? 600 : 400,
              cursor: 'pointer'
            }}
          >
            Nicht enthalten ({stats.noMatchCount})
          </button>

          <button
            onClick={() => setStatusFilter('FORMAT_ERROR')}
            style={{
              padding: '4px 10px',
              borderRadius: '16px',
              border: statusFilter === 'FORMAT_ERROR' ? '1px solid #ffe58f' : '1px solid #d5dadd',
              backgroundColor: statusFilter === 'FORMAT_ERROR' ? '#fffbe6' : '#ffffff',
              color: statusFilter === 'FORMAT_ERROR' ? '#d46b08' : '#556b82',
              fontWeight: statusFilter === 'FORMAT_ERROR' ? 600 : 400,
              cursor: 'pointer'
            }}
          >
            Formatfehler ({stats.formatErrorCount})
          </button>

          {stats.duplicateRowsCount > 0 && (
            <button
              onClick={() => setStatusFilter('DUPLICATES')}
              style={{
                padding: '4px 10px',
                borderRadius: '16px',
                border: statusFilter === 'DUPLICATES' ? '1px solid #d3adf7' : '1px solid #d5dadd',
                backgroundColor: statusFilter === 'DUPLICATES' ? '#f9f0ff' : '#ffffff',
                color: statusFilter === 'DUPLICATES' ? '#722ed1' : '#556b82',
                fontWeight: statusFilter === 'DUPLICATES' ? 600 : 400,
                cursor: 'pointer'
              }}
            >
              Duplikate ({stats.duplicateRowsCount})
            </button>
          )}

          <button
            onClick={() => setStatusFilter('PENDING')}
            style={{
              padding: '4px 10px',
              borderRadius: '16px',
              border: statusFilter === 'PENDING' ? '1px solid #d5dadd' : '1px solid #d5dadd',
              backgroundColor: statusFilter === 'PENDING' ? '#f1f5f9' : '#ffffff',
              color: statusFilter === 'PENDING' ? '#334155' : '#556b82',
              fontWeight: statusFilter === 'PENDING' ? 600 : 400,
              cursor: 'pointer'
            }}
          >
            Ungeprüft ({stats.pendingCount})
          </button>
        </div>

        {/* Table */}
        {filteredItems.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: '#556b82' }}>
            <Layers size={40} color="#cbd5e1" style={{ margin: '0 auto 12px auto' }} />
            <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#131e29', marginBottom: '6px' }}>
              Keine Einträge vorhanden
            </h4>
            <p style={{ fontSize: '13px', maxWidth: '420px', margin: '0 auto 16px auto' }}>
              Importieren Sie eine eigene CSV/Excel-Datei oder klicken Sie auf „Musterdaten laden“, um die 45 Positionen aus dem Dokument sofort zu prüfen.
            </p>
            <button
              onClick={onLoadPdfSampleData}
              style={{
                padding: '8px 18px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#0070f2',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Musterdaten laden (45 Positionen aus PDF)
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #d5dadd', color: '#334155' }}>
                  <th style={{ padding: '12px 14px', width: '40px' }}>#</th>
                  <th style={{ padding: '12px 14px', width: '90px' }}>Artikel-Nr.</th>
                  <th style={{ padding: '12px 14px', minWidth: '180px' }}>Eigene Warenbezeichnung</th>
                  <th style={{ padding: '12px 14px', width: '130px' }}>Warennummer</th>
                  <th style={{ padding: '12px 14px', width: '170px' }}>Prüfergebnis</th>
                  <th style={{ padding: '12px 14px', minWidth: '220px' }}>Amtliche Warenbeschreibung (Destatis)</th>
                  <th style={{ padding: '12px 14px', minWidth: '180px' }}>Hinweise / Warnungen</th>
                  <th style={{ padding: '12px 14px', width: '90px', textAlign: 'center' }}>Aktionen</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, index) => {
                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid #e5e9ec',
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa',
                        transition: 'background-color 0.1s ease'
                      }}
                    >
                      {/* # */}
                      <td style={{ padding: '10px 14px', color: '#556b82', fontWeight: 500 }}>
                        {item.rowNumber || (index + 1)}
                      </td>

                      {/* Artikelnummer */}
                      <td style={{ padding: '10px 14px', color: '#556b82' }}>
                        {item.articleNumber || '-'}
                      </td>

                      {/* Eigene Warenbezeichnung */}
                      <td style={{ padding: '10px 14px', fontWeight: 500, color: '#131e29' }}>
                        {item.userDescription || '-'}
                      </td>

                      {/* Warennummer (streng als Text dargestellt!) */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            className="font-mono"
                            style={{
                              fontWeight: 700,
                              fontSize: '14px',
                              color: item.status === 'FORMAT_ERROR' ? '#bb0000' : '#131e29',
                              backgroundColor: '#f1f5f9',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}
                          >
                            {item.normalizedCode || item.rawInput}
                          </span>
                          {item.rawInput !== item.normalizedCode && (
                            <span style={{ fontSize: '10px', color: '#556b82' }} title={`Original: "${item.rawInput}"`}>
                              (orig: {item.rawInput})
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '10px 14px' }}>
                        {item.status === 'MATCH' && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            backgroundColor: '#f1fdf5',
                            color: '#107e3e',
                            border: '1px solid #8de3ab',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontWeight: 600,
                            fontSize: '12px'
                          }}>
                            <CheckCircle2 size={14} /> Enthalten
                          </span>
                        )}

                        {item.status === 'NO_MATCH' && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            backgroundColor: '#fff1f0',
                            color: '#bb0000',
                            border: '1px solid #ffa39e',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontWeight: 600,
                            fontSize: '12px'
                          }}>
                            <XCircle size={14} /> Nicht enthalten
                          </span>
                        )}

                        {item.status === 'FORMAT_ERROR' && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            backgroundColor: '#fffbe6',
                            color: '#d46b08',
                            border: '1px solid #ffe58f',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontWeight: 600,
                            fontSize: '12px'
                          }}>
                            <AlertTriangle size={14} /> Formatfehler
                          </span>
                        )}

                        {item.status === 'PENDING' && (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            backgroundColor: '#f1f5f9',
                            color: '#556b82',
                            border: '1px solid #d5dadd',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontWeight: 500,
                            fontSize: '12px'
                          }}>
                            <Clock size={14} /> Ungeprüft
                          </span>
                        )}
                      </td>

                      {/* Amtliche Beschreibung */}
                      <td style={{ padding: '10px 14px', color: '#131e29', fontSize: '12px', lineHeight: 1.4 }}>
                        {item.officialDescription ? (
                          <span>{item.officialDescription}</span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                            {item.status === 'NO_MATCH' ? 'Kein amtlicher Eintrag' : '-'}
                          </span>
                        )}
                      </td>

                      {/* Hinweise */}
                      <td style={{ padding: '10px 14px', fontSize: '11px', color: '#556b82' }}>
                        {item.warnings.length > 0 ? (
                          <ul style={{ paddingLeft: '14px', margin: 0 }}>
                            {item.warnings.map((w, wi) => (
                              <li key={wi}>{w}</li>
                            ))}
                          </ul>
                        ) : '-'}
                      </td>

                      {/* Aktionen */}
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            onClick={() => onEditItem(item)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#0070f2',
                              padding: '4px'
                            }}
                            title="Zeile bearbeiten (setzt Prüfergebnis zurück)"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => onDeleteItem(item.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: '#bb0000',
                              padding: '4px'
                            }}
                            title="Zeile löschen"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
