import { SystemSettings, SettingType } from './system-settings.entity';
import { Coupon, CouponType } from './coupon.entity';
import { AdminNotification, NotificationSeverity } from './admin-notification.entity';
import { FileUpload, FileUploadType } from './file-upload.entity';
import { User } from '../../users/entities/user.entity';
import { Product, ProductStatus } from '../../products/entities/product.entity';
import { Order } from '../../orders/entities/order.entity';

describe('Enhanced Entity Models', () => {
  describe('SystemSettings Entity', () => {
    it('should create a SystemSettings instance', () => {
      const settings = new SystemSettings();
      settings.key = 'test_key';
      settings.value = { test: 'value' };
      settings.type = SettingType.OBJECT;
      
      expect(settings).toBeInstanceOf(SystemSettings);
      expect(settings.key).toBe('test_key');
      expect(settings.type).toBe(SettingType.OBJECT);
    });
  });

  describe('Coupon Entity', () => {
    it('should create a Coupon instance', () => {
      const coupon = new Coupon();
      coupon.code = 'SAVE10';
      coupon.type = CouponType.PERCENTAGE;
      coupon.value = 10;
      
      expect(coupon).toBeInstanceOf(Coupon);
      expect(coupon.code).toBe('SAVE10');
      expect(coupon.type).toBe(CouponType.PERCENTAGE);
    });
  });

  describe('AdminNotification Entity', () => {
    it('should create an AdminNotification instance', () => {
      const notification = new AdminNotification();
      notification.type = 'system_alert';
      notification.title = 'Test Alert';
      notification.message = 'This is a test alert';
      notification.severity = NotificationSeverity.WARNING;
      
      expect(notification).toBeInstanceOf(AdminNotification);
      expect(notification.severity).toBe(NotificationSeverity.WARNING);
    });
  });

  describe('FileUpload Entity', () => {
    it('should create a FileUpload instance', () => {
      const fileUpload = new FileUpload();
      fileUpload.filename = 'test.jpg';
      fileUpload.original_name = 'original_test.jpg';
      fileUpload.type = FileUploadType.PRODUCT;
      
      expect(fileUpload).toBeInstanceOf(FileUpload);
      expect(fileUpload.type).toBe(FileUploadType.PRODUCT);
    });
  });

  describe('Enhanced User Entity', () => {
    it('should have admin-specific fields', () => {
      const user = new User();
      user.email = 'admin@test.com';
      user.name = 'Admin User';
      user.is_active = true;
      user.metadata = { role_permissions: ['read', 'write'] };
      
      expect(user).toBeInstanceOf(User);
      expect(user.is_active).toBe(true);
      expect(user.metadata).toEqual({ role_permissions: ['read', 'write'] });
    });
  });

  describe('Enhanced Product Entity', () => {
    it('should have admin-specific fields', () => {
      const product = new Product();
      product.name = 'Test Product';
      product.sku = 'TEST-001';
      product.status = ProductStatus.ACTIVE;
      product.featured = true;
      product.tags = ['electronics', 'gadgets'];
      product.weight = 1.5;
      product.dimensions = { length: 10, width: 5, height: 3 };
      
      expect(product).toBeInstanceOf(Product);
      expect(product.status).toBe(ProductStatus.ACTIVE);
      expect(product.featured).toBe(true);
      expect(product.tags).toEqual(['electronics', 'gadgets']);
    });
  });

  describe('Enhanced Order Entity', () => {
    it('should have admin-specific fields', () => {
      const order = new Order();
      order.total = 100.00;
      order.fees = 5.00;
      order.net_amount = 95.00;
      order.admin_notes = 'Special handling required';
      order.payment_method_details = { card_type: 'visa', last_four: '1234' };
      order.shipping_details = { carrier: 'UPS', service: 'Ground' };
      
      expect(order).toBeInstanceOf(Order);
      expect(order.fees).toBe(5.00);
      expect(order.net_amount).toBe(95.00);
      expect(order.admin_notes).toBe('Special handling required');
    });
  });
});