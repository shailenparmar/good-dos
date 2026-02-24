const MESSAGES = [
  'boom',
  'one less thing',
  'clean',
  'check',
  'smooth',
  'nailed it',
  'yes',
  'crushed it',
  'nice work',
  'solid',
  'progress',
]

export function getRandomMessage(): string {
  return MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
}
