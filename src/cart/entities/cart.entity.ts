import { Entity, PrimaryGeneratedColumn, OneToMany, Column } from "typeorm";
import { CartItem } from "./cart-item.entity";

@Entity("carts")
export class Cart {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  user_id: string;

  @OneToMany(() => CartItem, (cartItem) => cartItem.cart, { cascade: true })
  items: CartItem[];

  @Column({ nullable: true })
  coupon_code: string;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  discount_amount: number;
}
