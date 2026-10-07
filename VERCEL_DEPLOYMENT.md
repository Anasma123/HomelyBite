# VERCEL DEPLOYMENT & DATABASE CONFIGURATION GUIDE

## 🌟 Home Food Marketplace Web Application

This platform is architected specifically for high-performance serverless deployment on **Vercel** with **PostgreSQL** (Neon / Supabase / Vercel Postgres / Railway).

---

### 1. Database Setup for Vercel (PostgreSQL)

Vercel serverless functions run statelessly across Edge & Node regions. A cloud PostgreSQL instance is the industry standard for production.

#### Option A: Neon Serverless Postgres (Recommended - 100% Free Tier)
1. Sign up at [neon.tech](https://neon.tech) and create a new project (e.g. `homefood-marketplace`).
2. Copy your connection string from the Neon dashboard:
   ```env
   DATABASE_URL="postgresql://username:password@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```

#### Option B: Vercel Postgres / Supabase
1. On Vercel dashboard, go to the **Storage** tab and click **Create Database** -> **Postgres**.
2. Automatically attaches `POSTGRES_PRISMA_URL` and `DATABASE_URL` to your Vercel project environment variables.

---

### 2. Pushing the Database Schema to PostgreSQL

Once your `DATABASE_URL` is set, run:
```bash
npx prisma db push
```
This instantly creates all 25+ relational marketplace tables:
- `User`, `CustomerProfile`, `CookerProfile`, `DeliveryPersonProfile`
- `Category`, `SubCategory`, `Tag`
- `Product`, `ProductImage`, `ProductIngredient`, `MasterIngredient`, `Allergen`
- `Order`, `OrderItem`, `OrderStatusHistory`, `PayoutLedger`, `DeliveryAssignment`
- `Review`, `Coupon`, `AuditLog`, `OTPVerification`, `Notification`

---

### 3. Deploying to Vercel in 2 Minutes

#### Step 1: Push your project to GitHub / GitLab
```bash
git init
git add .
git commit -m "feat: complete homefood marketplace production build"
git remote add origin https://github.com/your-username/homefood-marketplace.git
git push -u origin main
```

#### Step 2: Import into Vercel
1. Go to [vercel.com/new](https://vercel.com/new).
2. Select your GitHub repository.
3. Framework Preset: **Next.js** (Auto-detected).
4. Add the following **Environment Variables** in the Vercel project settings:

| Variable | Description | Example Value |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection pooler string | `postgresql://user:pass@ep-pooler.neon.tech/neondb?sslmode=require` |
| `NEXTAUTH_SECRET` | Secure session secret key | `super_secret_homefood_key_2026` |
| `EMAIL_HOST` | SMTP server host for OTP | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | `587` |
| `EMAIL_HOST_USER` | SMTP email username | `your-email@gmail.com` |
| `EMAIL_HOST_PASSWORD` | SMTP app-specific password | `your-app-password` |
| `EMAIL_USE_TLS` | TLS enabled | `true` |
| `DEFAULT_FROM_EMAIL` | Sender address | `HomeFood <noreply@yourdomain.com>` |

5. Click **Deploy**. Vercel will run `npm run build` and deploy within 45 seconds!

---

### 4. Running Locally

The codebase features an **automatic Dual Data Access Layer**:
- If `DATABASE_URL` is not yet configured, the app runs **100% out of the box locally** with instant in-memory & file persistence (`data/marketplace-store.json`), pre-seeded with verified kitchens, dishes, and demo roles!
- When `DATABASE_URL` is configured in production, it connects directly to your cloud PostgreSQL database.

To run locally:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 5. Role Switcher for Instant Testing
A toolbar is pinned at the top of the screen to switch between all 4 personas in 1-click:
1. **🛒 Customer** (`Amina Fathima`)
2. **👩‍🍳 Home Cooker / Baker** (`Anas Rahiman` - Anas Artisanal Home Bakery)
3. **🛵 Delivery Rider** (`Arjun Das` - KL-07-CD-4102)
4. **🛡️ Admin Control** (`Platform Administrator`)
