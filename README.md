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

## 🛣️ Project Roadmap

* **Implement Real-time Streaming**: Proxy token streams from the Python AI backend to the frontend for a "typing" effect.
* **Document Management Dashboard**: Build out endpoints for the frontend to list, view, and manage uploaded documents.
* **Admin Panel Integration**: Add administrative routes for monitoring system health and AI service statistics.
* **Enhanced Caching**: Implement a caching layer (e.g., with Redis) for frequently requested data from the AI backend, like capabilities.

---

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.
