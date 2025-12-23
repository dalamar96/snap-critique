export const createPreviewImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const maximizeSize = 1024; // Max dimension for preview
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maximizeSize) {
                    height *= maximizeSize / width;
                    width = maximizeSize;
                }
            } else {
                if (height > maximizeSize) {
                    width *= maximizeSize / height;
                    height = maximizeSize;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to create blob'));
                }
            }, 'image/jpeg', 0.8); // 80% quality JPEG
        };
        img.onerror = (e) => reject(e);
    });
};
