import React from 'react'

export default function Skeleton({ className = '', variant = 'rect', width, height }) {
  const baseStyles = 'skeleton'
  const variantStyles = {
    rect: 'rounded-xl',
    circle: 'rounded-full',
    text: 'rounded-md h-4'
  }

  const style = {
    width: width || 'auto',
    height: height || 'auto',
  }

  return (
    <div 
      className={`${baseStyles} ${variantStyles[variant]} ${className}`} 
      style={style}
    />
  )
}
