"use client";

import { useState, useRef, useEffect, useTransition } from "react";

interface TableActionsMenuProps {
  deleteAction: () => Promise<void>;
  vacuumAction: () => Promise<void>;
}

export default function TableActionsMenu({ deleteAction, vacuumAction }: TableActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

  // Close menu when clicking outside
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
    if (window.confirm("Are you sure you want to completely delete this table and all its data? This cannot be undone!")) {
      setIsOpen(false);
      startTransition(async () => {
        await deleteAction();
      });
    }
  };

  const handleVacuumClick = () => {
    if (window.confirm("Vacuum will permanently remove historical Parquet files that are no longer part of the current table state. Continue?")) {
      setIsOpen(false);
      startTransition(async () => {
        await vacuumAction();
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
        title="Table Actions"
      >
        {isPending ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        )}
      </button>

      {isOpen && !isPending && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-brand-border rounded-md shadow-lg z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="py-1">
            {/* Vacuum Action */}
            <button 
              onClick={handleVacuumClick}
              className="flex w-full items-center px-4 py-3 text-sm text-brand-dark hover:bg-brand-surface transition-colors"
            >
              <svg className="mr-3 h-4 w-4 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Vacuum (Cleanup Files)
            </button>

            <div className="border-t border-brand-border my-1"></div>

            {/* Delete Action */}
            <button 
              onClick={handleDeleteClick}
              className="flex w-full items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Table
            </button>
          </div>
        </div>
      )}
    </div>
  );
}