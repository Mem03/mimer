"use client";

import { useState } from "react";
import { Folder, File } from "lucide-react";

interface FileNode {
  name: string;
  path: string;
  content: string;
  isDir: boolean;
  children?: FileNode[];
}

interface FileTreeProps {
  files: FileNode[];
  selectedFile: string | null;
  onSelectFile: (file: FileNode) => void;
}

export function FileTree({ files, selectedFile, onSelectFile }: FileTreeProps) {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  const toggleDir = (path: string) => {
    const newExpanded = new Set(expandedDirs);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedDirs(newExpanded);
  };

  const renderFileNode = (node: FileNode, depth = 0) => {
    const isExpanded = expandedDirs.has(node.path);
    const isSelected = selectedFile === node.path;

    return (
      <div key={node.path} style={{ paddingLeft: `${depth * 16}px` }}>
        <div
          className={`flex items-center p-1 rounded cursor-pointer hover:bg-accent ${
            isSelected ? "bg-accent" : ""
          }`}
          onClick={() => {
            if (node.isDir) {
              toggleDir(node.path);
            } else {
              onSelectFile(node);
            }
          }}
        >
          {node.isDir ? (
            <Folder
              size={16}
              className={`mr-2 ${isExpanded ? "text-primary" : ""}`}
            />
          ) : (
            <File size={16} className="mr-2" />
          )}
          <span className="truncate">{node.name}</span>
        </div>
        {node.isDir && isExpanded && node.children && (
          <div className="ml-4">
            {node.children.map((child) => renderFileNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1 overflow-y-auto max-h-[400px]">
      {files.map((file) => renderFileNode(file))}
    </div>
  );
}
