import { Box } from '@mui/material';
import IssueCard from './IssueCard';
import type { IssueCardProps } from './types';

type IssueListProps = {
  issues: IssueCardProps[];
};

const IssueList: React.FC<IssueListProps> = ({ issues }) => {
  return (
    <Box
      sx={{
        border: '1px solid #e8e8e8',
        borderRadius: '12px',
        overflow: 'hidden',
      }}
    >
      {issues.map((issue) => (
        <IssueCard
          key={issue.issueKey}
          issueKey={issue.issueKey}
          summary={issue.summary}
          assignee={issue.assignee}
          assigneeAvatar={issue.assigneeAvatar}
          priority={issue.priority}
          status={issue.status}
        />
      ))}
    </Box>
  );
};

export default IssueList;