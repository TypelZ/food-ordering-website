# Requirements Document

## Introduction

This document specifies the requirements for an Online Food Ordering and Delivery Website designed for an AWS Learner Lab academic project. The system enables customers to browse menus, place orders, and track deliveries, while staff manage menu items and orders, and administrators manage user accounts. The system uses a simple, working architecture suitable for limited AWS resources (1 EC2, 1 RDS, S3 for images).

## Glossary

- **System**: The Online Food Ordering and Delivery Website application
- **Customer**: A registered user who can browse menus, place orders, and track deliveries
- **Staff**: A user account created by Admin who manages menu items and orders
- **Admin**: A privileged user who manages Staff and Customer accounts
- **JWT**: JSON Web Token used for authentication
- **Cart**: A temporary collection of menu items selected by a Customer before checkout
- **Order**: A confirmed purchase containing one or more menu items with a status
- **Menu Item**: A food product with name, description, price, and image

## Requirements

### Requirement 1: User Registration

**User Story:** As a visitor, I want to register as a Customer, so that I can place food orders.

#### Acceptance Criteria

1. WHEN a visitor submits valid registration data (nickname, email, password, delivery address) THEN the System SHALL create a new Customer account with hashed password
2. WHEN a visitor attempts to register with an existing email THEN the System SHALL reject the registration and return an error message
3. WHEN a visitor submits registration data with missing required fields THEN the System SHALL reject the registration and indicate which fields are missing
4. THE System SHALL assign the role "CUSTOMER" to all accounts created through registration

### Requirement 2: User Authentication

**User Story:** As a user, I want to log in and log out securely, so that I can access role-appropriate features.

#### Acceptance Criteria

1. WHEN a user submits valid email and password THEN the System SHALL return a JWT token containing user ID and role
2. WHEN a user submits invalid credentials THEN the System SHALL reject the login and return an authentication error
3. WHEN a user logs out THEN the System SHALL instruct the client to clear the stored JWT token
4. WHEN a request includes an expired or invalid JWT THEN the System SHALL reject the request with an unauthorized error

### Requirement 3: Menu Browsing

**User Story:** As a Customer, I want to view the menu with food images, so that I can decide what to order.

#### Acceptance Criteria

1. WHEN a Customer requests the menu THEN the System SHALL return all menu items with name, description, price, and image URL
2. WHEN menu items are displayed THEN the System SHALL load images from AWS S3 URLs stored in the database
3. THE System SHALL allow unauthenticated users to view the menu

### Requirement 4: Shopping Cart

**User Story:** As a Customer, I want to manage items in my cart, so that I can prepare my order before checkout.

#### Acceptance Criteria

1. WHEN a Customer adds a menu item to the cart THEN the System SHALL store the item with quantity in the cart
2. WHEN a Customer increases item quantity THEN the System SHALL update the quantity and recalculate the total
3. WHEN a Customer decreases item quantity to zero THEN the System SHALL remove the item from the cart
4. WHEN a Customer views the cart THEN the System SHALL display all items with quantities and total price
5. WHEN a Customer removes an item THEN the System SHALL delete the item from the cart and recalculate the total

### Requirement 5: Order Checkout

**User Story:** As a Customer, I want to checkout my cart, so that I can place my food order.

#### Acceptance Criteria

1. WHEN a Customer proceeds to checkout with items in cart THEN the System SHALL create an order with status "Pending"
2. WHEN an order is created THEN the System SHALL save all cart items as order items with quantity and price
3. WHEN an order is created THEN the System SHALL calculate and store the total price
4. WHEN an order is successfully created THEN the System SHALL clear the Customer's cart

### Requirement 6: Order History

**User Story:** As a Customer, I want to view my order history and status, so that I can track my orders.

#### Acceptance Criteria

1. WHEN a Customer requests order history THEN the System SHALL return all orders belonging to that Customer
2. WHEN displaying orders THEN the System SHALL include order ID, status, total price, items, and creation date
3. THE System SHALL restrict Customers to viewing only their own orders

### Requirement 7: Customer Settings

**User Story:** As a Customer, I want to update my profile settings, so that I can keep my information current.

#### Acceptance Criteria

1. WHEN a Customer updates their nickname THEN the System SHALL save the new nickname
2. WHEN a Customer updates their email to a unique value THEN the System SHALL save the new email
3. WHEN a Customer updates their email to an existing email THEN the System SHALL reject the update
4. WHEN a Customer updates their password THEN the System SHALL hash and save the new password
5. WHEN a Customer updates their delivery address THEN the System SHALL save the new address

### Requirement 8: Menu Management (Staff)

**User Story:** As a Staff member, I want to manage menu items, so that I can keep the menu current.

#### Acceptance Criteria

1. WHEN Staff creates a menu item with name, description, price, and image THEN the System SHALL upload the image to S3 and save the item with the image URL
2. WHEN Staff updates a menu item THEN the System SHALL save the updated fields
3. WHEN Staff updates a menu item image THEN the System SHALL upload the new image to S3 and update the URL
4. WHEN Staff deletes a menu item THEN the System SHALL remove the item from the database
5. WHILE a user has role "CUSTOMER" THEN the System SHALL deny access to menu management endpoints

### Requirement 9: Order Management (Staff)

**User Story:** As a Staff member, I want to manage orders, so that I can process customer requests.

#### Acceptance Criteria

1. WHEN Staff requests all orders THEN the System SHALL return all orders with customer info and items
2. WHEN Staff updates order status THEN the System SHALL save the new status
3. THE System SHALL restrict order status values to: Pending, Preparing, Ready, Completed, Cancelled
4. WHILE a user has role "CUSTOMER" THEN the System SHALL deny access to order management endpoints

### Requirement 10: Staff Settings

**User Story:** As a Staff member, I want to change my password, so that I can maintain account security.

#### Acceptance Criteria

1. WHEN Staff updates their password THEN the System SHALL hash and save the new password
2. WHILE a user has role "STAFF" THEN the System SHALL deny updates to nickname, email, and delivery address

### Requirement 11: User Management (Admin)

**User Story:** As an Admin, I want to manage user accounts, so that I can control system access.

#### Acceptance Criteria

1. WHEN Admin creates a Staff account with nickname, email, and password THEN the System SHALL create the account with role "STAFF"
2. WHEN Admin attempts to create a Customer account THEN the System SHALL reject the request
3. WHEN Admin deletes a Customer account THEN the System SHALL remove the account from the database
4. WHEN Admin deletes a Staff account THEN the System SHALL remove the account from the database
5. WHEN Admin updates a Staff nickname THEN the System SHALL save the new nickname
6. WHEN Admin attempts to edit Customer data THEN the System SHALL reject the request
7. WHILE a user does not have role "ADMIN" THEN the System SHALL deny access to user management endpoints

### Requirement 12: Role-Based Access Control

**User Story:** As a system operator, I want role-based access control, so that users can only access appropriate features.

#### Acceptance Criteria

1. WHEN a request requires authentication THEN the System SHALL verify the JWT token before processing
2. WHEN a request requires a specific role THEN the System SHALL verify the user's role matches the requirement
3. WHEN an unauthorized user attempts to access a protected resource THEN the System SHALL return a 403 Forbidden response
4. WHEN an unauthenticated user attempts to access a protected resource THEN the System SHALL return a 401 Unauthorized response

### Requirement 13: Data Persistence

**User Story:** As a system operator, I want data stored reliably, so that information persists across sessions.

#### Acceptance Criteria

1. THE System SHALL store user data in AWS RDS MySQL database
2. THE System SHALL store menu items in AWS RDS MySQL database
3. THE System SHALL store orders and order items in AWS RDS MySQL database
4. THE System SHALL store food images in AWS S3 bucket
5. WHEN storing passwords THEN the System SHALL hash them using bcrypt before saving

### Requirement 14: Frontend Navigation

**User Story:** As a user, I want role-appropriate navigation, so that I can access features relevant to my role.

#### Acceptance Criteria

1. WHEN a Customer logs in THEN the System SHALL display navigation for Menu, Cart, Orders, and Settings
2. WHEN Staff logs in THEN the System SHALL display navigation for Menu Management, Order Management, and Settings
3. WHEN Admin logs in THEN the System SHALL display navigation for User Management
4. WHEN a user logs out THEN the System SHALL redirect to the login page and clear stored tokens
