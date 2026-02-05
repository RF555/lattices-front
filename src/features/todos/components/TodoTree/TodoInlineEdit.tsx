import { useState, useRef, useEffect } from 'react';

interface TodoInlineEditProps {
  initialValue: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}

export function TodoInlineEdit({ initialValue, onSave, onCancel }: TodoInlineEditProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed && trimmed !== initialValue) {
      onSave(trimmed);
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
      }}
      onBlur={handleSubmit}
      onKeyDown={handleKeyDown}
      onClick={(e) => {
        e.stopPropagation();
      }}
      className="flex-1 text-sm px-1 py-0.5 border border-primary rounded focus:outline-none focus:ring-1 focus:ring-primary"
    />
  );
}
