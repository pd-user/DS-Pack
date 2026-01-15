/**
 * Export Module
 * 備份功能
 */

/**
 * 匯出完整備份（含照片的 JSON）
 * Export full backup with photos (JSON)
 */
async function exportFullBackup(records) {
    if (!records || records.length === 0) {
        const templates = PhotoDB.getTemplates();
        if (templates.length === 0) {
            showToast('沒有記錄或模板可匯出 No data to export', 'error');
            return;
        }
    }

    const backup = {
        version: '1.9.7',
        exportDate: new Date().toISOString(),
        deviceInfo: navigator.userAgent,
        recordCount: records.length,
        records: records,
        templates: PhotoDB.getTemplates()
    };

    const jsonContent = JSON.stringify(backup, null, 2);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `photo_backup_${dateStr}.json`;

    // 詢問使用者要使用哪種匯出方式
    const choice = confirm(
        '📤 選擇匯出方式 Export Method\n\n' +
        '【確定】= 下載檔案到裝置 (Download file)\n' +
        '【取消】= 顯示內容以便複製傳送 (Show content for copy)\n\n' +
        '提示：如果您的裝置無法傳送檔案，\n' +
        '請選擇「取消」來複製內容。'
    );

    if (choice) {
        // 方式 1: 傳統下載
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
        showToast(`備份已下載 Downloaded: ${filename}`, 'success');
    } else {
        // 方式 2: 顯示內容供複製
        showBackupContentModal(jsonContent, filename, backup);
    }

    // 2. 檢查是否有設定郵件地址
    const backupEmail = PhotoDB.getBackupEmail();

    if (backupEmail) {
        // 延遲 1 秒後嘗試複製備份資訊到剪貼簿
        setTimeout(async () => {
            const emailMessage =
                `收件人 To: ${backupEmail}\n` +
                `主旨 Subject: 📸 出貨照片備份 - ${dateStr}\n\n` +
                `---\n\n` +
                `您好，\n\n` +
                `這是系統自動產生的備份郵件。\n\n` +
                `備份資訊：\n` +
                `- 日期：${dateStr}\n` +
                `- 記錄筆數：${records.length}\n` +
                `- 模板數量：${backup.templates.length}\n` +
                `- 檔案名稱：${filename}\n\n` +
                `請將剛才下載的備份檔案（${filename}）附加到郵件後發送。\n\n` +
                `---\n\n` +
                `Hello,\n\n` +
                `This is an auto-generated backup email.\n\n` +
                `Backup Info:\n` +
                `- Date: ${dateStr}\n` +
                `- Records: ${records.length}\n` +
                `- Templates: ${backup.templates.length}\n` +
                `- Filename: ${filename}\n\n` +
                `Please attach the downloaded backup file (${filename}) to this email before sending.\n`;

            try {
                // 嘗試複製到剪貼簿
                await navigator.clipboard.writeText(emailMessage);

                // 顯示提示訊息
                if (confirm(
                    '✅ 郵件內容已複製到剪貼簿！\n' +
                    'Email content copied to clipboard!\n\n' +
                    `收件人：${backupEmail}\n\n` +
                    '請開啟您的郵件應用程式（網頁版或其他），\n' +
                    '貼上剛才複製的內容，並附加下載的備份檔案。\n\n' +
                    'Please open your email app (web or other),\n' +
                    'paste the copied content, and attach the backup file.\n\n' +
                    '點擊「確定」查看完整郵件內容'
                )) {
                    // 如果使用者想查看，顯示在新視窗
                    alert(emailMessage);
                }
            } catch (err) {
                console.error('Clipboard copy failed:', err);
                // 如果剪貼簿失敗，直接顯示內容讓使用者手動複製
                alert(
                    '⚠️ 無法自動複製到剪貼簿\n' +
                    'Cannot auto-copy to clipboard\n\n' +
                    '請手動複製以下內容：\n' +
                    'Please manually copy the following:\n\n' +
                    emailMessage
                );
            }
        }, 1000);
    }
}

/**
 * 顯示備份內容的彈窗
 */
function showBackupContentModal(jsonContent, filename, backup) {
    // 建立彈窗
    const modal = document.createElement('div');
    modal.className = 'backup-modal';
    modal.innerHTML = `
        <div class="backup-modal-content">
            <div class="backup-modal-header">
                <h2>📋 備份內容 Backup Content</h2>
                <button class="backup-modal-close" onclick="this.closest('.backup-modal').remove()">✕</button>
            </div>
            <div class="backup-modal-body">
                <div class="backup-info">
                    <p><strong>檔案名稱 Filename:</strong> ${filename}</p>
                    <p><strong>記錄筆數 Records:</strong> ${backup.recordCount}</p>
                    <p><strong>模板數量 Templates:</strong> ${backup.templates.length}</p>
                    <p><strong>匯出時間 Export Time:</strong> ${new Date(backup.exportDate).toLocaleString('zh-TW')}</p>
                </div>
                <div class="backup-instructions">
                    <h3>📝 使用說明 Instructions:</h3>
                    <ol>
                        <li>點擊下方「複製內容」按鈕</li>
                        <li>透過任何通訊軟體將內容傳送到您的電腦</li>
                        <li>在電腦上建立新的文字檔案，貼上內容</li>
                        <li>將檔案儲存為「${filename}」</li>
                        <li>使用本系統的「匯入備份」功能還原</li>
                    </ol>
                </div>
                <div class="backup-actions">
                    <button class="btn btn-primary" onclick="copyBackupContent()">
                        <span>📋</span> 複製全部內容 Copy All
                    </button>
                    <button class="btn btn-secondary" onclick="toggleBackupPreview()">
                        <span>👁️</span> <span id="preview-toggle-text">顯示內容 Show Content</span>
                    </button>
                </div>
                <div class="backup-preview hidden" id="backup-preview">
                    <textarea readonly id="backup-content-text">${jsonContent}</textarea>
                    <small style="color: var(--text-muted);">
                        ⚠️ 內容較長，建議直接使用「複製全部內容」按鈕
                    </small>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 儲存內容到全域變數供複製使用
    window._backupContent = jsonContent;
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
