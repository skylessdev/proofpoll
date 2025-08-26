# ProofPoll Lite

<p align="center">
  <a href="https://slack.com/oauth/v2/authorize?client_id=9333130942147.933845&scope=commands,chat:write&redirect_uri=https://proofpoll.replit.app/api/slack/oauth_redirect">
    <img alt="Install Slack" src="https://img.shields.io/badge/Slack-Install%20App-4A154B?logo=slack&logoColor=white" />
  </a>
  &nbsp;
  <a href="https://discord.com/oauth2/authorize?client_id=1406960180305858781&scope=applications.commands+bot&permissions=0">
    <img alt="Invite Discord" src="https://img.shields.io/badge/Discord-Invite%20Bot-5865F2?logo=discord&logoColor=white" />
  </a>
  &nbsp;
  <a href="https://proofpoll.replit.app/">
    <img alt="Docs" src="https://img.shields.io/badge/Docs-Read%20More-00B0F0?logo=readthedocs&logoColor=white" />
  </a>
  &nbsp;
  <a href="https://replit.com/@skylessdev/ProofPollLite">
    <img alt="Deploy on Replit" src="https://img.shields.io/badge/Replit-Deploy-FF6C37?logo=replit&logoColor=white" />
  </a>
</p>

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

4. Open [http://localhost:5000](http://localhost:5000) with your browser to see the result.

## 🚀 Install to Slack

You can add ProofPoll Lite to your Slack workspace in just a few steps:

### 1. Click the Install Link

Use the official Slack OAuth install link:

https://slack.com/oauth/v2/authorize?client_id=9333130942147.933845&scope=commands,chat:write&redirect_uri=https://proofpoll.replit.app/api/slack/oauth_redirect

The redirect URI is already configured in your app and points to the hosted ProofPoll Lite backend.

### 2. Authorize in Slack
- Choose your workspace
- Approve the requested permissions (/poll slash command, posting messages)

### 3. Test the /poll Command

Once installed:
1. Open any channel in your workspace
2. Type:
```
/poll "What's your favorite language?" "JavaScript" "Python" "TypeScript"
```
3. ProofPoll Lite will post an interactive poll to the channel. Votes are stored with verifiable proofs.

## 🎮 Install to Discord

Bring ProofPoll Lite into your Discord server:

### 1. Invite the Bot

Click this link to add the bot to any server you manage:

https://discord.com/oauth2/authorize?client_id=1406960180305858781&scope=applications.commands+bot&permissions=0

The bot requires minimal permissions — just enough to post polls and handle interactions.

### 2. Verify Interactions Endpoint

In the Discord Developer Portal → General Information, ensure the Interactions Endpoint URL is set to:

https://proofpoll.replit.app/api/discord/interactions

This allows Discord to verify and forward slash commands and button clicks.

### 3. Use the /poll Command

Once installed:
1. In any channel, type:
```
/poll text:"What's your favorite editor? VSCode, Vim, Emacs"
```
2. The bot will create a live poll with voting buttons.
3. Votes are validated and stored with cryptographic proofs.

## License

Files include SPDX-License-Identifier: (MIT OR MPL-2.0) headers.

© 2025 Skyless Innovation — dual licensed MIT/MPL-2.0
