import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { extname, join, resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { writeFile, unlink, readdir, stat } from 'fs/promises';
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

  async listar(tenantSlug: string) {
    const dir = join(this.uploadDir, tenantSlug);
    if (!existsSync(dir)) return [];
    const files = await readdir(dir);
    const results: Array<{ filename: string; url: string; size: number; lastModified: string }> = [];
    for (const filename of files) {
      const filepath = join(dir, filename);
      const fileStat = await stat(filepath);
      if (!fileStat.isFile()) continue;
      results.push({
        filename,
        url: `/uploads/${tenantSlug}/${filename}`,
        size: fileStat.size,
        lastModified: fileStat.mtime.toISOString(),
      });
    }
    return results.sort(
      (a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime(),
    );
  }
}
