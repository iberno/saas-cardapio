import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { extname, join, resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { writeFile, unlink } from 'fs/promises';
import crypto from 'node:crypto';

@Injectable()
export class UploadService {
  private uploadDir = resolve(process.cwd(), 'uploads');

  async upload(file: Express.Multer.File, tenantSlug: string): Promise<{ url: string; filename: string }> {
    const dir = join(this.uploadDir, tenantSlug);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const ext = extname(file.originalname);
    const filename = `${crypto.randomUUID()}${ext}`;
    await writeFile(join(dir, filename), file.buffer);
    return { url: `/uploads/${tenantSlug}/${filename}`, filename };
  }

  async delete(filename: string, tenantSlug: string): Promise<void> {
    const filepath = resolve(join(this.uploadDir, tenantSlug, filename));
    if (!filepath.startsWith(this.uploadDir)) {
      throw new BadRequestException('Invalid file path');
    }
    if (!existsSync(filepath)) throw new NotFoundException('File not found');
    await unlink(filepath);
  }
}
