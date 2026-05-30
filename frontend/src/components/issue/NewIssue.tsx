import { useEffect, useState } from 'react';
import {
  Stack,
  TextField,
  InputLabel,
  FormControl,
  MenuItem,
  Select,
  Box,
  Typography,
  type SelectChangeEvent,
} from '@mui/material';

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '5px',
    fontFamily: 'Montserrat, sans-serif',
  },
  '& .MuiInputLabel-root': {
    fontFamily: 'Montserrat, sans-serif',
  },
};

type NewIssueProps = {
  open: boolean;
  projectOptions: string[];
  onSubmit: (issue: {
    issueKey: string;
    project: string;
    summary: string;
    assignee: string;
    priority: 'high' | 'medium' | 'low';
    status: string;
  }) => void | Promise<void>;
};

const emptyForm = {
  project: '',
  summary: '',
  description: '',
  priority: '' as '' | 'high' | 'medium' | 'low',
  assignee: '',
};

const NewIssue: React.FC<NewIssueProps> = ({ open, projectOptions, onSubmit }) => {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setForm(emptyForm);
      setErrors({});
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.project) next.project = 'Select a project';
    if (!form.summary.trim()) next.summary = 'Summary is required';
    if (!form.priority) next.priority = 'Select a priority';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    void onSubmit({
      issueKey: `APP-${Math.floor(Math.random() * 900) + 100}`,
      project: form.project,
      summary: form.summary.trim(),
      assignee: form.assignee.trim() || 'Unassigned',
      priority: form.priority as 'high' | 'medium' | 'low',
      status: 'To Do',
    });
  };

  const projects =
    projectOptions.length > 0
      ? projectOptions
      : ['Project Alpha', 'Project Pulse', 'Project Nova'];

  return (
    <Box
      component="form"
      id="create-issue-form"
      onSubmit={handleSubmit}
      sx={{ width: '100%' }}
    >
      <Stack spacing={2.5}>
        <FormControl fullWidth required error={!!errors.project} sx={fieldSx}>
          <InputLabel>Project</InputLabel>
          <Select
            name="project"
            value={form.project}
            onChange={handleSelectChange}
            label="Project"
          >
            {projects.map((project) => (
              <MenuItem key={project} value={project} sx={{ fontFamily: 'Montserrat, sans-serif' }}>
                {project}
              </MenuItem>
            ))}
          </Select>
          {errors.project ? (
            <Typography sx={{ fontSize: 12, color: 'error.main', mt: 0.5, ml: 1.75 }}>
              {errors.project}
            </Typography>
          ) : null}
        </FormControl>

        <TextField
          label="Summary"
          name="summary"
          value={form.summary}
          onChange={handleTextChange}
          fullWidth
          required
          error={!!errors.summary}
          helperText={errors.summary}
          placeholder="Brief description of the issue"
          sx={fieldSx}
        />

        <TextField
          label="Description"
          name="description"
          value={form.description}
          onChange={handleTextChange}
          multiline
          rows={4}
          fullWidth
          placeholder="Add details, steps to reproduce, or acceptance criteria"
          sx={fieldSx}
        />

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
          <FormControl fullWidth required error={!!errors.priority} sx={{ ...fieldSx, flex: 1 }}>
            <InputLabel>Priority</InputLabel>
            <Select
              name="priority"
              value={form.priority}
              onChange={handleSelectChange}
              label="Priority"
            >
              <MenuItem value="low" sx={{ fontFamily: 'Montserrat, sans-serif' }}>
                Low
              </MenuItem>
              <MenuItem value="medium" sx={{ fontFamily: 'Montserrat, sans-serif' }}>
                Medium
              </MenuItem>
              <MenuItem value="high" sx={{ fontFamily: 'Montserrat, sans-serif' }}>
                High
              </MenuItem>
            </Select>
            {errors.priority ? (
              <Typography sx={{ fontSize: 12, color: 'error.main', mt: 0.5, ml: 1.75 }}>
                {errors.priority}
              </Typography>
            ) : null}
          </FormControl>

          <TextField
            label="Assignee"
            name="assignee"
            value={form.assignee}
            onChange={handleTextChange}
            fullWidth
            placeholder="Optional"
            sx={{ ...fieldSx, flex: 1 }}
          />
        </Box>
      </Stack>
    </Box>
  );
};

export default NewIssue;
