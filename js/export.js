/**
 * Export Module
 * 備份功能
 */

/**
 * 匯出完整備份（含照片的 JSON）
 * Export full backup with photos (JSON)
 */
function exportFullBackup(records) {
    if (!records || records.length === 0) {
        showToast('沒有可匯出的記錄 No records to export', 'error');
        return;
    }

    const backup = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        deviceInfo: navigator.userAgent,
        recordCount: records.length,
        records: records
    };

    const jsonContent = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `photo_backup_${dateStr}.json`;

    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();

    showToast(`完整備份已匯出 (${records.length} 筆) Full backup exported`, 'success');
}

/**
 * 匯入備份
 * Import backup
 */
async function importBackup(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const backup = JSON.parse(e.target.result);

                if (!backup.records || !Array.isArray(backup.records)) {
                    throw new Error('Invalid backup format');
                }

                const existingRecords = await PhotoDB.getAllRecords();
                let importedCount = 0;
                let skippedCount = 0;

                for (const record of backup.records) {
                    // 檢查是否已存在 (以 createdAt 為主，或內容完全一致)
                    const isDuplicate = existingRecords.some(existing => {
                        // 如果有 createdAt 且一致，即為重複
                        if (record.createdAt && existing.createdAt === record.createdAt) return true;

                        // fallback: 檢查基本內容是否完全相同
                        return existing.date === record.date &&
                            existing.customer === record.customer &&
                            existing.destination === record.destination &&
                            (existing.notes || '') === (record.notes || '');
                    });

                    if (isDuplicate) {
                        skippedCount++;
                        continue;
                    }

                    // 移除原本的 id (因為不同資料庫的 auto-increment ID 可能衝突)
                    // 但保留 createdAt 以作為未來比對基礎
                    delete record.id;

                    await PhotoDB.saveRecord(record);
                    importedCount++;
                }

                let message = `已匯入 ${importedCount} 筆記錄 Imported`;
                if (skippedCount > 0) {
                    message += ` (跳過 ${skippedCount} 筆重複項目 Skipped duplicates)`;
                }
                showToast(message, 'success');
                resolve(importedCount);
            } catch (error) {
                console.error('Import error:', error);
                showToast('匯入失敗，檔案格式錯誤 Import failed', 'error');
                reject(error);
            }
        };

        reader.onerror = () => {
            showToast('讀取檔案失敗 Failed to read file', 'error');
            reject(reader.error);
        };

        reader.readAsText(file);
    });
}

window.PhotoExport = {
    backup: exportFullBackup,
    importBackup: importBackup
};
