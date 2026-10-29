// Content that has no database table yet. Everything else comes from /api.

export const fallbackStats = { members: 0, workoutsCompleted: 0, classesThisWeek: 0 }

export const quotes = [
  { text: 'The only bad workout is the one that didn’t happen.', author: 'Unknown' },
  { text: 'Strength does not come from the body. It comes from the will.', author: 'Gandhi' },
  { text: 'Discipline is choosing between what you want now and what you want most.', author: 'Abraham Lincoln' },
  { text: 'Sweat is just fat crying.', author: 'Gym wall, probably' },
  { text: 'You don’t have to be extreme, just consistent.', author: 'Unknown' },
  { text: 'Small daily improvements are the key to staggering long-term results.', author: 'Robin Sharma' },
  { text: 'Your body can stand almost anything. It’s your mind you have to convince.', author: 'Unknown' },
]

export const quoteOfTheDay = () => {
  const dayIndex = Math.floor(Date.now() / 86400000) % quotes.length
  return quotes[dayIndex]
}

export const strengthHistory = [
  { month: 'Jan', squat: 100, bench: 70, deadlift: 130 },
  { month: 'Feb', squat: 105, bench: 72.5, deadlift: 135 },
  { month: 'Mar', squat: 110, bench: 75, deadlift: 142.5 },
  { month: 'Apr', squat: 115, bench: 77.5, deadlift: 150 },
  { month: 'May', squat: 120, bench: 80, deadlift: 155 },
  { month: 'Jun', squat: 122.5, bench: 82.5, deadlift: 160 },
  { month: 'Jul', squat: 127.5, bench: 85, deadlift: 167.5 },
  { month: 'Aug', squat: 130, bench: 87.5, deadlift: 172.5 },
  { month: 'Sep', squat: 135, bench: 90, deadlift: 180 },
  { month: 'Oct', squat: 140, bench: 92.5, deadlift: 185 },
]

export const personalRecords = [
  { id: 'pr-dl', lift: 'Deadlift', value: 185, unit: 'kg', date: '2026-10-09', delta: '+5 kg', tier: 'gold' },
  { id: 'pr-sq', lift: 'Back Squat', value: 140, unit: 'kg', date: '2026-10-02', delta: '+5 kg', tier: 'gold' },
  { id: 'pr-bp', lift: 'Bench Press', value: 92.5, unit: 'kg', date: '2026-10-06', delta: '+2.5 kg', tier: 'silver' },
  { id: 'pr-pu', lift: 'Weighted Pull-Up', value: 32.5, unit: 'kg', date: '2026-09-24', delta: '+2.5 kg', tier: 'silver' },
  { id: 'pr-row', lift: '2k Row', value: '7:12', unit: '', date: '2026-09-18', delta: '-8 s', tier: 'bronze' },
]

/** Achievement definitions. Unlock state is computed from live stats in Profile. */
export const achievementDefs = [
  { id: 'a1', name: 'First Rep', desc: 'Complete your first workout', icon: 'dumbbell', metric: 'workouts', target: 1 },
  { id: 'a2', name: 'On Fire', desc: '7-day streak', icon: 'flame', metric: 'longestStreak', target: 7 },
  { id: 'a3', name: 'Iron Month', desc: '30-day streak', icon: 'flame', metric: 'longestStreak', target: 30 },
  { id: 'a4', name: 'Century', desc: '100 workouts logged', icon: 'trophy', metric: 'workouts', target: 100 },
  { id: 'a5', name: 'Ten Strong', desc: '10 workouts logged', icon: 'trophy', metric: 'workouts', target: 10 },
  { id: 'a6', name: 'Class Act', desc: 'Book 5 classes', icon: 'calendar', metric: 'classes', target: 5 },
  { id: 'a7', name: 'Marathoner', desc: '1,000 active minutes', icon: 'timer', metric: 'minutes', target: 1000 },
  { id: 'a8', name: 'Early Hours', desc: '300 active minutes', icon: 'timer', metric: 'minutes', target: 300 },
]
