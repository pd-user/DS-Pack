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

        // 添加時間戳
        record.createdAt = new Date().toISOString();

        const request = store.add(record);

        request.onsuccess = () => {
            console.log('Record saved with ID:', request.result);
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
        // 日期範圍篩選
        if (filters.dateFrom) {
            if (record.date < filters.dateFrom) return false;
        }
        if (filters.dateTo) {
            if (record.date > filters.dateTo) return false;
        }

        // 客戶代碼篩選
        if (filters.customer) {
            if (!record.customer.toLowerCase().includes(filters.customer.toLowerCase())) {
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
// 分類設定管理（使用 localStorage）
// ===========================

const STORAGE_KEY_CATEGORIES = 'photo_categories';

/**
 * 預設分類項目
 */
const DEFAULT_CATEGORIES = [
    { id: 'conversion_frame', name: '轉換膠框', nameEn: 'Conversion Frame', hasChoice: true },
    { id: 'box', name: '盒子', nameEn: 'Box', hasChoice: false },
    { id: 'sponge', name: '海綿', nameEn: 'Sponge', hasChoice: false },
    { id: 'tyvek_paper', name: '泰維克紙', nameEn: 'Tyvek Paper', hasChoice: false },
    { id: 'bag', name: '袋子', nameEn: 'Bag', hasChoice: false },
    { id: 'box_label', name: '盒子標籤', nameEn: 'Box Label', hasChoice: false },
    { id: 'outer_bag_label', name: '外袋標籤', nameEn: 'Outer Bag Label', hasChoice: false },
    { id: 'outer_box_label', name: '外箱標籤', nameEn: 'Outer Box Label', hasChoice: false }
];

/**
 * 取得分類列表
 */
function getCategories() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY_CATEGORIES);
        if (saved) {
            return JSON.parse(saved);
        }
    } catch (e) {
        console.error('Error loading categories:', e);
    }
    return [...DEFAULT_CATEGORIES];
}

/**
 * 儲存分類列表
 */
function saveCategories(categories) {
    try {
        localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
        return true;
    } catch (e) {
        console.error('Error saving categories:', e);
        return false;
    }
}

/**
 * 新增分類
 */
function addCategory(name, nameEn, hasChoice = false) {
    const categories = getCategories();
    const id = 'cat_' + Date.now();
    categories.push({ id, name, nameEn, hasChoice });
    saveCategories(categories);
    return categories;
}

/**
 * 更新分類
 */
function updateCategory(id, name, nameEn, hasChoice) {
    const categories = getCategories();
    const index = categories.findIndex(c => c.id === id);
    if (index !== -1) {
        categories[index] = { id, name, nameEn, hasChoice };
        saveCategories(categories);
    }
    return categories;
}

/**
 * 刪除分類
 */
function deleteCategoryById(id) {
    let categories = getCategories();
    categories = categories.filter(c => c.id !== id);
    saveCategories(categories);
    return categories;
}

/**
 * 重置為預設分類
 */
function resetCategories() {
    saveCategories([...DEFAULT_CATEGORIES]);
    return [...DEFAULT_CATEGORIES];
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
    // 分類管理
    getCategories,
    saveCategories,
    addCategory,
    updateCategory,
    deleteCategory: deleteCategoryById,
    resetCategories,
    DEFAULT_CATEGORIES
};

