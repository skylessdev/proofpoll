# ProofPoll Lite

## Overview

ProofPoll Lite is a lightweight polling application with cryptographic proof mechanisms and messaging platform integrations. Built using Next.js 14 with App Router, TypeScript, Tailwind CSS, and Prisma ORM, the application provides secure polling with HMAC-SHA256 vote verification. The system includes fully operational Slack integration with slash commands and interactive buttons, plus Discord integration ready for deployment.

## Recent Changes (August 2025)

### Database Resolution
- **Session Pooler Migration**: Resolved PostgreSQL prepared statement conflicts (42P05) by switching from Transaction Pooler (port 6543) to Session Pooler (port 5432)
- **Cryptographic Proofs**: HMAC-SHA256 proof system verified as fully active with voterProofId and proofHash generation

### Slack Integration - LIVE ✅
- **Live Testing Confirmed**: End-to-end Slack integration verified operational on August 17, 2025
- **Request URLs Active**: Both `/api/slack/commands` and `/api/slack/interactions` responding correctly
- **Signature Verification**: HMAC-SHA256 signature validation working (timestamp delta ~1s)
- **Vote Flow Complete**: `/poll` command → button interactions → vote recording → response updates
- **Environment**: SLACK_SIGNING_SECRET and SLACK_BOT_TOKEN configured, SLACK_CHANNEL_ID not required

### Discord Integration - CODE COMPLETE
- **Endpoints Ready**: `/api/discord/interactions` with Ed25519 signature verification
- **Command Structure**: Poll slash command JSON defined for registration
- **Environment**: DISCORD_PUBLIC_KEY and DISCORD_APP_ID configured
- **Status**: Ready for portal configuration (Interactions URL + command registration)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Next.js 14 with App Router**: Utilizes the latest Next.js features including the new app directory structure for improved routing and layouts
- **TypeScript Configuration**: Strict type checking enabled with modern ES6+ features and JSX support
- **Component Structure**: Follows Next.js 14 conventions with the app directory containing pages and layouts
- **Styling Strategy**: Tailwind CSS with custom CSS variables for theme management, supporting both light and dark modes

### Backend Architecture  
- **Server-Side Rendering**: Next.js handles both frontend and backend concerns through API routes and server components
- **Database Layer**: Prisma ORM configured for database management and type-safe database queries
- **File Structure**: Modular approach with separate configuration files for different concerns (PostCSS, Tailwind, TypeScript)

### Data Storage Solutions
- **Database ORM**: Prisma client for type-safe database operations
- **Schema Management**: Prisma migrations for database schema versioning
- **Database Agnostic**: Prisma setup allows for multiple database backends

### Authentication and Authorization
- **Not Currently Implemented**: No authentication layer present in the current codebase
- **Future Consideration**: Architecture supports adding authentication middleware through Next.js API routes

### Styling and UI Architecture
- **Utility-First CSS**: Tailwind CSS for rapid UI development
- **Theme System**: CSS custom properties for dynamic theming with automatic dark/light mode detection
- **Responsive Design**: Mobile-first approach with Tailwind's responsive utilities
- **Typography**: Inter font family loaded through Next.js font optimization

## External Dependencies

### Core Framework Dependencies
- **Next.js (^15.4.6)**: React framework for production with built-in optimizations
- **React (^19.1.1) & React DOM (^19.1.7)**: Latest React libraries for UI rendering
- **TypeScript (^5.9.2)**: Static type checking and enhanced developer experience

### Database and ORM
- **Prisma (^6.13.0)**: Database toolkit and ORM for TypeScript/Node.js
- **@prisma/client (^6.13.0)**: Generated Prisma client for database operations

### Styling and CSS Processing
- **Tailwind CSS (^4.1.11)**: Utility-first CSS framework
- **PostCSS (^8.5.6)**: CSS preprocessing tool
- **Autoprefixer (^10.4.21)**: Adds vendor prefixes to CSS automatically

### Development and Build Tools
- **TypeScript Type Definitions**: @types packages for Node.js, React, and React DOM
- **Vercel Deployment**: Configured for seamless deployment on Vercel platform

### Notable Integrations
- **No External APIs**: Currently no third-party API integrations present
- **No Authentication Services**: No external authentication providers configured
- **Deployment Ready**: Pre-configured for Vercel hosting with optimized build settings