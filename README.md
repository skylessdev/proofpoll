# ProofPoll Lite

[![CI](https://github.com/skylessinnovation/proofpoll-lite/actions/workflows/ci.yml/badge.svg)](https://github.com/skylessinnovation/proofpoll-lite/actions/workflows/ci.yml)
[![License: MIT/MPL-2.0](https://img.shields.io/badge/license-MIT%20or%20MPL--2.0-blue.svg)](#license)

A lightweight polling application with cryptographic proof mechanisms and messaging platform integrations. Built using Next.js 14 with App Router, TypeScript, Tailwind CSS, and Prisma ORM, the application provides secure polling with HMAC-SHA256 vote verification.

## Features

- **Cryptographic Security**: HMAC-SHA256 vote verification with cryptographic proofs
- **Multi-Platform Integration**: Slack slash commands and Discord bot support
- **Modern Stack**: Next.js 14 with App Router, TypeScript, Tailwind CSS, Prisma ORM
- **Production Ready**: CI/CD with automated testing, SPDX license compliance
- **Vercel Deployment**: Optimized for seamless deployment and scaling

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up your database:
```bash
npx prisma migrate dev
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## License

Files include SPDX-License-Identifier: (MIT OR MPL-2.0) headers.

© 2025 Skyless Innovation — dual licensed MIT/MPL-2.0
