import React from "react";
import {
  Activity,
  Award,
  Bell,
  Binary,
  BookMarked,
  BookOpen,
  BookOpenCheck,
  Calendar,
  CalendarCheck,
  CheckCircle,
  CircleDot,
  Clock,
  DollarSign,
  Feather,
  FileCode,
  FileText,
  Flame,
  Gauge,
  GitBranch,
  GitFork,
  GitPullRequest,
  GraduationCap,
  Headphones,
  Inbox,
  Landmark,
  Languages,
  LayoutGrid,
  Mic,
  PenTool,
  Play,
  Radio,
  SearchCode,
  Send,
  Share2,
  ShieldAlert,
  Sparkles,
  StickyNote,
  Target,
  Timer,
  UserCheck,
  Users,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * Explicit registry instead of `import * as Icons` so the bundler can
 * tree-shake lucide (the wildcard pulled in ~770 kB of unused icons).
 * Add new names here when templates or node definitions reference them.
 */
const ICONS: Record<string, LucideIcon> = {
  Activity,
  Award,
  Bell,
  Binary,
  BookMarked,
  BookOpen,
  BookOpenCheck,
  Calendar,
  CalendarCheck,
  CheckCircle,
  CircleDot,
  Clock,
  DollarSign,
  Feather,
  FileCode,
  FileText,
  Flame,
  Gauge,
  GitBranch,
  GitFork,
  GitPullRequest,
  GraduationCap,
  Headphones,
  Inbox,
  Landmark,
  Languages,
  LayoutGrid,
  Mic,
  PenTool,
  Play,
  Radio,
  SearchCode,
  Send,
  Share2,
  ShieldAlert,
  Sparkles,
  StickyNote,
  Target,
  Timer,
  UserCheck,
  Users,
  Workflow,
  Zap,
};

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
  color?: string;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, className = "w-4 h-4", size, color }) => {
  const IconComponent = ICONS[name] ?? CircleDot;
  return <IconComponent className={className} size={size} color={color} />;
};
