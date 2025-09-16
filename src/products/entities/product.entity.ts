import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Category } from './category.entity';
import { Review } from './review.entity';

export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DRAFT = 'draft'
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ default: 0 })
  stock: number;

  @Column('simple-array')
  images: string[];

  @Column('decimal', { precision: 3, scale: 2, default: 0 })
  rating: number;

  // Admin-specific fields
  @Column({ type: 'varchar', unique: true })
  sku: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight: number;

  @Column({ type: 'jsonb', nullable: true })
  dimensions: {
    length: number;
    width: number;
    height: number;
  };

  @Column({ 
    type: 'enum', 
    enum: ProductStatus, 
    default: ProductStatus.ACTIVE 
  })
  status: ProductStatus;

  @Column({ type: 'boolean', default: false })
  featured: boolean;

  @Column({ type: 'text', array: true, default: [] })
  tags: string[];

  @Column({ type: 'varchar', nullable: true })
  meta_title: string;

  @Column({ type: 'text', nullable: true })
  meta_description: string;

  @Column({ type: 'int', default: 0 })
  minimum_stock: number;

  @Column({ type: 'int', default: 0 })
  sales_count: number;

  @ManyToOne(() => Category, category => category.products)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column()
  category_id: string;

  @OneToMany(() => Review, review => review.product)
  reviews: Review[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}