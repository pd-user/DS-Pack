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
        // 即使沒有記錄，也要能匯出建議模板
        const templates = PhotoDB.getTemplates();
        if (templates.length === 0) {
            showToast('沒有記錄或模板可匯出 No data to export', 'error');
            return;
        }
    }

    const backup = {
        version: '1.9.0',
        exportDate: new Date().toISOString(),
        deviceInfo: navigator.userAgent,
        recordCount: records.length,
        records: records,
        templates: PhotoDB.getTemplates() // 🚀 加入模板設定備份
    };

    const jsonContent = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `photo_backup_${dateStr}.json`;

    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();

    showToast(`備份已匯出 (${records.length} 筆記錄, ${backup.templates.length} 個模板) Backup exported`, 'success');
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
                let messageParts = [];

                // 1. 處理模板匯入
                if (backup.templates && Array.isArray(backup.templates)) {
                    const existingTemplates = PhotoDB.getTemplates();
                    let templatesAdded = 0;

                    for (const tpl of backup.templates) {
                        // 如果 ID 不存在，則匯入
                        if (!existingTemplates.some(et => et.id === tpl.id)) {
                            existingTemplates.push(tpl);
                            templatesAdded++;
                        }
                    }

                    if (templatesAdded > 0) {
                        PhotoDB.saveTemplates(existingTemplates);
                        messageParts.push(`匯入 ${templatesAdded} 個模板`);
                    }
                }

                // 2. 處理記錄匯入
                if (backup.records && Array.isArray(backup.records)) {
                    const existingRecords = await PhotoDB.getAllRecords();
                    let importedCount = 0;
                    let skippedCount = 0;

                    for (const record of backup.records) {
                        // 檢查是否已存在 (以 createdAt 為主，或內容完全一致)
                        const isDuplicate = existingRecords.some(existing => {
                            if (record.createdAt && existing.createdAt === record.createdAt) return true;
                            return existing.date === record.date &&
                                existing.customer === record.customer &&
                                existing.destination === record.destination &&
                                (existing.notes || '') === (record.notes || '');
                        });

                        if (isDuplicate) {
                            skippedCount++;
                            continue;
                        }

                        delete record.id;
                        await PhotoDB.saveRecord(record);
                        importedCount++;
                    }

                    if (importedCount > 0) {
                        messageParts.push(`匯入 ${importedCount} 筆記錄`);
                    }
                }

                if (messageParts.length === 0) {
                    showToast('未發現新資料匯入 No new data imported', 'info');
                } else {
                    showToast(messageParts.join(', ') + ' Success', 'success');
                }

                resolve(true);
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
