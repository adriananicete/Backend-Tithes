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
├── .gitignore                 ← node_modules, .env, .claude/settings.local.json, scripts/backups/
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
    if (!tokenHeader) return res.status(400).json({ error: 'No token, Access Denied!' })
    const token = tokenHeader.split(' ')[1]
    const jwtToken = jwt.verify(token, process.env.JWT_SECRET_KEY)
    req.user = jwtToken  // { id, role }
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
1. `authorizeRoles` middleware — used on admin routes
2. In-controller role check — used for complex logic (conflict of interest, ownership checks)

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
PATCH  /api/tithes/:id/approve  ← all except submitter (conflict of interest check)
PATCH  /api/tithes/:id/reject   ← all roles — requires rejectionNote
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
router.patch('/:id/approve', verifyToken, approveTithes)
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
