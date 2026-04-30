# CollabX

A collaborative project management platform built with **React** (frontend), **Spring Boot** (backend), and **PostgreSQL** (database).

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Running Locally](#running-locally)
- [Running with Docker](#running-with-docker)
- [API Documentation](#api-documentation)
- [Project Documentation](#project-documentation)
- [Project Structure](#project-structure)

---

## Overview

CollabX is a full-stack web application for managing workspaces, projects, issues, and team members with real-time collaboration features. The platform includes:

- **User Management**: CRUD operations for user administration
- **Authentication**: JWT-based authentication with role-based access control
- **Dashboard**: Metrics and project insights visualization
- **Task Management**: Create, update, and track issues
- **Workspace Management**: Organize projects and team members

---

## Prerequisites

### Option 1: Local Development (Manual Setup)

#### macOS

```bash
# 1. Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install Java 26
brew install java
brew install openjdk@26
# Add to PATH if needed (follow brew instructions)

# 3. Install Node.js & npm
brew install node

# 4. Install PostgreSQL
brew install postgresql
brew services start postgresql

# 5. Verify installations
java -version
node --version
npm --version
psql --version
```

#### Windows

```cmd
# 1. Install Java 26
# Download from: https://www.oracle.com/java/technologies/downloads/
# Or use Windows Package Manager:
winget install Oracle.JDK.26

# 2. Install Node.js & npm
winget install OpenJS.NodeJS
# Or download from: https://nodejs.org/

# 3. Install PostgreSQL
winget install PostgreSQL.PostgreSQL
# Or download from: https://www.postgresql.org/download/windows/

# 4. Verify installations
java -version
node --version
npm --version
psql --version
```

### Option 2: Docker (Recommended)

Requires **Docker** and **Docker Compose**.

- **macOS**: [Install Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Windows**: [Install Docker Desktop](https://www.docker.com/products/docker-desktop)

Verify installation:

```bash
docker --version
docker-compose --version
```

---

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd CollabX
```

### 2. Configure Environment

Copy and configure the `.env` file:

```bash
# macOS / Linux
cp .env.example .env

# Windows
copy .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
POSTGRES_USER=collabx
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=collabx_db

# Backend
JWT_SECRET=your-32-byte-secret-key-for-jwt-hs256
JWT_EXPIRATION_MS=86400000
APP_CORS_ALLOWED_ORIGINS=http://localhost:3000

# Frontend
VITE_API_URL=http://localhost:8080
```

### 3. Choose Your Setup Method

<details>
<summary><b>Docker (Recommended)</b></summary>

```bash
docker-compose up --build
```

Then access:

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8080
- **API Docs**: http://localhost:8080/swagger-ui.html

</details>

<details>
<summary><b>Manual Setup (macOS)</b></summary>

#### Terminal 1: Start PostgreSQL

```bash
brew services start postgresql
```

#### Terminal 2: Start Backend

```bash
cd backend
./mvnw spring-boot:run
```

Backend runs on `http://localhost:8080`

#### Terminal 3: Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

</details>

<details>
<summary><b>Manual Setup (Windows)</b></summary>

#### Terminal 1: Start PostgreSQL

```cmd
# Ensure PostgreSQL service is running (should start automatically)
# Or manually start it through Services (services.msc)
```

#### Terminal 2: Start Backend

```cmd
cd backend
mvnw.cmd spring-boot:run
```

Backend runs on `http://localhost:8080`

#### Terminal 3: Start Frontend

```cmd
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

</details>

---

## Running with Docker

### Start All Services

```bash
# Build and start services
docker-compose up --build

# Or start in detached mode
docker-compose up -d --build
```

### Access Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **API Documentation**: http://localhost:8080/swagger-ui.html
- **Database**: `localhost:5432` (PostgreSQL)

### Useful Docker Commands

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Remove volumes (clear database)
docker-compose down -v

# Rebuild specific service
docker-compose build --no-cache backend
```

---

## Running Locally

### Backend Setup (Spring Boot)

1. **Navigate to backend directory**

   ```bash
   cd backend
   ```

2. **Install dependencies and build**

   ```bash
   # macOS / Linux
   ./mvnw clean install

   # Windows
   mvnw.cmd clean install
   ```

3. **Run the application**

   ```bash
   # macOS / Linux
   ./mvnw spring-boot:run

   # Windows
   mvnw.cmd spring-boot:run
   ```

4. **Access API**
   - API: http://localhost:8080
   - Swagger UI: http://localhost:8080/swagger-ui.html
   - Health Check: http://localhost:8080/actuator/health

### Frontend Setup (React + Vite)

1. **Navigate to frontend directory**

   ```bash
   cd frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run development server**

   ```bash
   npm run dev
   ```

4. **Access application**
   - Frontend: http://localhost:3000

5. **Build for production**

   ```bash
   npm run build
   ```

---

## API Documentation

### Access Swagger UI

Once the backend is running, visit:

```
http://localhost:8080/swagger-ui.html
```

### Authentication

The API uses **JWT (JSON Web Tokens)** for authentication:

1. **Login** to get a token:

   ```bash
   POST /api/auth/login
   {
     "email": "admin@example.com",
     "password": "your-password"
   }
   ```

2. **Response** includes a bearer token:

   ```json
   {
     "accessToken": "eyJ...",
     "tokenType": "Bearer",
     "expiresIn": 86400
   }
   ```

3. **Use the token** in subsequent requests:

   ```bash
   Authorization: Bearer <YOUR_TOKEN>
   ```

### Example: List Users (Admin Only)

```bash
curl -X GET "http://localhost:8080/api/users" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "accept: application/json"
```

---

## Project Documentation

### Backend Documentation

- **Framework**: Spring Boot 4.0.4
- **Language**: Java 26
- **Build Tool**: Maven
- **Database**: PostgreSQL with Flyway migrations
- **Authentication**: Spring Security + JWT
- **API Docs**: SpringDoc OpenAPI (Swagger UI)

See [backend/HELP.md](backend/HELP.md) for additional backend information.

### Frontend Documentation

- **Framework**: React 19
- **Language**: TypeScript 5.9
- **Build Tool**: Vite 8
- **UI Library**: Material-UI (MUI) 7
- **State Management**: React Context API
- **HTTP Client**: Axios

See [frontend/README.md](frontend/README.md) for additional frontend information.

### Database Migrations

Migrations are automatically applied on startup using Flyway:

- **Location**: `backend/src/main/resources/db/migration/`
- **Naming**: `V{version}__{description}.sql`

---

## Project Structure

```
CollabX/
├── backend/                    # Spring Boot application
│   ├── src/main/java/
│   │   └── com/mahindra/backend/
│   │       ├── controller/     # REST endpoints
│   │       ├── service/        # Business logic
│   │       ├── entity/         # JPA entities
│   │       ├── repository/     # Data access
│   │       ├── config/         # Configuration
│   │       ├── security/       # JWT & Security
│   │       └── exception/      # Exception handling
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   └── db/migration/       # SQL migrations
│   ├── pom.xml
│   └── Dockerfile
├── frontend/                   # React + Vite application
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   ├── pages/              # Page components
│   │   ├── services/           # API services
│   │   ├── auth/               # Authentication
│   │   ├── hooks/              # Custom hooks
│   │   └── styles/             # Theme & styles
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docker-compose.yml          # Docker services orchestration
├── .env.example                # Environment variables template
└── README.md                   # This file
```

---

## Security

- **JWT Authentication**: Stateless token-based authentication
- **Role-Based Access Control (RBAC)**: Admin, VIEW_ONLY roles
- **Password Encryption**: BCrypt hashing
- **CORS Configuration**: Configurable allowed origins
- **CSRF Protection**: Spring Security default protection

### Default Roles

- **ADMIN**: Full access to all endpoints
- **TEAM_LEAD**: Operational access
- **DEVELOPER**: Limited access
- **VIEW_ONLY**: Read-only access to public endpoints

---

## Project Wiki

> [Link to Project Wiki](https://github.com/fernando-cb12/TechMahindra-PM/wiki)

Additional documentation, architectural decisions, troubleshooting guide, and team guidelines can be found in the [Project Wiki](https://github.com/fernando-cb12/TechMahindra-PM/wiki).

---

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit your changes: `git commit -m "Add your feature"`
3. Push to the branch: `git push origin feature/your-feature`
4. Open a Pull Request

---

## License

This project is licensed under the MIT License — see the LICENSE file for details.

---

## Troubleshooting

### Backend Issues

- **Port 8080 already in use**: Change in `application.properties` → `server.port=8081`
- **Database connection failed**: Verify PostgreSQL is running and `.env` credentials are correct
- **JWT errors**: Ensure `JWT_SECRET` in `.env` is at least 32 bytes for HS256

### Frontend Issues

- **CORS errors**: Check `APP_CORS_ALLOWED_ORIGINS` in backend `application.properties`
- **API not responding**: Verify backend is running on `http://localhost:8080`
- **Port 3000 already in use**: Change in `vite.config.ts` or run `npm run dev -- --port 3001`

### Docker Issues

- **Container won't start**: Check logs with `docker-compose logs`
- **Database volume issues**: Clear with `docker-compose down -v`

---

## Support

For issues and questions, please open an issue on the repository or contact the development team.
