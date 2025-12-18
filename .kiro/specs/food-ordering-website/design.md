# Design Document

## Overview

The Online Food Ordering and Delivery Website is a full-stack web application designed for AWS Learner Lab academic projects. It provides a simple, working system for customers to order food, staff to manage menus and orders, and admins to manage users. The architecture prioritizes simplicity and reliability within limited AWS resources (1 EC2, 1 RDS, S3).

### UI Design Theme
- Simple and friendly interface
- Black-to-white gradient color scheme
- Brown accent colors for warmth (buttons, highlights)
- Clean Bootstrap 5 components
- Minimal visual clutter

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Browser                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Frontend (HTML/CSS/JS/Bootstrap)            │   │
│  │  - Static pages served by Nginx                          │   │
│  │  - Fetch API for backend communication                   │   │
│  │  - JWT stored in localStorage                            │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AWS EC2 Instance                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Nginx (Port 80)                       │   │
│  │  - Reverse proxy to Node.js                              │   │
│  │  - Serves static frontend files                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Node.js/Express (Port 3000)                 │   │
│  │  - REST API endpoints                                    │   │
│  │  - JWT authentication                                    │   │
│  │  - Role-based authorization                              │   │
│  │  - Sequelize ORM                                         │   │
│  │  - PM2 process manager                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
          │                                      │
          ▼                                      ▼
┌──────────────────────┐              ┌──────────────────────┐
│     AWS RDS MySQL    │              │       AWS S3         │
│  - users table       │              │  - Food images       │
│  - menu_items table  │              │  - Public read       │
│  - orders table      │              │                      │
│  - order_items table │              │                      │
└──────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Backend Structure

```
backend/
├── config/
│   └── database.js          # Sequelize DB configuration
├── middleware/
│   ├── auth.js              # JWT verification middleware
│   └── roleCheck.js         # Role-based authorization
├── models/
│   ├── index.js             # Sequelize model loader
│   ├── User.js              # User model
│   ├── MenuItem.js          # Menu item model
│   ├── Order.js             # Order model
│   └── OrderItem.js         # Order item model
├── controllers/
│   ├── authController.js    # Auth logic
│   ├── menuController.js    # Menu CRUD logic
│   ├── cartController.js    # Cart logic (session-based)
│   ├── orderController.js   # Order logic
│   ├── userController.js    # User management logic
│   └── settingsController.js # Settings logic
├── routes/
│   ├── auth.js              # /api/auth/*
│   ├── menu.js              # /api/menu/*
│   ├── cart.js              # /api/cart/*
│   ├── orders.js            # /api/orders/*
│   ├── users.js             # /api/users/*
│   └── settings.js          # /api/settings/*
├── services/
│   └── s3Service.js         # S3 upload service
├── .env                     # Environment variables
├── app.js                   # Express app setup
└── server.js                # Server entry point
```

### Frontend Structure

```
frontend/
├── css/
│   └── style.css            # Custom styles (gradients, brown accents)
├── js/
│   ├── api.js               # Fetch API wrapper
│   ├── auth.js              # Auth functions
│   ├── cart.js              # Cart management
│   └── utils.js             # Utility functions
├── pages/
│   ├── login.html           # Login page
│   ├── register.html        # Registration page
│   ├── customer/
│   │   ├── dashboard.html   # Customer home
│   │   ├── menu.html        # Menu browsing
│   │   ├── cart.html        # Shopping cart
│   │   ├── orders.html      # Order history
│   │   └── settings.html    # Customer settings
│   ├── staff/
│   │   ├── dashboard.html   # Staff home
│   │   ├── menu.html        # Menu management
│   │   ├── orders.html      # Order management
│   │   └── settings.html    # Staff settings
│   └── admin/
│       ├── dashboard.html   # Admin home
│       └── users.html       # User management
└── index.html               # Landing/redirect page
```

### API Endpoints

#### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /register | Register new customer | Public |
| POST | /login | User login | Public |
| POST | /logout | User logout | Authenticated |

#### Menu (`/api/menu`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | / | Get all menu items | Public |
| GET | /:id | Get single menu item | Public |
| POST | / | Create menu item | Staff |
| PUT | /:id | Update menu item | Staff |
| DELETE | /:id | Delete menu item | Staff |
| POST | /:id/image | Upload menu image | Staff |

#### Cart (`/api/cart`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | / | Get cart contents | Customer |
| POST | /add | Add item to cart | Customer |
| PUT | /update | Update item quantity | Customer |
| DELETE | /remove/:itemId | Remove item from cart | Customer |
| DELETE | /clear | Clear cart | Customer |

#### Orders (`/api/orders`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | / | Get orders (own for Customer, all for Staff) | Authenticated |
| GET | /:id | Get order details | Authenticated |
| POST | / | Create order (checkout) | Customer |
| PUT | /:id/status | Update order status | Staff |

#### Users (`/api/users`) - Admin Only
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | / | Get all users | Admin |
| POST | /staff | Create staff account | Admin |
| PUT | /staff/:id | Update staff nickname | Admin |
| DELETE | /:id | Delete user | Admin |

#### Settings (`/api/settings`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /profile | Get current user profile | Authenticated |
| PUT | /profile | Update profile | Customer |
| PUT | /password | Change password | Authenticated |

## Data Models

### Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│     users       │       │   menu_items    │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ nickname        │       │ name            │
│ email (UNIQUE)  │       │ description     │
│ password        │       │ price           │
│ role            │       │ image_url       │
│ delivery_address│       │ created_at      │
│ created_at      │       └─────────────────┘
└─────────────────┘               │
        │                         │
        │ 1:N                     │
        ▼                         │
┌─────────────────┐               │
│     orders      │               │
├─────────────────┤               │
│ id (PK)         │               │
│ user_id (FK)    │───────────────┘
│ status          │               │
│ total_price     │               │
│ created_at      │               │
└─────────────────┘               │
        │                         │
        │ 1:N                     │
        ▼                         │
┌─────────────────┐               │
│   order_items   │               │
├─────────────────┤               │
│ id (PK)         │               │
│ order_id (FK)   │               │
│ menu_item_id(FK)│───────────────┘
│ quantity        │
│ price           │
└─────────────────┘
```

### SQL Schema

```sql
-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nickname VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('CUSTOMER', 'STAFF', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER',
    delivery_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Menu items table
CREATE TABLE menu_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    status ENUM('Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled') DEFAULT 'Pending',
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Order items table
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    menu_item_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
);

-- Create default admin account (password: admin123)
INSERT INTO users (nickname, email, password, role) 
VALUES ('Admin', 'admin@foodorder.com', '$2b$10$...hashedpassword...', 'ADMIN');
```

### Sequelize Models

#### User Model
```javascript
{
  id: { type: INTEGER, primaryKey: true, autoIncrement: true },
  nickname: { type: STRING(100), allowNull: false },
  email: { type: STRING(255), allowNull: false, unique: true },
  password: { type: STRING(255), allowNull: false },
  role: { type: ENUM('CUSTOMER', 'STAFF', 'ADMIN'), defaultValue: 'CUSTOMER' },
  delivery_address: { type: TEXT, allowNull: true }
}
```

#### MenuItem Model
```javascript
{
  id: { type: INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: STRING(255), allowNull: false },
  description: { type: TEXT },
  price: { type: DECIMAL(10, 2), allowNull: false },
  image_url: { type: STRING(500) }
}
```

#### Order Model
```javascript
{
  id: { type: INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: INTEGER, allowNull: false },
  status: { type: ENUM('Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'), defaultValue: 'Pending' },
  total_price: { type: DECIMAL(10, 2), allowNull: false }
}
```

#### OrderItem Model
```javascript
{
  id: { type: INTEGER, primaryKey: true, autoIncrement: true },
  order_id: { type: INTEGER, allowNull: false },
  menu_item_id: { type: INTEGER, allowNull: false },
  quantity: { type: INTEGER, allowNull: false },
  price: { type: DECIMAL(10, 2), allowNull: false }
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Registration creates Customer with hashed password
*For any* valid registration data (nickname, email, password, delivery address), registering should create a user with role "CUSTOMER" and a bcrypt-hashed password that is not equal to the plain text password.
**Validates: Requirements 1.1, 1.4, 13.5**

### Property 2: Email uniqueness constraint
*For any* existing user email, attempting to register or update to that email should be rejected with an appropriate error.
**Validates: Requirements 1.2, 7.3**

### Property 3: Registration validation rejects incomplete data
*For any* registration data missing required fields (nickname, email, or password), the system should reject the registration and indicate the missing fields.
**Validates: Requirements 1.3**

### Property 4: JWT contains correct claims
*For any* successful login, the returned JWT should decode to contain the correct user ID and role matching the authenticated user.
**Validates: Requirements 2.1**

### Property 5: Invalid credentials rejected
*For any* login attempt with non-existent email or incorrect password, the system should reject with an authentication error.
**Validates: Requirements 2.2**

### Property 6: Invalid JWT rejected
*For any* request with an expired, malformed, or invalid JWT to a protected endpoint, the system should return a 401 Unauthorized response.
**Validates: Requirements 2.4, 12.1, 12.4**

### Property 7: Menu retrieval returns complete items
*For any* menu request, all menu items in the database should be returned with name, description, price, and image_url fields present.
**Validates: Requirements 3.1**

### Property 8: Cart operations maintain consistency
*For any* sequence of cart add/update/remove operations, the cart total should equal the sum of (item price × quantity) for all items, and items with zero quantity should not exist in the cart.
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

### Property 9: Order creation integrity
*For any* checkout with a non-empty cart, the created order should have status "Pending", contain all cart items as order items with correct quantities and prices, have total_price equal to sum of order items, and the cart should be empty afterward.
**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 10: Customer order isolation
*For any* customer requesting their orders, only orders where user_id matches the customer's ID should be returned.
**Validates: Requirements 6.1, 6.3**

### Property 11: Order response completeness
*For any* order returned by the system, it should include id, status, total_price, items array, and created_at fields.
**Validates: Requirements 6.2**

### Property 12: Profile updates persist correctly
*For any* valid profile update (nickname, email, delivery address), retrieving the profile afterward should return the updated values.
**Validates: Requirements 7.1, 7.2, 7.5**

### Property 13: Password updates are hashed
*For any* password update, the stored password should be a bcrypt hash that validates against the new plain text password but is not equal to it.
**Validates: Requirements 7.4, 10.1**

### Property 14: Menu CRUD operations persist
*For any* menu item creation, the item should be retrievable with all provided fields. For any update, the item should reflect the changes. For any deletion, the item should no longer be retrievable.
**Validates: Requirements 8.1, 8.2, 8.4**

### Property 15: Order status updates persist
*For any* valid status update (Pending, Preparing, Ready, Completed, Cancelled), the order should reflect the new status when retrieved.
**Validates: Requirements 9.2, 9.3**

### Property 16: Role-based access control enforcement
*For any* protected endpoint with a role requirement, requests from users without the required role should receive a 403 Forbidden response, and requests without authentication should receive a 401 Unauthorized response.
**Validates: Requirements 8.5, 9.4, 11.7, 12.2, 12.3**

### Property 17: Staff account creation by Admin
*For any* staff creation request by an Admin with valid data, a user with role "STAFF" should be created with the provided nickname and email.
**Validates: Requirements 11.1**

### Property 18: User deletion removes account
*For any* user deletion by Admin, the user should no longer exist in the database and login attempts should fail.
**Validates: Requirements 11.3, 11.4**

### Property 19: Staff settings restrictions
*For any* Staff user attempting to update nickname, email, or delivery_address, the system should reject the update.
**Validates: Requirements 10.2**

## Error Handling

### HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Successful GET, PUT, DELETE |
| 201 | Successful POST (resource created) |
| 400 | Bad Request (validation errors, missing fields) |
| 401 | Unauthorized (missing or invalid JWT) |
| 403 | Forbidden (insufficient role permissions) |
| 404 | Not Found (resource doesn't exist) |
| 409 | Conflict (duplicate email) |
| 500 | Internal Server Error |

### Error Response Format

```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": ["field1 is required", "field2 must be valid email"]
}
```

### Success Response Format

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Handling Strategy

1. **Validation Errors**: Return 400 with list of validation failures
2. **Authentication Errors**: Return 401 with generic "Invalid credentials" message
3. **Authorization Errors**: Return 403 with "Access denied" message
4. **Not Found Errors**: Return 404 with "Resource not found" message
5. **Duplicate Errors**: Return 409 with "Email already exists" message
6. **Server Errors**: Log full error, return 500 with generic message

## Testing Strategy

### Testing Framework

- **Unit Testing**: Jest
- **Property-Based Testing**: fast-check library
- **API Testing**: Supertest for HTTP endpoint testing

### Unit Tests

Unit tests will cover:
- Input validation functions
- Password hashing and verification
- JWT token generation and verification
- Price calculation functions
- Role checking logic

### Property-Based Tests

Each correctness property will be implemented as a property-based test using fast-check:

1. **Property tests must run minimum 100 iterations**
2. **Each test must reference the property it validates**
3. **Format**: `**Feature: food-ordering-website, Property {number}: {property_text}**`

Example test structure:
```javascript
// **Feature: food-ordering-website, Property 1: Registration creates Customer with hashed password**
// **Validates: Requirements 1.1, 1.4, 13.5**
test('registration creates customer with hashed password', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        nickname: fc.string({ minLength: 1, maxLength: 100 }),
        email: fc.emailAddress(),
        password: fc.string({ minLength: 6 }),
        delivery_address: fc.string()
      }),
      async (userData) => {
        // Register user
        // Verify role is CUSTOMER
        // Verify password is hashed (not equal to plain text)
        // Verify bcrypt.compare returns true
      }
    ),
    { numRuns: 100 }
  );
});
```

### Test Categories

1. **Authentication Tests**
   - Registration validation
   - Login success/failure
   - JWT verification
   - Logout behavior

2. **Authorization Tests**
   - Role-based endpoint access
   - Customer isolation
   - Staff restrictions

3. **CRUD Operation Tests**
   - Menu item lifecycle
   - Order lifecycle
   - User management

4. **Business Logic Tests**
   - Cart calculations
   - Order total calculation
   - Status transitions

### Test Data Generation

Using fast-check arbitraries:
- `fc.emailAddress()` for valid emails
- `fc.string()` with constraints for names/passwords
- `fc.double()` for prices
- `fc.integer()` for quantities
- Custom arbitraries for valid order statuses

## Security Considerations

1. **Password Security**
   - bcrypt with salt rounds of 10
   - Never store plain text passwords
   - Never return passwords in API responses

2. **JWT Security**
   - Short expiration time (24 hours)
   - Secure secret key from environment
   - Token stored in localStorage (client-side)

3. **Input Validation**
   - Sanitize all user inputs
   - Validate email format
   - Validate required fields

4. **SQL Injection Prevention**
   - Use Sequelize ORM parameterized queries
   - Never concatenate user input into queries

5. **S3 Security**
   - Use IAM roles (no access keys in code)
   - Public read for images only
   - Validate file types before upload

## AWS Service Justification

| Service | Purpose | Justification |
|---------|---------|---------------|
| EC2 | Application hosting | Single instance sufficient for academic project, runs Node.js and Nginx |
| RDS MySQL | Data persistence | Managed database reduces operational overhead, familiar SQL syntax |
| S3 | Image storage | Scalable, cost-effective for static files, offloads storage from EC2 |

## Deployment Architecture

```
Internet
    │
    ▼
┌─────────────────────────────────────┐
│           AWS EC2 Instance          │
│  ┌─────────────────────────────┐   │
│  │    Nginx (Port 80/443)      │   │
│  │    - Reverse proxy          │   │
│  │    - Static file serving    │   │
│  └─────────────────────────────┘   │
│              │                      │
│              ▼                      │
│  ┌─────────────────────────────┐   │
│  │  PM2 → Node.js (Port 3000)  │   │
│  │    - Express API            │   │
│  │    - JWT Auth               │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
         │                    │
         ▼                    ▼
┌─────────────────┐  ┌─────────────────┐
│   AWS RDS       │  │    AWS S3       │
│   MySQL         │  │   (Images)      │
└─────────────────┘  └─────────────────┘
```
