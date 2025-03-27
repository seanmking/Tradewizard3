import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

export interface ChatBubbleProps {
  children?: React.ReactNode;
  sender: 'user' | 'assistant';
  isTyping?: boolean;
  className?: string;
}

export function ChatBubble({
  children,
  sender,
  isTyping = false,
  className,
}: ChatBubbleProps) {
  const isAssistant = sender === 'assistant';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex w-full mb-4',
        isAssistant ? 'justify-start' : 'justify-end',
        className
      )}
    >
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-2',
          isAssistant
            ? 'bg-muted text-muted-foreground'
            : 'bg-primary text-primary-foreground'
        )}
      >
        {isTyping ? (
          <motion.div
            className="flex space-x-1 h-6 items-center px-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-current rounded-full"
                animate={{
                  y: ['0%', '-50%', '0%'],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>
        ) : (
          <p className="text-sm whitespace-pre-wrap break-words">{children}</p>
        )}
      </div>
    </motion.div>
  );
} 