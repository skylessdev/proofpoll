/* SPDX-License-Identifier: (MIT OR MPL-2.0) */

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-12 lg:p-24 pb-20">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-center bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent break-words">
          ProofPoll Lite
        </h1>
        <p className="mt-6 sm:mt-8 text-lg sm:text-xl text-center text-gray-600 dark:text-gray-400 px-4">
          A lightweight polling application with cryptographic proof mechanisms
        </p>
        {/* CTA Buttons */}
        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row flex-wrap gap-3 justify-center">
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
        <div className="mt-12 sm:mt-16 flex items-center justify-center px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 border border-gray-200 dark:border-gray-700 w-full max-w-md">
            <div className="flex items-center space-x-2 sm:space-x-4 justify-center">
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                Next.js 14 + TypeScript + Tailwind + Prisma
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="mt-12 sm:mt-16 flex items-center justify-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-4">
        <div className="flex items-center space-x-2">
          <a
            href="https://github.com/skylessinnovation/proofpoll-lite"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            aria-label="View source on GitHub"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
          <span>© 2025 Skyless Innovation</span>
        </div>
      </footer>
    </main>
  )
}
