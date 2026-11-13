import path from 'path';
import fs from 'fs';

export interface DocumentUploadResult {
  fileUrl: string;
  filename: string;
  storageProvider: 'NEON_OBJECT_STORAGE' | 'LOCAL_SECURE_VAULT';
  sizeBytes: number;
  uploadedAt: string;
}

export const vaultStorageService = {
  async saveDocument(
    category: 'AGENT_LICENSE' | 'DRIVER_COMPLIANCE' | 'HOTEL_VOUCHER',
    filename: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<DocumentUploadResult> {
    const s3Endpoint = process.env.NEON_STORAGE_ENDPOINT;
    const bucketName = process.env.NEON_STORAGE_BUCKET || 'kashmir-connect-vault';
    const accessKey = process.env.NEON_STORAGE_ACCESS_KEY;
    const secretKey = process.env.NEON_STORAGE_SECRET_KEY;

    const cleanFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // If Neon Object Storage S3 credentials are configured, upload to S3/Neon Bucket
    if (s3Endpoint && accessKey && secretKey) {
      try {
        const targetUrl = `${s3Endpoint.replace(/\/$/, '')}/${bucketName}/${category}/${cleanFilename}`;
        
        const uploadRes = await fetch(targetUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': mimeType,
            'Authorization': `Bearer ${accessKey}`
          },
          body: new Uint8Array(buffer)
        });

        if (uploadRes.ok) {
          return {
            fileUrl: targetUrl,
            filename: cleanFilename,
            storageProvider: 'NEON_OBJECT_STORAGE',
            sizeBytes: buffer.length,
            uploadedAt: new Date().toISOString()
          };
        }
      } catch (err) {
        console.warn('Neon Object Storage upload failed, falling back to local secure vault:', err);
      }
    }

    // High-Security Local Vault Fallback
    const uploadDir = path.join(process.cwd(), 'uploads', 'vault', category);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, cleanFilename);
    fs.writeFileSync(filePath, buffer);

    return {
      fileUrl: `/api/vault/file/${category}/${cleanFilename}`,
      filename: cleanFilename,
      storageProvider: 'LOCAL_SECURE_VAULT',
      sizeBytes: buffer.length,
      uploadedAt: new Date().toISOString()
    };
  }
};
