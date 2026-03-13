"use client";

import { useState, useRef, useEffect, useTransition } from "react";

export default function TableActionsMenu({ deleteAction }: { deleteAction: () => Promise<void> }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDeleteClick = () => {
    if (window.confirm("🚨 Are you sure you want to completely delete this table and all its data? This cannot be undone!")) {
      setIsOpen(false);
      startTransition(async () => {
        await deleteAction();
      });
    }
  };

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={`p-2 rounded-md transition-colors flex items-center justify-center ${
          isPending ? 'text-brand-border' : 'hover:bg-brand-border text-brand-text'
        }`}
      >
        {isPending ? (
          <span className="text-xs font-bold">...</span>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        )}
      </button>

      {isOpen && !isPending && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-brand-border rounded-md shadow-lg z-10 overflow-hidden">
          <button 
            onClick={handleDeleteClick}
            className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            Delete Table
          </button>
        </div>
      )}
    </div>
  );
}