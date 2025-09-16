import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed'
}

@Entity('coupons')
export class Coupon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  code: string;

  @Column({ 
    type: 'enum', 
    enum: CouponType, 
    default: CouponType.PERCENTAGE 
  })
  type: CouponType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minimum_amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maximum_discount: number;

  @Column({ type: 'int', nullable: true })
  usage_limit: number;

  @Column({ type: 'int', default: 0 })
  used_count: number;

  @Column({ type: 'timestamp', nullable: true })
  expires_at: Date;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}