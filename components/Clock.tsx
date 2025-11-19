'use client'

import { useState, useEffect } from 'react'

export default function Clock() {
  const [time, setTime] = useState(() => new Date())

  useEffect(() => {
    // Update every second
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    // Cleanup interval on component unmount
    return () => clearInterval(timer)
  }, [])

  // Format time for Sweden timezone (24-hour format)
  const timeFormatter = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Stockholm',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })

  // Format date for Sweden timezone (Year Month Day)
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Stockholm',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const formattedTime = timeFormatter.format(time)
  const formattedDate = dateFormatter.format(time)

  return (
    <div className="flex flex-col items-center text-center scale-125">
      <div className="text-7xl font-mono font-bold text-black">
        {formattedTime}
      </div>
      <div className="text-xl text-gray-600 mt-2">
        {formattedDate}
      </div>
    </div>
  )
}
