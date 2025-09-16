import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";

@Entity("admin_audit_logs")
export class AdminAuditLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  admin_id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "admin_id" })
  admin: User;

  @Column({ type: "varchar" })
  action: string;

  @Column({ type: "varchar" })
  resource: string;

  @Column({ type: "uuid", nullable: true })
  resource_id: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, any>;

  @Column({ type: "varchar" })
  ip_address: string;

  @Column({ type: "varchar", nullable: true })
  user_agent: string;

  @Column({ type: "enum", enum: ["success", "failure"], default: "success" })
  status: string;

  @Column({ type: "text", nullable: true })
  error_message: string;

  @CreateDateColumn()
  created_at: Date;
}
