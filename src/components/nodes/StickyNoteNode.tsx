import React, { useState, memo } from "react";
import type { WorkflowNode } from "@/types/workflow";
import { useWorkflowStore } from "@/stores/workflowStore";
import { Trash2, Edit3, StickyNote } from "lucide-react";

interface StickyNoteNodeProps {
  node: WorkflowNode;
  selected: boolean;
  onPointerDown: (nodeId: string, e: React.PointerEvent) => void;
}

export const StickyNoteNode: React.FC<StickyNoteNodeProps> = memo(({
  node,
  selected,
  onPointerDown,
}) => {
  const updateNode = useWorkflowStore((s) => s.updateNode);
  const deleteNode = useWorkflowStore((s) => s.deleteNode);
  const select = useWorkflowStore((s) => s.select);
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(node.noteText || node.description);

  const handleBlur = () => {
    setIsEditing(false);
    updateNode(node.id, { noteText: text, description: text });
  };

  return (
    <div
      style={{
        transform: `translate3d(${node.x}px, ${node.y}px, 0)`,
        width: 280,
      }}
      onPointerDown={(e) => {
        select({ type: "node", id: node.id });
        onPointerDown(node.id, e);
      }}
      className={`absolute select-none cursor-grab active:cursor-grabbing rounded-xl p-4 transition-[box-shadow,border-color,background-color] duration-150 ${
        selected
          ? "ring-2 ring-amber-400 shadow-glow-amber bg-amber-100 border-amber-400 dark:bg-amber-950/80 dark:border-amber-400/60"
          : "bg-amber-50 border-amber-300 hover:border-amber-400 dark:bg-amber-950/40 dark:border-amber-500/30 dark:hover:border-amber-400/50 dark:hover:bg-amber-950/60"
      } border backdrop-blur-md shadow-xl text-amber-900 dark:text-amber-100 group`}
    >
      <div className="flex items-center justify-between pb-2 border-b border-amber-300/70 dark:border-amber-500/20 mb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
          <StickyNote className="w-3.5 h-3.5" />
          <span>{node.title || "Study Memo"}</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(!isEditing);
            }}
            className="p-1 hover:bg-amber-500/20 rounded text-amber-700 dark:text-amber-300"
            title="Edit Memo"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              deleteNode(node.id);
            }}
            className="p-1 hover:bg-rose-500/20 rounded text-rose-600 dark:text-rose-400"
            title="Delete Memo"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isEditing ? (
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onPointerDown={(e) => e.stopPropagation()}
          className="w-full bg-white/80 dark:bg-black/40 border border-amber-400/60 dark:border-amber-500/40 rounded p-1.5 text-xs text-amber-950 dark:text-amber-100 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none h-20"
        />
      ) : (
        <p className="text-xs text-amber-900/90 dark:text-amber-200/90 leading-relaxed italic whitespace-pre-wrap">
          "{text}"
        </p>
      )}
    </div>
  );
});
