# ⚖️ Legal AI Assistant - BFF & API Gateway

This repository contains the official **Backend-for-Frontend (BFF)** and **API Gateway** for the "Nyay Mitra" Legal AI application. It is a secure, high-performance Node.js service that manages users, sessions, and data persistence, while acting as the single, authoritative entry point for the frontend.

### ✨ Core Features

* 🔐 **Secure API Gateway**: Acts as the single, secure entry point for the frontend, handling all user authentication and session management with JWT.
* 🚀 **AI Service Orchestration**: Intelligently calls the internal Python AI backend to perform complex tasks like document analysis, RAG, and translation.
* 💾 **Persistent Data Storage**: Manages all user data, document metadata, and conversation histories in a dedicated database (MongoDB or PostgreSQL).
* 🌐 **Real-time Language Support**: Proxies proactive language detection requests to the AI backend to enable a seamless multilingual user experience.
* 🛡️ **Enhanced Security**: Built with `helmet` for protection against common web vulnerabilities and `express-rate-limit` to prevent abuse.

---

## 🏗️ Core Architecture

This service is part of a modern microservices architecture. The frontend only communicates with this Node.js BFF, which in turn communicates with the specialized Python AI service.

`Frontend` ↔️ `Node.js BFF (This Repo)` ↔️ `Python AI Service`

### 🛠️ Tech Stack

* **Framework**: Express.js with TypeScript
* **Database**: MongoDB with Mongoose (or PostgreSQL with Prisma)
* **Authentication**: Passport.js with JWT for secure sessions.
* **API Client**: Axios for server-to-server communication.
* **Security**: Helmet, Express Rate Limit, CORS
* **Validation**: Zod for type-safe data validation.

---

## 🚀 Setup

### Prerequisites

* **Node.js** (LTS version)
* **npm** or **Yarn**
* **MongoDB** or **PostgreSQL** Database
* A running instance of the **Python AI Backend**.

### Setup Steps

```bash
# Clone the repository
git clone [https://github.com/AnuGuin/LegalAI_Backend.git](https://github.com/AnuGuin/LegalAI_Backend.git)
cd LegalAI_Backend

# Install dependencies
npm install

# Create and configure your .env file
cp .env.example .env

# Start the development server
npm run dev
```

---

## � API Routes

### Health Check
* `GET /health` - Server health status

### Authentication Routes (`/api/v1/auth`)

#### Local Authentication
* `POST /api/v1/auth/register` - Register a new user
* `POST /api/v1/auth/login` - Login with credentials
* `POST /api/v1/auth/refresh` - Refresh access token
* `POST /api/v1/auth/logout` - Logout user (requires authentication)
* `GET /api/v1/auth/me` - Get current user info (requires authentication)

#### OAuth Authentication
* `GET /api/v1/auth/google` - Initiate Google OAuth login
* `GET /api/v1/auth/google/callback` - Google OAuth callback
* `GET /api/v1/auth/meta` - Initiate Meta/Facebook OAuth login
* `GET /api/v1/auth/meta/callback` - Meta OAuth callback

### User Routes (`/api/v1/user`) 🔒
All user routes require authentication.

* `GET /api/v1/user/profile` - Get user profile
* `PUT /api/v1/user/profile` - Update user profile
* `GET /api/v1/user/stats` - Get user statistics

### Chat Routes (`/api/v1/chat`)

#### Public Routes
* `GET /api/v1/chat/shared/:shareLink` - Get shared conversation (no auth required)

#### Protected Routes 🔒
All routes below require authentication.

* `POST /api/v1/chat/conversations` - Create new conversation
  - Body: `{ mode: 'NORMAL' | 'AGENTIC', title?, documentId?, documentName?, sessionId? }`
* `GET /api/v1/chat/conversations` - Get all user conversations
* `DELETE /api/v1/chat/conversations` - Delete all user conversations
* `GET /api/v1/chat/conversations/:conversationId` - Get conversation messages
* `GET /api/v1/chat/conversations/:conversationId/info` - Get conversation info
* `POST /api/v1/chat/conversations/:conversationId/messages` - Send message
  - Body: `{ message, mode }`
  - Optional file upload (for AGENTIC mode): PDF, DOC, DOCX, TXT (max 10MB)
* `POST /api/v1/chat/conversations/:conversationId/share` - Share/unshare conversation
  - Body: `{ share: boolean }`
* `DELETE /api/v1/chat/conversations/:conversationId` - Delete conversation

### Document Routes (`/api/v1/documents`) 🔒
All document routes require authentication.

* `POST /api/v1/documents` - Generate new document
  - Body: `{ prompt: string (10-5000 chars), format?: 'pdf' | 'docx' | 'txt' }`
* `GET /api/v1/documents` - Get all user documents
* `GET /api/v1/documents/:id` - Get specific document
* `DELETE /api/v1/documents/:id` - Delete document

### Translation Routes (`/api/v1/translation`) 🔒
All translation routes require authentication.

* `POST /api/v1/translation/translate` - Translate text
  - Body: `{ text: string, sourceLang: string, targetLang: string }`
* `POST /api/v1/translation/detect-language` - Detect language of text
  - Body: `{ text: string }`
* `GET /api/v1/translation/history` - Get translation history (up to 50 recent)

> 🔒 Routes marked with this icon require JWT authentication via the `Authorization: Bearer <token>` header.

---

## �🛣️ Project Roadmap

* **Implement Real-time Streaming**: Proxy token streams from the Python AI backend to the frontend for a "typing" effect.
* **Document Management Dashboard**: Build out endpoints for the frontend to list, view, and manage uploaded documents.
* **Admin Panel Integration**: Add administrative routes for monitoring system health and AI service statistics.
* **Enhanced Caching**: Implement a caching layer (e.g., with Redis) for frequently requested data from the AI backend, like capabilities.

---

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.
