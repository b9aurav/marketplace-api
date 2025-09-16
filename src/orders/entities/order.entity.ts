import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn, 
  OneToMany, 
  ManyToOne, 
  JoinColumn 
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { User } from '../../users/entities/user.entity';
import { Address } from '../../users/entities/address.entity';

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ nullable: true })
  tracking_number: string;

  @Column({ nullable: true })
  payment_method: string;

  @Column({ nullable: true })
  transaction_id: string;

  // Admin-specific payment and fee fields
  @Column({ type: 'jsonb', nullable: true })
  payment_method_details: Record<string, any>;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fees: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  net_amount: number;

  @Column({ type: 'text', nullable: true })
  admin_notes: string;

  @Column({ type: 'jsonb', nullable: true })
  shipping_details: Record<string, any>;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: string;

  @ManyToOne(() => Address)
  @JoinColumn({ name: 'address_id' })
  address: Address;

  @Column()
  address_id: string;

  @OneToMany(() => OrderItem, orderItem => orderItem.order, { cascade: true })
  items: OrderItem[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ nullable: true })
  coupon_code: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discount_amount: number;

  @Column({ type: 'jsonb', nullable: true })
  tracking_info: {
    location: string;
    estimated_delivery: Date;
    updates: { timestamp: Date; status: string; location: string }[];
  };
}