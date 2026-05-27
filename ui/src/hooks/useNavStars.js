import { useCallback, useState } from 'react'

const STORAGE_KEY = 'energy-lab-nav-stars'

function readStars() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : ['dashboard', 'ppa']
  } catch {
    return ['dashboard', 'ppa']
  }
}

export function useNavStars() {
  const [stars, setStars] = useState(readStars)

  const toggleStar = useCallback((id) => {
    setStars(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const isStarred = useCallback((id) => stars.includes(id), [stars])

  return { stars, toggleStar, isStarred }
}
