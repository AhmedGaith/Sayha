/**
 * Resize and compress a File to JPEG for upload (keeps payload smaller).
 * @param {File} file
 * @param {{ maxWidth?: number, quality?: number }} opts
 * @returns {Promise<{ base64: string, mimeType: string }>}
 */
export function compressImageToJpeg(file, opts = {}) {
  const maxWidth = opts.maxWidth ?? 1280;
  const quality = opts.quality ?? 0.82;

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("No canvas"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        const comma = dataUrl.indexOf(",");
        const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
        resolve({ base64, mimeType: "image/jpeg" });
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    img.src = url;
  });
}
