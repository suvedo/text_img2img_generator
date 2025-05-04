import { motion } from "motion/react"
import { FC, ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface TextRevealSimpleProps {
  children: ReactNode
  className?: string
}

export const TextRevealSimple: FC<TextRevealSimpleProps> = ({ children, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className={cn("text-base text-muted-foreground", className)}
    >
      {children}
    </motion.div>
  )
} 