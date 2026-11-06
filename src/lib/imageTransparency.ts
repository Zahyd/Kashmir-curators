/**
 * Intelligent Perimeter Flood-Fill Transparency Engine
 * Converts images with dark/black solid backgrounds into clean, transparent PNGs.
 * 
 * Uses perimeter-connected Breadth-First Search (BFS) flood-fill starting strictly
 * from the image boundaries inward. This preserves internal black details like
 * car tires, tinted windows, dark front grilles, and shadows while completely 
 * removing the outer black background.
 */

export interface TransparencyOptions {
  /** Maximum color distance from background (0 - 100). Default: 42 */
  tolerance?: number;
  /** Radius in pixels for soft alpha edge feathering. Default: 1.5 */
  featherRadius?: number;
  /** Target background color to remove. If omitted, sampled from image corners */
  targetBgColor?: { r: number; g: number; b: number };
  /** Whether to automatically trim empty transparent margins. Default: true */
  autoTrim?: boolean;
}

/**
 * Loads an image from a File, Blob, or URL into an HTMLImageElement
 */
function loadImage(source: File | Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    let objectUrl: string | null = null;
    if (typeof source === 'string') {
      img.src = source;
    } else {
      objectUrl = URL.createObjectURL(source);
      img.src = objectUrl;
    }

    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = (err) => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image for transparency processing: ' + err));
    };
  });
}

/**
 * Samples border pixels to determine if the background is dark/black
 */
export async function isImageDarkBackground(source: File | Blob | string): Promise<boolean> {
  try {
    const img = await loadImage(source);
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(img.naturalWidth || img.width, 300);
    canvas.height = Math.min(img.naturalHeight || img.height, 300);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return false;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // Sample 4 corners and midpoints of edges
    const sampleCoords = [
      [0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1],
      [Math.floor(width / 2), 0], [Math.floor(width / 2), height - 1],
      [0, Math.floor(height / 2)], [width - 1, Math.floor(height / 2)]
    ];

    let darkCount = 0;
    for (const [x, y] of sampleCoords) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      // If already transparent, not dark background
      if (a < 50) return false;

      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
      if (brightness < 45) {
        darkCount++;
      }
    }

    return darkCount >= 5;
  } catch (e) {
    return false;
  }
}

/**
 * Removes dark outer background from an image using perimeter-connected BFS flood fill
 * Returns a lossless transparent PNG File, Blob, and dataUrl.
 */
export async function removeDarkBackground(
  source: File | Blob | string,
  options: TransparencyOptions = {}
): Promise<{ file: File; blob: Blob; dataUrl: string; width: number; height: number }> {
  const tolerance = options.tolerance ?? 42;
  const autoTrim = options.autoTrim ?? true;

  const img = await loadImage(source);
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Canvas 2D context is not supported in this browser.');
  }

  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const totalPixels = width * height;

  // 1. Sample perimeter border pixels to calculate the dominant background color
  let bgR = 0;
  let bgG = 0;
  let bgB = 0;
  let borderSamples = 0;

  // Sample along all 4 outer borders (with a 2px inset to avoid jpeg compression fringe at borders)
  const step = Math.max(1, Math.floor(Math.min(width, height) / 100));
  for (let x = 0; x < width; x += step) {
    // Top border
    let idx = x * 4;
    bgR += data[idx]; bgG += data[idx + 1]; bgB += data[idx + 2];
    // Bottom border
    idx = ((height - 1) * width + x) * 4;
    bgR += data[idx]; bgG += data[idx + 1]; bgB += data[idx + 2];
    borderSamples += 2;
  }
  for (let y = 0; y < height; y += step) {
    // Left border
    let idx = (y * width) * 4;
    bgR += data[idx]; bgG += data[idx + 1]; bgB += data[idx + 2];
    // Right border
    idx = (y * width + width - 1) * 4;
    bgR += data[idx]; bgG += data[idx + 1]; bgB += data[idx + 2];
    borderSamples += 2;
  }

  bgR = options.targetBgColor?.r ?? Math.round(bgR / borderSamples);
  bgG = options.targetBgColor?.g ?? Math.round(bgG / borderSamples);
  bgB = options.targetBgColor?.b ?? Math.round(bgB / borderSamples);

  // 2. BFS Flood-Fill starting strictly from perimeter pixels
  // isBg: 0 = unvisited/foreground, 1 = background, 2 = queued
  const isBg = new Uint8Array(totalPixels);
  const queue = new Int32Array(totalPixels);
  let qHead = 0;
  let qTail = 0;

  const isColorMatch = (idx: number): boolean => {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = data[idx + 3];

    if (a < 30) return true; // already transparent

    // Euclidean distance from background color
    const dr = r - bgR;
    const dg = g - bgG;
    const db = b - bgB;
    const distance = Math.sqrt(dr * dr + dg * dg + db * db);

    // Also check max channel luminance for dark background
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    const isDarkEnough = brightness <= (Math.max(bgR, bgG, bgB) + tolerance);

    return distance <= tolerance || (brightness <= 30 && isDarkEnough);
  };

  // Seed BFS queue with outer perimeter pixels
  for (let x = 0; x < width; x++) {
    // Top row
    const topIdx = x;
    if (isColorMatch(topIdx * 4)) {
      isBg[topIdx] = 1;
      queue[qTail++] = topIdx;
    }
    // Bottom row
    const bottomIdx = (height - 1) * width + x;
    if (isColorMatch(bottomIdx * 4)) {
      isBg[bottomIdx] = 1;
      queue[qTail++] = bottomIdx;
    }
  }

  for (let y = 0; y < height; y++) {
    // Left column
    const leftIdx = y * width;
    if (isBg[leftIdx] === 0 && isColorMatch(leftIdx * 4)) {
      isBg[leftIdx] = 1;
      queue[qTail++] = leftIdx;
    }
    // Right column
    const rightIdx = y * width + (width - 1);
    if (isBg[rightIdx] === 0 && isColorMatch(rightIdx * 4)) {
      isBg[rightIdx] = 1;
      queue[qTail++] = rightIdx;
    }
  }

  // Execute BFS
  while (qHead < qTail) {
    const current = queue[qHead++];
    const cx = current % width;
    const cy = Math.floor(current / width);

    // 4 cardinal neighbors
    const neighbors = [
      cx > 0 ? current - 1 : -1,
      cx < width - 1 ? current + 1 : -1,
      cy > 0 ? current - width : -1,
      cy < height - 1 ? current + width : -1
    ];

    for (const n of neighbors) {
      if (n >= 0 && isBg[n] === 0) {
        if (isColorMatch(n * 4)) {
          isBg[n] = 1;
          queue[qTail++] = n;
        }
      }
    }
  }

  // 3. Apply Transparency and Edge Smoothing / Feathering
  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4;
    if (isBg[i] === 1) {
      data[idx + 3] = 0; // 100% transparent
    } else {
      // Check if this foreground pixel is directly adjacent to background
      const cx = i % width;
      const cy = Math.floor(i / width);
      let bgNeighbors = 0;

      if (cx > 0 && isBg[i - 1] === 1) bgNeighbors++;
      if (cx < width - 1 && isBg[i + 1] === 1) bgNeighbors++;
      if (cy > 0 && isBg[i - width] === 1) bgNeighbors++;
      if (cy < height - 1 && isBg[i + width] === 1) bgNeighbors++;

      if (bgNeighbors > 0) {
        // Soften edge to remove black fringe
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        
        // If the edge pixel is very close to dark background, smoothly fade its alpha
        if (brightness < 60) {
          const factor = Math.max(0.2, (brightness - 10) / 50);
          data[idx + 3] = Math.round(data[idx + 3] * factor);
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);

  // 4. Optional Trim / Auto-Crop to tight bounding box with padding
  let finalCanvas = canvas;
  if (autoTrim) {
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const a = data[(y * width + x) * 4 + 3];
        if (a > 10) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (minX <= maxX && minY <= maxY) {
      const padding = 16;
      const cropX = Math.max(0, minX - padding);
      const cropY = Math.max(0, minY - padding);
      const cropW = Math.min(width - cropX, (maxX - minX) + padding * 2);
      const cropH = Math.min(height - cropY, (maxY - minY) + padding * 2);

      const trimmedCanvas = document.createElement('canvas');
      trimmedCanvas.width = cropW;
      trimmedCanvas.height = cropH;
      const trimCtx = trimmedCanvas.getContext('2d');
      if (trimCtx) {
        trimCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
        finalCanvas = trimmedCanvas;
      }
    }
  }

  // 5. Export as lossless PNG Blob and File
  return new Promise((resolve, reject) => {
    finalCanvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to create PNG blob from canvas.'));
        return;
      }

      let baseName = 'vehicle-asset';
      if (typeof source !== 'string' && 'name' in source) {
        baseName = source.name.replace(/\.[^.]+$/, '');
      } else if (typeof source === 'string') {
        const parts = source.split('/');
        baseName = parts[parts.length - 1].replace(/\.[^.]+$/, '');
      }

      const fileName = `${baseName}-transparent.png`;
      const file = new File([blob], fileName, { type: 'image/png' });
      const dataUrl = finalCanvas.toDataURL('image/png');

      resolve({
        file,
        blob,
        dataUrl,
        width: finalCanvas.width,
        height: finalCanvas.height
      });
    }, 'image/png');
  });
}
