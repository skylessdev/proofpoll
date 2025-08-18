/* SPDX-License-Identifier: (MIT OR MPL-2.0) */

export function parsePollCommand(raw: string): { question: string; options: string[]; anon?: boolean } {
  // Remove leading/trailing whitespace
  const text = raw.trim()
  
  // Check for --anon flag
  const anon = text.includes('--anon')
  const cleanText = text.replace(/--anon/g, '').trim()
  
  // Split by | character
  const parts = cleanText.split('|').map(part => part.trim())
  
  if (parts.length < 3) {
    throw new Error('Poll format: /poll "Question" | Option A | Option B [--anon]')
  }
  
  // First part is the question (remove quotes if present)
  let question = parts[0]
  if (question.startsWith('"') && question.endsWith('"')) {
    question = question.slice(1, -1)
  }
  
  if (question.length < 5 || question.length > 200) {
    throw new Error('Question must be 5-200 characters')
  }
  
  // Remaining parts are options
  const rawOptions = parts.slice(1)
  const options = Array.from(new Set(rawOptions)).filter(opt => opt.length > 0)
  
  if (options.length < 2) {
    throw new Error('At least 2 unique options required')
  }
  
  if (options.length > 10) {
    throw new Error('Maximum 10 options allowed')
  }
  
  return { question, options, anon }
}