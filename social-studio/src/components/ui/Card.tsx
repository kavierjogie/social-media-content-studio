import { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export default function Card({ children, className = '', ...rest }: CardProps) {
  return (
    <div
      className={`card-surface rounded-2xl p-5 ${className}`}
      {...rest}
    >
      {children}
    </div>
  )
}
