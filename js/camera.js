/**
 * Camera Module
 * 處理相機和照片相關操作
 */

/**
 * 取得照片類別（動態從資料庫取得）
 */
function getPhotoCategories() {
    return PhotoDB.getCategories();
}

/**
 * 在圖片上添加資訊浮水印
 */
async function addWatermark(base64Image, info) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const fontSize = Math.max(16, Math.floor(img.width / 30));
            const padding = fontSize * 0.8;
            const lineHeight = fontSize * 1.4;

            const lines = [
                `${info.date} ${info.time}`,
                `${info.customer}`,
                `${info.destination}`,
                `${info.category}`
            ];

            const bgHeight = (lines.length * lineHeight) + (padding * 2);
            const bgY = img.height - bgHeight;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, bgY, img.width, bgHeight);

            ctx.font = `bold ${fontSize}px "Noto Sans TC", sans-serif`;
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';

            lines.forEach((line, index) => {
                const y = bgY + padding + (index * lineHeight) + fontSize * 0.8;
                ctx.fillText(line, padding, y);
            });

            resolve(canvas.toDataURL('image/jpeg', 0.9));
        };
        img.src = base64Image;
    });
}

/**
 * 處理選擇的照片檔案
 */
async function processPhotoFiles(files, info, categoryName) {
    const processedPhotos = [];

    for (const file of files) {
        try {
            let base64 = await PhotoDB.fileToBase64(file);
            base64 = await PhotoDB.compressImage(base64, 1200, 0.85);

            const now = new Date();
            const watermarkInfo = {
                date: info.date,
                time: now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
                customer: info.customer,
                destination: info.destination,
                category: categoryName
            };

            const watermarkedImage = await addWatermark(base64, watermarkInfo);

            processedPhotos.push({
                data: watermarkedImage,
                timestamp: now.toISOString(),
                originalName: file.name
            });
        } catch (error) {
            console.error('Error processing photo:', error);
        }
    }

    return processedPhotos;
}

/**
 * 建立照片預覽元素
 */
function createPhotoPreviewElement(photoData, index, onDelete) {
    const div = document.createElement('div');
    div.className = 'photo-preview-item';
    div.innerHTML = `
        <img src="${photoData.data}" alt="Photo ${index + 1}">
        <button class="delete-btn" type="button" title="Delete">✕</button>
    `;

    div.querySelector('img').addEventListener('click', () => {
        showPhotoViewer(photoData.data);
    });

    div.querySelector('.delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        onDelete(index);
        div.remove();
    });

    return div;
}

/**
 * 顯示照片檢視器
 */
function showPhotoViewer(imageSrc) {
    const viewer = document.getElementById('photo-viewer');
    const viewerImage = document.getElementById('viewer-image');

    viewerImage.src = imageSrc;
    viewer.classList.remove('hidden');

    const closeViewer = () => {
        viewer.classList.add('hidden');
    };

    document.getElementById('viewer-close').onclick = closeViewer;
    viewer.onclick = (e) => {
        if (e.target === viewer) closeViewer();
    };
}

window.PhotoCamera = {
    getCategories: getPhotoCategories,
    addWatermark,
    processPhotoFiles,
    createPhotoPreviewElement,
    showPhotoViewer
};
