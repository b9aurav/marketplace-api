import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import * as path from 'path';
import * as fs from 'fs';
import { AppModule } from '../src/app.module';
import { FileUpload, FileUploadType } from '../src/common/entities/file-upload.entity';
import { User } from '../src/users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { AdminExceptionFilter } from '../src/admin/filters/admin-exception.filter';

describe('Admin File Upload (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let adminToken: string;
  let testImagePath: string;
  let uploadedFileId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Configure app
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    app.useGlobalFilters(new AdminExceptionFilter());

    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Create test image file
    testImagePath = path.join(__dirname, 'fixtures', 'test-image.jpg');
    await createTestImage(testImagePath);

    // Create admin user and get token
    adminToken = await createAdminUserAndGetToken();
  });

  afterAll(async () => {
    // Clean up test image
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
    }

    // Clean up test fixtures directory
    const fixturesDir = path.dirname(testImagePath);
    if (fs.existsSync(fixturesDir)) {
      fs.rmSync(fixturesDir, { recursive: true, force: true });
    }

    await app.close();
  });

  async function createTestImage(imagePath: string): Promise<void> {
    const dir = path.dirname(imagePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Create a simple test image (1x1 pixel JPEG)
    const jpegHeader = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
      0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
      0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
      0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
      0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x11, 0x08, 0x00, 0x01,
      0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
      0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4,
      0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C,
      0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F, 0x00, 0x8A, 0x00,
      0xFF, 0xD9
    ]);

    fs.writeFileSync(imagePath, jpegHeader);
  }

  async function createAdminUserAndGetToken(): Promise<string> {
    const adminUser = {
      id: 'admin-user-id',
      email: 'admin@test.com',
      role: 'admin',
      is_verified: true,
      is_active: true,
    };

    return jwtService.sign(adminUser);
  }

  describe('POST /api/admin/upload/image', () => {
    it('should upload image successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/admin/upload/image')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', testImagePath)
        .field('type', 'product')
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('filename');
      expect(response.body).toHaveProperty('original_name', 'test-image.jpg');
      expect(response.body).toHaveProperty('url');
      expect(response.body).toHaveProperty('mime_type', 'image/jpeg');
      expect(response.body).toHaveProperty('size');
      expect(response.body).toHaveProperty('type', 'product');
      expect(response.body).toHaveProperty('created_at');

      // Store the uploaded file ID for later tests
      uploadedFileId = response.body.id;
    });

    it('should upload image with default type', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/admin/upload/image')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', testImagePath)
        .expect(201);

      expect(response.body).toHaveProperty('type', 'general');
    });

    it('should reject upload without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/upload/image')
        .attach('file', testImagePath)
        .expect(401);
    });

    it('should reject upload without file', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/upload/image')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('type', 'product')
        .expect(400);
    });

    it('should reject invalid file type', async () => {
      // Create a text file
      const textFilePath = path.join(__dirname, 'fixtures', 'test.txt');
      fs.writeFileSync(textFilePath, 'This is a text file');

      try {
        await request(app.getHttpServer())
          .post('/api/admin/upload/image')
          .set('Authorization', `Bearer ${adminToken}`)
          .attach('file', textFilePath)
          .expect(400);
      } finally {
        // Clean up
        if (fs.existsSync(textFilePath)) {
          fs.unlinkSync(textFilePath);
        }
      }
    });

    it('should reject invalid upload type', async () => {
      await request(app.getHttpServer())
        .post('/api/admin/upload/image')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', testImagePath)
        .field('type', 'invalid-type')
        .expect(400);
    });
  });

  describe('GET /api/admin/upload/files', () => {
    it('should return paginated files list', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/upload/files')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 10);
      expect(response.body).toHaveProperty('total_pages');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return files with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/upload/files?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 5);
    });

    it('should filter files by type', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/upload/files?type=product')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      // All returned files should be of type 'product'
      response.body.data.forEach((file: any) => {
        expect(file.type).toBe('product');
      });
    });

    it('should search files by filename', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/admin/upload/files?search=test')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/upload/files')
        .expect(401);
    });

    it('should validate pagination parameters', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/upload/files?page=0')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      await request(app.getHttpServer())
        .get('/api/admin/upload/files?limit=0')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      await request(app.getHttpServer())
        .get('/api/admin/upload/files?limit=101')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('GET /api/admin/upload/files/:id', () => {
    it('should return file details', async () => {
      if (!uploadedFileId) {
        // Upload a file first if not available
        const uploadResponse = await request(app.getHttpServer())
          .post('/api/admin/upload/image')
          .set('Authorization', `Bearer ${adminToken}`)
          .attach('file', testImagePath)
          .field('type', 'general');
        
        uploadedFileId = uploadResponse.body.id;
      }

      const response = await request(app.getHttpServer())
        .get(`/api/admin/upload/files/${uploadedFileId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', uploadedFileId);
      expect(response.body).toHaveProperty('filename');
      expect(response.body).toHaveProperty('original_name');
      expect(response.body).toHaveProperty('url');
      expect(response.body).toHaveProperty('mime_type');
      expect(response.body).toHaveProperty('size');
      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('created_at');
    });

    it('should return 404 for non-existent file', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';
      
      await request(app.getHttpServer())
        .get(`/api/admin/upload/files/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer())
        .get(`/api/admin/upload/files/${uploadedFileId}`)
        .expect(401);
    });

    it('should validate UUID format', async () => {
      await request(app.getHttpServer())
        .get('/api/admin/upload/files/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('DELETE /api/admin/upload/image/:id', () => {
    let fileToDeleteId: string;

    beforeEach(async () => {
      // Upload a file to delete
      const uploadResponse = await request(app.getHttpServer())
        .post('/api/admin/upload/image')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', testImagePath)
        .field('type', 'general');
      
      fileToDeleteId = uploadResponse.body.id;
    });

    it('should delete file successfully', async () => {
      await request(app.getHttpServer())
        .delete(`/api/admin/upload/image/${fileToDeleteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      // Verify file is deleted
      await request(app.getHttpServer())
        .get(`/api/admin/upload/files/${fileToDeleteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent file', async () => {
      const nonExistentId = '123e4567-e89b-12d3-a456-426614174000';
      
      await request(app.getHttpServer())
        .delete(`/api/admin/upload/image/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/api/admin/upload/image/${fileToDeleteId}`)
        .expect(401);
    });

    it('should validate UUID format', async () => {
      await request(app.getHttpServer())
        .delete('/api/admin/upload/image/invalid-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });
  });

  describe('File Processing', () => {
    it('should handle different image formats', async () => {
      // Test with PNG (create a simple PNG)
      const pngPath = path.join(__dirname, 'fixtures', 'test.png');
      const pngHeader = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
        0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
        0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44,
        0xAE, 0x42, 0x60, 0x82
      ]);
      
      fs.writeFileSync(pngPath, pngHeader);

      try {
        const response = await request(app.getHttpServer())
          .post('/api/admin/upload/image')
          .set('Authorization', `Bearer ${adminToken}`)
          .attach('file', pngPath)
          .field('type', 'general')
          .expect(201);

        expect(response.body).toHaveProperty('mime_type', 'image/png');
      } finally {
        // Clean up
        if (fs.existsSync(pngPath)) {
          fs.unlinkSync(pngPath);
        }
      }
    });

    it('should handle metadata field', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/admin/upload/image')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', testImagePath)
        .field('type', 'product')
        .field('metadata', 'test metadata')
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('type', 'product');
    });
  });

  describe('Error Handling', () => {
    it('should handle file system errors gracefully', async () => {
      // This test would require mocking file system operations
      // For now, we'll test that the endpoint exists and handles basic validation
      await request(app.getHttpServer())
        .post('/api/admin/upload/image')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400); // Should fail due to missing file
    });

    it('should return proper error format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/admin/upload/image')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path');
    });
  });
});