'use client';

// Client-side image compression before upload
export async function compressImage(
  file: File,
  maxSizeMB: number = 4,
  maxWidthOrHeight: number = 2048
): Promise<File> {
  // Dynamic import to avoid SSR issues
  const imageCompression = (await import('browser-image-compression')).default;

  const options = {
    maxSizeMB,
    maxWidthOrHeight,
    useWebWorker: true,
    fileType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
    preserveExif: true,
  };

  try {
    const compressed = await imageCompression(file, options);
    return new File([compressed], file.name, { type: file.type });
  } catch {
    // Return original if compression fails
    return file;
  }
}

// Convert file to base64 with optional compression
export async function fileToCompressedBase64(
  file: File,
  compress: boolean = true
): Promise<{ base64: string; mimeType: string; compressedSize: number }> {
  let processedFile = file;

  if (compress && file.type.startsWith('image/')) {
    processedFile = await compressImage(file);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve({
        base64,
        mimeType: processedFile.type,
        compressedSize: processedFile.size,
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(processedFile);
  });
}

// Validate file before upload
export function validateUploadFile(
  file: File,
  maxSizeMB: number = 20
): { valid: boolean; error?: string } {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
  ];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPG, PNG, WebP, and PDF files are allowed' };
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { valid: false, error: `File size must be under ${maxSizeMB}MB` };
  }

  return { valid: true };
}
