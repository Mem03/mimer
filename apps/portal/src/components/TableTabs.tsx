"use client";

import { useState } from "react";
import { TablePreview } from "./TablePreview";

// 1. Update the interface to include activeFiles
interface TableTabsProps {
  overviewChild: React.ReactNode;
  tableName: string;
  activeFiles: string[]; // This allows page.tsx to pass the list down
}

export default function TableTabs({ 
  overviewChild, 
  tableName, 
  activeFiles // 2. Destructure it here
}: TableTabsProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "preview">("overview");

  return (
    <div className="w-full">
      <div className="flex border-b border-brand-border mb-8 gap-8">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-4 text-sm font-medium transition-colors relative ${
            activeTab === "overview" ? "text-brand-primary" : "text-brand-text hover:text-brand-dark"
          }`}
        >
          Overview
          {activeTab === "overview" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />}
        </button>
        <button
          onClick={() => setActiveTab("preview")}
          className={`pb-4 text-sm font-medium transition-colors relative ${
            activeTab === "preview" ? "text-brand-primary" : "text-brand-text hover:text-brand-dark"
          }`}
        >
          Data Preview
          {activeTab === "preview" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />}
        </button>
      </div>

      <div>
        {/* 3. Conditional rendering: Show overview or the preview */}
        {activeTab === "overview" ? (
          overviewChild
        ) : (
          <TablePreview tableName={tableName} activeFiles={activeFiles} />
        )}
      </div>
    </div>
  );
}