import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Address } from "./address.entity";
import { Role } from "../../common/decorators/roles.decorator";
import { Order } from "../../orders/entities/order.entity";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({
    type: "enum",
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  // Admin-specific fields
  @Column({ type: "timestamp", nullable: true })
  last_login_at: Date;

  @Column({ type: "boolean", default: true })
  is_active: boolean;

  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => Address, (address) => address.user)
  addresses: Address[];

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
