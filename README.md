# 🥖 HomeFood Marketplace Web Application
### Home Food & Bakery Marketplace + AI Nutrition + Smart Search + Intelligent Delivery Platform

> **USP:** Discover homemade food from trusted local cooks, know exactly what's inside it with transparent ingredients and calculated nutrition, and get it delivered reliably with smart rider matching and cooker self-delivery fallback.

Built with Next.js 16 (App Router), React 19, TypeScript, Vanilla CSS Design System with a warm culinary **Light Theme**, Prisma ORM, and PostgreSQL (Neon/Vercel Postgres compatible).

---

## 🎨 Complete Light Theme Aesthetics
As requested (*"complete proper aayitt light themil sett cheyyi tto ellam venam"*):
- **Warm Culinary Light Palette**: Crisp ivory cards, warm terracotta & cinnamon accents (`#ea580c`), fresh emerald basil accents (`#059669`), and readable charcoal typography (`#1e293b`).
- **Glassmorphism Navigation**: Floating sticky blur header with live cart badge and quick search.
- **Micro-animations & Interactive Cards**: Smooth card hover elevations, nutrition pills, allergen tags, and dynamic order progress timelines.

---

## ⚡ 4 Core Real-World Engines

### 1. Marketplace Engine
- **Customer Portal**: Browse dishes, search by dietary preference (Eggless, Vegan, Gluten Free), inspect transparent ingredients, add to cart, choose delivery slots, apply coupons (e.g. `WELCOME50`), and track orders.
- **Cooker Portal**: Manage store profile, publish dishes with custom ingredients and prep times, set daily capacities, accept/reject incoming orders, update live preparation status.
- **Delivery Rider Portal**: NO public registration! Created exclusively by Admin. Switch between `ONLINE` and `OFFLINE`, view active radar assignments, update fulfillment steps (Picked Up -> Out for Delivery -> Delivered).
- **Admin Master Control**: Full platform governance: verify and approve cookers, moderate dishes, create riders, manage categories and tags, configure platform commission (10%), and inspect immutable audit logs.

### 2. Deterministic Nutrition Engine
- Formula: `Raw Ingredient Database + Quantity & Unit = Calculated Nutrition`
- Calculates **Calories, Protein, Carbohydrates, Total Fat, Saturated Fat, Sugar, Fiber, and Sodium**.
- Provides toggle between **Per Serving**, **Per 100g**, and **Total Product**.
- **AI Health Analysis**: Generates health grades (A/B/C/D), sugar and calorie density classifications, health benefits, dietary cautions, and healthier alternative recommendations.
- **Allergen Engine**: Automatically scans ingredients against allergen databases (Milk, Egg, Gluten, Wheat, Peanuts, Tree nuts, Soy, Sesame, Fish, Shellfish).

### 3. Discovery & Smart Search Engine
- YouTube-style weighted relevance ranking:
  - **Relevance**: 40%
  - **Distance**: 20%
  - **Rating**: 15%
  - **Availability**: 10%
  - **Popularity**: 10%
  - **Cooker Quality**: 5%
- **Natural Language Query Parser**: Automatically extracts dietary keywords (*eggless, vegan*), nutrition criteria (*low sugar, high protein*), and price thresholds (*under ₹700*) from user search queries.

### 4. Intelligent Delivery Engine & Fallback Logic
- Distance-based delivery fee calculations (0-3 km: ₹30, 3-6 km: ₹60, 6-10 km: ₹100).
- **Smart Rider Assignment**: Ranks online riders by proximity, workload balancing, vehicle type, and pickup ETA.
- **Critical Cooker Self-Delivery Fallback**: If no platform rider is nearby when food is ready, the system automatically redirects the order to Cooker Self-Delivery within the cooker's configured radius.
- **Product-Specific Wait Limits**: Respects shelf-life limits (e.g. 45 min for fresh cream cake, 240 min for cookies).

---

## 🚀 Running the Project

### 1. Local Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 2. Production Build (for Vercel)
```bash
npm run build
```
Tested and verified with 0 errors.

### 3. Automated API & Engine Tests
```bash
node scripts/test-api.js
```

---

## ☁️ Vercel & PostgreSQL Hosting
For detailed instructions on linking a free Neon PostgreSQL database and deploying on Vercel, refer to [VERCEL_DEPLOYMENT.md](file:///c:/Users/JHF%20IT%20Inno_Anas/Desktop/cooking/VERCEL_DEPLOYMENT.md).
