import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Product } from '../src/products/entities/product.entity';

describe('ProductsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /products', () => {
    it('should return all products', async () => {
      const res = await request(app.getHttpServer())
        .get('/products')
        .expect(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return filtered products', async () => {
      const res = await request(app.getHttpServer())
        .get('/products')
        .query({ category: '123e4567-e89b-12d3-a456-426614174000', min_price: 10, max_price: 100, sort: 'price_asc', page: 1, limit: 10 })
        .expect(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /products/trending', () => {
    it('should return trending products', async () => {
      const res = await request(app.getHttpServer())
        .get('/products/trending')
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /products/:id', () => {
    it('should return product details', async () => {
      // First, get a product id
      const resAll = await request(app.getHttpServer())
        .get('/products')
        .expect(200);
      const products: Product[] = resAll.body.data;
      if (!products.length) return; // skip if no products
      const id = products[0].id;
      const res = await request(app.getHttpServer())
        .get(`/products/${id}`)
        .expect(200);
      expect(res.body).toHaveProperty('id', id);
    });

    it('should return 404 for non-existent product', async () => {
      await request(app.getHttpServer())
        .get('/products/123e4567-e89b-12d3-a456-426614174000')
        .expect(404);
    });
  });
}); 