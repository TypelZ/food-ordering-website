# Implementation Plan

- [x] 1. Set up project structure and configuration

  - [x] 1.1 Initialize Node.js project with package.json and install dependencies
    - Install express, sequelize, mysql2, bcrypt, jsonwebtoken, multer, @aws-sdk/client-s3, cors, dotenv
    - Install dev dependencies: jest, fast-check, supertest
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [x] 1.2 Create backend folder structure
    - Create directories: config, middleware, models, controllers, routes, services
    - Create app.js and server.js entry points
    - _Requirements: All_

  - [x] 1.3 Create environment configuration
    - Create .env.example with DB_HOST, DB_USER, DB_PASS, DB_NAME, JWT_SECRET, S3_BUCKET, AWS_REGION
    - Create config/database.js for Sequelize configuration
    - _Requirements: 13.1, 13.4_

  - [x] 1.4 Create frontend folder structure
    - Create directories: css, js, pages/customer, pages/staff, pages/admin
    - Create index.html landing page
    - _Requirements: 14.1, 14.2, 14.3_

- [x] 2. Implement database models

  - [x] 2.1 Create User model with Sequelize
    - Define fields: id, nickname, email, password, role (ENUM), delivery_address, created_at
    - Add email unique constraint
    - _Requirements: 1.1, 1.2, 1.4_

  - [x] 2.2 Create MenuItem model with Sequelize
    - Define fields: id, name, description, price, image_url, created_at
    - _Requirements: 3.1, 8.1_

  - [x] 2.3 Create Order model with Sequelize
    - Define fields: id, user_id, status (ENUM), total_price, created_at
    - Add foreign key to users
    - _Requirements: 5.1, 9.3_

  - [x] 2.4 Create OrderItem model with Sequelize
    - Define fields: id, order_id, menu_item_id, quantity, price
    - Add foreign keys to orders and menu_items
    - _Requirements: 5.2_

  - [x] 2.5 Create model associations and index.js loader
    - User hasMany Orders, Order belongsTo User
    - Order hasMany OrderItems, OrderItem belongsTo Order
    - OrderItem belongsTo MenuItem
    - _Requirements: 6.1, 6.2_

- [x] 3. Implement authentication system

  - [x] 3.1 Create JWT middleware (middleware/auth.js)
    - Verify JWT token from Authorization header
    - Attach decoded user to request object
    - Return 401 for missing/invalid tokens
    - _Requirements: 2.4, 12.1, 12.4_

  - [x] 3.2 Create role-based authorization middleware (middleware/roleCheck.js)
    - Check user role against required roles
    - Return 403 for insufficient permissions
    - _Requirements: 8.5, 9.4, 11.7, 12.2, 12.3_

  - [x] 3.3 Create auth controller (controllers/authController.js)
    - Implement register: validate input, hash password, create CUSTOMER user
    - Implement login: verify credentials, generate JWT with user ID and role
    - Implement logout: return success (client clears token)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3_

  - [x] 3.4 Create auth routes (routes/auth.js)
    - POST /api/auth/register
    - POST /api/auth/login
    - POST /api/auth/logout
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.5 Write property tests for authentication
    - **Property 1: Registration creates Customer with hashed password**
    - **Property 3: Registration validation rejects incomplete data**
    - **Property 4: JWT contains correct claims**
    - **Property 5: Invalid credentials rejected**
    - **Validates: Requirements 1.1, 1.3, 1.4, 2.1, 2.2, 13.5**

- [x] 4. Checkpoint - Ensure authentication tests pass
  - All 5 auth tests passing

- [x] 5. Implement menu functionality

  - [x] 5.1 Create S3 service (services/s3Service.js)
    - Implement uploadImage function using AWS SDK v3
    - Use IAM role credentials (no access keys)
    - Return S3 URL after upload
    - _Requirements: 8.1, 8.3, 13.4_

  - [x] 5.2 Create menu controller (controllers/menuController.js)
    - Implement getAll: return all menu items
    - Implement getById: return single menu item
    - Implement create: validate input, upload image to S3, save item
    - Implement update: update fields, optionally update image
    - Implement delete: remove menu item
    - _Requirements: 3.1, 8.1, 8.2, 8.3, 8.4_

  - [x] 5.3 Create menu routes (routes/menu.js)
    - GET /api/menu (public)
    - GET /api/menu/:id (public)
    - POST /api/menu (Staff only)
    - PUT /api/menu/:id (Staff only)
    - DELETE /api/menu/:id (Staff only)
    - _Requirements: 3.1, 3.3, 8.1, 8.2, 8.4, 8.5_

  - [x] 5.4 Write property tests for menu
    - **Property 7: Menu retrieval returns complete items**
    - **Property 14: Menu CRUD operations persist**
    - **Validates: Requirements 3.1, 8.1, 8.2, 8.4**

- [x] 6. Implement cart functionality

  - [x] 6.1 Create cart controller (controllers/cartController.js)
    - Use in-memory cart storage (Map by user ID) for simplicity
    - Implement getCart: return items with calculated total
    - Implement addItem: add item or increase quantity
    - Implement updateItem: set quantity, remove if zero
    - Implement removeItem: delete item from cart
    - Implement clearCart: empty user's cart
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 6.2 Create cart routes (routes/cart.js)
    - GET /api/cart (Customer only)
    - POST /api/cart/add (Customer only)
    - PUT /api/cart/update (Customer only)
    - DELETE /api/cart/remove/:itemId (Customer only)
    - DELETE /api/cart/clear (Customer only)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 6.3 Write property tests for cart
    - **Property 8: Cart operations maintain consistency**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

- [x] 7. Implement order functionality

  - [x] 7.1 Create order controller (controllers/orderController.js)
    - Implement getOrders: return user's orders (Customer) or all orders (Staff)
    - Implement getOrderById: return order with items
    - Implement createOrder: create order from cart, save order items, clear cart
    - Implement updateStatus: update order status (Staff only)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 9.1, 9.2, 9.3_

  - [x] 7.2 Create order routes (routes/orders.js)
    - GET /api/orders (Authenticated)
    - GET /api/orders/:id (Authenticated)
    - POST /api/orders (Customer only)
    - PUT /api/orders/:id/status (Staff only)
    - _Requirements: 5.1, 6.1, 9.1, 9.2, 9.4_

  - [x] 7.3 Write property tests for orders
    - **Property 9: Order creation integrity**
    - **Property 10: Customer order isolation**
    - **Property 11: Order response completeness**
    - **Property 15: Order status updates persist**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 9.2, 9.3**

- [x] 8. Checkpoint - Ensure core functionality tests pass
  - All core tests passing

- [x] 9. Implement user management (Admin)

  - [x] 9.1 Create user controller (controllers/userController.js)
    - Implement getAll: return all users
    - Implement createStaff: create user with STAFF role
    - Implement updateStaff: update staff nickname only
    - Implement deleteUser: delete customer or staff
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

  - [x] 9.2 Create user routes (routes/users.js)
    - GET /api/users (Admin only)
    - POST /api/users/staff (Admin only)
    - PUT /api/users/staff/:id (Admin only)
    - DELETE /api/users/:id (Admin only)
    - _Requirements: 11.1, 11.3, 11.4, 11.5, 11.7_

  - [x] 9.3 Write property tests for user management
    - **Property 17: Staff account creation by Admin**
    - **Property 18: User deletion removes account**
    - **Validates: Requirements 11.1, 11.3, 11.4**

- [x] 10. Implement settings functionality

  - [x] 10.1 Create settings controller (controllers/settingsController.js)
    - Implement getProfile: return current user profile
    - Implement updateProfile: update nickname, email, delivery_address (Customer only)
    - Implement updatePassword: hash and save new password
    - Enforce Staff restrictions (password only)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 10.1, 10.2_

  - [x] 10.2 Create settings routes (routes/settings.js)
    - GET /api/settings/profile (Authenticated)
    - PUT /api/settings/profile (Customer only)
    - PUT /api/settings/password (Authenticated)
    - _Requirements: 7.1, 7.2, 7.4, 7.5, 10.1_

  - [x] 10.3 Write property tests for settings
    - **Property 2: Email uniqueness constraint**
    - **Property 12: Profile updates persist correctly**
    - **Property 13: Password updates are hashed**
    - **Property 19: Staff settings restrictions**
    - **Validates: Requirements 1.2, 7.1, 7.2, 7.3, 7.4, 7.5, 10.1, 10.2**

- [x] 11. Implement role-based access control tests

  - [x] 11.1 Write property tests for RBAC
    - **Property 6: Invalid JWT rejected**
    - **Property 16: Role-based access control enforcement**
    - **Validates: Requirements 2.4, 8.5, 9.4, 11.7, 12.1, 12.2, 12.3, 12.4**

- [x] 12. Checkpoint - Ensure all backend tests pass
  - All 38 tests passing with 73% code coverage

- [x] 13. Create frontend base and styling

  - [x] 13.1 Create CSS styles (css/style.css)
    - Implement black-to-white gradient backgrounds
    - Add brown accent colors for buttons and highlights
    - Style Bootstrap components for clean, friendly look
    - _Requirements: 14.1, 14.2, 14.3_

  - [x] 13.2 Create API utility (js/api.js)
    - Create fetch wrapper with JWT header injection
    - Handle response parsing and error handling
    - _Requirements: 2.1, 12.1_

  - [x] 13.3 Create auth utility (js/auth.js)
    - Implement login/logout functions
    - Store/retrieve JWT from localStorage
    - Implement role-based redirect logic
    - _Requirements: 2.1, 2.3, 14.4_

  - [x] 13.4 Create utility functions (js/utils.js)
    - Format currency, dates
    - Show toast notifications
    - Form validation helpers
    - _Requirements: All frontend_

- [x] 14. Create authentication pages

  - [x] 14.1 Create login page (pages/login.html)
    - Email and password form
    - Login button with API call
    - Link to register page
    - Role-based redirect after login
    - _Requirements: 2.1, 2.2_

  - [x] 14.2 Create register page (pages/register.html)
    - Nickname, email, password, delivery address form
    - Register button with API call
    - Link to login page
    - Redirect to login after success
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 15. Create customer pages

  - [x] 15.1 Create customer dashboard (pages/customer/dashboard.html)
    - Welcome message with nickname
    - Navigation menu (Menu, Cart, Orders, Settings)
    - Logout button
    - _Requirements: 14.1, 14.4_

  - [x] 15.2 Create menu browsing page (pages/customer/menu.html)
    - Display all menu items in cards
    - Show image, name, description, price
    - Add to cart button
    - _Requirements: 3.1, 3.2, 4.1_

  - [x] 15.3 Create cart page (pages/customer/cart.html)
    - List cart items with quantity controls
    - Increase/decrease quantity buttons
    - Remove item button
    - Display total price
    - Checkout button
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1_

  - [x] 15.4 Create orders page (pages/customer/orders.html)
    - List all customer orders
    - Show order ID, status, total, date
    - Expandable order items
    - _Requirements: 6.1, 6.2_

  - [x] 15.5 Create customer settings page (pages/customer/settings.html)
    - Edit nickname, email, delivery address
    - Change password section
    - Save buttons with API calls
    - _Requirements: 7.1, 7.2, 7.4, 7.5_

- [x] 16. Create staff pages

  - [x] 16.1 Create staff dashboard (pages/staff/dashboard.html)
    - Welcome message
    - Navigation menu (Menu Management, Order Management, Settings)
    - Logout button
    - _Requirements: 14.2, 14.4_

  - [x] 16.2 Create menu management page (pages/staff/menu.html)
    - List all menu items with edit/delete buttons
    - Add new item form with image upload
    - Edit item modal
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 16.3 Create order management page (pages/staff/orders.html)
    - List all orders with customer info
    - Status dropdown for each order
    - Update status button
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 16.4 Create staff settings page (pages/staff/settings.html)
    - Change password section only
    - No nickname/email/address fields
    - _Requirements: 10.1, 10.2_

- [x] 17. Create admin pages

  - [x] 17.1 Create admin dashboard (pages/admin/dashboard.html)
    - Welcome message
    - Navigation to User Management
    - Logout button
    - _Requirements: 14.3, 14.4_

  - [x] 17.2 Create user management page (pages/admin/users.html)
    - List all users with role badges
    - Create staff form
    - Edit staff nickname (staff only)
    - Delete user buttons
    - _Requirements: 11.1, 11.3, 11.4, 11.5_

- [x] 18. Wire up Express app and routes

  - [x] 18.1 Create main app.js
    - Configure Express middleware (cors, json, static files)
    - Mount all route modules
    - Add error handling middleware
    - _Requirements: All_

  - [x] 18.2 Create server.js entry point
    - Connect to database
    - Sync Sequelize models
    - Start server on configured port
    - _Requirements: 13.1, 13.2, 13.3_

  - [x] 18.3 Create database seeder for default admin
    - Create admin user if not exists
    - Hash default password
    - _Requirements: 11.1_

- [x] 19. Create deployment documentation

  - [x] 19.1 Create README.md with setup instructions
    - Project overview
    - Local development setup
    - Environment variables
    - _Requirements: All_

  - [x] 19.2 Create DEPLOYMENT.md with AWS deployment guide
    - EC2 setup steps
    - RDS configuration
    - S3 bucket setup
    - Nginx configuration
    - PM2 setup
    - _Requirements: 13.1, 13.4_

  - [x] 19.3 Create Postman collection for API testing
    - Auth endpoints
    - Menu endpoints
    - Cart endpoints
    - Order endpoints
    - User endpoints
    - Settings endpoints
    - _Requirements: All API_

- [x] 20. Final Checkpoint - Ensure all tests pass
  - All 38 tests passing
  - 73% code coverage
  - All features implemented and documented
