# 📸 拍照分類系統 Photo Classifier System

## 專案概述 Project Overview

一個手機友善的網頁應用程式，用於記錄出貨時的各項照片，並可隨時查詢與匯出。

A mobile-friendly web application for recording shipping photos and allowing query and export at any time.

---

## 功能規格 Functional Specifications

### 1. 資料輸入欄位 Data Input Fields

| 欄位名稱 | Field Name | 類型 Type | 必填 Required | 說明 Description |
|---------|------------|-----------|---------------|------------------|
| 日期 | Date | 日期選擇 Date Picker | ✅ 是 Yes | 自動帶入今天日期，可修改 Auto-fill today, editable |
| 客戶代碼 | Customer Code | 文字輸入 Text Input | ✅ 是 Yes | 支援自動完成 Supports autocomplete |
| 出貨地 | Destination | 文字輸入 Text Input | ✅ 是 Yes | 支援自動完成 Supports autocomplete |
| 備註 | Notes | 多行文字 Textarea | ❌ 否 No | 選填欄位 Optional field |

### 2. 照片分類項目 Photo Categories

拍照流程共有 8 個項目，依序進行：
The photo process has 8 items, completed in order:

| 順序 Order | 中文名稱 | English Name | 特殊處理 Special Handling |
|------------|----------|--------------|---------------------------|
| 1 | 轉換膠框 | Conversion Frame | ⚠️ 需先選擇「是/否」，選「是」才拍照，選「否」跳過 Choose Yes/No first |
| 2 | 盒子 | Box | 直接拍照 Direct photo |
| 3 | 海綿 | Sponge | 直接拍照 Direct photo |
| 4 | 泰維克紙 | Tyvek Paper | 直接拍照 Direct photo |
| 5 | 袋子 | Bag | 直接拍照 Direct photo |
| 6 | 盒子標籤 | Box Label | 直接拍照 Direct photo |
| 7 | 外袋標籤 | Outer Bag Label | 直接拍照 Direct photo |
| 8 | 外箱標籤 | Outer Box Label | 直接拍照 Direct photo |

### 3. 照片功能 Photo Features

- **多張照片** Multiple Photos: 每個項目可拍攝 1 張或多張照片
- **資訊浮水印** Info Watermark: 照片底部自動加入資訊欄，包含：
  - 日期時間 Date & Time
  - 客戶代碼 Customer Code
  - 出貨地 Destination
  - 項目名稱 Category Name

### 4. 資料儲存 Data Storage

- 使用瀏覽器內建的 **IndexedDB** 資料庫
- 資料儲存於本地裝置，無需伺服器
- 支援離線使用

### 5. 查詢功能 Search Function

可依據以下條件篩選記錄：
Filter records by:
- 日期範圍 Date Range (從...到... From...To...)
- 客戶代碼 Customer Code

### 6. 備份功能 Backup Functions

| 功能 Function | 格式 Format | 說明 Description |
|--------------|-------------|------------------|
| 完整備份 Full Backup | JSON | 包含所有資料與照片，可備份到電腦或轉移到其他裝置 |
| 匯入備份 Import | JSON | 從備份檔案還原資料 |

### 7. 離線使用 Offline Usage

- 首次載入後，可在無網路環境下使用
- 資料儲存於裝置本地，不需要網路
- 可將網頁添加到手機主畫面，像 App 一樣使用

---

## 頁面結構 Page Structure

```
📱 應用程式 App
│
├── 🏠 首頁 Home
│   ├── 資料輸入表單 Data Input Form
│   ├── [開始拍照] Start Photo Button
│   └── [查詢記錄] Search Records Button
│
├── 📷 拍照流程 Photo Process
│   ├── 進度條 Progress Bar (1/8 ~ 8/8)
│   ├── 項目名稱 Category Name (中英對照)
│   ├── 轉換膠框選擇 Conversion Choice (僅第1項)
│   ├── 照片預覽區 Photo Preview Grid
│   ├── [拍照/選擇照片] Take/Select Photo
│   └── [上一項] [下一項] Navigation Buttons
│
├── ✅ 完成確認 Complete Confirmation
│   ├── 資料摘要 Data Summary
│   ├── 照片摘要 Photo Summary
│   ├── [儲存記錄] Save Record Button
│   └── [取消] Cancel Button
│
├── 🔍 查詢頁面 Search Page
│   ├── 篩選條件 Filter Options
│   ├── [搜尋] Search Button
│   ├── [匯出Excel] Export Button
│   └── 搜尋結果列表 Results List
│
└── 📋 詳情頁面 Detail Page
    ├── 記錄資訊 Record Info
    ├── 各項目照片 Category Photos
    └── [刪除記錄] Delete Button
```

---

## 技術架構 Technical Architecture

```
┌─────────────────────────────────────────────────────┐
│                    前端 Frontend                     │
│  HTML5 + CSS3 + JavaScript (Vanilla)                │
├─────────────────────────────────────────────────────┤
│                    模組 Modules                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │   app.js    │ │  camera.js  │ │   db.js     │   │
│  │ 主程式邏輯  │ │ 相機處理    │ │ 資料庫操作  │   │
│  └─────────────┘ └─────────────┘ └─────────────┘   │
│  ┌─────────────┐                                    │
│  │  export.js  │                                    │
│  │ Excel 匯出  │                                    │
│  └─────────────┘                                    │
├─────────────────────────────────────────────────────┤
│                  資料儲存 Storage                    │
│                   IndexedDB                          │
│        ┌──────────────┐  ┌──────────────┐          │
│        │   records    │  │ suggestions  │          │
│        │   記錄資料   │  │ 自動完成建議 │          │
│        └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────┘
```

---

## 檔案結構 File Structure

```
photo-classifier/
├── index.html          # 主頁面 Main Page
├── manifest.json       # PWA 設定 PWA Configuration
├── css/
│   └── style.css       # 樣式表 Stylesheet
├── js/
│   ├── app.js          # 主程式邏輯 Main Logic
│   ├── camera.js       # 相機功能 Camera Functions
│   ├── db.js           # 資料庫 Database
│   └── export.js       # 匯出功能 Export Functions
└── README.md           # 說明文件 Documentation
```

---

## 部署方式 Deployment

### GitHub Pages（推薦 Recommended）

1. 建立 GitHub 帳號 Create GitHub account
2. 建立新的 Repository Create new repository
3. 上傳所有檔案 Upload all files
4. 前往 Settings > Pages
5. 選擇 Branch: main, Folder: / (root)
6. 儲存後獲得網址 Get URL after saving

網址格式 URL format: `https://[帳號名].github.io/[專案名]/`

### 本機測試 Local Testing

使用任何本地伺服器，例如：
Use any local server, for example:

```bash
# Python 3
python -m http.server 8080

# Node.js (需安裝 http-server)
npx http-server

# VS Code Live Server 擴充功能
```

然後在瀏覽器開啟 `http://localhost:8080`

---

## 使用說明 User Guide

### 新增記錄 Add New Record

1. 確認日期（自動帶入今天）
2. 輸入客戶代碼
3. 輸入出貨地
4. （選填）輸入備註
5. 點擊「開始拍照」
6. 依序完成 8 個項目的拍照：
   - 第 1 項「轉換膠框」需先選擇是否需要拍照
   - 其他項目直接拍照，每項可拍多張
7. 完成後確認摘要
8. 點擊「儲存記錄」

### 查詢記錄 Search Records

1. 點擊「查詢記錄」
2. 設定篩選條件（日期範圍、客戶代碼）
3. 點擊「搜尋」
4. 點擊任一記錄查看詳情


### 備份與還原 Backup & Restore

1. 進入查詢頁面
2. 點擊「完整備份」下載 JSON 檔案（包含所有記錄和照片）
3. 備份檔案可儲存到電腦或傳送到其他裝置
4. 在新裝置點擊「匯入備份」選擇 JSON 檔案還原資料

---

## 注意事項 Notes

1. **資料儲存於本地** Data stored locally
   - 資料只存在於當前裝置/瀏覽器
   - 清除瀏覽器資料會刪除所有記錄
   - 建議定期匯出備份

2. **相機權限** Camera Permission
   - 首次使用時瀏覽器會詢問相機權限
   - 需要允許才能使用拍照功能

3. **支援瀏覽器** Supported Browsers
   - Chrome (推薦)
   - Safari
   - Firefox
   - Edge

---

## 版本資訊 Version Info

- **版本 Version**: 1.0.0
- **建立日期 Created**: 2025-12-19
- **作者 Author**: Photo Classifier Team
