# Design Document

## Introduction

**Food Ordering Website** is a full-stack web application that enables customers to browse menus, place orders, and track deliveries online. Built as an academic project for AWS Learner Lab, the system demonstrates cloud deployment practices using AWS services including EC2, RDS, S3, and Auto Scaling.

The application supports three user roles with distinct functionalities:
- **Customers** can browse the menu, manage their shopping cart, place orders with custom delivery addresses, and track order history
- **Staff** can manage menu items (add, edit, delete with images), view all customer orders, and update order statuses through the workflow (Pending → Preparing → Ready → Completed)
- **Administrators** can manage user accounts, create staff accounts, and oversee system operations

### Key Features
- Secure JWT-based authentication with bcrypt password hashing
- Role-based access control (RBAC) for protected resources
- Real-time cart management with quantity controls
- Order tracking with status updates
- Responsive UI with Bootstrap 5 and custom gradient styling
- Local image storage with S3 support for production

### Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5
- **Backend**: Node.js, Express.js, Sequelize ORM
- **Database**: MySQL (AWS RDS) / SQLite (local development)
- **Authentication**: JWT with bcrypt password hashing
- **Image Storage**: Local filesystem / AWS S3
- **Process Manager**: PM2
- **Web Server**: Nginx (reverse proxy)

---

## AWS Resources Deployed

### Resource Summary

| Resource | Service | Purpose |
|----------|---------|---------|
| Web Server | EC2 (t2.micro) | Hosts Node.js application and Nginx |
| Database | RDS MySQL (db.t3.micro) | Stores users, menu items, orders |
| Image Storage | S3 Bucket | Stores menu item images (optional) |
| Load Balancer | Application Load Balancer | Distributes traffic across instances |
| Auto Scaling | Auto Scaling Group | Maintains application availability |
| AMI | Amazon Machine Image | Pre-configured application snapshot |

### AWS Services Explanation

#### Amazon EC2 (Elastic Compute Cloud)
EC2 provides resizable virtual servers in the cloud. For this project, a t2.micro instance runs the Node.js application with Nginx as a reverse proxy. EC2 allows full control over the server environment, enabling installation of Node.js, PM2, and other dependencies.

**Configuration:**
- Instance Type: t2.micro (1 vCPU, 1 GB RAM)
- OS: Amazon Linux 2 / Ubuntu
- Security Group: Ports 22 (SSH), 80 (HTTP), 443 (HTTPS), 3000 (Node.js)

#### Amazon RDS (Relational Database Service)
RDS provides managed MySQL database hosting, handling backups, patching, and maintenance automatically. This reduces operational overhead compared to self-managed databases on EC2.

**Configuration:**
- Engine: MySQL 8.0
- Instance Class: db.t3.micro
- Storage: 20 GB SSD
- Multi-AZ: Disabled (for cost savings in academic environment)

#### Amazon S3 (Simple Storage Service)
S3 provides scalable object storage for menu item images. Images are stored with public read access, allowing direct browser access without authentication. For local development, images are stored in the `backend/uploads/` folder instead.

**Configuration:**
- Bucket: Public read access for images
- Storage Class: Standard
- Region: Same as EC2/RDS

#### Application Load Balancer (ALB)
ALB distributes incoming HTTP traffic across multiple EC2 instances, providing high availability and fault tolerance. It performs health checks to route traffic only to healthy instances.

**Configuration:**
- Listener: HTTP (Port 80)
- Target Group: EC2 instances on port 3000
- Health Check: /api/health endpoint

#### Auto Scaling Group
Auto Scaling automatically adjusts the number of EC2 instances based on demand or health status. It ensures the application remains available even if an instance fails.

**Configuration:**
- Minimum Instances: 1
- Maximum Instances: 3
- Desired Capacity: 1
- Scaling Policy: Target tracking (CPU utilization)

#### Amazon Machine Image (AMI)
AMI is a snapshot of a configured EC2 instance, including the OS, application code, and dependencies. Creating an AMI allows rapid deployment of identical instances for scaling or recovery.

**Contents:**
- Node.js runtime
- Application code
- PM2 configuration
- Nginx configuration
- Environment setup

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                         Client Browser                         │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Frontend (HTML/CSS/JS/Bootstrap)           │   │
│  │  - Static pages served by Nginx                         │   │
│  │  - Fetch API for backend communication                  │   │
│  │  - JWT stored in localStorage                           │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Application Load Balancer                      │
│                    (Distributes Traffic)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                    Auto Scaling Group                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  AWS EC2 Instance(s)                    │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │              Nginx (Port 80)                    │    │   │
│  │  │  - Reverse proxy to Node.js                     │    │   │
│  │  │  - Serves static frontend files                 │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │                          │                              │   │
│  │                          ▼                              │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │          PM2 → Node.js (Port 3000)              │    │   │
│  │  │  - Express REST API                             │    │   │
│  │  │  - JWT authentication                           │    │   │
│  │  │  - Role-based authorization                     │    │   │
│  │  │  - Sequelize ORM                                │    │   │
│  │  │  - Local image storage (/uploads)               │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
          │                                      │
          ▼                                      ▼
┌──────────────────────┐              ┌──────────────────────┐
│     AWS RDS MySQL    │              │   AWS S3 (Optional)  │
│  - users table       │              │  - Menu images       │
│  - menu_items table  │              │  - Public read       │
│  - orders table      │              │                      │
│  - order_items table │              │                      │
└──────────────────────┘              └──────────────────────┘
```

## Components and Interfaces

### Backend Structure

```
backend/
├── config/
│   └── database.js          # Sequelize DB configuration (MySQL/SQLite)
├── middleware/
│   ├── auth.js              # JWT verification middleware
│   └── roleCheck.js         # Role-based authorization
├── models/
│   ├── index.js             # Sequelize model loader & associations
│   ├── User.js              # User model with password hashing
│   ├── MenuItem.js          # Menu item model
│   ├── Order.js             # Order model with delivery_address
│   └── OrderItem.js         # Order item model
├── controllers/
│   ├── authController.js    # Registration, login, logout
│   ├── menuController.js    # Menu CRUD with image upload
│   ├── cartController.js    # In-memory cart management
│   ├── orderController.js   # Order creation & status updates
│   ├── userController.js    # Admin user management
│   └── settingsController.js # Profile & password updates
├── routes/
│   ├── auth.js              # /api/auth/*
│   ├── menu.js              # /api/menu/*
│   ├── cart.js              # /api/cart/*
│   ├── orders.js            # /api/orders/*
│   ├── users.js             # /api/users/*
│   └── settings.js          # /api/settings/*
├── services/
│   └── s3Service.js         # Image upload (local or S3)
├── uploads/                 # Local image storage folder
├── seeders/
│   └── adminSeeder.js       # Default admin account creation
├── tests/                   # Jest test files
├── app.js                   # Express app setup
└── server.js                # Server entry point
```

### Frontend Structure

```
frontend/
├── css/
│   └── style.css            # Custom styles (gradients, brown accents)
├── js/
│   ├── api.js               # Fetch wrapper, formatCurrency (RM), utilities
│   └── auth.js              # Login/logout, role-based redirects
├── pages/
│   ├── login.html           # Login page
│   ├── register.html        # Customer registration
│   ├── customer/
│   │   ├── dashboard.html   # Customer home with navigation
│   │   ├── menu.html        # Menu browsing with quantity selector
│   │   ├── cart.html        # Cart with delivery address input
│   │   ├── orders.html      # Order history with addresses
│   │   └── settings.html    # Profile & password settings
│   ├── staff/
│   │   ├── dashboard.html   # Staff home
│   │   ├── menu.html        # Menu management (CRUD + images)
│   │   ├── orders.html      # Order management with status updates
│   │   └── settings.html    # Password change only
│   └── admin/
│       ├── dashboard.html   # Admin home
│       └── users.html       # User management
└── index.html               # Landing page
```

### API Endpoints

#### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /register | Register new customer | Public |
| POST | /login | User login, returns JWT | Public |
| POST | /logout | User logout | Authenticated |

#### Menu (`/api/menu`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | / | Get all menu items | Public |
| GET | /:id | Get single menu item | Public |
| POST | / | Create menu item (with image) | Staff |
| PUT | /:id | Update menu item (with image) | Staff |
| DELETE | /:id | Delete menu item | Staff |

#### Cart (`/api/cart`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | / | Get cart contents with total | Customer |
| POST | /add | Add item to cart (with quantity) | Customer |
| PUT | /update | Update item quantity | Customer |
| DELETE | /remove/:itemId | Remove item from cart | Customer |
| DELETE | /clear | Clear entire cart | Customer |

#### Orders (`/api/orders`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | / | Get orders (own for Customer, all for Staff) | Authenticated |
| GET | /:id | Get order details with items | Authenticated |
| POST | / | Create order with delivery_address | Customer |
| PUT | /:id/status | Update order status | Staff |

#### Users (`/api/users`) - Admin Only
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | / | Get all users | Admin |
| POST | /staff | Create staff account | Admin |
| PUT | /staff/:id | Update staff nickname | Admin |
| DELETE | /:id | Delete user (not admin) | Admin |

#### Settings (`/api/settings`)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /profile | Get current user profile | Authenticated |
| PUT | /profile | Update profile (Customer only) | Customer |
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
│ created_at      │       │ updated_at      │
└─────────────────┘       └─────────────────┘
        │                         │
        │ 1:N                     │
        ▼                         │
┌─────────────────┐               │
│     orders      │               │
├─────────────────┤               │
│ id (PK)         │               │
│ user_id (FK)    │               │
│ status          │               │
│ total_price     │               │
│ delivery_address│               │
│ created_at      │               │
│ updated_at      │               │
└─────────────────┘               │
        │                         │
        │ 1:N                     │
        ▼                         │
┌─────────────────┐               │
│   order_items   │               │
├─────────────────┤               │
│ id (PK)         │               │
│ order_id (FK)   │───────────────┘
│ menu_item_id(FK)│
│ quantity        │
│ price           │
│ created_at      │
│ updated_at      │
└─────────────────┘
```

### Model Details

#### User Model
- **id**: Auto-increment primary key
- **nickname**: Display name (required)
- **email**: Unique email address (required)
- **password**: Bcrypt hashed password (required)
- **role**: ENUM ('CUSTOMER', 'STAFF', 'ADMIN'), default 'CUSTOMER'
- **delivery_address**: Optional default delivery address
- **Hooks**: Password auto-hashed before save

#### MenuItem Model
- **id**: Auto-increment primary key
- **name**: Item name (required)
- **description**: Optional description
- **price**: Decimal price in RM (required)
- **image_url**: Local path (/uploads/...) or S3 URL

#### Order Model
- **id**: Auto-increment primary key
- **user_id**: Foreign key to users
- **status**: ENUM ('Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled')
- **total_price**: Calculated total in RM
- **delivery_address**: Address for this specific order

#### OrderItem Model
- **id**: Auto-increment primary key
- **order_id**: Foreign key to orders
- **menu_item_id**: Foreign key to menu_items
- **quantity**: Number of items
- **price**: Price at time of order

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Registration creates Customer with hashed password
*For any* valid registration data, registering should create a user with role "CUSTOMER" and a bcrypt-hashed password.
**Validates: Requirements 1.1, 1.4, 13.5**

### Property 2: Email uniqueness constraint
*For any* existing user email, attempting to register or update to that email should be rejected.
**Validates: Requirements 1.2, 7.3**

### Property 3: Registration validation rejects incomplete data
*For any* registration data missing required fields, the system should reject with validation errors.
**Validates: Requirements 1.3**

### Property 4: JWT contains correct claims
*For any* successful login, the JWT should contain correct user ID, email, and role.
**Validates: Requirements 2.1**

### Property 5: Invalid credentials rejected
*For any* login with wrong email or password, the system should reject with authentication error.
**Validates: Requirements 2.2**

### Property 6: Invalid JWT rejected
*For any* request with expired, malformed, or invalid JWT, return 401 Unauthorized.
**Validates: Requirements 2.4, 12.1, 12.4**

### Property 7: Menu retrieval returns complete items
*For any* menu request, all items should include name, description, price, and image_url.
**Validates: Requirements 3.1**

### Property 8: Cart operations maintain consistency
*For any* cart operations, total should equal sum of (price × quantity) for all items.
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**

### Property 9: Order creation integrity
*For any* checkout, order should have status "Pending", correct items, and cart should be cleared.
**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

### Property 10: Customer order isolation
*For any* customer, only their own orders should be returned.
**Validates: Requirements 6.1, 6.3**

### Property 11: Order response completeness
*For any* order, response should include id, status, total_price, items, and delivery_address.
**Validates: Requirements 6.2**

### Property 12: Profile updates persist correctly
*For any* valid profile update, changes should be reflected when retrieved.
**Validates: Requirements 7.1, 7.2, 7.5**

### Property 13: Password updates are hashed
*For any* password update, the new password should be bcrypt hashed.
**Validates: Requirements 7.4, 10.1**

### Property 14: Menu CRUD operations persist
*For any* menu create/update/delete, changes should persist correctly.
**Validates: Requirements 8.1, 8.2, 8.4**

### Property 15: Order status updates persist
*For any* status update, the order should reflect the new status.
**Validates: Requirements 9.2, 9.3**

### Property 16: Role-based access control enforcement
*For any* protected endpoint, unauthorized users should receive 403 Forbidden.
**Validates: Requirements 8.5, 9.4, 11.7, 12.2, 12.3**

### Property 17: Staff account creation by Admin
*For any* staff creation by Admin, a user with role "STAFF" should be created.
**Validates: Requirements 11.1**

### Property 18: User deletion removes account
*For any* user deletion, the user should no longer exist and login should fail.
**Validates: Requirements 11.3, 11.4**

### Property 19: Staff settings restrictions
*For any* Staff user, profile updates (except password) should be rejected.
**Validates: Requirements 10.2**

## Error Handling

### HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Successful GET, PUT, DELETE |
| 201 | Successful POST (resource created) |
| 400 | Bad Request (validation errors) |
| 401 | Unauthorized (missing/invalid JWT) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate email) |
| 500 | Internal Server Error |

### Response Format

```json
// Success
{
  "success": true,
  "message": "Operation completed",
  "data": { ... }
}

// Error
{
  "success": false,
  "message": "Error description",
  "errors": ["field1 is required"]
}
```

## Testing Strategy

### Framework
- **Unit/Integration Testing**: Jest
- **Property-Based Testing**: fast-check
- **API Testing**: Supertest

### Test Coverage
- 38 tests across 7 test suites
- 73% code coverage
- All correctness properties validated

### Test Files
- `auth.test.js` - Authentication properties (1, 3, 4, 5)
- `menu.test.js` - Menu CRUD properties (7, 14)
- `cart.test.js` - Cart operations property (8)
- `order.test.js` - Order properties (9, 10, 11, 15)
- `user.test.js` - User management properties (17, 18)
- `settings.test.js` - Settings properties (2, 12, 13, 19)
- `rbac.test.js` - Access control properties (6, 16)

## Security Considerations

1. **Password Security**: bcrypt with 10 salt rounds
2. **JWT Security**: 24-hour expiration, secure secret
3. **Input Validation**: All inputs validated and sanitized
4. **SQL Injection Prevention**: Sequelize parameterized queries
5. **Role-Based Access**: Middleware enforces permissions
6. **File Upload**: Image type validation, size limits (5MB)
