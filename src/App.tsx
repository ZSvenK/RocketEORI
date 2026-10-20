import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { CheckListView } from './components/CheckListView';
import { ReferenceManagerModal } from './components/ReferenceManagerModal';
import { ImportModal } from './components/ImportModal';
import { ExportModal } from './components/ExportModal';
import { RowEditModal } from './components/RowEditModal';
import { ConfirmModal } from './components/ConfirmModal';
import { CheckItem, ReferenceEntry, ReferenceMetadata } from './types';
import { executeCheck } from './features/check/checkEngine';
import { createInitialUserCheckItems } from './data/userPdfTestData';
import { loadOfficial2026Reference } from './data/officialReferenceBundle';
import {
  saveCheckItemsToDb,
  getCheckItemsFromDb,
  saveReferenceToDb,
  getAllReferencesFromDb,
  getReferenceEntriesFromDb,
  getSetting,
  setSetting,
  clearAllCheckItemsFromDb
} from './storage/db';

export const App: React.FC = () => {
  const [items, setItems] = useState<CheckItem[]>([]);
  const [activeReference, setActiveReference] = useState<{
    metadata: ReferenceMetadata;
    entries: ReferenceEntry[];
  } | null>(null);

  const [isChecking, setIsChecking] = useState(false);
  const [isRefModalOpen, setIsRefModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CheckItem | null>(null);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  // Initialize DB & load saved state or defaults
  useEffect(() => {
    async function init() {
      try {
        // 1. Load active reference
        const savedRefId = await getSetting<string>('activeReferenceId');
        let refLoaded = false;

        if (savedRefId) {
          const allRefs = await getAllReferencesFromDb();
          const found = allRefs.find(r => r.id === savedRefId);
          if (found) {
            const entries = await getReferenceEntriesFromDb(found.id);
            if (entries.length > 0) {
              setActiveReference({ metadata: found, entries });
              refLoaded = true;
            }
          }
        }

        // If no reference stored yet, auto-load official Destatis 2026
        if (!refLoaded) {
          try {
            const official = await loadOfficial2026Reference();
            await saveReferenceToDb(official.metadata, official.entries);
            await setSetting('activeReferenceId', official.metadata.id);
            setActiveReference(official);
          } catch (e) {
            console.warn('Official 2026 bundle auto-load warning:', e);
          }
        }

        // 2. Load check items
        const savedItems = await getCheckItemsFromDb();
        if (savedItems && savedItems.length > 0) {
          setItems(savedItems);
        } else {
          // Default: Load the 45 items from the user's PDF so they are ready out of the box!
          const initial = createInitialUserCheckItems();
          setItems(initial);
          await saveCheckItemsToDb(initial);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }
    init();
  }, []);

  // Update DB whenever items change
  const updateItems = async (newItems: CheckItem[]) => {
    setItems(newItems);
    try {
      await saveCheckItemsToDb(newItems);
    } catch (e) {
      console.error('Failed to save items to IndexedDB:', e);
    }
  };

  // Run Check
  const handleRunCheck = () => {
    if (!activeReference) {
      alert('Prüfung blockiert: Bitte aktivieren Sie zuerst eine gültige amtliche Referenzdatei.');
      return;
    }

    setIsChecking(true);
    setTimeout(() => {
      try {
        const checked = executeCheck(items, activeReference);
        updateItems(checked);
      } catch (err: any) {
        alert('Fehler bei der Prüfung: ' + err.message);
      } finally {
        setIsChecking(false);
      }
    }, 150); // Small async tick to render loading spinner
  };

  // Activate Reference
  const handleActivateReference = async (
    metadata: ReferenceMetadata,
    entries: ReferenceEntry[]
  ) => {
    await saveReferenceToDb(metadata, entries);
    await setSetting('activeReferenceId', metadata.id);
    setActiveReference({ metadata, entries });

    // Gemäß Abschnitt 11: Nach Wechsel der aktiven Referenz bisherige Ergebnisse
    // nicht stillschweigend der neuen Referenz zuordnen -> erneute Prüfung verlangen!
    const invalidated = items.map(item => ({
      ...item,
      status: 'PENDING' as const,
      officialDescription: undefined,
      checkedAt: undefined,
      warnings: item.warnings.filter(w => !w.includes('Enthalten') && !w.includes('Nicht enthalten'))
    }));
    await updateItems(invalidated);
  };

  // Load PDF sample items (45 lines)
  const handleLoadPdfSampleData = async () => {
    const initial = createInitialUserCheckItems();
    await updateItems(initial);
  };

  // Clear list
  const handleConfirmClear = async () => {
    await clearAllCheckItemsFromDb();
    setItems([]);
    setConfirmClearOpen(false);
  };

  // Import items
  const handleImportItems = async (newItems: CheckItem[], replace: boolean) => {
    if (replace) {
      await updateItems(newItems);
    } else {
      await updateItems([...items, ...newItems]);
    }
  };

  // Edit item
  const handleSaveEditedItem = async (updated: CheckItem) => {
    const newItems = items.map(i => i.id === updated.id ? updated : i);
    await updateItems(newItems);
  };

  // Delete item
  const handleDeleteItem = async (id: string) => {
    const newItems = items.filter(i => i.id !== id);
    await updateItems(newItems);
  };

  // Add new row
  const handleAddNewRow = async () => {
    const newItem: CheckItem = {
      id: 'item-' + Date.now(),
      rowNumber: items.length + 1,
      rawInput: '',
      normalizedCode: '',
      status: 'PENDING',
      warnings: [],
      isDuplicateCode: false
    };
    setEditingItem(newItem);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg-base)' }}>
      {/* Header */}
      <Header
        activeReference={activeReference ? activeReference.metadata : null}
        onOpenReferenceManager={() => setIsRefModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        totalItemsCount={items.length}
      />

      {/* Official Legal Disclaimer Banner */}
      <DisclaimerBanner />

      {/* Main Content View */}
      <main style={{ flex: 1 }}>
        <CheckListView
          items={items}
          activeReference={activeReference ? activeReference.metadata : null}
          isChecking={isChecking}
          onRunCheck={handleRunCheck}
          onLoadPdfSampleData={handleLoadPdfSampleData}
          onClearList={() => setConfirmClearOpen(true)}
          onAddNewRow={handleAddNewRow}
          onEditItem={(item) => setEditingItem(item)}
          onDeleteItem={handleDeleteItem}
        />
      </main>

      {/* Modals */}
      <ReferenceManagerModal
        isOpen={isRefModalOpen}
        onClose={() => setIsRefModalOpen(false)}
        activeReference={activeReference ? activeReference.metadata : null}
        onActivateReference={handleActivateReference}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportItems={handleImportItems}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        items={items}
        metadata={activeReference ? activeReference.metadata : undefined}
      />

      {editingItem && (
        <RowEditModal
          item={editingItem}
          isOpen={true}
          onClose={() => setEditingItem(null)}
          onSave={handleSaveEditedItem}
        />
      )}

      <ConfirmModal
        isOpen={confirmClearOpen}
        title="Prüfliste vollständig leeren?"
        message="Möchten Sie wirklich alle Positionen aus der Prüfliste löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        confirmLabel="Liste unwiderruflich leeren"
        isDanger={true}
        onConfirm={handleConfirmClear}
        onCancel={() => setConfirmClearOpen(false)}
      />
    </div>
  );
};
