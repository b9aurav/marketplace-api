import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

export enum NotificationSeverity {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  SUCCESS = "success",
}

@Entity("admin_notifications")
export class AdminNotification {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  type: string;

  @Column({ type: "varchar" })
  title: string;

  @Column({ type: "text" })
  message: string;

  @Column({ type: "jsonb", nullable: true })
  data: Record<string, any>;

  @Column({ type: "boolean", default: false })
  read: boolean;

  @Column({
    type: "enum",
    enum: NotificationSeverity,
    default: NotificationSeverity.INFO,
  })
  severity: NotificationSeverity;

  @CreateDateColumn()
  created_at: Date;
}
