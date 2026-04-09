# TechMahindra Frontend

A React + TypeScript frontend application built with Vite, Material-UI, and modern development practices.

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling and development server
- **Material-UI (MUI)** for UI components
- **ESLint** for code linting

## Project Structure

```
frontend/
├── public/                          # Static assets
├── src/
│   ├── assets/                      # Images, fonts, and other assets
│   ├── components/                  # Reusable UI components
│   │   ├── layout/                  # Layout components (Layout, Header, etc.)
│   │   ├── routes/                  # Route-specific components
│   │   └── shared/                  # Shared/reusable components
│   ├── pages/                       # Page components
│   ├── App.tsx                      # Main App component
│   └── main.tsx                     # Application entry point
├── eslint.config.js                 # ESLint configuration
├── tsconfig*.json                   # TypeScript configurations
├── vite.config.ts                   # Vite configuration
├── package.json                     # Dependencies and scripts
└── README.md                        # This file
```

## Component Organization

### Layout Components (`src/components/layout/`)
- `Layout.tsx` - Main application layout with header and content area

### Shared Components (`src/components/shared/`)
- `Button.tsx` - Custom styled button component
- `index.ts` - Barrel exports for easy imports

### Route Components (`src/components/routes/`)
- Organized by route/feature
- `login/LoginForm.tsx` - Login form component

### Pages (`src/pages/`)
- Top-level page components
- Each page represents a route in the application

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Linting

```bash
npm run lint
```

## Code Style

This project uses ESLint for code linting. The configuration includes:

- TypeScript-specific rules
- React-specific rules
- Custom rules for code quality

## Architecture Principles

- **Modularization**: Components are organized into logical modules
- **Reusability**: Shared components are extracted for reuse across the app
- **Separation of Concerns**: Pages, components, and logic are properly separated
- **Type Safety**: Full TypeScript coverage for better development experience
