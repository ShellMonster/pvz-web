/** Resolve the app mount node; fails fast if index.html is wrong. */
export function requireRoot(
  doc: Pick<Document, 'getElementById'> = document,
): HTMLElement {
  const el = doc.getElementById('root')
  if (!el) {
    throw new Error('Root element #root not found')
  }
  return el
}
