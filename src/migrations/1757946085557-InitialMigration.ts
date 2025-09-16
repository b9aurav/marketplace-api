import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1757946085557 implements MigrationInterface {
  name = "InitialMigration1757946085557";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "addresses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "label" character varying NOT NULL, "street" character varying NOT NULL, "city" character varying NOT NULL, "state" character varying NOT NULL, "zip" character varying NOT NULL, "is_default" boolean NOT NULL DEFAULT false, "user_id" uuid NOT NULL, CONSTRAINT "PK_745d8f43d3af10ab8247465e450" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "image" character varying, "slug" character varying, "is_active" boolean NOT NULL DEFAULT true, "sort_order" integer NOT NULL DEFAULT '0', "parent_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "reviews" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content" text NOT NULL, "rating" integer NOT NULL, "product_id" uuid NOT NULL, "user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_231ae565c273ee700b283f15c1d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."products_status_enum" AS ENUM('active', 'inactive', 'draft')`,
    );
    await queryRunner.query(
      `CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" text NOT NULL, "price" numeric(10,2) NOT NULL, "stock" integer NOT NULL DEFAULT '0', "images" text NOT NULL, "rating" numeric(3,2) NOT NULL DEFAULT '0', "sku" character varying NOT NULL, "weight" numeric(10,2), "dimensions" jsonb, "status" "public"."products_status_enum" NOT NULL DEFAULT 'active', "featured" boolean NOT NULL DEFAULT false, "tags" text array NOT NULL DEFAULT '{}', "meta_title" character varying, "meta_description" text, "minimum_stock" integer NOT NULL DEFAULT '0', "sales_count" integer NOT NULL DEFAULT '0', "category_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c44ac33a05b144dd0d9ddcf9327" UNIQUE ("sku"), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "order_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quantity" integer NOT NULL, "price" numeric(10,2) NOT NULL, "order_id" uuid NOT NULL, "product_id" uuid NOT NULL, "product_name" character varying NOT NULL, CONSTRAINT "PK_005269d8574e6fac0493715c308" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."orders_status_enum" AS ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')`,
    );
    await queryRunner.query(
      `CREATE TABLE "orders" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."orders_status_enum" NOT NULL DEFAULT 'pending', "total" numeric(10,2) NOT NULL, "tracking_number" character varying, "payment_method" character varying, "transaction_id" character varying, "payment_method_details" jsonb, "fees" numeric(10,2) NOT NULL DEFAULT '0', "net_amount" numeric(10,2) NOT NULL DEFAULT '0', "admin_notes" text, "shipping_details" jsonb, "user_id" uuid NOT NULL, "address_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "coupon_code" character varying, "discount_amount" numeric(10,2) NOT NULL DEFAULT '0', "tracking_info" jsonb, CONSTRAINT "PK_710e2d4957aa5878dfe94e4ac2f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "name" character varying NOT NULL, "phone" character varying, "role" "public"."users_role_enum" NOT NULL DEFAULT 'user', "last_login_at" TIMESTAMP, "is_active" boolean NOT NULL DEFAULT true, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."coupons_type_enum" AS ENUM('percentage', 'fixed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "coupons" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "type" "public"."coupons_type_enum" NOT NULL DEFAULT 'percentage', "value" numeric(10,2) NOT NULL, "minimum_amount" numeric(10,2), "maximum_discount" numeric(10,2), "usage_limit" integer, "used_count" integer NOT NULL DEFAULT '0', "expires_at" TIMESTAMP, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e025109230e82925843f2a14c48" UNIQUE ("code"), CONSTRAINT "PK_d7ea8864a0150183770f3e9a8cb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."system_settings_type_enum" AS ENUM('string', 'number', 'boolean', 'object')`,
    );
    await queryRunner.query(
      `CREATE TABLE "system_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "key" character varying NOT NULL, "value" jsonb NOT NULL, "description" character varying, "type" "public"."system_settings_type_enum" NOT NULL DEFAULT 'string', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_b1b5bc664526d375c94ce9ad43d" UNIQUE ("key"), CONSTRAINT "PK_82521f08790d248b2a80cc85d40" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."file_uploads_type_enum" AS ENUM('product', 'category', 'general')`,
    );
    await queryRunner.query(
      `CREATE TABLE "file_uploads" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "filename" character varying NOT NULL, "original_name" character varying NOT NULL, "url" character varying NOT NULL, "mime_type" character varying NOT NULL, "size" integer NOT NULL, "type" "public"."file_uploads_type_enum" NOT NULL DEFAULT 'general', "uploaded_by" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b3ebfc99a8b660f0bc64a052b42" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "cart_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "quantity" integer NOT NULL, "price" numeric(10,2) NOT NULL, "cart_id" uuid NOT NULL, "product_id" uuid NOT NULL, CONSTRAINT "PK_6fccf5ec03c172d27a28a82928b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "carts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" character varying NOT NULL, "coupon_code" character varying, "discount_amount" numeric(10,2) NOT NULL DEFAULT '0', CONSTRAINT "PK_b5f695a59f5ebb50af3c8160816" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."admin_notifications_severity_enum" AS ENUM('info', 'warning', 'error', 'success')`,
    );
    await queryRunner.query(
      `CREATE TABLE "admin_notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying NOT NULL, "title" character varying NOT NULL, "message" text NOT NULL, "data" jsonb, "read" boolean NOT NULL DEFAULT false, "severity" "public"."admin_notifications_severity_enum" NOT NULL DEFAULT 'info', "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1fecd1cab747b7ab6e850091901" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."admin_audit_logs_status_enum" AS ENUM('success', 'failure')`,
    );
    await queryRunner.query(
      `CREATE TABLE "admin_audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "admin_id" uuid NOT NULL, "action" character varying NOT NULL, "resource" character varying NOT NULL, "resource_id" uuid, "description" text, "metadata" jsonb, "ip_address" character varying NOT NULL, "user_agent" character varying, "status" "public"."admin_audit_logs_status_enum" NOT NULL DEFAULT 'success', "error_message" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_de7a8fc2fbb525484c71a86bb96" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "addresses" ADD CONSTRAINT "FK_16aac8a9f6f9c1dd6bcb75ec023" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD CONSTRAINT "FK_88cea2dc9c31951d06437879b40" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_9482e9567d8dcc2bc615981ef44" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" ADD CONSTRAINT "FK_728447781a30bc3fcfe5c2f1cdf" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_9a5f6868c96e0069e699f33e124" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_145532db85752b29c57d2b7b1f1" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" ADD CONSTRAINT "FK_9263386c35b6b242540f9493b00" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_a922b820eeef29ac1c6800e826a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" ADD CONSTRAINT "FK_d39c53244703b8534307adcd073" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" ADD CONSTRAINT "FK_6385a745d9e12a89b859bb25623" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" ADD CONSTRAINT "FK_30e89257a105eab7648a35c7fce" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "FK_01a78e07962ed72eaf9ccae990b" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "admin_audit_logs" DROP CONSTRAINT "FK_01a78e07962ed72eaf9ccae990b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" DROP CONSTRAINT "FK_30e89257a105eab7648a35c7fce"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cart_items" DROP CONSTRAINT "FK_6385a745d9e12a89b859bb25623"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_d39c53244703b8534307adcd073"`,
    );
    await queryRunner.query(
      `ALTER TABLE "orders" DROP CONSTRAINT "FK_a922b820eeef29ac1c6800e826a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_9263386c35b6b242540f9493b00"`,
    );
    await queryRunner.query(
      `ALTER TABLE "order_items" DROP CONSTRAINT "FK_145532db85752b29c57d2b7b1f1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_9a5f6868c96e0069e699f33e124"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_728447781a30bc3fcfe5c2f1cdf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "reviews" DROP CONSTRAINT "FK_9482e9567d8dcc2bc615981ef44"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT "FK_88cea2dc9c31951d06437879b40"`,
    );
    await queryRunner.query(
      `ALTER TABLE "addresses" DROP CONSTRAINT "FK_16aac8a9f6f9c1dd6bcb75ec023"`,
    );
    await queryRunner.query(`DROP TABLE "admin_audit_logs"`);
    await queryRunner.query(
      `DROP TYPE "public"."admin_audit_logs_status_enum"`,
    );
    await queryRunner.query(`DROP TABLE "admin_notifications"`);
    await queryRunner.query(
      `DROP TYPE "public"."admin_notifications_severity_enum"`,
    );
    await queryRunner.query(`DROP TABLE "carts"`);
    await queryRunner.query(`DROP TABLE "cart_items"`);
    await queryRunner.query(`DROP TABLE "file_uploads"`);
    await queryRunner.query(`DROP TYPE "public"."file_uploads_type_enum"`);
    await queryRunner.query(`DROP TABLE "system_settings"`);
    await queryRunner.query(`DROP TYPE "public"."system_settings_type_enum"`);
    await queryRunner.query(`DROP TABLE "coupons"`);
    await queryRunner.query(`DROP TYPE "public"."coupons_type_enum"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP TYPE "public"."orders_status_enum"`);
    await queryRunner.query(`DROP TABLE "order_items"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TYPE "public"."products_status_enum"`);
    await queryRunner.query(`DROP TABLE "reviews"`);
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP TABLE "addresses"`);
  }
}
