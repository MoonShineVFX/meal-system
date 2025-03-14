import React from 'react'

interface DividerProps {
  text?: string
  className?: string
}

export default function Divider({ text, className = '' }: DividerProps) {
  if (!text) {
    // Simple divider without text
    return <div className={`my-4 h-[2px] bg-stone-200 ${className}`}></div>
  }

  // Divider with text in the middle
  return (
    <div className={`my-4 flex items-center ${className}`}>
      <div className='h-[2px] flex-grow bg-stone-200'></div>
      <span className='mx-4 text-sm text-stone-500'>{text}</span>
      <div className='h-[2px] flex-grow bg-stone-200'></div>
    </div>
  )
}
