# 📸 出貨照片管理系統使用手冊 (v1.9.0)
# Photo Classifier User Manual

## 1. 系統簡介 (Introduction)
本系統專為出貨照片記錄設計，支援多站點模板自定義、離線操作與自動命名匯出。
This system is designed for shipping photo recording, supporting multi-site template customization, offline operation, and auto-naming export.

---

## 2. 核心功能操作 (Core Operations)

### A. 模板設定 (Template Settings)
*   **路徑**：首頁 > 設定 (Settings) > 模板管理。
    **Path**: Home > Settings > Template Management.
*   **新增模板**：點擊「新增模板」，輸入站點名稱。
    **Add Template**: Click "Add Template" and enter the site name.
*   **調整項目**：在模板中新增項目（中英文），並可使用 ▲/▼ 調整拍照順序。
    **Manage Items**: Add items (CN/EN) and use ▲/▼ to reorder them for the photo process.

### B. 拍照作業 (Taking Photos)
*   **選擇模板**：在首頁輸入資料時，必須選擇適用的「模板」。
    **Select Template**: You must select a "Template" before starting.
*   **拍照/選取**：按順序進行拍照，支援「是/否」特殊選擇（如：是否需要轉換膠框）。
    **Capture**: Follow the steps to take photos. Supports "Yes/No" choices if configured.
*   **項目備註**：每一項拍照時皆可輸入獨立的「項目備註」。
    **Item Note**: Each step allow entering an individual note.

### C. 查詢與匯出 (Search & Export)
*   **資料庫**：首頁點擊「出貨照片資料庫」進行日期或客戶搜尋。
    **Database**: Click "Database" to search by date or customer code.
*   **備份管理**：使用管理按鈕匯出 JSON 備份檔。
    **Backup**: Use the management icon to export JSON backup files.

---

## 3. 檔名命名規則 (File Naming Convention)
使用「備份檔檢視器 (ExportViewer.html)」下載的照片將遵循以下格式：
Photos downloaded via "ExportViewer.html" follow this format:

`[模板名稱]_[客戶代碼]_[出貨地]_[項目名稱]_[日期]_[序號].jpg`
`[Template_Name]_[Customer_Code]_[Destination]_[Item_Name]_[Date]_[No].jpg`

---

## 4. 注意事項 (Important Notes)
1.  **離線使用**：系統支援離線操作，但匯出備份時需確保資料已儲存。
    **Offline**: Supports offline use; ensure records are saved locally.
2.  **更新提示**：若看到「發現新版本」，請點擊確定以獲取最新功能。
    **Update**: Click "OK" when "New Version Found" appears to get the latest features.
