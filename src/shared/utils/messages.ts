const MESSAGES = [
  'boom',
  'one less thing',
  'clean',
  'check',
  'smooth',
  'nailed it',
  'yes',
  'slay',
  'nice',
  'solid',
  'progress',
  'swag',
]

export function getRandomMessage(): string {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
}
