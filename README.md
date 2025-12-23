# 📦 出貨照片資料庫 (Export Photo Database)

![Version](https://img.shields.io/badge/version-1.7-blue.svg)
![Status](https://img.shields.io/badge/status-stable-green.svg)

本系統專為出貨流程中的照片管理設計，整合了 IndexedDB 本地資料庫與 PWA 技術，確保在各種環境下都能高效記錄與查詢。

## 📖 操作使用手冊 (User Manual)

### 1. 核心流程
*   **進入系統**：預設進入「資料庫」，可快速搜尋歷史記錄。
*   **建立新案**：點擊右上角 **📸** 圖示開始新的拍照流程。
*   **拍照與備註**：在 8 個標準步驟中，除了拍照，還可以針對每個項目輸入包材規格或特殊備註。
*   **編輯修正**：
    *   **快速編輯**：在詳情頁針對單一類別點擊「✏️ 編輯項目」可直接修改。
    *   **全域編輯**：詳情頁右上角 ✏️ 可修改主表資訊。

### 2. 資料庫管理
*   **搜尋**：支援「客戶代碼」與「出貨地」關鍵字查詢。
*   **備份 (💾)**：
    *   點擊此圖示可選擇 **匯出 (Export)** 或 **匯入 (Import)**。
    *   建議每週固定匯出一次 JSON 檔存放在雲端，以防手機遺失。
*   **設定 (⚙️)**：
    *   自定義拍照類別標題與順序。

### 3. 技術點
*   **PWA 支援**：支援離線使用，右下角顯示版本號（目前 v1.7）。
*   **自動大寫**：客戶代碼與出貨地自動轉換為英文大寫。
*   **照片檢視**：支援全螢幕放大功能，並在照片上自動生成浮水印。

## 📥 安裝與部署
1. 推送代碼至 GitHub 會自動透過 GitHub Pages 部署。
2. 手機開啟網址後，點選瀏覽器選單中的「加入主畫面」即可完成 App 化安裝。

## 🛠 技術棧
*   Frontend: Vanilla JS, CSS3, HTML5
*   Storage: IndexedDB (Database), LocalStorage (Settings)
*   PWA: Service Worker, Manifest.json

---
*Created by Antigravity AI for Shipping Optimization.*
