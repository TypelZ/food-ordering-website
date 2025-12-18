# Food Ordering Website

A simple, working online food ordering and delivery website built for AWS Learner Lab academic projects.

## Features

### Customer
- Browse menu with food images
- Add items to cart
- Checkout and place orders
- View order history and status
- Update profile and password

### Staff
- Create, update, delete menu items
- Upload food images to S3
- View and manage all orders
- Update order status

### Admin
- Create staff accounts
- Delete customer/staff accounts
- Update staff nicknames

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript, Bootstrap 5
- **Backend**: Node.js, Express.js
- **Database**: MySQL (AWS RDS) / SQLite (development)
- **Storage**: AWS S3 (food images)
- **Authentication**: JWT

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd food-ordering-website
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Seed the admin account:
```bash
npm run seed
```

5. Start the development server:
```bash
npm run dev
```

6. Open http://localhost:3000 in your browser

### Default Admin Credentials
- Email: admin@foodorder.com
- Password: admin123

## Project Structure

```
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Auth & role middleware
│   ├── models/          # Sequelize models
│   ├── routes/          # API routes
│   ├── seeders/         # Database seeders
│   ├── services/        # S3 service
│   ├── tests/           # Jest tests
│   ├── app.js           # Express app
│   └── server.js        # Entry point
├── frontend/
│   ├── css/             # Stylesheets
│   ├── js/              # JavaScript utilities
│   ├── pages/           # HTML pages
│   │   ├── customer/    # Customer pages
│   │   ├── staff/       # Staff pages
│   │   └── admin/       # Admin pages
│   └── index.html       # Landing page
├── .env.example         # Environment template
├── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register customer
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Menu (Public read, Staff write)
- `GET /api/menu` - Get all items
- `GET /api/menu/:id` - Get single item
- `POST /api/menu` - Create item (Staff)
- `PUT /api/menu/:id` - Update item (Staff)
- `DELETE /api/menu/:id` - Delete item (Staff)

### Cart (Customer only)
- `GET /api/cart` - Get cart
- `POST /api/cart/add` - Add item
- `PUT /api/cart/update` - Update quantity
- `DELETE /api/cart/remove/:id` - Remove item
- `DELETE /api/cart/clear` - Clear cart

### Orders
- `GET /api/orders` - Get orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create order (Customer)
- `PUT /api/orders/:id/status` - Update status (Staff)

### Users (Admin only)
- `GET /api/users` - Get all users
- `POST /api/users/staff` - Create staff
- `PUT /api/users/staff/:id` - Update staff
- `DELETE /api/users/:id` - Delete user

### Settings
- `GET /api/settings/profile` - Get profile
- `PUT /api/settings/profile` - Update profile
- `PUT /api/settings/password` - Change password

## Testing

Run tests:
```bash
npm test
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DB_HOST | Database host | localhost |
| DB_PORT | Database port | 3306 |
| DB_USER | Database user | root |
| DB_PASS | Database password | - |
| DB_NAME | Database name | food_ordering |
| JWT_SECRET | JWT secret key | - |
| JWT_EXPIRES_IN | Token expiry | 24h |
| AWS_REGION | AWS region | us-east-1 |
| S3_BUCKET | S3 bucket name | - |
| PORT | Server port | 3000 |
| NODE_ENV | Environment | development |

## License

ISC
