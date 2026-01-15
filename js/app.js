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
    itemNotes: {},
    isQuickEdit: false, // 是否為單一項目快速編輯模式
    currentRecordId: null,
    selectedTemplateId: null,
    selectedTemplate: null, // 當前使用的模板物件
    editingTemplate: null  // 正在編輯中的模板暫存
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

    // 載入模板清單
    loadTemplates();

    // 初始載入：顯示所有記錄
    handleSearch();

    prepareNewRecord(); // 確保初始是新增模式
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
    Elements.itemNote = document.getElementById('item-note'); // 新增

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
    Elements.btnQuickFinish = document.getElementById('btn-quick-finish');

    // 模板管理 (New)
    Elements.selectTemplate = document.getElementById('select-template');
    Elements.templateList = document.getElementById('template-list');
    Elements.templateEditor = document.getElementById('template-editor');
    Elements.editTemplateName = document.getElementById('edit-template-name');
    Elements.editItemsList = document.getElementById('edit-items-list');
    Elements.newItemName = document.getElementById('new-item-name');
    Elements.newItemNameEn = document.getElementById('new-item-name-en');
    Elements.newItemHasChoice = document.getElementById('new-item-has-choice');
    Elements.choiceTitle = document.getElementById('choice-title');
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
    document.getElementById('btn-back-from-search').addEventListener('click', () => {
        prepareNewRecord();
        showPage('home');
    });
    document.getElementById('btn-back-from-detail').addEventListener('click', () => showPage('search'));

    // 新增：首頁（拍照表單）返回搜尋頁
    document.getElementById('btn-back-from-home') || (() => {
        // 在 header 加一個返回按鈕供家頁面使用
        const header = Elements.pageHome.querySelector('.app-header');
        const backBtn = document.createElement('button');
        backBtn.className = 'btn-back-floating';
        backBtn.innerHTML = '<span>🔙</span>';
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

    // 快速儲存（編輯模式時可用）
    Elements.btnQuickFinish.addEventListener('click', handleQuickFinish);

    // 完成頁面
    document.getElementById('btn-save-record').addEventListener('click', handleSaveRecord);
    document.getElementById('btn-cancel-record').addEventListener('click', () => {
        if (confirm('確定要取消嗎？\nAre you sure to cancel?')) {
            showPage('home');
        }
    });

    // 搜尋功能
    document.getElementById('btn-do-search').addEventListener('click', handleSearch);

    // 備份與還原
    document.getElementById('btn-backup-trigger').addEventListener('click', () => {
        const choice = confirm('💾 備份管理 Backup Management\n\n點擊「確定」匯出備份 (Export)\n點擊「取消」進行匯入還原 (Import)');
        if (choice) {
            handleBackup();
        } else {
            document.getElementById('import-input').click();
        }
    });

    document.getElementById('import-input') || (() => {
        // 匯入的 input 必須在 body 的某處，但我剛才移除了內容區，現在把它加回 hidden
        const input = document.createElement('input');
        input.type = 'file';
        input.id = 'import-input';
        input.accept = '.json';
        input.style.display = 'none';
        document.body.appendChild(input);
        input.addEventListener('change', handleImport);
    })();

    // 備份圖示長按或點擊後的選單改進：這裡直接讓點擊執行備份
    // 如果需要匯入，我把邏輯併入：若長按則匯入，但簡易起見我們先直接處理
    // 為了讓使用者能還原，我稍微調整一下：
    document.getElementById('btn-backup-trigger').addEventListener('contextmenu', (e) => {
        e.preventDefault();
        document.getElementById('import-input').click();
    });

    // 刪除與編輯記錄
    document.getElementById('btn-delete-record').addEventListener('click', handleDeleteRecord);
    document.getElementById('btn-edit-record').addEventListener('click', handleEditRecord);

    // 設定頁面
    document.getElementById('btn-settings-trigger').addEventListener('click', () => {
        showPage('settings');
        renderTemplateList();
        loadBackupEmail();
    });
    document.getElementById('btn-settings').addEventListener('click', () => {
        showPage('settings');
        renderTemplateList();
        loadBackupEmail();
    });
    document.getElementById('btn-back-from-settings').addEventListener('click', () => {
        showPage('search');
    });

    // 模板管理事件
    document.getElementById('btn-show-add-template').addEventListener('click', () => openTemplateEditor());
    document.getElementById('btn-close-editor').addEventListener('click', () => Elements.templateEditor.classList.add('hidden'));
    document.getElementById('btn-add-item-to-tpl').addEventListener('click', handleAddItemToTemplate);
    document.getElementById('btn-save-template').addEventListener('click', handleSaveTemplate);

    // 監聽模板選擇變化
    Elements.selectTemplate.addEventListener('change', (e) => {
        PhotoDB.setSelectedTemplateId(e.target.value);
        AppState.selectedTemplateId = e.target.value;
        AppState.selectedTemplate = PhotoDB.getTemplateById(e.target.value);
    });

    // 備份郵件設定
    document.getElementById('btn-save-email').addEventListener('click', handleSaveBackupEmail);
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
/**
 * 準備新增記錄（重置所有編輯狀態）
 */
function prepareNewRecord() {
    AppState.currentRecordId = null;
    AppState.isQuickEdit = false;
    AppState.photos = {};
    AppState.itemNotes = {};
    AppState.currentStep = 0;

    // 重置首頁標題
    const header = Elements.pageHome.querySelector('.app-header h1');
    header.innerHTML = '📸 出貨照片管理系統';

    // 清空表單
    if (Elements.dataForm) {
        Elements.dataForm.reset();
        setTodayDate();
    }
}

function handleFormSubmit(e) {
    e.preventDefault();

    AppState.formData = {
        date: Elements.inputDate.value,
        customer: Elements.inputCustomer.value.trim().toUpperCase(),
        destination: Elements.inputDestination.value.trim().toUpperCase(),
        notes: Elements.inputNotes.value.trim(),
        templateId: Elements.selectTemplate.value,
        templateName: AppState.selectedTemplate ? AppState.selectedTemplate.name : ''
    };

    if (!AppState.formData.templateId) {
        showToast('請選擇模板 Please select a template', 'error');
        return;
    }

    // 重置狀態（僅在新增模式時重置照片）
    if (!AppState.currentRecordId) {
        AppState.photos = {};
        AppState.itemNotes = {};
    }
    AppState.currentStep = 0;
    Elements.itemNote.value = ''; // 清空輸入框

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

    // 顯示/隱藏選擇區域（是否需要拍攝此項目）
    if (category.hasChoice && !AppState.photos[category.id]) {
        Elements.choiceTitle.innerHTML = `是否需要拍攝「${category.name}」？<br><small>Do you need to take photos of "${category.nameEn}"?</small>`;
        Elements.conversionChoice.classList.remove('hidden');
        Elements.photoSection.classList.add('hidden');
    } else {
        Elements.conversionChoice.classList.add('hidden');
        Elements.photoSection.classList.remove('hidden');
    }

    // 更新照片預覽
    updatePhotoPreview();

    // 載入該項目的備註
    Elements.itemNote.value = AppState.itemNotes[category.id] || '';

    // 如果是快速編輯模式，更換按鈕文字
    const nextBtn = document.getElementById('btn-next-step');
    const isLastStep = AppState.currentStep === PhotoCamera.getCategories().length - 1;

    if (AppState.isQuickEdit) {
        nextBtn.innerHTML = '<span>✅</span> 儲存修改 Save';
        nextBtn.classList.add('btn-success');
        Elements.btnQuickFinish.classList.add('hidden'); // 快速編輯模式不需要此按鈕
    } else {
        nextBtn.innerHTML = isLastStep
            ? '<span>🏁</span> 完成 Finish'
            : '<span>→</span> 下一步 Next';
        nextBtn.classList.remove('btn-success');

        // 如果目前是編輯現有記錄（非快速編輯單一項模式），顯示快速儲存按鈕
        if (AppState.currentRecordId) {
            Elements.btnQuickFinish.classList.remove('hidden');
        } else {
            Elements.btnQuickFinish.classList.add('hidden');
        }
    }
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
function handleNextStep() {
    // 取得當前項目
    const currentCategory = PhotoCamera.getCategories()[AppState.currentStep];
    AppState.itemNotes[currentCategory.id] = Elements.itemNote.value.trim();

    // 如果是快速編輯模式，點擊「下一步」按鈕（此時已變更為儲存）即直接儲存
    if (AppState.isQuickEdit) {
        handleQuickSave();
        return;
    }

    if (AppState.currentStep < PhotoCamera.getCategories().length - 1) {
        AppState.currentStep++;
        updateCameraStep();
    } else {
        showCompletePage();
    }
}

/**
 * 處理上一步
 */
function handlePrevStep() {
    // 如果是快速編輯模式，按下取消/上一步直接回到詳情頁
    if (AppState.isQuickEdit) {
        AppState.isQuickEdit = false;
        showRecordDetail(AppState.currentRecordId);
        return;
    }

    // 切換前，先儲存當前項目的備註
    const currentCategory = PhotoCamera.getCategories()[AppState.currentStep];
    AppState.itemNotes[currentCategory.id] = Elements.itemNote.value.trim();

    if (AppState.currentStep > 0) {
        AppState.currentStep--;
        updateCameraStep();
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
        const note = AppState.itemNotes[cat.id];

        if (photos === null && !note) {
            // 跳過且無備註時不顯示
        } else {
            summaryHTML += `
                <div class="summary-photo-category">
                    <h4>${cat.name} ${cat.nameEn} ${photos === null ? '(跳過 Skip)' : `(${photos ? photos.length : 0})`}</h4>
                    ${note ? `<p class="item-summary-note">📝 ${note}</p>` : ''}
                    <div class="summary-photo-grid">
                        ${photos && photos.length > 0 ? photos.map(p => `<img src="${p.data}" alt="${cat.name}">`).join('') : ''}
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
            photos: AppState.photos,
            itemNotes: AppState.itemNotes,
            // 儲存當下的模板資訊，確保未來命名正確
            templateName: AppState.formData.templateName,
            categoryNames: PhotoCamera.getCategories().reduce((acc, cat) => {
                acc[cat.id] = cat.name;
                return acc;
            }, {})
        };

        // 如果目前是編輯模式，則帶入 ID 以進行覆蓋 (Upsert)
        if (AppState.currentRecordId) {
            record.id = AppState.currentRecordId;
        }

        await PhotoDB.saveRecord(record);
        showToast(record.id ? '記錄已更新 Record updated!' : '記錄已儲存 Record saved!', 'success');

        // 重置狀態
        AppState.currentRecordId = null;

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

        PhotoCamera.getCategories().forEach((cat, index) => {
            const photos = record.photos?.[cat.id];
            const note = record.itemNotes?.[cat.id];

            if ((photos && photos.length > 0) || note) {
                detailHTML += `
                    <div class="detail-photo-category">
                        <div class="category-header-row">
                            <h3>${cat.name} ${cat.nameEn} ${photos ? `(${photos.length})` : ''}</h3>
                            <button class="btn-edit-item" onclick="startQuickEdit(${record.id}, ${index})">
                                ✏️ 編輯項目 Edit
                            </button>
                        </div>
                        ${note ? `<p class="item-detail-note">📝 ${note}</p>` : ''}
                        <div class="detail-photo-grid">
                            ${photos ? photos.map(p => `
                                <div class="detail-photo-item">
                                    <img src="${p.data}" alt="${cat.name}" onclick="PhotoCamera.showPhotoViewer('${p.data}')">
                                </div>
                            `).join('') : ''}
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
 * 處理編輯記錄
 */
async function handleEditRecord() {
    if (!AppState.currentRecordId) return;

    try {
        const record = await PhotoDB.getRecord(AppState.currentRecordId);
        if (!record) return;

        // 回填表單資料
        Elements.inputDate.value = record.date;
        Elements.inputCustomer.value = record.customer;
        Elements.inputDestination.value = record.destination;
        Elements.inputNotes.value = record.notes || '';

        // 更新 App 狀態
        AppState.formData = {
            date: record.date,
            customer: record.customer,
            destination: record.destination,
            notes: record.notes
        };
        AppState.photos = record.photos || {};
        AppState.itemNotes = record.itemNotes || {}; // 回填項目備註

        // 顯示表單頁面
        showPage('home');

        // 更新表單中的標題，提示正在編輯
        const header = Elements.pageHome.querySelector('.app-header h1');
        header.innerHTML = `✏️ 正在編輯模式<br><small>${record.customer}</small>`;

    } catch (error) {
        console.error('Error starting edit:', error);
        showToast('載入編輯失敗', 'error');
    }
}

/**
 * 啟動單一項目快速編輯
 */
async function startQuickEdit(recordId, stepIndex) {
    try {
        const record = await PhotoDB.getRecord(recordId);
        if (!record) return;

        // 設定狀態
        AppState.currentRecordId = recordId;
        AppState.formData = {
            date: record.date,
            customer: record.customer,
            destination: record.destination,
            notes: record.notes
        };
        AppState.photos = record.photos || {};
        AppState.itemNotes = record.itemNotes || {};
        AppState.currentStep = stepIndex;
        AppState.isQuickEdit = true;

        // 顯示相機頁面
        showPage('camera');
        updateCameraStep();

    } catch (error) {
        console.error('Quick edit error:', error);
    }
}

/**
 * 快速儲存單一項目的更改
 */
async function handleQuickSave() {
    try {
        // 確保當前編輯的備註已存入 AppState
        const currentCategory = PhotoCamera.getCategories()[AppState.currentStep];
        AppState.itemNotes[currentCategory.id] = Elements.itemNote.value.trim();

        const record = {
            ...AppState.formData,
            photos: AppState.photos,
            itemNotes: AppState.itemNotes,
            id: AppState.currentRecordId
        };

        await PhotoDB.saveRecord(record);
        showToast('項目更新成功 Item updated!', 'success');

        // 結束快速編輯模式，回到詳情頁
        AppState.isQuickEdit = false;
        showRecordDetail(AppState.currentRecordId);

    } catch (error) {
        console.error('Quick save error:', error);
        showToast('儲存失敗', 'error');
    }
}

/**
 * 快速完成並儲存（用於編輯模式中途跳出儲存）
 */
async function handleQuickFinish() {
    // 儲存當前步驟的照片備註
    const currentCategory = PhotoCamera.getCategories()[AppState.currentStep];
    AppState.itemNotes[currentCategory.id] = Elements.itemNote.value.trim();

    // 呼叫原本的儲存邏輯
    await handleSaveRecord();
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

/**
 * 載入模板清單
 */
function loadTemplates() {
    const templates = PhotoDB.getTemplates();
    const selectedId = PhotoDB.getSelectedTemplateId();

    let html = '<option value="">-- 請選擇模板 --</option>';
    html += templates.map(t => `<option value="${t.id}" ${t.id === selectedId ? 'selected' : ''}>${t.name}</option>`).join('');

    Elements.selectTemplate.innerHTML = html;

    // 更新 AppState
    if (selectedId) {
        AppState.selectedTemplateId = selectedId;
        AppState.selectedTemplate = PhotoDB.getTemplateById(selectedId);
    }
}

// ===========================
// 模板管理功能
// ===========================

function renderTemplateList() {
    const templates = PhotoDB.getTemplates();
    if (templates.length === 0) {
        Elements.templateList.innerHTML = '<p class="no-results">目前沒有模板，請新增。 No templates found.</p>';
        return;
    }

    Elements.templateList.innerHTML = templates.map(t => `
        <div class="template-item">
            <div class="template-info">
                <div class="template-name">${t.name}</div>
                <div class="template-meta">${t.items.length} 個項目</div>
            </div>
            <div class="template-actions">
                <button class="btn-icon" onclick="openTemplateEditor('${t.id}')" title="編輯項目">✏️</button>
                <button class="btn-icon" onclick="handleDeleteTemplate('${t.id}')" title="刪除選單">🗑️</button>
            </div>
        </div>
    `).join('');
}

function openTemplateEditor(id = null) {
    if (id) {
        const t = PhotoDB.getTemplateById(id);
        AppState.editingTemplate = JSON.parse(JSON.stringify(t));
        document.getElementById('editor-title').textContent = '編輯模板 Edit Template';
    } else {
        AppState.editingTemplate = { id: null, name: '', items: [] };
        document.getElementById('editor-title').textContent = '新增模板 Add Template';
    }

    Elements.editTemplateName.value = AppState.editingTemplate.name;
    renderEditItems();
    Elements.templateEditor.classList.remove('hidden');
}

function renderEditItems() {
    const items = AppState.editingTemplate.items;
    Elements.editItemsList.innerHTML = items.map((item, index) => `
        <div class="edit-item-row-display">
            <div class="item-reorder-btns">
                <button class="btn-icon-sm" onclick="moveItemInTemplate(${index}, -1)" ${index === 0 ? 'disabled' : ''}>▲</button>
                <button class="btn-icon-sm" onclick="moveItemInTemplate(${index}, 1)" ${index === items.length - 1 ? 'disabled' : ''}>▼</button>
            </div>
            <span class="item-name-text">${index + 1}. ${item.name} (${item.nameEn}) ${item.hasChoice ? '✓' : ''}</span>
            <button class="btn-icon" onclick="handleRemoveItemFromTemplate(${index})">✕</button>
        </div>
    `).join('');
}

function moveItemInTemplate(index, direction) {
    const items = AppState.editingTemplate.items;
    const newIndex = index + direction;

    if (newIndex < 0 || newIndex >= items.length) return;

    // 交換位置
    const temp = items[index];
    items[index] = items[newIndex];
    items[newIndex] = temp;

    // 行動裝置震動回饋
    if (navigator.vibrate) navigator.vibrate(50);

    renderEditItems();
}

function handleAddItemToTemplate() {
    const name = Elements.newItemName.value.trim();
    const nameEn = Elements.newItemNameEn.value.trim();
    const hasChoice = Elements.newItemHasChoice.checked;

    if (!name) return showToast('請輸入項目名稱', 'error');

    AppState.editingTemplate.items.push({
        id: 'item_' + Date.now() + Math.random().toString(36).substr(2, 5),
        name,
        nameEn,
        hasChoice
    });

    Elements.newItemName.value = '';
    Elements.newItemNameEn.value = '';
    Elements.newItemHasChoice.checked = false;
    renderEditItems();
}

function handleRemoveItemFromTemplate(index) {
    AppState.editingTemplate.items.splice(index, 1);
    renderEditItems();
}

async function handleSaveTemplate() {
    const name = Elements.editTemplateName.value.trim();
    if (!name) return showToast('請填寫模板名稱', 'error');

    AppState.editingTemplate.name = name;

    if (AppState.editingTemplate.id) {
        PhotoDB.updateTemplate(AppState.editingTemplate);
    } else {
        PhotoDB.addTemplate(name);
        // 如果是剛新增，我們需要把 items 塞回去 (因為上面的 addTemplate 只收 name)
        const templates = PhotoDB.getTemplates();
        const newT = templates[templates.length - 1];
        newT.items = AppState.editingTemplate.items;
        PhotoDB.updateTemplate(newT);
    }

    Elements.templateEditor.classList.add('hidden');
    renderTemplateList();
    loadTemplates();
    showToast('模板儲存成功 Template saved', 'success');
}

function handleDeleteTemplate(id) {
    if (!confirm('確定要刪除此模板嗎？')) return;
    PhotoDB.deleteTemplate(id);
    renderTemplateList();
    loadTemplates();
    showToast('模板已刪除 Template deleted', 'success');
}

// 設為全域函數
window.openTemplateEditor = openTemplateEditor;
window.handleDeleteTemplate = handleDeleteTemplate;
window.handleRemoveItemFromTemplate = handleRemoveItemFromTemplate;
window.moveItemInTemplate = moveItemInTemplate;

// ===========================
// 備份郵件管理
// ===========================

/**
 * 載入備份郵件地址
 */
function loadBackupEmail() {
    const email = PhotoDB.getBackupEmail();
    const emailInput = document.getElementById('backup-email');
    if (emailInput) {
        emailInput.value = email;
    }
}

/**
 * 儲存備份郵件地址
 */
function handleSaveBackupEmail() {
    const emailInput = document.getElementById('backup-email');
    const email = emailInput.value.trim();

    // 簡單的郵件格式驗證
    if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        showToast('請輸入有效的郵件地址 Invalid email format', 'error');
        return;
    }

    PhotoDB.setBackupEmail(email);

    if (email) {
        showToast('郵件地址已儲存 Email saved', 'success');
    } else {
        showToast('郵件地址已清除 Email cleared', 'info');
    }
}

/**
 * 顯示 Toast 通知
 */
let toastTimer = null;
function showToast(message, type = 'info') {
    if (toastTimer) clearTimeout(toastTimer);

    Elements.toast.textContent = message;
    Elements.toast.className = `toast ${type} show`;

    // 3秒後自動消失
    toastTimer = setTimeout(() => {
        Elements.toast.classList.remove('show');
        toastTimer = null;
    }, 3000);
}

// 全域函數
window.showToast = showToast;

// 啟動應用程式
document.addEventListener('DOMContentLoaded', initApp);
