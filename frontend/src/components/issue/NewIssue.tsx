import {
  Stack,
  TextField,
  InputLabel,
  FormControl,
  MenuItem,
  Select,
  Button,
  Box,
} from "@mui/material";

const NewIssue: React.FC = () => {
  return (
    <form style={{ width: "100%" }}>
      <Stack spacing={2}>
        {/* Project */}
        <FormControl fullWidth required>
          <InputLabel>Project</InputLabel>
          <Select name="project" value="" onChange={() => {}} label="Project">
            <MenuItem value="issue1">Issue 1</MenuItem>
            <MenuItem value="issue2">Issue 2</MenuItem>
            <MenuItem value="issue3">Issue 3</MenuItem>
          </Select>
        </FormControl>

        {/* Summary */}
        <TextField label="Summary" name="summary" fullWidth required />

        {/* Description */}
        <TextField
          label="Description"
          name="description"
          multiline
          rows={4}
          fullWidth
        />

        {/* Priority + Assignee side by side */}
        <Box sx={{ display: "flex", gap: 2 }}>
          <FormControl fullWidth required>
            <InputLabel>Priority</InputLabel>
            <Select
              name="priority"
              value=""
              onChange={() => {}}
              label="Priority"
            >
              <MenuItem value="low">Low</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="high">High</MenuItem>
            </Select>
          </FormControl>

          <TextField label="Assignee" name="assignee" fullWidth />
        </Box>

        {/* Button */}
        <Button type="submit" variant="contained" sx={{ width: "fit-content" }}>
          Create
        </Button>
      </Stack>
    </form>
  );
};

export default NewIssue;
