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

                let importedCount = 0;

                for (const record of backup.records) {
                    // 移除原本的 id，讓資料庫自動生成新的
                    delete record.id;
                    await PhotoDB.saveRecord(record);
                    importedCount++;
                }

                showToast(`已匯入 ${importedCount} 筆記錄 Imported ${importedCount} records`, 'success');
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
