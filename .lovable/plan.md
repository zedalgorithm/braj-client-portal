

# BRAJ Statistical and Research Consultancy — Client Portal

## Design & Branding
- Clean, minimal design with **blue & white** color scheme
- Professional typography, generous white space
- BRAJ branding throughout (logo placeholder, company name in header/footer)

---

## Page 1: Landing Page
- **Hero section** with tagline and call-to-action ("Get Started" → sign up)
- **Services section** with 5 service cards:
  - **Statistical Analysis**: Descriptive (KSh 1,500) | ANOVA/Regression/t-test/Correlation (KSh 3,000)
  - **Research**: Pricing TBD
  - **Turnitin Check**: Pricing TBD
  - **Paraphrasing**: Pricing TBD
  - **Editing**: Pricing TBD
- Each card has a description, pricing tiers, and "Place Order" button (redirects to login if not authenticated)
- **About/Contact section** in the footer

## Page 2: Authentication
- Sign up and Log in pages (email/password via Supabase Auth)
- Role-based access: **client** (default) and **admin**
- Admin role stored in a `user_roles` table with RLS security

## Page 3: Order Form
- Dynamic form based on selected service
- Fields: service type, pricing tier, title, instructions/notes, deadline
- Conditional fields: chapter count (research), word count (editing/paraphrasing)
- **File upload** for input documents (stored in Supabase Storage)
- Order confirmation summary before submission

## Page 4: Client Dashboard
- List of all submitted orders with status badges: **Pending → In Progress → Completed**
- Click into an order to view details
- Download completed output files when available
- Order history with filters

## Page 5: Admin Dashboard
- View **all orders** from all clients
- Update order status (Pending → In Progress → Completed)
- Upload completed output files for client download
- Mark payments as received (offline tracking — toggle/checkbox)
- Filter and search by service type, status, client name

---

## Backend (Supabase)
- **Database tables**: `profiles`, `user_roles`, `services`, `orders`, `order_files`
- **Storage buckets**: `input-files` (client uploads), `output-files` (admin uploads)
- **RLS policies**: Clients see only their own orders; admins see all
- Offline payment tracking (boolean flag on orders)

