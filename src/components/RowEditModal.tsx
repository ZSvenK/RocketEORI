import React, { useState } from 'react';
import { CheckItem } from '../types';
import { normalizeWarennummer } from '../utils/normalizer';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';

interface RowEditModalProps {
  item: CheckItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: CheckItem) => void;
}

export const RowEditModal: React.FC<RowEditModalProps> = ({ item, isOpen, onClose, onSave }) => {
  const [articleNumber, setArticleNumber] = useState(item.articleNumber || '');
  const [userDescription, setUserDescription] = useState(item.userDescription || '');
  const [rawInput, setRawInput] = useState(item.rawInput || '');

  if (!isOpen) return null;

  const norm = normalizeWarennummer(rawInput);

  const handleSave = () => {
    // Gemäß Abschnitt 11: Nach Bearbeitung einer Nummer ist ihr altes Prüfergebnis ungültig und zurückzusetzen!
    const isCodeChanged = rawInput.trim() !== item.rawInput.trim();

    const updated: CheckItem = {
      ...item,
      articleNumber: articleNumber.trim() || undefined,
      userDescription: userDescription.trim() || undefined,
      rawInput: rawInput,
      normalizedCode: norm.normalized,
      status: isCodeChanged ? 'PENDING' : item.status,
      officialDescription: isCodeChanged ? undefined : item.officialDescription,
      checkedAt: isCodeChanged ? undefined : item.checkedAt,
      warnings: norm.warnings
    };

    onSave(updated);
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
        maxWidth: '540px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
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
            Eintrag bearbeiten {item.rowNumber ? `(Zeile #${item.rowNumber})` : ''}
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#556b82' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>
              Warennummer (genau 8 Ziffern) *
            </label>
            <input
              type="text"
              value={rawInput}
              onChange={e => setRawInput(e.target.value)}
              placeholder="z.B. 05029000"
              className="font-mono"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: `1px solid ${norm.isValidFormat ? '#107e3e' : '#bb0000'}`,
                fontSize: '15px',
                outline: 'none',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
              }}
            />
            <div style={{ marginTop: '6px', fontSize: '12px' }}>
              {norm.isValidFormat ? (
                <span style={{ color: '#107e3e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={14} /> Gültiges 8-stelliges Format: <strong>{norm.normalized}</strong>
                </span>
              ) : (
                <span style={{ color: '#bb0000', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertTriangle size={14} /> {norm.errorMessage}
                </span>
              )}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>
              Eigene Warenbezeichnung (optional)
            </label>
            <input
              type="text"
              value={userDescription}
              onChange={e => setUserDescription(e.target.value)}
              placeholder="z.B. Naturhaare"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #d5dadd',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#334155' }}>
              Artikelnummer (optional)
            </label>
            <input
              type="text"
              value={articleNumber}
              onChange={e => setArticleNumber(e.target.value)}
              placeholder="z.B. ART-022"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #d5dadd',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{
            backgroundColor: '#ebf5fe',
            border: '1px solid #91caff',
            borderRadius: '6px',
            padding: '10px 12px',
            fontSize: '12px',
            color: '#0050b3'
          }}>
            Hinweis: Wenn die Warennummer geändert wird, wird das alte Prüfergebnis automatisch zurückgesetzt und muss neu geprüft werden.
          </div>
        </div>

        <div style={{
          padding: '16px 24px',
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
            onClick={handleSave}
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
            Änderungen speichern
          </button>
        </div>
      </div>
    </div>
  );
};
