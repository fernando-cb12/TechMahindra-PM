import { useState } from 'react';
import {
  Stack,
  TextField,
  InputLabel,
  FormControl,
  MenuItem,
  Select,
  Button,
  Box,
} from '@mui/material';

type NewIssueProps = {
  onSubmit: (issue: {
    key: string;
    summary: string;
    assignee: string;
    priority: 'high' | 'medium' | 'low';
    status: string;
  }) => void;
};

const NewIssue: React.FC<NewIssueProps> = ({ onSubmit }) => {
  const [form, setForm] = useState({
    project: '',
    summary: '',
    description: '',
    priority: '',
    assignee: '',
  });

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Mock new issue
    const newIssue = {
      key: `APP-${Math.floor(Math.random() * 900) + 100}`, // random key e.g APP-234
      summary: form.summary,
      assignee: form.assignee || 'Unassigned',
      priority: (form.priority || 'low') as 'high' | 'medium' | 'low',
      status: 'To Do',
    };

    onSubmit(newIssue); // send it up to Issues.tsx
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <Stack spacing={2}>
        {/* Project */}
        <FormControl fullWidth required>
          <InputLabel>Project</InputLabel>
          <Select
            name="project"
            value={form.project}
            onChange={handleChange}
            label="Project"
          >
            <MenuItem value="Project 1">Issue 1</MenuItem>
            <MenuItem value="Project 2">Issue 2</MenuItem>
            <MenuItem value="Project 3">Issue 3</MenuItem>
          </Select>
        </FormControl>

        {/* Summary */}
        <TextField
          label="Summary"
          name="summary"
          value={form.summary}
          onChange={handleChange}
          fullWidth
          required
        />

        {/* Description */}
        <TextField
          label="Description"
          name="description"
          value={form.description}
          onChange={handleChange}
          multiline
          rows={4}
          fullWidth
        />

        {/* Priority + Assignee */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl fullWidth required>
            <InputLabel>Priority</InputLabel>
            <Select
              name="priority"
              value={form.priority}
              onChange={handleChange}
              label="Priority"
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Assignee"
            name="assignee"
            value={form.assignee}
            onChange={handleChange}
            fullWidth
          />
        </Box>

        <Button type="submit" variant="contained" sx={{ width: 'fit-content' }}>
          Create
        </Button>
      </Stack>
    </form>
  );
};

export default NewIssue;
