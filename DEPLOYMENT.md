# AWS Deployment Guide

This guide covers deploying the Food Ordering Website to AWS using EC2, RDS, and S3.

## Prerequisites

- AWS Academy Learner Lab access
- Basic knowledge of AWS Console
- SSH client (PuTTY for Windows or terminal for Mac/Linux)

## Architecture

```
Internet → EC2 (Nginx + Node.js) → RDS MySQL
                ↓
              S3 (Images)
```

## Step 1: Create RDS MySQL Database

1. Go to **RDS** in AWS Console
2. Click **Create database**
3. Choose:
   - Engine: MySQL
   - Template: Free tier
   - DB instance identifier: `food-ordering-db`
   - Master username: `admin`
   - Master password: (choose a strong password)
4. Under **Connectivity**:
   - VPC: Default VPC
   - Public access: Yes (for Learner Lab)
   - Security group: Create new
5. Under **Additional configuration**:
   - Initial database name: `food_ordering`
6. Click **Create database**
7. Wait for status to become "Available"
8. Note the **Endpoint** (e.g., `food-ordering-db.xxxxx.us-east-1.rds.amazonaws.com`)

### Configure Security Group

1. Click on the RDS instance
2. Under **Security**, click the security group
3. Edit **Inbound rules**
4. Add rule:
   - Type: MySQL/Aurora
   - Source: Anywhere (0.0.0.0/0) or your EC2 security group

## Step 2: Create S3 Bucket

1. Go to **S3** in AWS Console
2. Click **Create bucket**
3. Bucket name: `food-images-<your-unique-id>`
4. Region: Same as your EC2/RDS
5. Uncheck "Block all public access"
6. Acknowledge the warning
7. Click **Create bucket**

### Configure Bucket Policy

1. Go to bucket → **Permissions** → **Bucket policy**
2. Add this policy (replace `YOUR-BUCKET-NAME`):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
        }
    ]
}
```

### Configure CORS

1. Go to bucket → **Permissions** → **CORS**
2. Add:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

## Step 3: Launch EC2 Instance

1. Go to **EC2** in AWS Console
2. Click **Launch instance**
3. Configure:
   - Name: `food-ordering-server`
   - AMI: Amazon Linux 2023
   - Instance type: t2.micro (free tier)
   - Key pair: Create new or use existing
   - Network settings:
     - Allow SSH (port 22)
     - Allow HTTP (port 80)
     - Allow HTTPS (port 443)
4. Click **Launch instance**
5. Note the **Public IPv4 address**

## Step 4: Connect to EC2

### Using SSH (Mac/Linux)

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ec2-user@<EC2-PUBLIC-IP>
```

### Using PuTTY (Windows)

1. Convert .pem to .ppk using PuTTYgen
2. Connect using PuTTY with the .ppk file

## Step 5: Install Dependencies on EC2

```bash
# Update system
sudo yum update -y

# Install Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Install Git
sudo yum install -y git

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo yum install -y nginx
```

## Step 6: Clone and Configure Project

```bash
# Clone repository
cd /home/ec2-user
git clone <your-repository-url> food-ordering
cd food-ordering

# Install dependencies
npm install

# Create .env file
nano .env
```

Add to `.env`:

```
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_PORT=3306
DB_USER=admin
DB_PASS=your-rds-password
DB_NAME=food_ordering

JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRES_IN=24h

AWS_REGION=us-east-1
S3_BUCKET=your-s3-bucket-name

PORT=3000
NODE_ENV=production
```

Save and exit (Ctrl+X, Y, Enter)

## Step 7: Initialize Database

```bash
# Seed admin account
npm run seed
```

## Step 8: Configure PM2

```bash
# Start application with PM2
pm2 start backend/server.js --name food-ordering

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command it outputs
```

## Step 9: Configure Nginx

```bash
# Edit Nginx config
sudo nano /etc/nginx/nginx.conf
```

Replace the `server` block with:

```nginx
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Test Nginx config
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

## Step 10: Configure IAM Role for S3

1. Go to **IAM** in AWS Console
2. Click **Roles** → **Create role**
3. Select **AWS service** → **EC2**
4. Add permission: `AmazonS3FullAccess`
5. Name: `EC2-S3-Access`
6. Create role

### Attach Role to EC2

1. Go to EC2 instance
2. Actions → Security → Modify IAM role
3. Select `EC2-S3-Access`
4. Save

## Step 11: Test Deployment

1. Open browser: `http://<EC2-PUBLIC-IP>`
2. Login with admin credentials:
   - Email: admin@foodorder.com
   - Password: admin123

## Troubleshooting

### Check Application Logs
```bash
pm2 logs food-ordering
```

### Check Nginx Logs
```bash
sudo tail -f /var/log/nginx/error.log
```

### Restart Services
```bash
pm2 restart food-ordering
sudo systemctl restart nginx
```

### Check Database Connection
```bash
mysql -h <RDS-ENDPOINT> -u admin -p food_ordering
```

## Security Notes

1. Change default admin password after first login
2. Use strong JWT_SECRET in production
3. Consider using HTTPS with SSL certificate
4. Restrict RDS security group to EC2 only
5. Enable RDS encryption for sensitive data

## Cost Optimization

- Use t2.micro for EC2 (free tier eligible)
- Use db.t3.micro for RDS (free tier eligible)
- S3 costs are minimal for small image storage
- Stop instances when not in use (Learner Lab)
