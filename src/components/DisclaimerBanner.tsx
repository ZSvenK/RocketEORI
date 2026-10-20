import React, { useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{
      backgroundColor: '#fffbf0',
      borderBottom: '1px solid #ffe58f',
      padding: '8px 24px',
      fontSize: '13px',
      color: '#7c4a03'
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <AlertCircle size={16} style={{ color: '#d46b08', flexShrink: 0 }} />
          <span>
            <strong>Rechtlicher Hinweis:</strong> Die Anwendung beantwortet ausschließlich: <em>„Ist diese achtstellige Warennummer in der importierten amtlichen Referenzausgabe enthalten?“</em>
            {!expanded && ' Sie prüft NICHT Zollsätze, Ursprung oder Einreihung.'}
          </span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: 'none',
            border: 'none',
            color: '#b35c00',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontWeight: 500
          }}
        >
          {expanded ? 'Weniger anzeigen' : 'Fachliche Grenzen lesen'}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {expanded && (
        <div style={{
          maxWidth: '1440px',
          margin: '8px auto 4px auto',
          paddingTop: '8px',
          borderTop: '1px dashed #ffd591',
          fontSize: '12px',
          lineHeight: 1.6
        }}>
          <p style={{ marginBottom: '6px' }}>
            Die Prüfung erfolgt rein rechnerisch lokal im Browser gegen den jeweils aktivierten Referenzdatenbestand des Statistischen Bundesamtes (Destatis Sova-Leitdatei).
          </p>
          <ul style={{ paddingLeft: '20px', marginBottom: '6px' }}>
            <li><strong>Keine Einreihungsprüfung:</strong> Es wird nicht geprüft, ob eine Nummer inhaltlich zum Produkt passt.</li>
            <li><strong>Keine Zoll- oder Tarifprüfung:</strong> Keine Zollsätze, keine Einfuhr-/Ausfuhrbeschränkungen, keine Zusatzcodes.</li>
            <li><strong>Keine Rechtsverbindlichkeit:</strong> Ergebnisse sind weder zollamtlich freigegeben noch rechtsverbindlich.</li>
            <li><strong>Personenkennzeichen P1 / P2:</strong> Die Kürzel P1 und P2 aus bisherigen Warenaufstellungen sind Personenkennzeichnungen, für die Prüfung irrelevant und lösen keine Prüflogik aus.</li>
          </ul>
        </div>
      )}
    </div>
  );
};
