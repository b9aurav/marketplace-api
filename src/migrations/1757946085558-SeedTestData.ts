import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedTestData1757946085558 implements MigrationInterface {
  name = "SeedTestData1757946085558";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert Users (including admin users)
    await queryRunner.query(`
      INSERT INTO "users" ("id", "email", "name", "phone", "role", "last_login_at", "is_active", "metadata", "created_at", "updated_at") VALUES
      ('550e8400-e29b-41d4-a716-446655440001', 'admin@example.com', 'Admin User', '+1234567890', 'admin', NOW() - INTERVAL '1 day', true, '{"preferences": {"theme": "dark", "notifications": true}}', NOW() - INTERVAL '30 days', NOW()),
      ('550e8400-e29b-41d4-a716-446655440002', 'john.doe@example.com', 'John Doe', '+1234567891', 'user', NOW() - INTERVAL '2 hours', true, '{"preferences": {"theme": "light", "newsletter": true}}', NOW() - INTERVAL '25 days', NOW()),
      ('550e8400-e29b-41d4-a716-446655440003', 'jane.smith@example.com', 'Jane Smith', '+1234567892', 'user', NOW() - INTERVAL '5 hours', true, '{"preferences": {"theme": "auto", "notifications": false}}', NOW() - INTERVAL '20 days', NOW()),
      ('550e8400-e29b-41d4-a716-446655440004', 'bob.wilson@example.com', 'Bob Wilson', '+1234567893', 'user', NOW() - INTERVAL '1 day', true, '{"preferences": {"theme": "light"}}', NOW() - INTERVAL '15 days', NOW()),
      ('550e8400-e29b-41d4-a716-446655440005', 'alice.brown@example.com', 'Alice Brown', '+1234567894', 'user', NOW() - INTERVAL '3 days', true, '{"preferences": {"notifications": true}}', NOW() - INTERVAL '10 days', NOW()),
      ('550e8400-e29b-41d4-a716-446655440006', 'charlie.davis@example.com', 'Charlie Davis', '+1234567895', 'user', NOW() - INTERVAL '1 week', true, '{}', NOW() - INTERVAL '8 days', NOW()),
      ('550e8400-e29b-41d4-a716-446655440007', 'diana.miller@example.com', 'Diana Miller', '+1234567896', 'user', NOW() - INTERVAL '2 days', true, '{"preferences": {"theme": "dark"}}', NOW() - INTERVAL '5 days', NOW()),
      ('550e8400-e29b-41d4-a716-446655440008', 'edward.jones@example.com', 'Edward Jones', '+1234567897', 'user', NOW() - INTERVAL '4 hours', true, '{}', NOW() - INTERVAL '3 days', NOW()),
      ('550e8400-e29b-41d4-a716-446655440009', 'fiona.garcia@example.com', 'Fiona Garcia', '+1234567898', 'user', NOW() - INTERVAL '6 hours', false, '{"preferences": {"notifications": false}}', NOW() - INTERVAL '2 days', NOW()),
      ('550e8400-e29b-41d4-a716-446655440010', 'george.martinez@example.com', 'George Martinez', '+1234567899', 'admin', NOW() - INTERVAL '8 hours', true, '{"preferences": {"theme": "light", "admin_panel": "advanced"}}', NOW() - INTERVAL '1 day', NOW())
    `);

    // Insert Categories (with parent-child relationships)
    await queryRunner.query(`
      INSERT INTO "categories" ("id", "name", "description", "image", "slug", "is_active", "sort_order", "parent_id", "created_at", "updated_at") VALUES
      ('650e8400-e29b-41d4-a716-446655440001', 'Electronics', 'Electronic devices and gadgets', '/images/categories/electronics.jpg', 'electronics', true, 1, NULL, NOW() - INTERVAL '20 days', NOW()),
      ('650e8400-e29b-41d4-a716-446655440002', 'Clothing', 'Fashion and apparel', '/images/categories/clothing.jpg', 'clothing', true, 2, NULL, NOW() - INTERVAL '20 days', NOW()),
      ('650e8400-e29b-41d4-a716-446655440003', 'Home & Garden', 'Home improvement and garden supplies', '/images/categories/home-garden.jpg', 'home-garden', true, 3, NULL, NOW() - INTERVAL '20 days', NOW()),
      ('650e8400-e29b-41d4-a716-446655440004', 'Books', 'Books and educational materials', '/images/categories/books.jpg', 'books', true, 4, NULL, NOW() - INTERVAL '20 days', NOW()),
      ('650e8400-e29b-41d4-a716-446655440005', 'Sports & Outdoors', 'Sports equipment and outdoor gear', '/images/categories/sports.jpg', 'sports-outdoors', true, 5, NULL, NOW() - INTERVAL '20 days', NOW()),
      ('650e8400-e29b-41d4-a716-446655440006', 'Smartphones', 'Mobile phones and accessories', '/images/categories/smartphones.jpg', 'smartphones', true, 1, '650e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '19 days', NOW()),
      ('650e8400-e29b-41d4-a716-446655440007', 'Laptops', 'Portable computers', '/images/categories/laptops.jpg', 'laptops', true, 2, '650e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '19 days', NOW()),
      ('650e8400-e29b-41d4-a716-446655440008', 'Men''s Clothing', 'Clothing for men', '/images/categories/mens-clothing.jpg', 'mens-clothing', true, 1, '650e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '19 days', NOW()),
      ('650e8400-e29b-41d4-a716-446655440009', 'Women''s Clothing', 'Clothing for women', '/images/categories/womens-clothing.jpg', 'womens-clothing', true, 2, '650e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '19 days', NOW()),
      ('650e8400-e29b-41d4-a716-446655440010', 'Furniture', 'Home furniture', '/images/categories/furniture.jpg', 'furniture', true, 1, '650e8400-e29b-41d4-a716-446655440003', NOW() - INTERVAL '19 days', NOW())
    `);

    // Insert Products
    await queryRunner.query(`
      INSERT INTO "products" ("id", "name", "description", "price", "stock", "images", "rating", "sku", "weight", "dimensions", "status", "featured", "tags", "meta_title", "meta_description", "minimum_stock", "sales_count", "category_id", "created_at", "updated_at") VALUES
      ('750e8400-e29b-41d4-a716-446655440001', 'iPhone 15 Pro', 'Latest Apple smartphone with advanced features', 999.99, 50, 'iphone15pro-1.jpg,iphone15pro-2.jpg,iphone15pro-3.jpg', 4.8, 'IPH15PRO001', 0.19, '{"length": 14.67, "width": 7.09, "height": 0.83}', 'active', true, '{smartphone,apple,5g,premium}', 'iPhone 15 Pro - Premium Smartphone', 'Experience the power of iPhone 15 Pro with advanced camera system and A17 Pro chip', 10, 125, '650e8400-e29b-41d4-a716-446655440006', NOW() - INTERVAL '18 days', NOW()),
      ('750e8400-e29b-41d4-a716-446655440002', 'Samsung Galaxy S24', 'Flagship Android smartphone', 849.99, 75, 'galaxy-s24-1.jpg,galaxy-s24-2.jpg', 4.6, 'SAM-GS24-001', 0.17, '{"length": 14.7, "width": 7.06, "height": 0.76}', 'active', true, '{smartphone,samsung,android,flagship}', 'Samsung Galaxy S24 - Android Flagship', 'Discover the Samsung Galaxy S24 with AI-powered features and stunning display', 15, 98, '650e8400-e29b-41d4-a716-446655440006', NOW() - INTERVAL '17 days', NOW()),
      ('750e8400-e29b-41d4-a716-446655440003', 'MacBook Pro 16"', 'Professional laptop for creators', 2499.99, 25, 'macbook-pro-16-1.jpg,macbook-pro-16-2.jpg,macbook-pro-16-3.jpg', 4.9, 'MBP16-M3-001', 2.14, '{"length": 35.57, "width": 24.81, "height": 1.68}', 'active', true, '{laptop,apple,professional,m3}', 'MacBook Pro 16" - Professional Laptop', 'Unleash your creativity with the powerful MacBook Pro 16" featuring M3 Pro chip', 5, 67, '650e8400-e29b-41d4-a716-446655440007', NOW() - INTERVAL '16 days', NOW()),
      ('750e8400-e29b-41d4-a716-446655440004', 'Dell XPS 13', 'Ultrabook for productivity', 1299.99, 40, 'dell-xps13-1.jpg,dell-xps13-2.jpg', 4.4, 'DELL-XPS13-001', 1.27, '{"length": 29.57, "width": 19.9, "height": 1.48}', 'active', false, '{laptop,dell,ultrabook,windows}', 'Dell XPS 13 - Premium Ultrabook', 'Experience premium performance with the Dell XPS 13 ultrabook', 8, 43, '650e8400-e29b-41d4-a716-446655440007', NOW() - INTERVAL '15 days', NOW()),
      ('750e8400-e29b-41d4-a716-446655440005', 'Men''s Cotton T-Shirt', 'Comfortable cotton t-shirt for everyday wear', 24.99, 200, 'mens-tshirt-1.jpg,mens-tshirt-2.jpg,mens-tshirt-3.jpg', 4.2, 'MENS-TSHIRT-001', 0.2, '{"length": 71, "width": 51, "height": 1}', 'active', false, '{clothing,men,cotton,casual}', 'Men''s Cotton T-Shirt - Comfortable Wear', 'High-quality cotton t-shirt perfect for casual occasions', 20, 234, '650e8400-e29b-41d4-a716-446655440008', NOW() - INTERVAL '14 days', NOW()),
      ('750e8400-e29b-41d4-a716-446655440006', 'Women''s Summer Dress', 'Elegant summer dress for special occasions', 79.99, 80, 'womens-dress-1.jpg,womens-dress-2.jpg', 4.5, 'WOM-DRESS-001', 0.3, '{"length": 95, "width": 40, "height": 2}', 'active', true, '{clothing,women,dress,summer}', 'Women''s Summer Dress - Elegant Style', 'Beautiful summer dress perfect for any special occasion', 10, 156, '650e8400-e29b-41d4-a716-446655440009', NOW() - INTERVAL '13 days', NOW()),
      ('750e8400-e29b-41d4-a716-446655440007', 'Office Chair Ergonomic', 'Comfortable ergonomic office chair', 299.99, 35, 'office-chair-1.jpg,office-chair-2.jpg,office-chair-3.jpg', 4.3, 'OFF-CHAIR-001', 15.5, '{"length": 66, "width": 66, "height": 120}', 'active', false, '{furniture,office,ergonomic,chair}', 'Ergonomic Office Chair - Comfort & Support', 'Premium ergonomic office chair designed for all-day comfort', 5, 89, '650e8400-e29b-41d4-a716-446655440010', NOW() - INTERVAL '12 days', NOW()),
      ('750e8400-e29b-41d4-a716-446655440008', 'JavaScript: The Good Parts', 'Essential JavaScript programming book', 34.99, 60, 'js-book-1.jpg', 4.7, 'BOOK-JS-001', 0.4, '{"length": 23, "width": 17, "height": 2}', 'active', true, '{book,programming,javascript,education}', 'JavaScript: The Good Parts - Programming Book', 'Master JavaScript with this essential programming guide', 10, 78, '650e8400-e29b-41d4-a716-446655440004', NOW() - INTERVAL '11 days', NOW()),
      ('750e8400-e29b-41d4-a716-446655440009', 'Yoga Mat Premium', 'High-quality yoga mat for fitness', 49.99, 120, 'yoga-mat-1.jpg,yoga-mat-2.jpg', 4.4, 'YOGA-MAT-001', 1.2, '{"length": 183, "width": 61, "height": 0.6}', 'active', false, '{sports,yoga,fitness,mat}', 'Premium Yoga Mat - Fitness Essential', 'Professional-grade yoga mat for your fitness journey', 15, 167, '650e8400-e29b-41d4-a716-446655440005', NOW() - INTERVAL '10 days', NOW()),
      ('750e8400-e29b-41d4-a716-446655440010', 'Wireless Headphones', 'Noise-cancelling wireless headphones', 199.99, 90, 'headphones-1.jpg,headphones-2.jpg,headphones-3.jpg', 4.6, 'HEAD-WIRE-001', 0.25, '{"length": 19, "width": 17, "height": 8}', 'active', true, '{electronics,audio,wireless,noise-cancelling}', 'Wireless Headphones - Premium Audio', 'Experience superior sound quality with noise-cancelling technology', 12, 145, '650e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '9 days', NOW()),
      ('750e8400-e29b-41d4-a716-446655440011', 'Gaming Mouse RGB', 'High-precision gaming mouse with RGB lighting', 89.99, 65, 'gaming-mouse-1.jpg,gaming-mouse-2.jpg', 4.5, 'GAME-MOUSE-001', 0.12, '{"length": 12.8, "width": 6.8, "height": 4.2}', 'active', false, '{electronics,gaming,mouse,rgb}', 'Gaming Mouse RGB - Precision Gaming', 'Professional gaming mouse with customizable RGB lighting', 8, 92, '650e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '8 days', NOW()),
      ('750e8400-e29b-41d4-a716-446655440012', 'Coffee Maker Deluxe', 'Programmable coffee maker for perfect brew', 149.99, 45, 'coffee-maker-1.jpg,coffee-maker-2.jpg', 4.3, 'COFFEE-MAK-001', 3.2, '{"length": 35, "width": 20, "height": 38}', 'active', false, '{home,kitchen,coffee,appliance}', 'Deluxe Coffee Maker - Perfect Brew', 'Start your day right with this programmable coffee maker', 6, 76, '650e8400-e29b-41d4-a716-446655440003', NOW() - INTERVAL '7 days', NOW())
    `);

    // Insert Addresses
    await queryRunner.query(`
      INSERT INTO "addresses" ("id", "label", "street", "city", "state", "zip", "is_default", "user_id") VALUES
      ('850e8400-e29b-41d4-a716-446655440001', 'Home', '123 Main Street', 'New York', 'NY', '10001', true, '550e8400-e29b-41d4-a716-446655440002'),
      ('850e8400-e29b-41d4-a716-446655440002', 'Work', '456 Business Ave', 'New York', 'NY', '10002', false, '550e8400-e29b-41d4-a716-446655440002'),
      ('850e8400-e29b-41d4-a716-446655440003', 'Home', '789 Oak Street', 'Los Angeles', 'CA', '90210', true, '550e8400-e29b-41d4-a716-446655440003'),
      ('850e8400-e29b-41d4-a716-446655440004', 'Home', '321 Pine Road', 'Chicago', 'IL', '60601', true, '550e8400-e29b-41d4-a716-446655440004'),
      ('850e8400-e29b-41d4-a716-446655440005', 'Home', '654 Elm Street', 'Houston', 'TX', '77001', true, '550e8400-e29b-41d4-a716-446655440005'),
      ('850e8400-e29b-41d4-a716-446655440006', 'Apartment', '987 Cedar Lane', 'Phoenix', 'AZ', '85001', true, '550e8400-e29b-41d4-a716-446655440006'),
      ('850e8400-e29b-41d4-a716-446655440007', 'Home', '147 Maple Drive', 'Philadelphia', 'PA', '19101', true, '550e8400-e29b-41d4-a716-446655440007'),
      ('850e8400-e29b-41d4-a716-446655440008', 'Office', '258 Birch Street', 'San Antonio', 'TX', '78201', false, '550e8400-e29b-41d4-a716-446655440007'),
      ('850e8400-e29b-41d4-a716-446655440009', 'Home', '369 Walnut Avenue', 'San Diego', 'CA', '92101', true, '550e8400-e29b-41d4-a716-446655440008'),
      ('850e8400-e29b-41d4-a716-446655440010', 'Home', '741 Cherry Street', 'Dallas', 'TX', '75201', true, '550e8400-e29b-41d4-a716-446655440009')
    `);

    // Insert Orders
    await queryRunner.query(`
      INSERT INTO "orders" ("id", "status", "total", "tracking_number", "payment_method", "transaction_id", "payment_method_details", "fees", "net_amount", "admin_notes", "shipping_details", "user_id", "address_id", "created_at", "updated_at", "coupon_code", "discount_amount", "tracking_info") VALUES
      ('950e8400-e29b-41d4-a716-446655440001', 'delivered', 1024.98, 'TRK001234567', 'credit_card', 'txn_1234567890', '{"card_last4": "4242", "brand": "visa"}', 25.62, 999.36, 'Customer requested express delivery', '{"carrier": "FedEx", "service": "Express", "estimated_delivery": "2024-01-15"}', '550e8400-e29b-41d4-a716-446655440002', '850e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '15 days', NOW() - INTERVAL '10 days', 'SAVE10', 25.00, '{"status": "delivered", "location": "New York, NY", "delivered_at": "2024-01-15T14:30:00Z"}'),
      ('950e8400-e29b-41d4-a716-446655440002', 'shipped', 849.99, 'TRK001234568', 'paypal', 'pp_1234567891', '{"paypal_email": "jane.smith@example.com"}', 21.25, 828.74, NULL, '{"carrier": "UPS", "service": "Ground", "estimated_delivery": "2024-01-20"}', '550e8400-e29b-41d4-a716-446655440003', '850e8400-e29b-41d4-a716-446655440003', NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days', NULL, 0.00, '{"status": "in_transit", "location": "Los Angeles, CA", "last_update": "2024-01-18T10:15:00Z"}'),
      ('950e8400-e29b-41d4-a716-446655440003', 'processing', 2499.99, NULL, 'credit_card', 'txn_1234567892', '{"card_last4": "1234", "brand": "mastercard"}', 62.50, 2437.49, 'High-value order - verify before shipping', NULL, '550e8400-e29b-41d4-a716-446655440004', '850e8400-e29b-41d4-a716-446655440004', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day', NULL, 0.00, NULL),
      ('950e8400-e29b-41d4-a716-446655440004', 'paid', 104.98, NULL, 'stripe', 'pi_1234567893', '{"card_last4": "5678", "brand": "amex"}', 2.62, 102.36, NULL, NULL, '550e8400-e29b-41d4-a716-446655440005', '850e8400-e29b-41d4-a716-446655440005', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', 'WELCOME15', 15.00, NULL),
      ('950e8400-e29b-41d4-a716-446655440005', 'pending', 299.99, NULL, NULL, NULL, NULL, 0.00, 299.99, NULL, NULL, '550e8400-e29b-41d4-a716-446655440006', '850e8400-e29b-41d4-a716-446655440006', NOW() - INTERVAL '6 hours', NOW() - INTERVAL '6 hours', NULL, 0.00, NULL),
      ('950e8400-e29b-41d4-a716-446655440006', 'cancelled', 79.99, NULL, NULL, NULL, NULL, 0.00, 79.99, 'Customer requested cancellation', NULL, '550e8400-e29b-41d4-a716-446655440007', '850e8400-e29b-41d4-a716-446655440007', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days', NULL, 0.00, NULL),
      ('950e8400-e29b-41d4-a716-446655440007', 'delivered', 34.99, 'TRK001234569', 'credit_card', 'txn_1234567894', '{"card_last4": "9999", "brand": "visa"}', 0.87, 34.12, NULL, '{"carrier": "USPS", "service": "Priority", "estimated_delivery": "2024-01-12"}', '550e8400-e29b-41d4-a716-446655440008', '850e8400-e29b-41d4-a716-446655440009', NOW() - INTERVAL '12 days', NOW() - INTERVAL '8 days', NULL, 0.00, '{"status": "delivered", "location": "San Diego, CA", "delivered_at": "2024-01-12T16:45:00Z"}')
    `);

    // Insert Order Items
    await queryRunner.query(`
      INSERT INTO "order_items" ("id", "quantity", "price", "order_id", "product_id", "product_name") VALUES
      ('a50e8400-e29b-41d4-a716-446655440001', 1, 999.99, '950e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 'iPhone 15 Pro'),
      ('a50e8400-e29b-41d4-a716-446655440002', 1, 24.99, '950e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440005', 'Men''s Cotton T-Shirt'),
      ('a50e8400-e29b-41d4-a716-446655440003', 1, 849.99, '950e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440002', 'Samsung Galaxy S24'),
      ('a50e8400-e29b-41d4-a716-446655440004', 1, 2499.99, '950e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440003', 'MacBook Pro 16"'),
      ('a50e8400-e29b-41d4-a716-446655440005', 1, 79.99, '950e8400-e29b-41d4-a716-446655440004', '750e8400-e29b-41d4-a716-446655440006', 'Women''s Summer Dress'),
      ('a50e8400-e29b-41d4-a716-446655440006', 1, 24.99, '950e8400-e29b-41d4-a716-446655440004', '750e8400-e29b-41d4-a716-446655440005', 'Men''s Cotton T-Shirt'),
      ('a50e8400-e29b-41d4-a716-446655440007', 1, 299.99, '950e8400-e29b-41d4-a716-446655440005', '750e8400-e29b-41d4-a716-446655440007', 'Office Chair Ergonomic'),
      ('a50e8400-e29b-41d4-a716-446655440008', 1, 79.99, '950e8400-e29b-41d4-a716-446655440006', '750e8400-e29b-41d4-a716-446655440006', 'Women''s Summer Dress'),
      ('a50e8400-e29b-41d4-a716-446655440009', 1, 34.99, '950e8400-e29b-41d4-a716-446655440007', '750e8400-e29b-41d4-a716-446655440008', 'JavaScript: The Good Parts')
    `);

    // Insert Reviews
    await queryRunner.query(`
      INSERT INTO "reviews" ("id", "content", "rating", "product_id", "user_id", "created_at") VALUES
      ('b50e8400-e29b-41d4-a716-446655440001', 'Amazing phone! The camera quality is outstanding and the performance is smooth.', 5, '750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '10 days'),
      ('b50e8400-e29b-41d4-a716-446655440002', 'Great value for money. Battery life could be better but overall satisfied.', 4, '750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', NOW() - INTERVAL '8 days'),
      ('b50e8400-e29b-41d4-a716-446655440003', 'Perfect laptop for professional work. Fast, reliable, and great display.', 5, '750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', NOW() - INTERVAL '7 days'),
      ('b50e8400-e29b-41d4-a716-446655440004', 'Comfortable t-shirt, good quality fabric. Fits as expected.', 4, '750e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', NOW() - INTERVAL '6 days'),
      ('b50e8400-e29b-41d4-a716-446655440005', 'Beautiful dress, perfect for summer events. Love the design!', 5, '750e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440006', NOW() - INTERVAL '5 days'),
      ('b50e8400-e29b-41d4-a716-446655440006', 'Very comfortable chair for long work sessions. Good back support.', 4, '750e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440007', NOW() - INTERVAL '4 days'),
      ('b50e8400-e29b-41d4-a716-446655440007', 'Excellent book for learning JavaScript fundamentals. Highly recommended!', 5, '750e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440008', NOW() - INTERVAL '3 days'),
      ('b50e8400-e29b-41d4-a716-446655440008', 'Good yoga mat, non-slip surface works well. Thickness is perfect.', 4, '750e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440009', NOW() - INTERVAL '2 days'),
      ('b50e8400-e29b-41d4-a716-446655440009', 'Great headphones! Noise cancellation works perfectly.', 5, '750e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440002', NOW() - INTERVAL '1 day'),
      ('b50e8400-e29b-41d4-a716-446655440010', 'Responsive gaming mouse, RGB lighting is customizable. Love it!', 4, '750e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440003', NOW() - INTERVAL '12 hours'),
      ('b50e8400-e29b-41d4-a716-446655440011', 'Makes excellent coffee every morning. Easy to program and use.', 4, '750e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440004', NOW() - INTERVAL '6 hours'),
      ('b50e8400-e29b-41d4-a716-446655440012', 'Decent laptop for the price. Good for basic tasks and productivity.', 4, '750e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440005', NOW() - INTERVAL '3 hours')
    `);

    // Insert Carts
    await queryRunner.query(`
      INSERT INTO "carts" ("id", "user_id", "coupon_code", "discount_amount") VALUES
      ('c50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', NULL, 0.00),
      ('c50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 'SAVE10', 10.00),
      ('c50e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', NULL, 0.00),
      ('c50e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440005', NULL, 0.00),
      ('c50e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440006', 'WELCOME15', 15.00)
    `);

    // Insert Cart Items
    await queryRunner.query(`
      INSERT INTO "cart_items" ("id", "quantity", "price", "cart_id", "product_id") VALUES
      ('d50e8400-e29b-41d4-a716-446655440001', 1, 199.99, 'c50e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440010'),
      ('d50e8400-e29b-41d4-a716-446655440002', 2, 24.99, 'c50e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440005'),
      ('d50e8400-e29b-41d4-a716-446655440003', 1, 89.99, 'c50e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440011'),
      ('d50e8400-e29b-41d4-a716-446655440004', 1, 49.99, 'c50e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440009'),
      ('d50e8400-e29b-41d4-a716-446655440005', 1, 1299.99, 'c50e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440004'),
      ('d50e8400-e29b-41d4-a716-446655440006', 1, 149.99, 'c50e8400-e29b-41d4-a716-446655440004', '750e8400-e29b-41d4-a716-446655440012'),
      ('d50e8400-e29b-41d4-a716-446655440007', 3, 34.99, 'c50e8400-e29b-41d4-a716-446655440005', '750e8400-e29b-41d4-a716-446655440008')
    `);

    // Insert Coupons
    await queryRunner.query(`
      INSERT INTO "coupons" ("id", "code", "type", "value", "minimum_amount", "maximum_discount", "usage_limit", "used_count", "expires_at", "is_active", "created_at", "updated_at") VALUES
      ('e50e8400-e29b-41d4-a716-446655440001', 'SAVE10', 'percentage', 10.00, 50.00, 100.00, 1000, 45, NOW() + INTERVAL '30 days', true, NOW() - INTERVAL '20 days', NOW()),
      ('e50e8400-e29b-41d4-a716-446655440002', 'WELCOME15', 'percentage', 15.00, 100.00, 150.00, 500, 23, NOW() + INTERVAL '60 days', true, NOW() - INTERVAL '15 days', NOW()),
      ('e50e8400-e29b-41d4-a716-446655440003', 'FIXED25', 'fixed', 25.00, 200.00, NULL, 200, 12, NOW() + INTERVAL '45 days', true, NOW() - INTERVAL '10 days', NOW()),
      ('e50e8400-e29b-41d4-a716-446655440004', 'SUMMER20', 'percentage', 20.00, 75.00, 200.00, 300, 67, NOW() + INTERVAL '90 days', true, NOW() - INTERVAL '5 days', NOW()),
      ('e50e8400-e29b-41d4-a716-446655440005', 'EXPIRED10', 'percentage', 10.00, 50.00, 50.00, 100, 89, NOW() - INTERVAL '5 days', false, NOW() - INTERVAL '25 days', NOW() - INTERVAL '5 days'),
      ('e50e8400-e29b-41d4-a716-446655440006', 'NEWUSER', 'fixed', 50.00, 300.00, NULL, 1000, 156, NOW() + INTERVAL '120 days', true, NOW() - INTERVAL '3 days', NOW())
    `);

    // Insert System Settings
    await queryRunner.query(`
      INSERT INTO "system_settings" ("id", "key", "value", "description", "type", "created_at", "updated_at") VALUES
      ('f50e8400-e29b-41d4-a716-446655440001', 'site_name', '"E-Commerce Store"', 'Name of the website', 'string', NOW() - INTERVAL '30 days', NOW()),
      ('f50e8400-e29b-41d4-a716-446655440002', 'site_description', '"Your one-stop shop for everything"', 'Website description for SEO', 'string', NOW() - INTERVAL '30 days', NOW()),
      ('f50e8400-e29b-41d4-a716-446655440003', 'currency', '"USD"', 'Default currency code', 'string', NOW() - INTERVAL '30 days', NOW()),
      ('f50e8400-e29b-41d4-a716-446655440004', 'tax_rate', '8.25', 'Default tax rate percentage', 'number', NOW() - INTERVAL '30 days', NOW()),
      ('f50e8400-e29b-41d4-a716-446655440005', 'free_shipping_threshold', '75.00', 'Minimum order amount for free shipping', 'number', NOW() - INTERVAL '30 days', NOW()),
      ('f50e8400-e29b-41d4-a716-446655440006', 'maintenance_mode', 'false', 'Enable/disable maintenance mode', 'boolean', NOW() - INTERVAL '30 days', NOW()),
      ('f50e8400-e29b-41d4-a716-446655440007', 'email_notifications', 'true', 'Enable email notifications', 'boolean', NOW() - INTERVAL '30 days', NOW()),
      ('f50e8400-e29b-41d4-a716-446655440008', 'payment_methods', '{"credit_card": true, "paypal": true, "stripe": true, "bank_transfer": false}', 'Available payment methods', 'object', NOW() - INTERVAL '30 days', NOW()),
      ('f50e8400-e29b-41d4-a716-446655440009', 'shipping_zones', '{"domestic": {"rate": 5.99, "free_threshold": 75}, "international": {"rate": 15.99, "free_threshold": 150}}', 'Shipping configuration by zones', 'object', NOW() - INTERVAL '30 days', NOW()),
      ('f50e8400-e29b-41d4-a716-446655440010', 'max_cart_items', '50', 'Maximum items allowed in cart', 'number', NOW() - INTERVAL '30 days', NOW())
    `);

    // Insert File Uploads
    await queryRunner.query(`
      INSERT INTO "file_uploads" ("id", "filename", "original_name", "url", "mime_type", "size", "type", "uploaded_by", "created_at") VALUES
      ('150e8400-e29b-41d4-a716-446655440001', 'iphone15pro-1.jpg', 'iPhone_15_Pro_Front.jpg', '/uploads/products/iphone15pro-1.jpg', 'image/jpeg', 245760, 'product', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '18 days'),
      ('150e8400-e29b-41d4-a716-446655440002', 'iphone15pro-2.jpg', 'iPhone_15_Pro_Back.jpg', '/uploads/products/iphone15pro-2.jpg', 'image/jpeg', 198432, 'product', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '18 days'),
      ('150e8400-e29b-41d4-a716-446655440003', 'galaxy-s24-1.jpg', 'Samsung_Galaxy_S24.jpg', '/uploads/products/galaxy-s24-1.jpg', 'image/jpeg', 312576, 'product', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '17 days'),
      ('150e8400-e29b-41d4-a716-446655440004', 'macbook-pro-16-1.jpg', 'MacBook_Pro_16_inch.jpg', '/uploads/products/macbook-pro-16-1.jpg', 'image/jpeg', 456789, 'product', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '16 days'),
      ('150e8400-e29b-41d4-a716-446655440005', 'electronics.jpg', 'Electronics_Category.jpg', '/uploads/categories/electronics.jpg', 'image/jpeg', 187654, 'category', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '20 days'),
      ('150e8400-e29b-41d4-a716-446655440006', 'clothing.jpg', 'Clothing_Category.jpg', '/uploads/categories/clothing.jpg', 'image/jpeg', 234567, 'category', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '20 days'),
      ('150e8400-e29b-41d4-a716-446655440007', 'logo.png', 'Company_Logo.png', '/uploads/general/logo.png', 'image/png', 45678, 'general', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '25 days'),
      ('150e8400-e29b-41d4-a716-446655440008', 'banner.jpg', 'Homepage_Banner.jpg', '/uploads/general/banner.jpg', 'image/jpeg', 567890, 'general', '550e8400-e29b-41d4-a716-446655440001', NOW() - INTERVAL '15 days'),
      ('150e8400-e29b-41d4-a716-446655440009', 'product-manual.pdf', 'Product_Manual_v2.pdf', '/uploads/general/product-manual.pdf', 'application/pdf', 1234567, 'general', '550e8400-e29b-41d4-a716-446655440010', NOW() - INTERVAL '10 days'),
      ('150e8400-e29b-41d4-a716-446655440010', 'catalog.pdf', 'Product_Catalog_2024.pdf', '/uploads/general/catalog.pdf', 'application/pdf', 2345678, 'general', '550e8400-e29b-41d4-a716-446655440010', NOW() - INTERVAL '5 days')
    `);

    // Insert Admin Notifications
    await queryRunner.query(`
      INSERT INTO "admin_notifications" ("id", "type", "title", "message", "data", "read", "severity", "created_at") VALUES
      ('250e8400-e29b-41d4-a716-446655440001', 'order', 'New Order Received', 'Order #950e8400-e29b-41d4-a716-446655440005 has been placed and requires processing', '{"order_id": "950e8400-e29b-41d4-a716-446655440005", "amount": 299.99}', false, 'info', NOW() - INTERVAL '6 hours'),
      ('250e8400-e29b-41d4-a716-446655440002', 'inventory', 'Low Stock Alert', 'Product "MacBook Pro 16\"" is running low on stock (25 units remaining)', '{"product_id": "750e8400-e29b-41d4-a716-446655440003", "current_stock": 25, "minimum_stock": 5}', true, 'warning', NOW() - INTERVAL '2 days'),
      ('250e8400-e29b-41d4-a716-446655440003', 'user', 'New User Registration', 'New user George Martinez has registered', '{"user_id": "550e8400-e29b-41d4-a716-446655440010", "email": "george.martinez@example.com"}', true, 'success', NOW() - INTERVAL '1 day'),
      ('250e8400-e29b-41d4-a716-446655440004', 'payment', 'Payment Failed', 'Payment processing failed for order #950e8400-e29b-41d4-a716-446655440005', '{"order_id": "950e8400-e29b-41d4-a716-446655440005", "error": "Insufficient funds"}', false, 'error', NOW() - INTERVAL '8 hours'),
      ('250e8400-e29b-41d4-a716-446655440005', 'system', 'System Maintenance', 'Scheduled maintenance completed successfully', '{"maintenance_type": "database_optimization", "duration": "2 hours"}', true, 'info', NOW() - INTERVAL '3 days'),
      ('250e8400-e29b-41d4-a716-446655440006', 'review', 'New Product Review', 'New 5-star review received for iPhone 15 Pro', '{"product_id": "750e8400-e29b-41d4-a716-446655440001", "rating": 5, "reviewer": "John Doe"}', false, 'success', NOW() - INTERVAL '10 hours'),
      ('250e8400-e29b-41d4-a716-446655440007', 'security', 'Multiple Login Attempts', 'Multiple failed login attempts detected for admin account', '{"ip_address": "192.168.1.100", "attempts": 5, "blocked": true}', false, 'warning', NOW() - INTERVAL '4 hours'),
      ('250e8400-e29b-41d4-a716-446655440008', 'coupon', 'Coupon Usage Limit', 'Coupon "SAVE10" has reached 90% of its usage limit', '{"coupon_code": "SAVE10", "used_count": 45, "usage_limit": 50}', true, 'warning', NOW() - INTERVAL '12 hours')
    `);

    // Insert Admin Audit Logs
    await queryRunner.query(`
      INSERT INTO "admin_audit_logs" ("id", "admin_id", "action", "resource", "resource_id", "description", "metadata", "ip_address", "user_agent", "status", "error_message", "created_at") VALUES
      ('350e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'CREATE', 'product', '750e8400-e29b-41d4-a716-446655440012', 'Created new product: Coffee Maker Deluxe', '{"product_name": "Coffee Maker Deluxe", "price": 149.99, "category": "Home & Garden"}', '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'success', NULL, NOW() - INTERVAL '7 days'),
      ('350e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'UPDATE', 'product', '750e8400-e29b-41d4-a716-446655440001', 'Updated product stock for iPhone 15 Pro', '{"old_stock": 45, "new_stock": 50, "reason": "inventory_adjustment"}', '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'success', NULL, NOW() - INTERVAL '5 days'),
      ('350e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440010', 'DELETE', 'user', '550e8400-e29b-41d4-a716-446655440009', 'Deactivated user account', '{"user_email": "fiona.garcia@example.com", "reason": "user_request"}', '192.168.1.15', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'success', NULL, NOW() - INTERVAL '3 days'),
      ('350e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'UPDATE', 'order', '950e8400-e29b-41d4-a716-446655440002', 'Updated order status to shipped', '{"old_status": "processing", "new_status": "shipped", "tracking_number": "TRK001234568"}', '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'success', NULL, NOW() - INTERVAL '3 days'),
      ('350e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440010', 'CREATE', 'coupon', 'e50e8400-e29b-41d4-a716-446655440006', 'Created new coupon: NEWUSER', '{"code": "NEWUSER", "type": "fixed", "value": 50, "usage_limit": 1000}', '192.168.1.15', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'success', NULL, NOW() - INTERVAL '3 days'),
      ('350e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', 'UPDATE', 'system_settings', 'f50e8400-e29b-41d4-a716-446655440004', 'Updated tax rate setting', '{"old_value": 8.00, "new_value": 8.25, "key": "tax_rate"}', '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'success', NULL, NOW() - INTERVAL '2 days'),
      ('350e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440001', 'DELETE', 'product', '750e8400-e29b-41d4-a716-446655440013', 'Attempted to delete product', '{"product_name": "Discontinued Item", "reason": "inventory_cleanup"}', '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'failure', 'Product has existing orders and cannot be deleted', NOW() - INTERVAL '1 day'),
      ('350e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440010', 'CREATE', 'category', '650e8400-e29b-41d4-a716-446655440010', 'Created new category: Furniture', '{"name": "Furniture", "parent_category": "Home & Garden", "sort_order": 1}', '192.168.1.15', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'success', NULL, NOW() - INTERVAL '19 days'),
      ('350e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440001', 'UPDATE', 'user', '550e8400-e29b-41d4-a716-446655440002', 'Updated user role', '{"old_role": "user", "new_role": "user", "email": "john.doe@example.com"}', '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'success', NULL, NOW() - INTERVAL '12 hours'),
      ('350e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', 'BULK_UPDATE', 'product', NULL, 'Bulk updated product prices', '{"affected_products": 5, "price_adjustment": "5%", "category": "Electronics"}', '192.168.1.10', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'success', NULL, NOW() - INTERVAL '6 hours')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Delete in reverse order to respect foreign key constraints
    await queryRunner.query(`DELETE FROM "admin_audit_logs"`);
    await queryRunner.query(`DELETE FROM "admin_notifications"`);
    await queryRunner.query(`DELETE FROM "file_uploads"`);
    await queryRunner.query(`DELETE FROM "system_settings"`);
    await queryRunner.query(`DELETE FROM "coupons"`);
    await queryRunner.query(`DELETE FROM "cart_items"`);
    await queryRunner.query(`DELETE FROM "carts"`);
    await queryRunner.query(`DELETE FROM "reviews"`);
    await queryRunner.query(`DELETE FROM "order_items"`);
    await queryRunner.query(`DELETE FROM "orders"`);
    await queryRunner.query(`DELETE FROM "products"`);
    await queryRunner.query(`DELETE FROM "categories"`);
    await queryRunner.query(`DELETE FROM "addresses"`);
    await queryRunner.query(`DELETE FROM "users"`);
  }
}