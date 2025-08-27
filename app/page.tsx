/* SPDX-License-Identifier: (MIT OR MPL-2.0) */

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-6xl font-bold text-center bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
          ProofPoll Lite
        </h1>
        <p className="mt-8 text-xl text-center text-gray-600 dark:text-gray-400">
          A lightweight polling application with cryptographic proof mechanisms
        </p>
        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="https://slack.com/oauth/v2/authorize?client_id=9333130942147.9338455346085&scope=commands,chat:write&redirect_uri=https%3A%2F%2Fproofpoll.replit.app%2Fapi%2Fslack%2Foauth_redirect"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Install ProofPoll Lite to Slack"
            className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium bg-[#4A154B] text-white hover:opacity-95 transition"
          >
            <span className="mr-2 inline-block h-2 w-2 bg-white rounded-sm" />
            Install to Slack
          </a>

          <a
            href="https://discord.com/oauth2/authorize?client_id=1406960180305858781&scope=bot%20applications.commands"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Add ProofPoll Lite to Discord"
            className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-medium border border-gray-300 text-gray-900 hover:bg-gray-50 transition"
          >
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-gray-400" />
            Add to Discord
          </a>
        </div>
        <div className="mt-16 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Next.js 14 + TypeScript + Tailwind + Prisma
              </span>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
