# ☁️ Cloud Based – File Strorage Platform

A **full-stack cloud storage web application** inspired by Google Drive, built using **FastAPI** and **React**.  
It allows users to securely upload, organize, preview, share, and manage files with advanced features such as **version history**, **activity logs**, **tags**, and **intelligent search**.



## 🔗 Live Demo

- **Frontend**: https://cloud-storage-frontend.netlify.app
- **Backend API**: https://cloud-storage-backend-k1dt.onrender.com
- **Swagger Docs**: https://cloud-storage-backend-k1dt.onrender.com/docs



## 📌 Overview

This project is a **production-ready cloud storage system** that replicates core Google Drive functionality. It provides a secure, scalable platform for file management with enterprise-grade features including:

- **Secure Authentication**: JWT-based auth with OAuth support
- **File Management**: Upload, organize, preview, and share files
- **Version Control**: Automatic file versioning with restore capability
- **Activity Tracking**: Comprehensive audit logs
- **Smart Search**: Autocomplete search with advanced filters
- **Storage Management**: Real-time storage quota monitoring

### Why This Project?

This application demonstrates modern full-stack development practices:
- RESTful API architecture
- Secure file storage with cloud integration
- Real-time data updates
- Production deployment strategies



## ✨ Key Features

### 🔐 Authentication & Security
- ✅ Email & password authentication with secure bcrypt hashing
- ✅ Google OAuth 2.0 integration for seamless login
- ✅ JWT token-based session management with auto-refresh
- ✅ Password reset functionality
- ✅ Protected API routes with role-based access control

### 📁 File & Folder Management
- ✅ **File Upload**: Drag-and-drop or button upload with progress tracking
- ✅ **Multi-Format Support**: Images, PDFs, videos, audio, documents (up to 500MB)
- ✅ **Folder Organization**: Create nested folder hierarchies
- ✅ **Duplicate Handling**: Auto-rename duplicates (file.txt → file(1).txt)
- ✅ **Trash System**: Soft delete with restore capability
- ✅ **Multi-Select**: Bulk delete/restore operations

### 👁️ File Preview
- ✅ **Image Preview**: JPG, PNG, GIF, WebP with zoom/rotate
- ✅ **PDF Viewer**: In-browser PDF rendering
- ✅ **Media Playback**: Video and audio preview
- ✅ **Text Files**: Syntax-highlighted code preview
- ✅ **Download Fallback**: For unsupported formats

### 🏷️ Tags & Labels
- ✅ **Color-Coded Tags**: Organize files with custom tags
- ✅ **Multi-Tag Support**: Apply multiple tags per file
- ✅ **Tag Management**: Create, edit, delete tags
- ✅ **Visual Organization**: Quick identification with colors

### 🔄 Version History
- ✅ **Automatic Versioning**: Every update creates a new version
- ✅ **Version Tracking**: View all previous versions with metadata
- ✅ **Restore Capability**: Rollback to any previous version
- ✅ **Version Comparison**: See file sizes and dates

### 📊 Activity Logs
- ✅ **Action Tracking**: Upload, delete, share, restore logs
- ✅ **Selective Deletion**: Delete individual or bulk activities
- ✅ **Clear All**: One-click history cleanup

### 🔍 Intelligent Search
- ✅ **Autocomplete Suggestions**: Real-time search with dropdown
- ✅ **Advanced Filters**: Filter by type, size, date
- ✅ **Keyboard Navigation**: Arrow keys to navigate suggestions
- ✅ **Highlighted Results**: Visual match highlighting

### 💾 Storage Management
- ✅ **Real-Time Usage**: Visual storage quota indicator
- ✅ **Usage Warnings**: Color-coded alerts (75%, 90%)
- ✅ **Storage Breakdown**: See used vs total storage
- ✅ **10GB Free Storage**: Generous free tier

### 🤝 Sharing & Collaboration

- ✅ **User Sharing**: Share files with specific users via email
- ✅ **Role-Based Permissions**: Viewer or Editor roles
- ✅ **Public Links**: Generate shareable public URLs
- ✅ **Link Protection**: Optional password and expiry date


## 🛠 Tech Stack

### Frontend Technologies

| Technology        | Version   | Purpose       | Why Used                                  |
|-------------------|-----------|---------------|-------------------------------------------|
| **React**         | 19.2      | UI Framework  | Component-based architecture, virtual DOM |
| **Vite**          | 7.3       | Build Tool    | Fast HMR, optimized production builds     |
| **Tailwind CSS**  | 4.1       | Styling       | Utility-first, responsive design          |
| **Axios**         | 1.1       | HTTP Client   | Promise-based API requests, interceptors  |
| **React Router**  | 7.10      | Routing       | Client-side navigation                    |
| **React Hot Toast**| 2.4      | Notifications | Clean, customizable toasts                |
| **Lucide React**  | 0.562     | Icons         | Lightweight, customizable icons           |


### Backend Technologies

| Technology        | Version   | Purpose               | Why Used                          |
|-------------------|-----------|-----------------------|-----------------------------------|
| **FastAPI**       | 0.104     | API Framework         | High performance, async support   |
| **Python**        | 3.11      | Language              | Modern syntax, strong typing      |
| **SQLAlchemy**    | 2.0       | ORM                   | Database abstraction, migrations  |
| **Supabase**      | -         | Backend-as-a-Service  | Database + Storage + Auth         |
| **Pydantic**      | 2.1       | Validation            | Data validation, serialization    |
| **python-jose**   | 3.3       | JWT                   | Token generation/verification     |
| **bcrypt**        | 4.1       | Hashing               | Password security                 |


### Infrastructure

| Service                   | Purpose           | Why Used                          |
|---------------------------|-------------------|-----------------------------------|
| **Vercel**                | Frontend Hosting  | Deploy, CDN       |
| **Render**                | Backend Hosting   | Deploy            |
| **Supabase Storage**      | File Storage      | Secure, scalable object storage   |
| **PostgreSQL (Supabase)** | Database          | Managed, auto-backups             |



## 🏗 Architecture

```
┌─────────────────┐
│   React App     │  ← User Interface (Vercel)
│   (Frontend)    │
└────────┬────────┘
         │ HTTPS/REST API
         ▼
┌─────────────────┐
│   FastAPI       │  ← Business Logic (Render)
│   (Backend)     │
└────────┬────────┘
         │
    ┌────┴────┬──────────┐
    ▼         ▼          ▼
┌────────┐ ┌─────────┐ ┌──────────┐
│PostgeSQL││Supabase │ │  JWT     │
│Database ││Storage  │ │  Auth    │
└────────┘ └─────────┘ └──────────┘
```


### Architecture Flow:

1. **User Interaction**: User interacts with React UI
2. **API Request**: Axios sends authenticated requests to FastAPI
3. **Authentication**: JWT token validated
4. **Business Logic**: FastAPI processes request
5. **Database**: PostgreSQL stores metadata
6. **File Storage**: Supabase stores actual files
7. **Response**: JSON data returned to frontend




## 📸 Functionality Walkthrough

### 1️⃣ User Registration

**Description:**  
New users can create an account using email and password. The system securely hashes passwords using bcrypt before storing them in the database.

**Tech Stack:**
- **Backend**: FastAPI `/auth/register` endpoint
- **Database**: User table with hashed_password field
- **Security**: bcrypt password hashing

**Screenshot:**

![User Registration](Screenshots/Register.png)


### 2️⃣ User Login

**Description:**  
Registered users authenticate using email/password. Upon successful login, the backend generates a JWT access token valid for 30 minutes with auto-refresh capability.

**Tech Stack:**
- **Backend**: FastAPI `/auth/login` endpoint
- **Authentication**: JWT tokens (python-jose)
- **Frontend**: Axios interceptors for token management

**Screenshot:**

![User Login](Screenshots/Login.png)


### 3️⃣ Google OAuth Login

**Description:**  
Users can authenticate using their Google account. The system uses OAuth 2.0 protocol to securely verify identity without storing passwords.

**Tech Stack:**
- **OAuth Provider**: Google Cloud Platform
- **Backend**: `/auth/google/callback` endpoint
- **Library**: Google OAuth2 library

**Flow:**
1. User clicks "Continue with Google"
2. Redirected to Google consent screen
3. Google returns authorization code
4. Backend exchanges code for user info
5. JWT token generated and user logged in

**Screenshot:**

![Google OAuth Login](Screenshots/Google-Login.png)


### 4️⃣ Dashboard - File & Folder View

**Description:**  
Main dashboard displays user's files and folders in grid or list view. Shows file metadata including name, size, date, tags, and provides quick actions.

**Tech Stack:**
- **Frontend**: React components with Tailwind CSS
- **State Management**: React useState/useEffect
- **API**: GET `/files/` and `/folders/`

**Features Visible:**
- Grid/List view toggle
- Storage usage indicator
- Breadcrumb navigation
- Quick action buttons
- File tags display
- Pagination (50 items per load)


**Screenshot:**

![Dashboard](Screenshots/Dashboard.png)


### 5️⃣ File Upload with Progress

**Description:**  
Users can upload files via drag-and-drop or file picker. The system displays real-time upload progress and automatically creates version 1 for new files.

**Tech Stack:**
- **Frontend**: React Dropzone, Axios with onUploadProgress
- **Backend**: FastAPI multipart/form-data handling
- **Storage**: Supabase Storage bucket

**Upload Process:**
1. File selected/dropped
2. FormData created
3. Axios sends POST with progress callback
4. Backend uploads to Supabase Storage
5. Metadata saved to PostgreSQL
6. Version 1 created automatically
7. Activity logged

**Screenshot:**

![File Upload](Screenshots/upload.png)



### 6️⃣ Create Folder

**Description:**  
Users can organize files by creating folders and nested sub-folders. Supports hierarchical structure similar to traditional file systems.

**Tech Stack:**
- **Backend**: `/folders/` endpoint with parent_id
- **Database**: Self-referencing foreign key for hierarchy

**Screenshot:**

![Create Folder](Screenshots/create-folder.png)


### 7️⃣ File Preview

**Description:**  
Supported file formats can be previewed directly in the browser without downloading. Includes zoom, rotate, and navigation controls.

**Tech Stack:**
- **Frontend**: Modal with file-specific renderers
- **Image**: Native <img> with transform controls
- **PDF**: iframe with embedded viewer
- **Video/Audio**: HTML5 media elements
- **Text**: Syntax highlighted <pre>

**Supported Formats:**
- Images: JPG, PNG, GIF, WebP
- Documents: PDF
- Videos: MP4, MOV, AVI
- Audio: MP3, WAV, OGG
- Text: TXT, JSON, MD, code files

**Screenshot:**

![File Preview](Screenshots/file-preview.png)


### 8️⃣ Tag Management

**Description:**  
Create color-coded tags to organize files across folders. Tags provide visual categorization and quick filtering.

**Tech Stack:**
- **Backend**: `/tags/` CRUD endpoints
- **Database**: Many-to-many relationship (file_tags table)
- **Frontend**: Tag picker modal with color selection

**Features:**
- 8 pre-defined colors
- Custom tag names
- Edit/Delete tags
- View files by tag


**Screenshot:**

![Tag Management](Screenshots/tags.png)


### 9️⃣ File with Tags Display

**Description:**  
Files show their applied tags as colored badges for quick visual identification.

**Tech Stack:**
- **Frontend**: Dynamic badge rendering with inline styles
- **Database**: JOIN query to fetch file tags

**Screenshot:**

![File with Tags](Screenshots/file-with-tags.png)


### 🔟 File Sharing

**Description:**  
Share files with specific users via email or create public shareable links with optional password protection and expiry.

**Tech Stack:**
- **Backend**: `/shares/` endpoints
- **Database**: shares and public_links tables
- **Security**: UUID tokens, password hashing, expiry checks

**Sharing Options:**

**User Sharing:**
- Viewer: Can only view/download
- Editor: Can edit/delete
- Shared with email address

**Public Links:**
- Optional password protection
- Expiry date (1-365 days)

**Screenshot:**

![Share Modal](Screenshots/Share.png)


### 1️⃣1️⃣ Version History

**Description:**  
Every file update creates a new version. Users can view all versions with metadata and restore any previous version.

**Tech Stack:**
- **Backend**: `/versions/` endpoints
- **Database**: file_versions table with version_number
- **Logic**: Auto-increment version on upload

**Version Process:**
1. Upload file with existing name
2. System detects duplicate
3. Creates new version (e.g., version 2)
4. Updates file.current_version
5. Stores old file_path in versions table
6. Allows restore to any version

**Screenshot:**

![Version History](Screenshots/Version_History.png)


### 1️⃣2️⃣ Activity Log

**Description:**  
Comprehensive audit trail of all user actions including uploads, deletes and restores. Supports selective or bulk deletion of logs.

**Tech Stack:**
- **Backend**: `/activities/` endpoints
- **Database**: activity_logs table with JSON details
- **Features**: Filter, bulk delete, clear all

**Logged Activities:**
- Upload
- Delete
- Restore


**Screenshot:**

![Activity Log](Screenshots/activity-log.png)


### 1️⃣3️⃣ Smart Search with Autocomplete

**Description:**  
Real-time search with dropdown suggestions as you type. Shows matching files and folders with highlighted text. Supports keyboard navigation.

**Tech Stack:**
- **Frontend**: Debounced search 
- **Backend**:  Case-insensitive matching
- **Features**: Keyboard navigation (↑↓), highlighted matches

**Search Features:**
- Autocomplete after 2 characters
- Separate file/folder sections
- Shows 5 results per category
- Highlights matching text
- Keyboard navigable
- Advanced filters (type, size, date)


**Screenshot:**

![Search Autocomplete](Screenshots/Search.png)


### 1️⃣4️⃣ Trash & Restore

**Description:**  
Deleted files/folders move to trash before permanent deletion. Supports individual or bulk restore/delete operations.

**Tech Stack:**
- **Backend**: Soft delete with is_deleted flag
- **Features**: Restore, permanent delete, bulk operations


**Screenshot:**

![Trash](Screenshots/Trash.png)


### 1️⃣5️⃣ Storage Usage Monitoring

**Description:**  
Real-time storage quota indicator in sidebar showing used/total storage with color-coded warnings.

**Tech Stack:**
- **Frontend**: Calculates total file sizes
- **Display**: Progress bar with percentage
- **Alerts**: Yellow (75%), Red (90%)

**Features:**
- Visual progress bar
- Percentage display
- Size in MB/GB
- Warning alerts
- 5GB free storage

**Screenshot:**

![Storage Usage](Screenshots/Storage-usage.png)


## 🗄 Database Design (Key Tables)

-users
-files
-folders
-tags
-file_tags (Many-to-Many)
-file_versions
-shares
-public_links
-activity_logs


### Database Relationships:

- **One-to-Many**: User → Files, User → Folders, Folder → Files
- **Self-Referencing**: Folder → parent_folder (nested folders)
- **Many-to-Many**: Files ↔ Tags (via file_tags)
- **One-to-Many**: File → Versions, File → Shares


## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login user | No |
| POST | `/auth/refresh` | Refresh access token | Yes |
| GET | `/auth/google/url` | Get Google OAuth URL | No |
| POST | `/auth/google/callback` | Handle OAuth callback | No |

### Files

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/files/upload` | Upload file | Yes |
| GET | `/files/` | List files (paginated) | Yes |
| GET | `/files/search` | Search files | Yes |
| GET | `/files/{id}` | Get file details | Yes |
| GET | `/files/{id}/preview` | Get preview URL | Yes |
| DELETE | `/files/{id}` | Move to trash | Yes |
| DELETE | `/files/{id}/permanent` | Permanent delete | Yes |
| POST | `/files/{id}/restore` | Restore from trash | Yes |
| POST | `/files/{id}/star` | Toggle star | Yes |
| GET | `/files/starred/all` | Get starred files | Yes |
| GET | `/files/trash/all` | Get trashed files | Yes |

### Folders

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/folders/` | Create folder | Yes |
| GET | `/folders/` | List folders | Yes |
| GET | `/folders/search` | Search folders | Yes |
| PUT | `/folders/{id}` | Update folder | Yes |
| DELETE | `/folders/{id}` | Move to trash | Yes |
| POST | `/folders/{id}/restore` | Restore folder | Yes |

### Tags

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/tags/` | Create tag | Yes |
| GET | `/tags/` | List all tags | Yes |
| PUT | `/tags/{id}` | Update tag | Yes |
| DELETE | `/tags/{id}` | Delete tag | Yes |
| POST | `/tags/file/{file_id}/tags` | Add tags to file | Yes |
| GET | `/tags/{id}/files` | Get files by tag | Yes |

### Shares

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/shares/` | Share with user | Yes |
| GET | `/shares/shared-with-me` | Get shared items | Yes |
| GET | `/shares/my-shares` | Get my shares | Yes |
| DELETE | `/shares/{id}` | Remove share | Yes |
| POST | `/shares/public-link` | Create public link | Yes |
| GET | `/shares/public/{token}` | Access public link | No |

### Versions

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/versions/file/{file_id}` | Get file versions | Yes |
| POST | `/versions/file/{file_id}/restore/{version}` | Restore version | Yes |

### Activity

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/activities/` | Get user activities | Yes |
| DELETE | `/activities/{id}` | Delete activity | Yes |
| POST | `/activities/bulk-delete` | Bulk delete | Yes |
| DELETE | `/activities/clear/all` | Clear all logs | Yes |


## 💻 Installation Guide

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL (or Supabase account)
- Google OAuth Credentials (optional, for Google login)


## 🚀 Installation & Setup

### 1. Clone the Repository
git clone 
cd cloud-storage-project


### 2. Backend Setup
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment

# Windows:
.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env with your credentials
nano .env

**Backend .env file sample:**
```env
DATABASE_URL=postgresql://user:password@host:port/database
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your_supabase_key
SECRET_KEY=your-secret-key-here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=your local host url/auth/google/callback
```

**Start Backend:**
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000


### 3. Frontend Setup
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env
nano .env

**Frontend .env file sample:**
```env
VITE_API_URL=your local host url
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

**Start Frontend:**
npm run dev

## 🚀 Deployment
```
Frontend (Netlify)
Backend (Render)
```



## 🔮 Future Enhancements
- ✅ Two-Factor Authentication (2FA)
- ✅ Advanced Analytics Dashboard
- ✅ File Comments & Annotations
- ✅ Real-Time Notifications
- ✅ Desktop Sync Client
- ✅ Mobile App (React Native)
- ✅ Office Document Editing
- ✅ File Versioning Comparison
- ✅ Team Workspaces
- ✅ Admin Dashboard
- ✅ Audit Logs Export
- ✅ GDPR Compliance Tools


## 👨‍💻 Author

Nikitha Devaraj



## ⭐ Acknowledgments
- FastAPI Documentation
- React Documentation
- Supabase Documentation
- TailwindCSS
- Lucide Icons
- Vercel & Render for hosting









