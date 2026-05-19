# JOSCM Tithes App — Backend Documentation

## Project Overview

JOSCM Tithes App is a **church financial management system** for **Jesus Our Savior Christian Ministries (JOSCM)**. The backend is built with **MERN stack** (MongoDB, Express, React, Node.js) and features a **role-based access control (RBAC)** system that mirrors the church's organizational hierarchy.

**Backend Status: 100% Complete**

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | v22 | Runtime — `--watch` (no nodemon), `--env-file` (no dotenv) |
| **Express.js** | v4 | Web framework |
| **MongoDB** | Latest | NoSQL database |
| **Mongoose** | v9 | ODM — schemas, models, queries |
| **bcrypt** | v6 | Password hashing (saltRounds: 10) |
| **jsonwebtoken** | v9 | JWT auth (expires: 1d) |
| **cors** | v2 | Cross-origin resource sharing |
| **ExcelJS** | v4 | Excel (.xlsx) report generation |
| **PDFKit** | v0.18 | PDF report generation |
| **cloudinary** | v2 | Cloud image hosting for voucher receipts |
| **multer** | v1 | Multipart/form-data handling for file uploads |
| **multer-storage-cloudinary** | v4 | Direct-to-Cloudinary storage engine for multer |

---

## Project Structure

```
backend/
├── app.js                     ← Entry point — Express setup, routes, DB connect, listen
├── package.json               ← type: module, node --watch --env-file=.env app.js
├── .env                       ← PORT, CONNECTION_STRING, JWT_SECRET_KEY
├── .gitignore                 ← node_modules, .env, .claude/settings.local.json, scripts/backups/, test-export.js
├── scripts/
│   ├── reset-transactional-data.js   ← one-off DB reset (Notification, Expense, Voucher, RequestForm, Tithes); needs RESET_CONNECTION_STRING + --confirm; auto-backups to scripts/backups/<ts>/
│   └── backups/                      ← gitignored — JSON dumps written before each --confirm run
└── src/
    ├── config/
    │   ├── db.js              ← connectDB() — mongoose.connect()
    │   └── cloudinary.js      ← Cloudinary SDK config (CLOUDINARY_NAME, API_KEY, API_SECRET)
    ├── models/
    │   ├── User.js
    │   ├── Category.js
    │   ├── TithesEntry.js
    │   ├── RequestForm.js
    │   ├── Voucher.js
    │   ├── Expense.js
    │   └── Notification.js
    ├── controllers/
    │   ├── auth/
    │   │   └── authController.js     ← userLogin, userLogout
    │   ├── admin/
    │   │   ├── userController.js     ← getAllUsers, getUser, createUser, updateUser, isActiveUser, deleteUser
    │   │   └── categoryController.js ← getAllCategories, createCategory, updateCategory, deleteCategory
    │   ├── userController.js         ← changePassword
    │   ├── tithesController.js       ← getAllTithes, submitTithes, updateTithes, approveTithes, rejectTithes
    │   ├── requestFormController.js  ← full RF approval chain (10 functions — disburse + received split)
    │   ├── voucherController.js      ← getAllVouchers, createVoucher (+ autoRecordExpense call)
    │   ├── expenseController.js      ← getAllExpenses, createManualExpense, autoRecordExpense
    │   ├── notificationController.js ← getNotifications, markAsRead, markAllAsRead
    │   └── reportController.js       ← getTithesReport, getExpenseReport, exportTithesExcel, exportTithesPDF, exportExpenseExcel, exportExpensePDF
    ├── routes/
    │   ├── auth/
    │   │   └── authRoutes.js
    │   ├── admin/
    │   │   ├── userRoutes.js
    │   │   └── categoryRoutes.js
    │   ├── userRoutes.js
    │   ├── tithesRoutes.js
    │   ├── requestFormRoutes.js
    │   ├── voucherRoutes.js
    │   ├── expenseRoutes.js
    │   ├── notificationRoutes.js
    │   └── reportRoutes.js
    ├── middlewares/
    │   ├── authMiddleware.js          ← verifyToken — verifies JWT on every protected route
    │   ├── roleMiddleware.js          ← authorizeRoles(...roles) — checks user role
    │   └── uploadMiddleware.js        ← multer + CloudinaryStorage — receipts folder, images only, 10MB, max 5 files
    └── utils/
        ├── seed.js                    ← seeds initial admin user (Adrian)
        └── sendNotification.js        ← helper — creates Notification document in DB
```

---

## Environment Variables (.env)

```properties
PORT=7001
CONNECTION_STRING=mongodb://localhost:27017/JOSCM-Tithes
JWT_SECRET_KEY=your_secret_key_here

# CORS — comma-separated allowed origins. REQUIRED: an empty value now
# blocks every browser origin (used to allow all). Set the frontend URL
# locally (e.g. http://localhost:5173) and the Vercel URL(s) on Render.
CORS_ORIGIN=http://localhost:5173

# Set to "production" on Render so 500 errors return a generic message
NODE_ENV=production

# Cloudinary — for voucher receipt uploads
CLOUDINARY_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Note:** Local MongoDB used for development. MongoDB Atlas had SSL/TLS issues on Windows with Node.js v22. If using Atlas, add these options to `mongoose.connect()`:
```js
{ tlsAllowInvalidCertificates: true, tlsAllowInvalidHostnames: true, ssl: true }
```

---

## app.js (Entry Point)

```js
import express from 'express'
import cors from 'cors'
import { connectDB } from './src/config/db.js'
import authRoutes from './src/routes/auth/authRoutes.js'
import adminUserRoutes from './src/routes/admin/userRoutes.js'
import userRoutes from './src/routes/userRoutes.js'
import categoryRoutes from './src/routes/admin/categoryRoutes.js'
import tithesRoutes from './src/routes/tithesRoutes.js'
import requestFormRoutes from './src/routes/requestFormRoutes.js'
import voucherRoutes from './src/routes/voucherRoutes.js'
import expenseRoutes from './src/routes/expenseRoutes.js'
import notificationRoutes from './src/routes/notificationRoutes.js'
import reportRoutes from './src/routes/reportRoutes.js'

const PORT = process.env.PORT || 7002
const app = express()

app.use(express.json())
app.use(cors())

app.use('/api/auth', authRoutes)
app.use('/api/admin/users', adminUserRoutes)
app.use('/api/admin/categories', categoryRoutes)
app.use('/api/users', userRoutes)
app.use('/api/tithes', tithesRoutes)
app.use('/api/request-form', requestFormRoutes)
app.use('/api/vouchers', voucherRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/reports', reportRoutes)

connectDB().then(() => {
    app.listen(PORT, () => console.log(`Server is running on port: ${PORT}`))
})
```

---

## Roles & Users

| Role | Person | Responsibilities |
|---|---|---|
| **admin** | Adrian | Full access — manage users, categories, all endpoints |
| **do** | Jaymar | Approve/reject tithes entries |
| **validator** | Dani | Validate RF, create Vouchers (PCF) |
| **pastor** | Bernie | Final approval of Request Forms |
| **auditor** | Roselyn | View-only, validate RF, approve RF, export reports |
| **member** | Berna, Lourdes, Kiya | Submit tithes, create RF, confirm receipt |

---

## Middlewares

### authMiddleware.js — verifyToken
```js
export const verifyToken = (req, res, next) => {
  try {
    const tokenHeader = req.headers.authorization
    if (!tokenHeader || !tokenHeader.startsWith('Bearer '))
      return res.status(401).json({ error: 'No token, Access Denied!' })
    const token = tokenHeader.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'No token, Access Denied!' })
    req.user = jwt.verify(token, process.env.JWT_SECRET_KEY)  // { id, role }
    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid Token' })
  }
}
```

### roleMiddleware.js — authorizeRoles
```js
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role))
      return res.status(403).json({ error: 'Access Denied!' })
    next()
  }
}
```

**Two layers of role checking:**
1. `authorizeRoles` middleware — primary enforcement on every role-gated route (admin routes, plus tithes/RF/expense write routes since the security-hardening pass)
2. In-controller role check — kept as defense-in-depth alongside the middleware, and for complex logic (conflict of interest, ownership checks the middleware can't express)

### errorHandler.js — notFound + errorHandler
Mounted last in `app.js`, after all route mounts. `notFound` returns `404 { error: 'Route not found' }` for unmatched routes. `errorHandler` is the centralized error sink: controllers forward errors via `next(error)` (every controller `catch` block does `catch (error) { next(error) }`), so internal details are never sent to the client — a 500 returns a generic `Internal Server Error` when `NODE_ENV === 'production'`. It guards `res.headersSent` so a failed file-export stream doesn't crash on a double-send.

---

## Database Schemas

### User.js
```js
{
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },  // bcrypt hashed
  role: { type: String, enum: ['admin','do','validator','pastor','auditor','member'], required: true },
  isActive: { type: Boolean, default: true },
  timestamps: true
}
```

### Category.js
```js
{
  name: { type: String, required: true },
  type: { type: String, enum: ['rf','expense'] },
  color: { type: String },
  isActive: { type: Boolean, default: true },
  createdBy: { type: ObjectId, ref: 'User' },
  timestamps: true
}
```

### TithesEntry.js
```js
{
  entryDate: { type: Date, required: true },
  serviceType: { type: String, enum: ['Sunday Service','Special Service','Anniversary Service'], required: true },
  denominations: [{ bill: Number, qty: Number, subtotal: Number }],
  total: { type: Number, required: true },
  remarks: { type: String },
  submittedBy: { type: ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  reviewedBy: { type: ObjectId, ref: 'User' },
  reviewedAt: { type: Date },
  rejectionNote: { type: String },
  timestamps: true
}
```

### RequestForm.js
```js
{
  rfNo: { type: String, required: true, unique: true, index: true },  // RF-0001
  entryDate: { type: Date, required: true },
  category: { type: ObjectId, ref: 'Category', required: true },
  requestedBy: { type: ObjectId, ref: 'User', required: true },
  estimatedAmount: { type: Number, required: true },
  remarks: { type: String },  // editable by owner (draft) and by validator at voucher creation
  status: {
    type: String,
    enum: ['draft','submitted','for_approval','approved','rejected','voucher_created','disbursed','received'],
    default: 'draft'
  },
  attachments: [{ type: String }],  // URLs (reserved — no upload flow yet)
  submittedAt: { type: Date },
  validatedBy: { type: ObjectId, ref: 'User' },
  validatedAt: { type: Date },
  approvedBy: { type: ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectionNote: { type: String },
  rejectedBy: { type: ObjectId, ref: 'User' },
  rejectedAt: { type: Date },
  voucherId: { type: ObjectId, ref: 'Voucher' },
  voucherCreatedAt: { type: Date },
  disbursedBy: { type: ObjectId, ref: 'User' },   // admin/DO who marked it disbursed
  disbursedAt: { type: Date },
  receivedBy: { type: ObjectId, ref: 'User' },    // requester who confirmed receipt
  receivedAt: { type: Date },
  timestamps: true
}
```

### Voucher.js
```js
{
  pcfNo: { type: String, required: true, unique: true, index: true },  // PCF-0001
  rfId: { type: ObjectId, ref: 'RequestForm', required: true },
  date: Date,
  category: { type: ObjectId, ref: 'Category', required: true },
  amount: { type: Number, required: true },
  receipts: [{ type: String }],  // Cloudinary secure URLs (images only, max 5 files, 10MB each)
  createdBy: { type: ObjectId, ref: 'User' },
  status: { type: String, default: 'approved' },
  timestamps: true
}
```

### Expense.js
```js
{
  source: { type: String, enum: ['voucher','manual'], required: true },
  linkedId: { type: ObjectId, ref: 'Voucher' },  // optional, only for voucher source
  amount: { type: Number, required: true },
  category: { type: ObjectId, ref: 'Category', required: true },
  date: { type: Date, required: true },
  remarks: { type: String },
  recordedBy: { type: ObjectId, ref: 'User' },
  timestamps: true
}
```

### Notification.js
```js
{
  userId: { type: ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['approval','rejection','info','reminder'], required: true },
  refId: { type: ObjectId, required: true },  // polymorphic
  refModel: { type: String, enum: ['Tithes','RequestForm','Voucher'], required: true },
  isRead: { type: Boolean, default: false },
  timestamps: true
}
```

---

## API Endpoints

### Auth — `/api/auth`
```
POST   /api/auth/login          ← all users — returns JWT token (1 day expiry)
POST   /api/auth/logout         ← authenticated — client-side logout
```

**Login payload:**
```json
{ "email": "adrian@joscm.com", "password": "admin123" }
```

**Login response:**
```json
{
  "status": "Login Successfull",
  "data": { "id": "...", "name": "Adrian", "email": "adrian@joscm.com", "role": "admin" },
  "token": "eyJhbGci..."
}
```

---

### Users — `/api/users`
```
PATCH  /api/users/change-password   ← authenticated (all roles)
```

**Payload:** `{ "currentPassword": "old", "newPassword": "new" }`

---

### Admin — Users — `/api/admin/users`
All routes: `verifyToken + authorizeRoles('admin')`
```
POST   /api/admin/users                     ← create user
GET    /api/admin/users                     ← list all (password excluded)
GET    /api/admin/users/:id                 ← get by ID
PATCH  /api/admin/users/:id                 ← update info/role
PATCH  /api/admin/users/:id/deactivate      ← set isActive: false
DELETE /api/admin/users/:id                 ← delete permanently
```

**Create user payload:**
```json
{ "name": "Jaymar", "email": "jaymar@joscm.com", "password": "pass123", "role": "do" }
```

---

### Admin — Categories — `/api/admin/categories`
All routes: `verifyToken + authorizeRoles('admin')`
```
POST   /api/admin/categories        ← create (createdBy from JWT)
GET    /api/admin/categories        ← list all
PATCH  /api/admin/categories/:id    ← update name, type, color
DELETE /api/admin/categories/:id    ← delete
```

**Create category payload:**
```json
{ "name": "Events", "type": "rf", "color": "#4f8ef7" }
```

---

### Tithes — `/api/tithes`
All routes: `verifyToken`
```
POST   /api/tithes              ← all roles — submit tithes (status: pending)
GET    /api/tithes              ← all roles — date filter: ?startDate=&endDate=
PATCH  /api/tithes/:id          ← owner only, pending status only
PATCH  /api/tithes/:id/approve  ← do, auditor, admin — except submitter (conflict of interest check)
PATCH  /api/tithes/:id/reject   ← do, auditor, admin — requires rejectionNote
```

**Submit tithes payload:**
```json
{
  "entryDate": "2025-12-07",
  "serviceType": "Sunday Service",
  "denominations": [
    { "bill": 1000, "qty": 5, "subtotal": 5000 },
    { "bill": 500, "qty": 4, "subtotal": 2000 }
  ],
  "total": 7000,
  "remarks": "Sunday tithes"
}
```

**GET response includes:**
- `totalBalance` — sum of `total` on the entries returned by the current filter (filter-scoped, kept for back-compat with summary cards)
- `availableBalance` — true cash-on-hand: `sum(approved tithes total)` − `sum(all expenses)` — ignores the date filter, used by the frontend RF amount-limit guard
- `count` — number of entries
- Sort order: newest first (`createdAt: -1`)
- Populated: `submittedBy (name, role)`, `reviewedBy (name, role)`

**Filters available:**
```
GET /api/tithes?startDate=2025-12-01&endDate=2025-12-31
```

---

### Request Form — `/api/request-form`
All routes: `verifyToken`
```
POST   /api/request-form                    ← all roles — create RF (draft, auto rfNo)
GET    /api/request-form                    ← all roles — member sees own only
PATCH  /api/request-form/:id               ← owner, draft only
DELETE /api/request-form/:id               ← owner, draft only
PATCH  /api/request-form/:id/submit        ← owner
PATCH  /api/request-form/:id/validate      ← validator, auditor, admin
PATCH  /api/request-form/:id/approve       ← pastor, auditor, admin
PATCH  /api/request-form/:id/reject        ← validator, pastor, auditor, admin
PATCH  /api/request-form/:id/disburse      ← admin, do  (status: voucher_created → disbursed)
PATCH  /api/request-form/:id/received      ← owner     (status: disbursed → received)
```

Sort order on `GET /api/request-form`: newest first (`createdAt: -1`).

**Create RF payload:**
```json
{
  "entryDate": "2026-04-01",
  "category": "<category_id>",
  "estimatedAmount": 5000,
  "remarks": "For Sunday youth event supplies"
}
```

**Update RF allowed fields (draft only):** `entryDate`, `category`, `estimatedAmount`, `remarks`, `attachments`

**Filters available:**
```
GET /api/request-form?startDate=&endDate=&status=approved&rfNo=RF-0001
```

**Populated fields:** `requestedBy`, `category`, `approvedBy`, `validatedBy`, `voucherId`

**RF Status Flow:**
```
draft → submitted → for_approval → approved → voucher_created → disbursed → received
                  ↘ rejected (at submitted or for_approval stage)
```

Each transition's actor:
- `draft → submitted` — owner
- `submitted → for_approval` — validator / auditor / admin
- `for_approval → approved` — pastor / auditor / admin
- `approved → voucher_created` — validator / admin (via voucher creation; auto-records expense)
- `voucher_created → disbursed` — **admin / DO** (records that money left the church)
- `disbursed → received` — **owner / requester** (confirms physical receipt; terminal)
- `* → rejected` — only valid from `submitted` or `for_approval`

**Auto-numbering:** RF-0001, RF-0002... (finds last RF sorted by createdAt, increments)

---

### Vouchers — `/api/vouchers`
All routes: `verifyToken`
```
POST   /api/vouchers    ← validator, admin — RF must be approved
                         — accepts multipart/form-data (receipts files)
GET    /api/vouchers    ← validator, do, auditor, admin
```

**Create voucher payload (multipart/form-data):**

| Field | Type | Notes |
|---|---|---|
| `rfId` | text | Linked approved RequestForm ID |
| `category` | text | Category ID — **overrides RF category if different** (Dani aligns) |
| `amount` | text | Voucher amount |
| `remarks` | text | Optional — **overrides RF remarks** if provided |
| `receipts` | file[] | **Required** — at least 1 image (jpg/jpeg/png/webp), up to 5 files, 10MB each |

**On voucher creation:**
1. Receipt files uploaded to Cloudinary (folder `joscm/receipts`) — secure URLs saved to `voucher.receipts`
2. If `category` or `remarks` differs from the linked RF, the RF is **updated to match** — Dani is the source of truth for final alignment
3. Voucher saved with auto PCF-0001 number
4. `autoRecordExpense()` called — creates Expense document using the **aligned** category
5. RF status updated to `voucher_created`; `voucherId` linked
6. Notification sent to requestedBy

**Why the validator can edit RF category/remarks:**
Dani (validator) is the one who reconciles the request with the actual expense at voucher time. If the member picked the wrong category or wrote vague remarks, Dani corrects them before the PCF is issued so the ledger stays accurate.

**Auto-numbering:** PCF-0001, PCF-0002... (same pattern as RF)

---

### Expenses — `/api/expenses`
All routes: `verifyToken`
```
GET    /api/expenses    ← auditor, admin
POST   /api/expenses    ← admin only (manual entry)
```

**Manual expense payload:**
```json
{
  "amount": 1500,
  "category": "<category_id>",
  "date": "2026-04-01"
}
```

**Note:** `source` is auto-set — `voucher` for auto-recorded, `manual` for manual entry.

---

### Notifications — `/api/notifications`
All routes: `verifyToken`
```
GET    /api/notifications           ← per user (filtered by JWT userId)
PATCH  /api/notifications/read-all  ← mark all as read
PATCH  /api/notifications/:id/read  ← mark single as read (ownership check)
```

**Note:** `read-all` route must be BEFORE `/:id/read` in router to avoid Express treating "read-all" as an ID.

**Auto-triggered on:**
| Event | Who gets notified |
|---|---|
| Tithes submitted | roles: do, auditor, admin (excluding submitter) |
| Tithes approved | submittedBy |
| Tithes rejected | submittedBy |
| RF submitted | roles: validator, auditor, admin (excluding submitter) |
| RF validated | requestedBy + roles: pastor, auditor, admin (excluding validator) |
| RF approved | requestedBy + validatedBy |
| RF rejected | requestedBy |
| RF disbursed | requestedBy ("please confirm receipt") |
| RF received | roles: admin, auditor (excluding the requester who confirmed) |
| Voucher created | requestedBy of linked RF + roles: do, auditor, admin (excluding creator) |

---

### Reports — `/api/reports`
All routes: `verifyToken`
```
GET    /api/reports/tithes                  ← all roles (member sees own only)
GET    /api/reports/expense                 ← all except member
GET    /api/reports/tithes/export/excel     ← all roles
GET    /api/reports/tithes/export/pdf       ← all roles
GET    /api/reports/expense/export/excel    ← admin, auditor (authorizeRoles)
GET    /api/reports/expense/export/pdf      ← admin, auditor (authorizeRoles)
```

**Filters:**
```
GET /api/reports/tithes?startDate=2025-12-01&endDate=2025-12-31
GET /api/reports/expense?startDate=2025-12-01&endDate=2025-12-31
```

**Excel/PDF exports** — response is binary file download, set these headers:
```js
// Excel
res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
res.setHeader('Content-Disposition', 'attachment; filename=tithes-report.xlsx')

// PDF
res.setHeader('Content-Type', 'application/pdf')
res.setHeader('Content-Disposition', 'attachment; filename=tithes-report.pdf')
```

**Excel features:**
- Blue header row with white bold text
- JOSCM title row (merged cells A1:F1)
- Alternate row colors
- Status text color (green=approved, yellow=pending, red=rejected)
- Total Balance formula (SUM) at bottom
- Center-aligned cells

**PDF features:**
- Table with blue header
- Alternate row colors (#f0f4ff)
- Center-aligned text using custom `centerText()` helper
- Generated date (left-aligned)
- Total Balance (left-aligned)

---

## Utils

### sendNotification.js
```js
import { Notification } from '../models/Notification.js'

const sendNotification = async ({ userId, message, type, refId, refModel }) => {
  const createNotif = new Notification({ userId, message, type, refId, refModel })
  await createNotif.save()
  return createNotif
}
```

### seed.js
```js
// Run: node --env-file=.env src/utils/seed.js
// Creates initial admin user (Adrian)
```

---

## Key Business Logic

### Conflict of Interest — Tithes
A user **cannot approve their own tithes entry**:
```js
if (finderTithes.submittedBy.toString() === req.user.id)
  return res.status(400).json({ error: 'Cannot approve your own tithes entry!' })
```

### Auto-Number Generation
```js
// RF Number
const lastRF = await RequestForm.findOne().sort({ createdAt: -1 })
const lastNumber = lastRF ? parseInt(lastRF.rfNo.split('-')[1]) : 0
const newRfNo = `RF-${String(lastNumber + 1).padStart(4, '0')}`

// PCF Number — same pattern with Voucher collection
```

### Auto-Record Expense
```js
// Called inside createVoucher after newVoucher.save()
const autoRecordExpense = async (newVoucher) => {
  const newExpense = new Expense({
    source: 'voucher',
    linkedId: newVoucher._id,
    amount: newVoucher.amount,
    category: newVoucher.category,
    date: newVoucher.date,
    recordedBy: newVoucher.createdBy
  })
  await newExpense.save()
}
```

### Member Filter on RF
```js
if (req.user.role === 'member') filter.requestedBy = req.user.id
```

### runValidators on Updates
All `findByIdAndUpdate` calls use:
```js
{ new: true, runValidators: true }
```

---

## Status Enums

### users.role
`admin` | `do` | `validator` | `pastor` | `auditor` | `member`

### tithes.status
`pending` | `approved` | `rejected`

### tithes.serviceType
`Sunday Service` | `Special Service` | `Anniversary Service`

### request_forms.status
`draft` | `submitted` | `for_approval` | `approved` | `rejected` | `voucher_created` | `disbursed` | `received`

### categories.type
`rf` | `expense`

### expenses.source
`voucher` | `manual`

### notifications.type
`approval` | `rejection` | `info` | `reminder`

---

## Branch History

| # | Branch | Description |
|---|---|---|
| 1 | `feat/project-setup` | app.js, db.js, package.json |
| 2 | `feat/auth` | login, logout, JWT, verifyToken, authorizeRoles |
| 3 | `feat/admin-users` | CRUD users, role assignment, deactivate |
| 4 | `feat/admin-categories` | CRUD categories |
| 5 | `feat/change-password` | PATCH /api/users/change-password |
| 6 | `feat/tithes` | submit, get, update, approve, reject + conflict of interest |
| 7 | `feat/request-form` | full RF approval chain — 9 endpoints |
| 8 | `feat/voucher` | PCF creation, auto-number, auto-record expense |
| 9 | `feat/expense` | auto-record on voucher + manual expense |
| 10 | `feat/notifications` | auto-trigger on every status change |
| 11 | `feat/reports` | tithes/expense reports + Excel/PDF export |
| 12 | `feat/expense-export` | expense Excel + PDF export |
| 13 | `feat/search-filter` | date filter, status filter, rfNo filter, totalBalance |
| 14 | `feat/voucher-cloudinary-receipts` | Cloudinary upload for voucher receipts; RF `remarks` field; validator can align RF category/remarks on voucher creation |
| 15 | `feat/add-status-notif` | Notify validator when their RF gets approved (extra `sendNotification` call in `approveRequestForm`) |
| 16 | `feat/expense-remarks-and-deep-populate` | Expense schema gains `remarks`; `getAllExpenses` deep-populates `linkedId → Voucher → rfId → RequestForm → requestedBy/approvedBy` in one trip; `createManualExpense` accepts `remarks` |
| 17 | `feat/normalize-empty-list-responses` | All list endpoints (categories, users, tithes, RF, vouchers, expenses) return their normal success shape on empty (`200 []` or `200 { count: 0, data: [] }`) instead of `404` with error message |
| 18 | `feat/rf-timestamps-and-full-response` | RF schema gains `submittedAt` / `voucherCreatedAt` / `receivedAt`; submit / voucher-create / received endpoints write those; `getAllRequestForms` populates `rejectedBy`; validate / approve / reject return the full populated RF (consistent shape with create / update / list) |
| 19 | `feat/users-create-return-full-user` | `POST /admin/users` returns the saved user (with `_id`, minus password) instead of cherry-picked echo |
| 20 | `feat/socket-io-notifications` | Socket.IO server replaces 60s frontend polling. `app.js` swaps `app.listen` for `http.createServer(app)` + `new SocketIOServer(httpServer, { cors })`. JWT handshake middleware reads `socket.handshake.auth.token` (same `JWT_SECRET_KEY` as the HTTP middleware), sets `socket.userId = decoded.id`, and on `connection` joins the socket to a room named after that user id. New `src/services/realtime.js` holds a module-scoped `io` reference and exports `emitToUser(userId, event, payload)` so callers don't have to plumb `io` themselves. `src/utils/sendNotification.js` (the funnel for every notification trigger) emits `notification:new` with the saved doc to the recipient's room after the DB insert. No controller changes needed. CORS allowlist + Vercel-preview pattern reused from REST. |
| 21 | `fix/categories-readable-by-all-roles` | Drop the `authorizeRoles('admin')` guard on `GET /api/admin/categories` only — the write endpoints (POST / PATCH / DELETE) stay admin-only. Non-admin members hitting the Create Request Form modal were getting 403 on the categories fetch, leaving the dropdown empty (looked like a UI bug). Path stays at `/api/admin/categories` so the existing admin Categories management page keeps working without a frontend route change. |
| 22 | `feat/notify-actors-on-pending-work` | New helper `sendNotificationToRoles({ roles, message, type, refId, refModel, excludeUserId })` in `src/utils/sendNotification.js` finds all active users in the given roles and fans out per-user `sendNotification` calls (each writing the doc + emitting via Socket.IO). `excludeUserId` skips the actor so an admin who validates their own RF doesn't notify themselves through the pastor/auditor/admin path. **Wired into 3 sites**: `submitTithes` → `['do', 'auditor', 'admin']`, `submitRequestForm` → `['validator', 'auditor', 'admin']` (message includes `rfNo`), `validateRequestForm` → also `['pastor', 'auditor', 'admin']` (in addition to existing notif back to requester). Closes the gap where the original notification design only fired "result back to actor" events — nothing pinged the next-step actors when work landed in their queue. |
| 23 | `feat/disburse-status-flow` | Splits the RF disbursement transition into two distinct actions for proper audit trail. **Status enum gains `received`** as the new terminal state. **New `PATCH /api/request-form/:id/disburse`** (admin/DO only): `voucher_created → disbursed`, sets `disbursedBy`/`disbursedAt`, notifies the requester. **Reshaped `PATCH /:id/received`** (owner only): now requires the RF be in `disbursed` status (was incorrectly checking `approved` — a long-standing inconsistency with the frontend, which never matched), transitions to `received`, sets `receivedBy`/`receivedAt`, fans out a notification to `['admin','auditor']` (excluding the actor) so oversight knows the case is closed. RF schema gains `disbursedBy` / `disbursedAt` / `receivedBy`. RF_POPULATE in the controller now pulls both new ref fields. **Sort order added** to `getAllRequestForms` / `getAllTithes` / `getAllVouchers` — all use `.sort({ createdAt: -1 })` so newest entries appear first (was MongoDB default ascending insertion order — UX complaint that new entries were "going to the bottom"). **`getAllTithes` returns a new `availableBalance` field** computed via two parallel aggregates: `sum(approved Tithes.total) − sum(Expense.amount)`, ignores the date filter (it's the church's true cash-on-hand for the RF amount-limit guard on the frontend). The existing filter-scoped `totalBalance` is kept for back-compat with summary cards. **Why two-step finish:** disbursement is an explicit operational action (admin/DO logs that money physically left the church) and receipt is a separate confirmation by the requester. Future audit reports can join on `disbursedBy`/`disbursedAt` vs `receivedBy`/`receivedAt` for true accountability. |
| 25 | `feat/voucher-populate-requested-by` | Frontend ownership gates on the Voucher page need to know who the linked RF's requester is so a "Mark as Received" button (currently RF-page-only) can also be surfaced from the voucher row when `rfId.status === "disbursed"` and the current user is that requester. The existing `getAllVouchers` populate string was `"rfNo estimatedAmount status remarks"` — no `requestedBy` field on the wire. **Single-line shape change** in `src/controllers/voucherController.js`: replaced the inline string-form `.populate("rfId", ...)` with a deep populate object form `populate({ path: "rfId", select: "rfNo estimatedAmount status remarks requestedBy", populate: { path: "requestedBy", select: "name" } })`. Adds `requestedBy._id` (Mongoose includes `_id` automatically when `select` is given) and `requestedBy.name` to the voucher response. **No schema change.** **No `createVoucher` change** — that endpoint already returned the unpopulated `newVoucher` raw and the frontend always refetches, so adding populate there is unnecessary. **Backwards-compatible** for any existing voucher consumer: existing string-form fields (`rfNo`/`estimatedAmount`/`status`/`remarks`) all still arrive as before — the change only *adds* a populated `requestedBy` object. **Why this didn't ship with the disburse flow earlier:** Disburse only needs role-gating (`admin`/`do`), no ownership check — so `feat/disburse-status-flow` (#23) and the frontend's `feat/voucher-row-click-details` could both ship without this populate change. Mark Received is the first action on the voucher page that requires per-row ownership info. |
| 24 | `(no branch — direct force-push to main, 2026-05-02)` | **History rewrite — no code change.** Adrian noticed "Claude" appearing on the GitHub Contributors graph and asked it removed so the repo presents as solo work. Ran `git filter-branch --msg-filter "grep -v '^Co-Authored-By: Claude'" -- main` which rewrote **93 commits on `main`**, stripping every `Co-Authored-By: Claude Opus 4.7 / 4.6 / Sonnet 4.6 <noreply@anthropic.com>` trailer from commit messages. Force-pushed via `git push --force-with-lease origin main`. **No file contents changed** — only commit hashes + author trailers; deployed app code is byte-identical. Local backup at `backup/pre-history-rewrite` (kept until everything is confirmed working). Companion operation done on `Frontend-Tithes` (146 commits — see `Frontend-Tithes/CLAUDE_CLIENT.md` §14). New collaboration rule codified at the time: **commit messages + PR bodies must never include Co-Authored-By: Claude or "Generated with Claude Code" footers** going forward (recorded in user's auto-memory). **Side effects to be aware of:** every commit hash on `main` is now different from what original PRs referenced — old PR comments linking to specific hashes will 404, but the merge-commit messages still mention the PR numbers. Old feature branches that were merged still exist on remote with their pre-rewrite hashes (orphans — invisible in Contributors graph since that counts `main` only). GitHub Contributors graph takes ~24h to recompute after a force-push to default branch. |
| 26 | `chore/reset-transactional-data` | One-off **fresh-start data reset** before formal go-live (2026-05-10). New `scripts/reset-transactional-data.js` clears every transactional collection — `Notification`, `Expense`, `Voucher`, `RequestForm`, `Tithes` — and **leaves `Category` and `User` untouched** so the church staff accounts and seeded categories carry over. Delete order is child-refs first (Notification → Expense → Voucher → RequestForm → Tithes) to avoid orphaned `refId` / `linkedId` / `voucherId` pointers mid-run. **Safety mechanics**: requires `RESET_CONNECTION_STRING` env var (a deliberately-different name from the app's `CONNECTION_STRING` so a stray run can never silently target localhost), masks the password in its target log line, defaults to **dry run** (counts only), needs explicit `--confirm` flag to actually delete, and on `--confirm` always backs up every targeted collection to `scripts/backups/<ISO-timestamp>/<Collection>.json` before issuing any `deleteMany`. `scripts/backups/` added to `.gitignore` — backups stay local. **Run on 2026-05-09**: backed up + deleted 40 Notifications, 3 Expenses, 3 Vouchers, 3 RequestForms, 3 Tithes from the Atlas cluster. Cloudinary receipts uploaded by the deleted vouchers were left in place (no automatic Cloudinary purge — orphaned URLs in the Cloudinary library are harmless without the DB pointers, and storage is well within quota). Atlas DB user password was rotated after the run since the URI had been pasted in chat. Script is kept in-repo for future resets. |
| 27 | `fix/rf-self-decision-guard` | **Conflict-of-interest fix.** Adrian, testing as a `validator`, found he could validate an RF he had created himself. The `validate` / `approve` / `reject` RF endpoints only role-gated — they never excluded the requester. Added one guard each in `requestFormController.js`: after the existing role check, `if (findRequestFormById.requestedBy.toString() === req.user.id) return 403` with messages "You cannot validate/approve/reject your own request form". Mirrors the inverse owner check already present in `submitRequestForm` / `updateRequestForm` / `deleteRequestForm` / `receivedRequestForm` (those require `=== req.user.id`; these require `!==`). `disburse` left alone — it's admin/DO-only and the actor is never the requester in practice. **Companion frontend branch `Frontend-Tithes#fix/rf-self-decision-guard` shipped first** (it only hides buttons across 4 surfaces — RfTable, RfDetailsDialog, NotificationActionDialog, PendingWorkSection); this backend branch is the real enforcement so a direct API call can't bypass the hidden button. Order note: the frontend had no API-contract dependency on this change (it reads the already-populated `requestedBy._id`), so frontend-first caused no breakage — but for a security/permission hole the backend is the source of truth. |
| 28 | `feat/expenses-by-category` | **New aggregated endpoint** `GET /api/expenses/by-category` so the frontend Dashboard's "Expenses by Category" chart can be shown to *every* role (previously admin/auditor only on the frontend). Adrian's intent: give all church staff visibility into where money goes. New `getExpensesByCategory` in `expenseController.js` runs a Mongo aggregation — `$match` last 6 months by `date` → `$group` by `category` summing `amount` → `$lookup` into `categories` → `$project` to `{ category, amount }` (`$ifNull` → "Uncategorized" for any expense whose category was deleted) → `$sort` amount desc. Response shape `{ status, count, data: [{ category, amount }] }`. **Deliberately aggregated, not raw:** the existing `getAllExpenses` returns full per-expense records (amounts, dates, `recordedBy`, linked voucher→RF→requester names) — exposing that to members would be an over-share. This endpoint returns only category totals, safe for all roles, so it's gated by `verifyToken` only (no `authorizeRoles`). 6-month window chosen to match the frontend chart's existing client-side cutoff. Route added **before** `GET /` in `expenseRoutes.js` (specific path first, though `/by-category` vs `/` don't actually collide). No model change. **Companion frontend branch consumes this** — `ChartBarExpense` switches from building the category series client-side off the full `/expenses` payload to reading this pre-aggregated endpoint, and the Dashboard drops the `canViewExpenses` gate on that one chart. |
| 33 | `feat/security-middleware` | **Security hardening branch 4 of 6 — the largest.** Adds four standard hardening layers. **(1) helmet** — `app.use(helmet())` sets security headers (HSTS, `X-Content-Type-Options`, `X-Frame-Options`, etc.). **(2) Login rate limiting** — `express-rate-limit` in `authRoutes.js`, `loginLimiter` caps `POST /api/auth/login` at 10 attempts / 15 min per IP (returns `429`), to slow brute-force / credential-stuffing. `app.set('trust proxy', 1)` added so the limiter keys on the real client IP behind Render's proxy. **(3) Strict CORS** — `corsOriginCheck` in `app.js` had two holes: an empty `CORS_ORIGIN` env fell through to "allow all", and a regex allowed *any* `*.vercel.app` origin. Both removed — now only origins explicitly listed in `CORS_ORIGIN` (comma-separated) pass. **`CORS_ORIGIN` is now a required env var** on Render *and* locally (empty = every browser origin blocked); set it to the Vite dev URL locally and the production Vercel URL(s) on Render. **(4) Centralized error handler** — new `src/middlewares/errorHandler.js` (`notFound` + `errorHandler`), mounted last in `app.js`. Every controller previously did `catch (error) { console.log(error); res.status(500).json({ error: error.message }) }` — leaking internal error messages (~40 sites). Swept all 10 controllers: each handler signature gains `next`, and each `catch` block became `catch (error) { next(error) }`. `errorHandler` logs server-side, returns a generic `Internal Server Error` for 500s when `NODE_ENV === 'production'`, and guards `res.headersSent` (so a mid-stream failure in an Excel/PDF export doesn't crash on a double-send). **Companion owner action**: set `CORS_ORIGIN` + `NODE_ENV=production` on Render before/with this deploy, else the frontend gets CORS-blocked and 500s stay verbose. Intentional 4xx responses in controllers were left untouched — only the 500 catch path changed. |
| 32 | `fix/route-rbac-hardening` | **Security hardening branch 3 of 6.** Moved role enforcement to route middleware. The RF `validate` / `approve` / `reject` / `disburse` endpoints and the expense `POST /` (manual entry) endpoint were role-checked **only inside their controllers** — correct behavior, but the gate fired late. Added `authorizeRoles(...)` to each route with the **exact role set already used by the in-controller check** (`validate` → validator/auditor/admin; `approve` → admin/auditor/pastor; `reject` → admin/validator/auditor/pastor; `disburse` → admin/do; expense `POST` → admin), so behavior is identical, just enforced earlier. **In-controller checks kept** as defense-in-depth — and they also carry the conflict-of-interest "cannot act on your own RF" rule (#27) that middleware can't express. RF `submit`/`received`/`update`/`delete` left alone (ownership-based, not role-based). Also hardened `verifyToken` in `authMiddleware.js`: missing token now returns **`401`** not `400` (so the frontend's `apiFetch` 401-handler force-logs-out consistently), and a malformed `Authorization` header (no `Bearer ` prefix / no token after the space) is rejected cleanly instead of crashing `jwt.verify` with `undefined`. |
| 31 | `chore/remove-committed-token` | **Security hardening branch 2 of 6.** Deleted `test-export.js` — a standalone ad-hoc script (a hardcoded `fetch` to the report-export endpoint, never imported by `app.js` or anything else) that carried a **real admin JWT** hardcoded in an `Authorization: Bearer` header. The file was git-tracked and the token is in repo history across ~8 commits. `git rm` removes it going forward; `test-export.js` added to `.gitignore` so a local copy can't be re-committed. **No history rewrite** — deliberately: rotating `JWT_SECRET_KEY` (owner action, done alongside this branch) invalidates the leaked token regardless of whether it stays in history, and the token's own `exp` had already passed (~2026-05-04); a `filter-repo`/BFG force-push would break the feature-branch workflow for no added security. A signed JWT leaks no secret material, so the rotated `JWT_SECRET_KEY` is not derivable from it. If an export-test script is wanted again, recreate it locally (now gitignored) reading the token from `process.env`. |
| 30 | `fix/tithes-approval-rbac` | **Broken-access-control fix — first branch of a 6-branch security-hardening pass** (full audit lives in the plan file). The tithes `approve` / `reject` endpoints were role-gated **nowhere**: `tithesRoutes.js` had only `verifyToken`, and `approveTithes` / `rejectTithes` in `tithesController.js` only checked the conflict-of-interest rule (`submittedBy !== req.user.id`). Any authenticated account — including a plain `member` — could approve or reject any tithes entry, i.e. privilege escalation against live church financial records. Fix is two-layer: (1) `authorizeRoles('do','auditor','admin')` added to both routes — the real enforcement; (2) a module-level `REVIEWER_ROLES = ['do','auditor','admin']` const + an in-controller `403` guard in each handler as defense-in-depth (mirrors the pattern in `requestFormController`). Reviewer role set taken from the `submitTithes` notification targets (`['do','auditor','admin']`), which already encoded who reviews tithes. The conflict-of-interest check is unchanged. **Backend-first** per the security rule — frontend button-gating already matched these roles, so no frontend change needed for this branch. |
| 29 | `feat/db-indexes-and-ttl` | **MongoDB indexes + a Notification TTL** — outcome of an advisory question from Adrian ("do we need Redis + cron jobs?"). Verdict: no. Single-church app, hundreds of records, Render free-tier single instance — Redis is premature (doesn't fix the real latency, which is cold starts) and in-process cron is unreliable on a dyno that sleeps after 15 min idle. The two genuine low-cost wins, needing no new infra, were done instead. **(1) Indexes** — the schemas had almost none (only the `rfNo` / `pcfNo` unique indexes), so every filtered list query and report date-range query was a full collection scan. Added `schema.index(...)` calls matching the real query patterns: `TithesEntry` → `{status:1,createdAt:-1}` + `{entryDate:1}`; `RequestForm` → `{status:1,createdAt:-1}` + `{entryDate:1}` + `{requestedBy:1}`; `Expense` → `{date:1}` + `{category:1}`. `Voucher` left alone (`getAllVouchers` is an unfiltered `find()`). **(2) Notification TTL** — notifications fan out one doc per recipient per action and were never deleted (unbounded growth). Added `notifSchema.index({createdAt:1},{expireAfterSeconds: 60*60*24*90})` so MongoDB's background reaper auto-purges anything older than 90 days — **no scheduler, no cron, no code that runs**. TTL is on `createdAt` (deletes read or unread alike — a 90-day-old notification is stale either way; deleting only-read ones would need an extra timestamp field, not worth it). Also added `notifSchema.index({userId:1,createdAt:-1})` for the `getNotifications` per-user query+sort (separate from the single-field TTL index — they coexist). **Backend-only, additive, no API/controller/response change.** Mongoose builds the indexes on model init (`autoIndex` default on) on the next Render deploy; instant at this data volume. |

---

## Running the Project

```bash
cd backend
npm install
node --env-file=.env src/utils/seed.js   # seed admin user
npm run dev                               # starts on port 7001
```

**package.json scripts:**
```json
{
  "dev": "node --watch --env-file=.env app.js"
}
```

---

## Common Patterns

### Protected Route Pattern
```js
router.get('/', verifyToken, getAllTithes)
router.post('/', verifyToken, submitTithes)
router.patch('/:id/approve', verifyToken, authorizeRoles('do', 'auditor', 'admin'), approveTithes)
```

### Admin Route Pattern
```js
router.post('/', verifyToken, authorizeRoles('admin'), createUser)
```

### Controller Pattern
```js
const functionName = async (req, res) => {
  try {
    // 1. Get params/body/user
    // 2. Validate
    // 3. Check ownership/role
    // 4. Check status
    // 5. DB operation
    // 6. Send notification (if needed)
    // 7. Response
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: error.message })
  }
}
```

### Password Handling
```js
// Hash on create/update
const hashedPassword = await bcrypt.hash(password, 10)

// Compare on login/change-password
const isMatch = await bcrypt.compare(currentPassword, user.password)
```

### ObjectId Validation
```js
if (!mongoose.Types.ObjectId.isValid(id))
  return res.status(400).json({ error: 'Invalid ID' })
```

---

*Developed by Adrian Anicete — JOSCM Church Financial Management System*
*Backend: 100% Complete*
