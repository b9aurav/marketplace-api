import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Product } from "./product.entity";
import { User } from "../../users/entities/user.entity";

@Entity("reviews")
export class Review {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column("text")
  content: string;

  @Column("int")
  rating: number;

  @ManyToOne(() => Product, (product) => product.reviews)
  @JoinColumn({ name: "product_id" })
  product: Product;

  @Column()
  product_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column()
  user_id: string;

  @CreateDateColumn()
  created_at: Date;
}
