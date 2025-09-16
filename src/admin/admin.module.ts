import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminAuditLog } from './entities/admin-audit-log.entity';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Address } from '../users/entities/address.entity';
import { Product } from '../products/entities/product.entity';
import { Category } from '../products/entities/category.entity';
import { FileUpload } from '../common/entities/file-upload.entity';
import { AdminAuditService } from './services/admin-audit.service';
import { UserManagementService } from './services/user-management.service';
import { ProductManagementService } from './services/product-management.service';
import { OrderManagementService } from './services/order-management.service';
import { FileUploadService } from './services/file-upload.service';
import { DashboardService } from './services/dashboard.service';
import { AdminGuard } from './guards/admin.guard';
import { AdminAuditInterceptor } from './interceptors/admin-audit.interceptor';
import { AdminTestController } from './controllers/admin-test.controller';
import { UserManagementController } from './controllers/user-management.controller';
import { ProductManagementController } from './controllers/product-management.controller';
import { OrderManagementController } from './controllers/order-management.controller';
import { FileUploadController } from './controllers/file-upload.controller';
import { DashboardController } from './controllers/dashboard.controller';
import { CacheModule } from '../common/cache/cache.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminAuditLog, User, Order, OrderItem, Address, Product, Category, FileUpload]),
    CacheModule,
    AuthModule,
  ],
  controllers: [
    AdminTestController,
    UserManagementController,
    ProductManagementController,
    OrderManagementController,
    FileUploadController,
    DashboardController,
  ],
  providers: [
    AdminAuditService,
    UserManagementService,
    ProductManagementService,
    OrderManagementService,
    FileUploadService,
    DashboardService,
    AdminGuard,
    AdminAuditInterceptor,
  ],
  exports: [
    AdminAuditService,
    UserManagementService,
    ProductManagementService,
    OrderManagementService,
    FileUploadService,
    DashboardService,
    AdminGuard,
    AdminAuditInterceptor,
  ],
})
export class AdminModule {}
