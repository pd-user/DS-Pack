/**
 * IndexedDB Database Module
 * 處理所有資料庫操作
 */

const DB_NAME = 'PhotoClassifierDB';
const DB_VERSION = 1;
const STORE_RECORDS = 'records';
const STORE_SUGGESTIONS = 'suggestions';

let db = null;

/**
 * 初始化資料庫
 */
async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('Database error:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            db = request.result;
            console.log('Database opened successfully');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;

            // 建立記錄存儲
            if (!database.objectStoreNames.contains(STORE_RECORDS)) {
                const recordStore = database.createObjectStore(STORE_RECORDS, {
                    keyPath: 'id',
                    autoIncrement: true
                });
                recordStore.createIndex('date', 'date', { unique: false });
                recordStore.createIndex('customer', 'customer', { unique: false });
                recordStore.createIndex('destination', 'destination', { unique: false });
                recordStore.createIndex('createdAt', 'createdAt', { unique: false });
            }

            // 建立建議存儲（用於自動完成）
            if (!database.objectStoreNames.contains(STORE_SUGGESTIONS)) {
                const suggestionStore = database.createObjectStore(STORE_SUGGESTIONS, {
                    keyPath: 'id'
                });
                suggestionStore.createIndex('type', 'type', { unique: false });
            }

            console.log('Database upgraded');
        };
    });
}

/**
 * 儲存記錄
 */
async function saveRecord(record) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_RECORDS], 'readwrite');
        const store = transaction.objectStore(STORE_RECORDS);

        // 如果是新記錄，才添加建立時間
        if (!record.id) {
            record.createdAt = new Date().toISOString();
        }

        // 更新最後修改時間
        record.updatedAt = new Date().toISOString();

        // 使用 put 以支援更新現有記錄 (若 ID 已存在則更新，不存在則新增)
        const request = store.put(record);

        request.onsuccess = () => {
            console.log('Record saved/updated with ID:', request.result);
            // 更新建議清單
            updateSuggestions('customer', record.customer);
            updateSuggestions('destination', record.destination);
            resolve(request.result);
        };

        request.onerror = () => {
            console.error('Error saving record:', request.error);
            reject(request.error);
        };
    });
}

/**
 * 取得所有記錄
 */
async function getAllRecords() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_RECORDS], 'readonly');
        const store = transaction.objectStore(STORE_RECORDS);
        const request = store.getAll();

        request.onsuccess = () => {
            // 按建立時間倒序排列
            const records = request.result.sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            resolve(records);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

/**
 * 依條件搜尋記錄
 */
async function searchRecords(filters) {
    const allRecords = await getAllRecords();

    return allRecords.filter(record => {
        // 客戶代碼篩選
        if (filters.customer) {
            if (!record.customer.toLowerCase().includes(filters.customer.toLowerCase())) {
                return false;
            }
        }

        // 出貨地篩選
        if (filters.destination) {
            if (!record.destination.toLowerCase().includes(filters.destination.toLowerCase())) {
                return false;
            }
        }

        return true;
    });
}

/**
 * 取得單筆記錄
 */
async function getRecord(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_RECORDS], 'readonly');
        const store = transaction.objectStore(STORE_RECORDS);
        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

/**
 * 刪除記錄
 */
async function deleteRecord(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_RECORDS], 'readwrite');
        const store = transaction.objectStore(STORE_RECORDS);
        const request = store.delete(id);

        request.onsuccess = () => {
            console.log('Record deleted:', id);
            resolve();
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

/**
 * 更新建議清單
 */
async function updateSuggestions(type, value) {
    if (!value || !value.trim()) return;

    const id = `${type}_${value.toLowerCase()}`;

    return new Promise((resolve) => {
        const transaction = db.transaction([STORE_SUGGESTIONS], 'readwrite');
        const store = transaction.objectStore(STORE_SUGGESTIONS);

        const suggestion = {
            id: id,
            type: type,
            value: value.trim(),
            count: 1,
            lastUsed: new Date().toISOString()
        };

        // 先嘗試取得現有的
        const getRequest = store.get(id);

        getRequest.onsuccess = () => {
            if (getRequest.result) {
                suggestion.count = getRequest.result.count + 1;
            }
            store.put(suggestion);
            resolve();
        };

        getRequest.onerror = () => {
            store.put(suggestion);
            resolve();
        };
    });
}

/**
 * 取得建議清單
 */
async function getSuggestions(type) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_SUGGESTIONS], 'readonly');
        const store = transaction.objectStore(STORE_SUGGESTIONS);
        const index = store.index('type');
        const request = index.getAll(type);

        request.onsuccess = () => {
            // 按使用次數排序
            const suggestions = request.result
                .sort((a, b) => b.count - a.count)
                .map(s => s.value);
            resolve(suggestions);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}

/**
 * 將照片轉換為 Base64
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * 壓縮圖片
 */
async function compressImage(base64, maxWidth = 1200, quality = 0.8) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // 計算縮放比例
            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = base64;
    });
}

// ===========================
// 模板與分類設定管理（使用 localStorage）
// ===========================

const STORAGE_KEY_TEMPLATES = 'photo_templates';
const STORAGE_KEY_SELECTED_TEMPLATE = 'selected_template_id';

/**
 * 取得模板列表
 */
function getTemplates() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY_TEMPLATES);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error('Error loading templates:', e);
    }
    return []; // 預設不再提供預設值，由使用者自行建立
}

/**
 * 儲存模板列表
 */
function saveTemplates(templates) {
    try {
        localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(templates));
        return true;
    } catch (e) {
        console.error('Error saving templates:', e);
        return false;
    }
}

/**
 * 新增模板
 */
function addTemplate(name) {
    const templates = getTemplates();
    const id = 'tpl_' + Date.now();
    const newTemplate = { id, name, items: [] };
    templates.push(newTemplate);
    saveTemplates(templates);
    return newTemplate;
}

/**
 * 刪除模板
 */
function deleteTemplate(id) {
    let templates = getTemplates();
    templates = templates.filter(t => t.id !== id);
    saveTemplates(templates);

    // 如果刪除的是目前選中的模板，清除選擇
    if (getSelectedTemplateId() === id) {
        setSelectedTemplateId(null);
    }
    return templates;
}

/**
 * 更新模板名稱或項目
 */
function updateTemplate(template) {
    const templates = getTemplates();
    const index = templates.findIndex(t => t.id === template.id);
    if (index !== -1) {
        templates[index] = template;
        saveTemplates(templates);
        return true;
    }
    return false;
}

/**
 * 取得目前選中的模板 ID
 */
function getSelectedTemplateId() {
    return localStorage.getItem(STORAGE_KEY_SELECTED_TEMPLATE);
}

/**
 * 設定目前選中的模板 ID
 */
function setSelectedTemplateId(id) {
    if (id) {
        localStorage.setItem(STORAGE_KEY_SELECTED_TEMPLATE, id);
    } else {
        localStorage.removeItem(STORAGE_KEY_SELECTED_TEMPLATE);
    }
}

/**
 * 取得特定模板及其項目
 */
function getTemplateById(id) {
    const templates = getTemplates();
    return templates.find(t => t.id === id);
}

// 匯出函數
window.PhotoDB = {
    init: initDB,
    saveRecord,
    getAllRecords,
    searchRecords,
    getRecord,
    deleteRecord,
    getSuggestions,
    fileToBase64,
    compressImage,
    // 模板管理
    getTemplates,
    saveTemplates,
    addTemplate,
    deleteTemplate,
    updateTemplate,
    getTemplateById,
    getSelectedTemplateId,
    setSelectedTemplateId
};

