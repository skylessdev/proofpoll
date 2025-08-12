export function baseUrlFrom(req: Request): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
  const protocol = req.headers.get('x-forwarded-proto') || 'https'
  return `${protocol}://${host}`
}