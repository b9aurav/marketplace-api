import { 
  IsString, 
  IsNumber, 
  IsArray, 
  IsUUID, 
  IsOptional, 
  IsEnum, 
  IsBoolean, 
  IsPositive, 
  Min, 
  MinLength,
  IsDateString,
  ValidateNested,
  IsObject
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ProductStatus } from '../../products/entities/product.entity';

// Query DTOs
export class GetProductsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Search by product name, SKU, or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiPropertyOptional({ enum: ProductStatus, description: 'Filter by product status' })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ description: 'Filter by featured products' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ description: 'Filter by minimum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min_price?: number;

  @ApiPropertyOptional({ description: 'Filter by maximum price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_price?: number;

  @ApiPropertyOptional({ description: 'Filter by minimum stock' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min_stock?: number;

  @ApiPropertyOptional({ description: 'Filter by maximum stock' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_stock?: number;

  @ApiPropertyOptional({ description: 'Filter products created from this date' })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional({ description: 'Filter products created to this date' })
  @IsOptional()
  @IsDateString()
  date_to?: string;

  @ApiPropertyOptional({ 
    enum: ['name', 'price', 'stock', 'created_at', 'sales_count', 'rating'],
    description: 'Sort by field' 
  })
  @IsOptional()
  @IsEnum(['name', 'price', 'stock', 'created_at', 'sales_count', 'rating'])
  sort_by?: string = 'created_at';

  @ApiPropertyOptional({ 
    enum: ['asc', 'desc'],
    description: 'Sort order' 
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sort_order?: string = 'desc';
}

// Product dimensions DTO
export class ProductDimensionsDto {
  @ApiProperty({ description: 'Length in cm' })
  @IsNumber()
  @IsPositive()
  length: number;

  @ApiProperty({ description: 'Width in cm' })
  @IsNumber()
  @IsPositive()
  width: number;

  @ApiProperty({ description: 'Height in cm' })
  @IsNumber()
  @IsPositive()
  height: number;
}

// Create product DTO for admin
export class AdminCreateProductDto {
  @ApiProperty({ description: 'Product name' })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({ description: 'Product description' })
  @IsString()
  @MinLength(10)
  description: string;

  @ApiProperty({ description: 'Product price' })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({ description: 'Stock quantity' })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiProperty({ description: 'Product images URLs', type: [String] })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty({ description: 'Category ID' })
  @IsUUID()
  category_id: string;

  @ApiProperty({ description: 'Product SKU' })
  @IsString()
  sku: string;

  @ApiPropertyOptional({ description: 'Product weight in kg' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  weight?: number;

  @ApiPropertyOptional({ description: 'Product dimensions', type: ProductDimensionsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductDimensionsDto)
  dimensions?: ProductDimensionsDto;

  @ApiPropertyOptional({ enum: ProductStatus, description: 'Product status' })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus = ProductStatus.ACTIVE;

  @ApiPropertyOptional({ description: 'Is product featured' })
  @IsOptional()
  @IsBoolean()
  featured?: boolean = false;

  @ApiPropertyOptional({ description: 'Product tags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[] = [];

  @ApiPropertyOptional({ description: 'SEO meta title' })
  @IsOptional()
  @IsString()
  meta_title?: string;

  @ApiPropertyOptional({ description: 'SEO meta description' })
  @IsOptional()
  @IsString()
  meta_description?: string;

  @ApiPropertyOptional({ description: 'Minimum stock threshold' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minimum_stock?: number = 0;
}

// Update product DTO for admin
export class AdminUpdateProductDto {
  @ApiPropertyOptional({ description: 'Product name' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @ApiPropertyOptional({ description: 'Product description' })
  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @ApiPropertyOptional({ description: 'Product price' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;

  @ApiPropertyOptional({ description: 'Stock quantity' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ description: 'Product images URLs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiPropertyOptional({ description: 'Product SKU' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ description: 'Product weight in kg' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  weight?: number;

  @ApiPropertyOptional({ description: 'Product dimensions', type: ProductDimensionsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProductDimensionsDto)
  dimensions?: ProductDimensionsDto;

  @ApiPropertyOptional({ enum: ProductStatus, description: 'Product status' })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ description: 'Is product featured' })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ description: 'Product tags', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'SEO meta title' })
  @IsOptional()
  @IsString()
  meta_title?: string;

  @ApiPropertyOptional({ description: 'SEO meta description' })
  @IsOptional()
  @IsString()
  meta_description?: string;

  @ApiPropertyOptional({ description: 'Minimum stock threshold' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minimum_stock?: number;
}

// Update inventory DTO
export class UpdateInventoryDto {
  @ApiProperty({ description: 'New stock quantity' })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({ description: 'Minimum stock threshold' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minimum_stock?: number;

  @ApiPropertyOptional({ description: 'Reason for inventory update' })
  @IsOptional()
  @IsString()
  reason?: string;
}

// Bulk action DTO
export class BulkProductActionDto {
  @ApiProperty({ description: 'Product IDs to perform action on', type: [String] })
  @IsArray()
  @IsUUID(undefined, { each: true })
  product_ids: string[];

  @ApiProperty({ 
    enum: ['activate', 'deactivate', 'delete', 'feature', 'unfeature'],
    description: 'Action to perform' 
  })
  @IsEnum(['activate', 'deactivate', 'delete', 'feature', 'unfeature'])
  action: string;

  @ApiPropertyOptional({ description: 'Additional data for the action' })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}

// Export DTO
export class ExportProductsDto {
  @ApiPropertyOptional({ 
    enum: ['csv', 'xlsx'],
    description: 'Export format' 
  })
  @IsOptional()
  @IsEnum(['csv', 'xlsx'])
  format?: string = 'csv';

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiPropertyOptional({ enum: ProductStatus, description: 'Filter by product status' })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ description: 'Filter by featured products' })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ description: 'Filter products created from this date' })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional({ description: 'Filter products created to this date' })
  @IsOptional()
  @IsDateString()
  date_to?: string;

  @ApiPropertyOptional({ 
    description: 'Fields to include in export',
    type: [String]
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fields?: string[];
}

// Response DTOs
export class ProductDetailsDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  stock: number;

  @ApiProperty()
  images: string[];

  @ApiProperty()
  rating: number;

  @ApiProperty()
  sku: string;

  @ApiProperty()
  weight: number;

  @ApiProperty()
  dimensions: ProductDimensionsDto;

  @ApiProperty()
  status: ProductStatus;

  @ApiProperty()
  featured: boolean;

  @ApiProperty()
  tags: string[];

  @ApiProperty()
  meta_title: string;

  @ApiProperty()
  meta_description: string;

  @ApiProperty()
  minimum_stock: number;

  @ApiProperty()
  sales_count: number;

  @ApiProperty()
  category_id: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  // Additional computed fields
  @ApiProperty()
  low_stock: boolean;

  @ApiProperty()
  category_name?: string;

  @ApiProperty()
  total_reviews?: number;
}

export class ProductAnalyticsDto {
  @ApiProperty()
  total_products: number;

  @ApiProperty()
  active_products: number;

  @ApiProperty()
  inactive_products: number;

  @ApiProperty()
  draft_products: number;

  @ApiProperty()
  featured_products: number;

  @ApiProperty()
  low_stock_products: number;

  @ApiProperty()
  out_of_stock_products: number;

  @ApiProperty()
  total_inventory_value: number;

  @ApiProperty()
  average_price: number;

  @ApiProperty()
  top_selling_products: Array<{
    id: string;
    name: string;
    sales_count: number;
    revenue: number;
  }>;

  @ApiProperty()
  category_distribution: Array<{
    category_id: string;
    category_name: string;
    product_count: number;
    percentage: number;
  }>;

  @ApiProperty()
  stock_distribution: {
    in_stock: number;
    low_stock: number;
    out_of_stock: number;
  };

  @ApiProperty()
  price_distribution: {
    under_100: number;
    between_100_500: number;
    between_500_1000: number;
    over_1000: number;
  };
}

export class ExportResultDto {
  @ApiProperty()
  export_id: string;

  @ApiProperty()
  status: 'processing' | 'completed' | 'failed';

  @ApiProperty()
  download_url?: string;

  @ApiProperty()
  total_records?: number;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  expires_at?: Date;
}

export class PaginatedProductsDto {
  @ApiProperty({ type: [ProductDetailsDto] })
  data: ProductDetailsDto[];

  @ApiProperty()
  pagination: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}