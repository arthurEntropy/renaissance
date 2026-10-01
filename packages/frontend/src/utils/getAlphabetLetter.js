export function getAlphabetLetter(value) {
  const firstCharacter = String(value || '').trim().charAt(0)
    .replace(/[Ææ]/g, 'A')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
  return /^[A-Z]$/.test(firstCharacter) ? firstCharacter : ''
}