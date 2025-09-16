import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

export enum FileUploadType {
  PRODUCT = "product",
  CATEGORY = "category",
  GENERAL = "general",
}

@Entity("file_uploads")
export class FileUpload {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar" })
  filename: string;

  @Column({ type: "varchar" })
  original_name: string;

  @Column({ type: "varchar" })
  url: string;

  @Column({ type: "varchar" })
  mime_type: string;

  @Column({ type: "int" })
  size: number;

  @Column({
    type: "enum",
    enum: FileUploadType,
    default: FileUploadType.GENERAL,
  })
  type: FileUploadType;

  @Column({ type: "uuid", nullable: true })
  uploaded_by: string;

  @CreateDateColumn()
  created_at: Date;
}
