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
