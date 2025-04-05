import * as React from 'react';
import { cn } from '@/utils/cn';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function ChatInput({
  onSend,
  isLoading = false,
  className,
}: ChatInputProps) {
  const [message, setMessage] = React.useState('');
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSend(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('relative', className)}>
      <textarea
        ref={textareaRef}
        value={message}
        onChange={handleTextareaChange}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        disabled={isLoading}
        className={cn(
          'w-full resize-none bg-white px-4 py-3 focus:outline-none',
          'min-h-[50px] max-h-[200px]',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        rows={1}
      />
      <button
        type="submit"
        disabled={!message.trim() || isLoading}
        className={cn(
          'absolute right-2 bottom-2 p-2 rounded-lg',
          'bg-primary-500 text-white',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'hover:bg-primary-600 transition-colors'
        )}
      >
        <SendIcon className="w-5 h-5" />
      </button>
    </form>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 2L11 13" />
      <path d="M22 2L15 22L11 13L2 9L22 2Z" />
    </svg>
  );
} 