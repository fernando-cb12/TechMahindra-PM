export type NavItem = {
  label: string;
  value: string;
};

export type ProjectSubsection = {
  label: string;
  id: string;
};

export type Project = {
  label: string;
  id: string;
  subsections: ProjectSubsection[];
};

export interface SidebarProps {
  activeNavItem?: string;
  activeProject?: string;
  activeSubsection?: string;
  onNavItemClick?: (value: string) => void;
  onProjectClick?: (projectId: string) => void;
  onSubsectionClick?: (projectId: string, subsectionId: string) => void;
  userName?: string;
  userPoints?: number;
  userInitials?: string;
  navItems?: NavItem[];
  projects?: Project[];
}
