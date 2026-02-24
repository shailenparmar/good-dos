import { useCallback } from 'react'
import { playCompleteSound, playSubtaskCompleteSound } from '@shared/utils/sound'

export function useTaskSound() {
  const playComplete = useCallback((isSubtask: boolean = false, priority: number = 0) => {
    if (isSubtask) {
      playSubtaskCompleteSound()
    } else {
      playCompleteSound(priority)
    }
  }, [])

  return { playComplete }
}
