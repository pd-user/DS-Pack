/**
 * Main Application Module
 * 主程式邏輯
 */

// 應用程式狀態
const AppState = {
    currentPage: 'search',
    currentStep: 0,
    formData: {},
    photos: {},
    currentRecordId: null
};

// DOM 元素快取
const Elements = {};

/**
 * 初始化應用程式
 */
async function initApp() {
    console.log('Initializing Photo Classifier App...');

    // 初始化資料庫
    await PhotoDB.init();

    // 快取 DOM 元素
    cacheElements();

    // 綁定事件
    bindEvents();

    // 設定今天日期
    setTodayDate();

    // 載入建議清單
    loadSuggestions();

    // 初始載入：顯示所有記錄
    handleSearch();

    console.log('App initialized successfully');
}

/**
 * 快取 DOM 元素
 */
function cacheElements() {
    // 頁面
    Elements.pageHome = document.getElementById('page-home');
    Elements.pageCamera = document.getElementById('page-camera');
    Elements.pageComplete = document.getElementById('page-complete');
    Elements.pageSearch = document.getElementById('page-search');
    Elements.pageDetail = document.getElementById('page-detail');

    // 表單
    Elements.dataForm = document.getElementById('data-form');
    Elements.inputDate = document.getElementById('input-date');
    Elements.inputCustomer = document.getElementById('input-customer');
    Elements.inputDestination = document.getElementById('input-destination');
    Elements.inputNotes = document.getElementById('input-notes');

    // 相機頁面
    Elements.stepTitle = document.getElementById('step-title');
    Elements.currentStep = document.getElementById('current-step');
    Elements.totalSteps = document.getElementById('total-steps');
    Elements.progressFill = document.getElementById('progress-fill');
    Elements.conversionChoice = document.getElementById('conversion-choice');
    Elements.photoSection = document.getElementById('photo-section');
    Elements.photoPreviewGrid = document.getElementById('photo-preview-grid');
    Elements.cameraInput = document.getElementById('camera-input');

    // 資訊顯示
    Elements.infoCustomer = document.getElementById('info-customer');
    Elements.infoDestination = document.getElementById('info-destination');
    Elements.infoDate = document.getElementById('info-date');

    // 搜尋
    Elements.searchResults = document.getElementById('search-results');
    Elements.searchCustomer = document.getElementById('search-customer');
    Elements.searchDestination = document.getElementById('search-destination');

    // 其他
    Elements.completeSummary = document.getElementById('complete-summary');
    Elements.detailContent = document.getElementById('detail-content');
    Elements.toast = document.getElementById('toast');
}

/**
 * 綁定事件
 */
function bindEvents() {
    // 表單提交
    Elements.dataForm.addEventListener('submit', handleFormSubmit);

    // 搜尋按鈕
    document.getElementById('btn-search').addEventListener('click', () => showPage('search'));

    // 返回按鈕
    document.getElementById('btn-back-home').addEventListener('click', () => {
        if (confirm('確定要離開嗎？目前的拍照記錄將不會儲存。\nAre you sure? Current photos will not be saved.')) {
            showPage('home');
        }
    });
    document.getElementById('btn-back-from-search').addEventListener('click', () => showPage('home'));
    document.getElementById('btn-back-from-detail').addEventListener('click', () => showPage('search'));

    // 新增：首頁（拍照表單）返回搜尋頁
    document.getElementById('btn-back-from-home') || (() => {
        // 在 header 加一個返回按鈕供家頁面使用
        const header = Elements.pageHome.querySelector('.app-header');
        const backBtn = document.createElement('button');
        backBtn.className = 'btn-back-floating';
        backBtn.innerHTML = '<span>←</span>';
        backBtn.onclick = () => showPage('search');
        Elements.pageHome.prepend(backBtn);
    })();

    // 拍照步驟按鈕
    document.getElementById('btn-conversion-yes').addEventListener('click', () => handleConversionChoice(true));
    document.getElementById('btn-conversion-no').addEventListener('click', () => handleConversionChoice(false));
    document.getElementById('btn-prev-step').addEventListener('click', handlePrevStep);
    document.getElementById('btn-next-step').addEventListener('click', handleNextStep);

    // 相機輸入
    Elements.cameraInput.addEventListener('change', handlePhotoInput);

    // 完成頁面
    document.getElementById('btn-save-record').addEventListener('click', handleSaveRecord);
    document.getElementById('btn-cancel-record').addEventListener('click', () => {
        if (confirm('確定要取消嗎？\nAre you sure to cancel?')) {
            showPage('home');
        }
    });

    // 搜尋功能
    document.getElementById('btn-do-search').addEventListener('click', handleSearch);

    // 備份功能
    document.getElementById('btn-backup').addEventListener('click', handleBackup);
    document.getElementById('import-input').addEventListener('change', handleImport);

    // 刪除記錄
    document.getElementById('btn-delete-record').addEventListener('click', handleDeleteRecord);

    // 設定頁面
    document.getElementById('btn-settings').addEventListener('click', () => {
        showPage('settings');
        renderCategoryList();
    });
    document.getElementById('btn-back-from-settings').addEventListener('click', () => showPage('home'));
    document.getElementById('btn-add-category').addEventListener('click', handleAddCategory);
    document.getElementById('btn-reset-categories').addEventListener('click', handleResetCategories);
}

/**
 * 設定今天日期
 */
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    Elements.inputDate.value = today;
}

/**
 * 載入建議清單
 */
async function loadSuggestions() {
    try {
        const customers = await PhotoDB.getSuggestions('customer');
        const destinations = await PhotoDB.getSuggestions('destination');

        const customerList = document.getElementById('customer-list');
        const destinationList = document.getElementById('destination-list');

        customerList.innerHTML = customers.map(c => `<option value="${c}">`).join('');
        destinationList.innerHTML = destinations.map(d => `<option value="${d}">`).join('');
    } catch (error) {
        console.error('Error loading suggestions:', error);
    }
}

/**
 * 顯示頁面
 */
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(`page-${pageName}`).classList.add('active');
    AppState.currentPage = pageName;
}

/**
 * 處理表單提交
 */
function handleFormSubmit(e) {
    e.preventDefault();

    AppState.formData = {
        date: Elements.inputDate.value,
        customer: Elements.inputCustomer.value.trim(),
        destination: Elements.inputDestination.value.trim(),
        notes: Elements.inputNotes.value.trim()
    };

    // 重置照片狀態
    AppState.photos = {};
    AppState.currentStep = 0;

    // 更新資訊顯示
    Elements.infoCustomer.textContent = AppState.formData.customer;
    Elements.infoDestination.textContent = AppState.formData.destination;
    Elements.infoDate.textContent = AppState.formData.date;

    // 設定總步驟數
    Elements.totalSteps.textContent = PhotoCamera.getCategories().length;

    // 顯示相機頁面
    showPage('camera');
    updateCameraStep();
}

/**
 * 更新拍照步驟
 */
function updateCameraStep() {
    const category = PhotoCamera.getCategories()[AppState.currentStep];

    // 更新標題（中英對照）
    Elements.stepTitle.textContent = `${category.name} ${category.nameEn}`;
    Elements.currentStep.textContent = AppState.currentStep + 1;

    // 更新進度條
    const progress = ((AppState.currentStep + 1) / PhotoCamera.getCategories().length) * 100;
    Elements.progressFill.style.width = `${progress}%`;

    // 更新按鈕狀態
    document.getElementById('btn-prev-step').disabled = AppState.currentStep === 0;

    const isLastStep = AppState.currentStep === PhotoCamera.getCategories().length - 1;
    const nextBtn = document.getElementById('btn-next-step');
    nextBtn.innerHTML = isLastStep ? '完成 Complete <span class="icon">✓</span>' : '下一項 Next <span class="icon">→</span>';

    // 顯示/隱藏選擇區域（轉換膠框）
    if (category.hasChoice && !AppState.photos[category.id]) {
        Elements.conversionChoice.classList.remove('hidden');
        Elements.photoSection.classList.add('hidden');
    } else {
        Elements.conversionChoice.classList.add('hidden');
        Elements.photoSection.classList.remove('hidden');
    }

    // 更新照片預覽
    updatePhotoPreview();
}

/**
 * 處理轉換膠框選擇
 */
function handleConversionChoice(needPhoto) {
    const category = PhotoCamera.getCategories()[AppState.currentStep];

    if (needPhoto) {
        AppState.photos[category.id] = [];
        Elements.conversionChoice.classList.add('hidden');
        Elements.photoSection.classList.remove('hidden');
    } else {
        AppState.photos[category.id] = null; // 標記為跳過
        handleNextStep();
    }
}

/**
 * 更新照片預覽
 */
function updatePhotoPreview() {
    const category = PhotoCamera.getCategories()[AppState.currentStep];
    const photos = AppState.photos[category.id] || [];

    Elements.photoPreviewGrid.innerHTML = '';

    photos.forEach((photo, index) => {
        const element = PhotoCamera.createPhotoPreviewElement(photo, index, (idx) => {
            photos.splice(idx, 1);
        });
        Elements.photoPreviewGrid.appendChild(element);
    });
}

/**
 * 處理照片輸入
 */
async function handlePhotoInput(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const category = PhotoCamera.getCategories()[AppState.currentStep];
    const categoryName = `${category.name} ${category.nameEn}`;

    showToast('處理照片中... Processing...', 'info');

    const processedPhotos = await PhotoCamera.processPhotoFiles(
        files,
        AppState.formData,
        categoryName
    );

    if (!AppState.photos[category.id]) {
        AppState.photos[category.id] = [];
    }

    AppState.photos[category.id].push(...processedPhotos);
    updatePhotoPreview();

    showToast(`已新增 ${processedPhotos.length} 張照片 Added ${processedPhotos.length} photos`, 'success');

    // 清空 input
    e.target.value = '';
}

/**
 * 上一步
 */
function handlePrevStep() {
    if (AppState.currentStep > 0) {
        AppState.currentStep--;
        updateCameraStep();
    }
}

/**
 * 下一步
 */
function handleNextStep() {
    if (AppState.currentStep < PhotoCamera.getCategories().length - 1) {
        AppState.currentStep++;
        updateCameraStep();
    } else {
        showCompletePage();
    }
}

/**
 * 顯示完成頁面
 */
function showCompletePage() {
    let summaryHTML = `
        <div class="summary-item">
            <span class="summary-label">📅 日期 Date</span>
            <span class="summary-value">${AppState.formData.date}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">🏢 客戶代碼 Customer</span>
            <span class="summary-value">${AppState.formData.customer}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">📍 出貨地 Destination</span>
            <span class="summary-value">${AppState.formData.destination}</span>
        </div>
        <div class="summary-item">
            <span class="summary-label">📝 備註 Notes</span>
            <span class="summary-value">${AppState.formData.notes || '-'}</span>
        </div>
        <div class="summary-photos">
            <h3>📷 照片摘要 Photo Summary</h3>
    `;

    PhotoCamera.getCategories().forEach(cat => {
        const photos = AppState.photos[cat.id];
        if (photos === null) {
            summaryHTML += `<div class="summary-photo-category"><h4>${cat.name} ${cat.nameEn}: 跳過 Skipped</h4></div>`;
        } else if (photos && photos.length > 0) {
            summaryHTML += `
                <div class="summary-photo-category">
                    <h4>${cat.name} ${cat.nameEn} (${photos.length})</h4>
                    <div class="summary-photo-grid">
                        ${photos.map(p => `<img src="${p.data}" alt="${cat.name}">`).join('')}
                    </div>
                </div>
            `;
        }
    });

    summaryHTML += '</div>';
    Elements.completeSummary.innerHTML = summaryHTML;
    showPage('complete');
}

/**
 * 儲存記錄
 */
async function handleSaveRecord() {
    try {
        const record = {
            ...AppState.formData,
            photos: AppState.photos
        };

        await PhotoDB.saveRecord(record);
        showToast('記錄已儲存 Record saved!', 'success');

        // 重置表單
        Elements.dataForm.reset();
        setTodayDate();
        loadSuggestions();

        showPage('home');
    } catch (error) {
        console.error('Error saving record:', error);
        showToast('儲存失敗 Save failed', 'error');
    }
}

/**
 * 搜尋記錄
 */
async function handleSearch() {
    const filters = {
        customer: Elements.searchCustomer.value.trim() || null,
        destination: Elements.searchDestination.value.trim() || null
    };

    try {
        const records = await PhotoDB.searchRecords(filters);
        // 依照日期降序排列（新的在前面）
        records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        displaySearchResults(records);
    } catch (error) {
        console.error('Error searching:', error);
        showToast('搜尋失敗', 'error');
    }
}

/**
 * 顯示搜尋結果
 */
function displaySearchResults(records) {
    if (records.length === 0) {
        Elements.searchResults.innerHTML = '<p class="no-results">沒有找到記錄 No records found</p>';
        return;
    }

    Elements.searchResults.innerHTML = records.map(record => {
        let photoCount = 0;
        let firstPhoto = null;

        if (record.photos) {
            Object.values(record.photos).forEach(photos => {
                if (photos && photos.length > 0) {
                    photoCount += photos.length;
                    if (!firstPhoto) firstPhoto = photos[0].data;
                }
            });
        }

        return `
            <div class="result-card" data-id="${record.id}">
                <div class="result-header">
                    <span class="result-date">${record.date}</span>
                    <span class="result-customer">${record.customer}</span>
                </div>
                <div class="result-destination">📍 ${record.destination}</div>
                <div class="result-photos">
                    ${firstPhoto ? `<img src="${firstPhoto}" alt="Preview">` : ''}
                    <span>共 ${photoCount} 張照片</span>
                </div>
            </div>
        `;
    }).join('');

    // 綁定點擊事件
    Elements.searchResults.querySelectorAll('.result-card').forEach(card => {
        card.addEventListener('click', () => showRecordDetail(parseInt(card.dataset.id)));
    });
}

/**
 * 顯示記錄詳情
 */
async function showRecordDetail(id) {
    try {
        const record = await PhotoDB.getRecord(id);
        if (!record) return;

        AppState.currentRecordId = id;

        let detailHTML = `
            <div class="detail-info">
                <div class="detail-row">
                    <span class="detail-label">📅 日期 Date</span>
                    <span class="detail-value">${record.date}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">🏢 客戶代碼 Customer</span>
                    <span class="detail-value">${record.customer}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">📍 出貨地 Destination</span>
                    <span class="detail-value">${record.destination}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">📝 備註 Notes</span>
                    <span class="detail-value">${record.notes || '-'}</span>
                </div>
            </div>
            <div class="detail-photos-section">
        `;

        PhotoCamera.getCategories().forEach(cat => {
            const photos = record.photos?.[cat.id];
            if (photos && photos.length > 0) {
                detailHTML += `
                    <div class="detail-photo-category">
                        <h3>${cat.name} ${cat.nameEn} (${photos.length})</h3>
                        <div class="detail-photo-grid">
                            ${photos.map(p => `
                                <div class="detail-photo-item">
                                    <img src="${p.data}" alt="${cat.name}" onclick="PhotoCamera.showPhotoViewer('${p.data}')">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        });

        detailHTML += '</div>';
        Elements.detailContent.innerHTML = detailHTML;
        showPage('detail');
    } catch (error) {
        console.error('Error loading detail:', error);
    }
}

/**
 * 刪除記錄
 */
async function handleDeleteRecord() {
    if (!confirm('確定要刪除此記錄嗎？\nAre you sure to delete this record?')) return;

    try {
        await PhotoDB.deleteRecord(AppState.currentRecordId);
        showToast('記錄已刪除 Record deleted', 'success');
        showPage('search');
        handleSearch();
    } catch (error) {
        console.error('Error deleting:', error);
        showToast('刪除失敗', 'error');
    }
}



/**
 * 完整備份
 */
async function handleBackup() {
    const records = await PhotoDB.getAllRecords();
    PhotoExport.backup(records);
}

/**
 * 匯入備份
 */
async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!confirm('匯入備份會新增記錄到資料庫，確定要繼續嗎？\nImport will add records to database. Continue?')) {
        e.target.value = '';
        return;
    }

    try {
        await PhotoExport.importBackup(file);
        handleSearch(); // 重新搜尋顯示結果
    } catch (error) {
        console.error('Import error:', error);
    }

    e.target.value = '';
}

// ===========================
// 設定頁面功能
// ===========================

/**
 * 渲染分類列表
 */
function renderCategoryList() {
    const categories = PhotoDB.getCategories();
    const listEl = document.getElementById('category-list');

    if (categories.length === 0) {
        listEl.innerHTML = '<p class="no-results">沒有設定任何項目 No categories configured</p>';
        return;
    }

    listEl.innerHTML = categories.map((cat, index) => `
        <div class="category-item" data-id="${cat.id}">
            <div class="category-order">${index + 1}</div>
            <div class="category-info">
                <div class="category-name">${cat.name}</div>
                <div class="category-name-en">${cat.nameEn}</div>
            </div>
            ${cat.hasChoice ? '<span class="category-badge">是/否選擇</span>' : ''}
            <div class="category-actions">
                <button class="btn-icon btn-edit" title="編輯 Edit" onclick="editCategory('${cat.id}')">✏️</button>
                <button class="btn-icon btn-delete-cat" title="刪除 Delete" onclick="deleteCategory('${cat.id}')">🗑️</button>
            </div>
        </div>
    `).join('');
}

/**
 * 新增分類
 */
function handleAddCategory() {
    const nameInput = document.getElementById('new-category-name');
    const nameEnInput = document.getElementById('new-category-name-en');
    const hasChoiceInput = document.getElementById('new-category-has-choice');

    const name = nameInput.value.trim();
    const nameEn = nameEnInput.value.trim();
    const hasChoice = hasChoiceInput.checked;

    if (!name || !nameEn) {
        showToast('請填寫中英文名稱 Please fill in both names', 'error');
        return;
    }

    PhotoDB.addCategory(name, nameEn, hasChoice);

    // 清空表單
    nameInput.value = '';
    nameEnInput.value = '';
    hasChoiceInput.checked = false;

    renderCategoryList();
    showToast('已新增項目 Category added', 'success');
}

/**
 * 編輯分類
 */
function editCategory(id) {
    const categories = PhotoDB.getCategories();
    const cat = categories.find(c => c.id === id);
    if (!cat) return;

    const newName = prompt('中文名稱 Chinese Name:', cat.name);
    if (newName === null) return;

    const newNameEn = prompt('英文名稱 English Name:', cat.nameEn);
    if (newNameEn === null) return;

    const hasChoice = confirm('是否需要「是/否」選擇？\nDoes this category need Yes/No choice?');

    PhotoDB.updateCategory(id, newName.trim() || cat.name, newNameEn.trim() || cat.nameEn, hasChoice);
    renderCategoryList();
    showToast('已更新項目 Category updated', 'success');
}

/**
 * 刪除分類
 */
function deleteCategory(id) {
    if (!confirm('確定要刪除此項目嗎？\nAre you sure to delete this category?')) return;

    PhotoDB.deleteCategory(id);
    renderCategoryList();
    showToast('已刪除項目 Category deleted', 'success');
}

/**
 * 重置為預設分類
 */
function handleResetCategories() {
    if (!confirm('確定要重置為預設項目嗎？自訂項目將會遺失。\nReset to default? Custom categories will be lost.')) return;

    PhotoDB.resetCategories();
    renderCategoryList();
    showToast('已重置為預設項目 Reset to default', 'success');
}

// 設為全域函數供 HTML onclick 使用
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;

/**
 * 顯示 Toast 通知
 */
function showToast(message, type = 'info') {
    Elements.toast.textContent = message;
    Elements.toast.className = `toast ${type} show`;

    setTimeout(() => {
        Elements.toast.classList.remove('show');
    }, 3000);
}

// 全域函數
window.showToast = showToast;

// 啟動應用程式
document.addEventListener('DOMContentLoaded', initApp);
