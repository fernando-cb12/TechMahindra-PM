export type IssueCardProps = {
  issueKey: string;
  summary: string;
  project: string;
  assignee: string;
  assigneeAvatar?: string;
  priority: 'high' | 'medium' | 'low';
  status: string;
};
