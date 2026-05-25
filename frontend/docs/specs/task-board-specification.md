# Task Board Specification

## 0. Project Audit — Complete Before Any Code

Before creating or modifying any file, audit the current project and document the findings directly in this spec.

### 0.1 Existing Component Inventory

The implementation must first search for existing reusable components before creating new ones.

Audit the following areas:

- Existing layout components:
  - Sidebar
  - Page header
  - Workspace navigation
  - Tabs or view selector
  - Buttons
  - Tables
  - Popovers
  - Dialogs
  - Dropdown menus
  - Search bars
  - User avatars
  - Progress indicators
  - Task update/comment components
  - File upload components
  - Drag-and-drop components or hooks already implemented in the current Task Board

For each matching component, document:

```md
- Component name:
- File path:
- Current responsibility:
- Can be reused? Yes / No
- Reuse strategy: extend / wrap / use directly / create new
```

No parallel component should be created if an equivalent component already exists.

---

### 0.2 Theme & Design Tokens

The Task Board must follow the existing visual identity of the application.

The implementation must reuse:

- Existing primary color palette.
- Existing sidebar colors.
- Existing status colors.
- Existing typography.
- Existing border radius.
- Existing shadow styles.
- Existing modal/pop-up styles.
- Existing button styles.
- Existing table spacing and row height.
- Existing drag-and-drop visual behavior, since drag-and-drop is already implemented in the project.

The UI must visually match the current Task Board design:

- Burgundy primary buttons.
- Rounded search input.
- Light gray table background.
- Colored task groups.
- Colored status and priority pills.
- Left sidebar workspace structure.
- Top view selector tabs.
- Existing drag-and-drop interaction patterns.

No new visual system should be introduced.

---

### 0.3 Existing Patterns

Before implementation, identify the current project patterns for:

- State management.
- Modal handling.
- Dropdown/popover handling.
- Table rendering.
- Form handling.
- File upload handling.
- User/member data handling.
- Local mock data structure.
- API service layer.
- Drag-and-drop implementation.
- Icons library.

Because drag-and-drop is already implemented, the implementation must reuse the current drag-and-drop solution instead of introducing a new library unless there is a clear technical reason and approval is given.

---

## 1. Overview

The Task Board page allows users to manage tasks inside project workspaces using grouped task tables.

The board supports:

- Multiple task groups.
- Multiple views.
- Task creation.
- Group creation.
- Custom columns.
- Assigning multiple members.
- Editable status/priority style fields.
- Search.
- Sorting/filtering.
- Task updates/comments.
- File uploads.
- Mention autocomplete.
- Drag-and-drop ordering for groups.
- Preservation of manual group order.
- Reusable board behavior across every task board in the application.

All functionality must be abstracted into reusable components and integrated into the current project structure.

---

## 2. Main Requirements

### 2.1 Add View Button

A new `+` button must be added to the top view selector bar.

Current examples:

```txt
Main Table | Charts | Calendar | +
```

Behavior:

- The button appears after the existing view tabs.
- On click, it opens a pop-up.
- The pop-up must follow the same visual style as existing app pop-ups.
- For now, the pop-up only displays the title:

```txt
Add New View
```

No additional functionality is required yet.

Acceptance criteria:

- The `+` button is visible beside the existing view tabs.
- Clicking it opens a styled pop-up.
- The pop-up can be closed.
- The pop-up title is exactly `Add New View`.

---

### 2.2 Rename “New Task” Button

The existing `New Task` button must be renamed to:

```txt
New
```

Acceptance criteria:

- The button keeps the same styling.
- Only the text changes from `New Task` to `New`.

---

### 2.3 New Button Dropdown Menu

Clicking the `New` button must open a small dropdown menu.

The dropdown must contain two options:

```txt
New Item
New Group of Items
```

Behavior:

- The dropdown appears below the `New` button.
- It uses the same popover/dropdown style used elsewhere in the app.
- Clicking outside closes the dropdown.
- Selecting an option closes the dropdown after the action is executed.

---

### 2.4 New Item Behavior

When the user clicks:

```txt
New Item
```

The system must create a new default task row inside the first task group in the board.

Rules:

- The first task group means the group currently displayed at the top of the list.
- If groups have been reordered manually, the new item goes into the current first group according to `manualGroupOrder`.
- If a temporary sort is active, the new item goes into the first group currently visible after sorting.
- The task should use default values.
- The new task should be inserted before the final `Add Task` row.

Default task row:

```typescript
{
  id: string;
  title: "New Task";
  assignees: [];
  status: null;
  priority: null;
  dueDate: null;
  progress: 0;
  updates: [];
  files: [];
}
```

Acceptance criteria:

- Clicking `New Item` creates one new row.
- The row appears in the first visible task group.
- The row appears before the final `Add Task` row.
- The new task title should be editable.
- The task insertion does not alter `manualGroupOrder`.

---

### 2.5 New Group of Items Behavior

When the user clicks:

```txt
New Group of Items
```

The system must create a new empty task group in the second position of the board.

Rules:

- The new group is inserted after the first existing group.
- The group is empty.
- The group only contains the final `Add Task` row.
- The default group name should be:

```txt
New Group
```

Default group:

```typescript
{
  id: string;
  name: "New Group",
  color: "#A3334D",
  collapsed: false,
  tasks: []
}
```

Manual order behavior:

- The new group ID must be inserted into `manualGroupOrder` at index `1`.
- If there are no existing groups, the new group is inserted at index `0`.
- If a temporary sort is active, the new group is still written into the manual order at the second manual position, but the visible position may depend on the active sort until sorting is cleared.

Acceptance criteria:

- A new group appears in the second position when no temporary sort is active.
- The group has no task rows.
- The group includes the `Add Task` row at the bottom.
- The group name can be edited later if the project already supports editable group names.
- `manualGroupOrder` is updated correctly.

---

## 3. Manual Group Order

### 3.1 Purpose

The Task Board must preserve the user’s custom group order separately from temporary sorting.

This prevents manual drag-and-drop order from being lost when the user sorts groups by task count or alphabetically.

---

### 3.2 Data Structure

Add `manualGroupOrder` to the board state.

```typescript
export interface TaskBoardState {
  taskBoardId: string;
  views: TaskBoardView[];
  activeViewId: string;
  columns: TaskBoardColumn[];
  groups: TaskGroup[];
  members: BoardMember[];
  manualGroupOrder: string[];
}
```

Rules:

- `manualGroupOrder` stores only group IDs.
- Every group in `groups` must have exactly one corresponding ID in `manualGroupOrder`.
- Deleted groups must be removed from `manualGroupOrder`.
- New groups must be inserted into `manualGroupOrder`.
- Dragging groups updates `manualGroupOrder`.
- Sorting does not mutate `manualGroupOrder`.

Example:

```json
{
  "groups": [
    { "id": "group-core", "name": "Core Setup" },
    { "id": "group-ui", "name": "UI Components" },
    { "id": "group-qa", "name": "Testing & QA" }
  ],
  "manualGroupOrder": [
    "group-core",
    "group-ui",
    "group-qa"
  ]
}
```

---

### 3.3 Visible Group Order

The board must derive the visible group order instead of directly mutating the group list for every sort.

Suggested selector:

```typescript
function getVisibleGroups(
  groups: TaskGroup[],
  manualGroupOrder: string[],
  sortMode: "none" | "taskCount" | "alphabetical",
  sortDirection: "asc" | "desc"
): TaskGroup[] {
  const groupsById = new Map(groups.map(group => [group.id, group]));

  const manuallyOrderedGroups = manualGroupOrder
    .map(groupId => groupsById.get(groupId))
    .filter(Boolean) as TaskGroup[];

  if (sortMode === "none") {
    return manuallyOrderedGroups;
  }

  const sortedGroups = [...manuallyOrderedGroups];

  if (sortMode === "taskCount") {
    sortedGroups.sort((a, b) => {
      const result = a.tasks.length - b.tasks.length;
      return sortDirection === "asc" ? result : -result;
    });
  }

  if (sortMode === "alphabetical") {
    sortedGroups.sort((a, b) => {
      const result = a.name.localeCompare(b.name);
      return sortDirection === "asc" ? result : -result;
    });
  }

  return sortedGroups;
}
```

Acceptance criteria:

- When `sortMode` is `none`, groups render according to `manualGroupOrder`.
- When sorting is active, visible order changes temporarily.
- Clearing sorting restores the manual order.
- Manual order is not lost after sorting.

---

### 3.4 Drag-and-Drop Group Reordering

Drag-and-drop for groups is already implemented and must be reused.

Required behavior:

- Users can drag a group by its header area.
- Dragging changes the group’s manual position.
- On drop, update `manualGroupOrder`.
- Task rows remain inside their group.
- Group color and collapsed state remain unchanged.
- The physical `groups` array does not need to be reordered if rendering uses `manualGroupOrder`.

Important rule:

If a temporary sort is active, dragging should either:

1. Be disabled until the sort is cleared, or
2. Clear the active sort before allowing manual reorder.

Preferred behavior:

```txt
When the user starts dragging a group while a sort is active, clear the active sort and restore manual ordering before applying the new drag order.
```

Acceptance criteria:

- Dragging a group updates `manualGroupOrder`.
- The new order persists after refresh if persistence is enabled.
- Sorting and then clearing sort returns to the latest manual drag order.
- Drag behavior does not break table layout.
- Drag-and-drop implementation reuses the existing project code.

---

## 4. Task Group Table Behavior

### 4.1 Add Task Row

The existing `Add Task` label must become a full table row.

Current behavior:

- `Add Task` appears visually below the table.

New behavior:

- `Add Task` must be rendered as the last row of each task group table.
- It must not be divided into columns.
- It must span the full table width.
- It must visually align with the table.
- It must keep the `+ Add Task` style.

Implementation detail:

Use a table row with a single cell spanning all visible columns:

```tsx
<TableRow>
  <TableCell colSpan={visibleColumns.length}>
    + Add Task
  </TableCell>
</TableRow>
```

Acceptance criteria:

- Every group always has an `Add Task` row.
- It is always the final row.
- It spans the complete table width.
- It does not show vertical column separators.

---

## 5. Assignee Field

### 5.1 Assignee Selector Search

The assignee selector must include a search bar.

Behavior:

- Clicking the assignee cell opens a dropdown.
- The dropdown contains a search input at the top.
- Typing filters members dynamically.
- Search is case-insensitive.
- Search should match partial names.

Example:

```txt
Typing "ma" should match "Marco Ríos"
Typing "lu" should match "Lucía Fernández"
```

Acceptance criteria:

- The dropdown displays available members.
- The search input filters the list while typing.
- The user can select one or more members.
- The selected members are saved in the task row.

---

### 5.2 Multiple Assignees

The assignee field must support more than one member per task.

Data structure:

```typescript
export interface BoardMember {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  initials: string;
}

export interface TaskItem {
  assignees: BoardMember[];
}
```

Display rules:

- If there is one assignee:
  - Show avatar/initials and full name.
- If there are two or more assignees:
  - Show profile pictures or initials only.
  - Do not show full names in the cell.
  - Avatars may overlap slightly.
  - On hover, show tooltip with member names.

Acceptance criteria:

- A task can have multiple assignees.
- Two or more assignees display as avatars only.
- Member names remain visible through tooltip or dropdown.

---

## 6. Column System

### 6.1 Add Column Button

Each task group table must have a small final column with a `+` button.

Behavior:

- The `+` column appears at the far right of the table.
- Clicking it opens an “Add Column” pop-up.
- The pop-up shows quick column templates and a blank column option.

Quick column examples:

```txt
Status
Priority
Due Date
Timeline
Progress
Budget
Owner
Files
Last Updated
Tags
Text
Number
Currency
Time Estimate
```

Also include:

```txt
Blank Column
```

Acceptance criteria:

- Every task table has a final `+` column.
- Clicking the `+` opens a pop-up.
- The pop-up includes quick options and blank column creation.
- The pop-up matches the existing app style.

---

### 6.2 Blank Column Creation

When the user selects:

```txt
Blank Column
```

The system must:

1. Add a new empty column.
2. Place it before the final `+` column.
3. Auto-select the column title.
4. Allow the user to rename it immediately.
5. Ask the user to choose a field type.

Supported field types:

```txt
Short Text
Long Text
Number
Currency
Percentage
Date
Time
Timeline
Single Select
Multi Select
Person
File
Checkbox
URL
Email
Phone
Formula
```

Default field type:

```txt
Short Text
```

Acceptance criteria:

- A blank column is created.
- The title enters rename/edit mode automatically.
- The user can select a field type.
- The column is added to every group in the same task board.

Important rule:

A board column belongs to the board, not to a single group. Therefore, adding a column from any group adds it to all groups in that task board.

---

### 6.3 Quick Column Creation

Quick column options must come with predefined field types.

Examples:

```typescript
const quickColumnTemplates = [
  {
    label: "Status",
    type: "singleSelect",
    options: ["To Do", "In Progress", "Review", "Done", "Blocked"]
  },
  {
    label: "Priority",
    type: "singleSelect",
    options: ["Low", "Medium", "High", "Critical"]
  },
  {
    label: "Due Date",
    type: "date"
  },
  {
    label: "Timeline",
    type: "timeline"
  },
  {
    label: "Progress",
    type: "percentage"
  },
  {
    label: "Budget",
    type: "currency"
  },
  {
    label: "Owner",
    type: "person"
  },
  {
    label: "Files",
    type: "file"
  },
  {
    label: "Tags",
    type: "multiSelect",
    options: ["Frontend", "Backend", "Bug", "Feature", "Design"]
  }
];
```

Rules:

- Quick columns must have a default type.
- The user must still be able to change the type before confirming.
- Select-type quick columns must include predefined options.

Acceptance criteria:

- Selecting `Status` creates a single select column with status options.
- Selecting `Priority` creates a single select column with priority options.
- Selecting a non-select column creates the correct field type.
- The type can be changed before creating the column.

---

## 7. Select Field Customization

### 7.1 Editable Select Options

Single select and multi select fields must be customizable.

This applies to:

- Status
- Priority
- Any custom single select column
- Any custom multi select column

Behavior when clicking a select field:

- Show existing options.
- Allow choosing one of the options.
- Show an option to create a new status/option.
- Show an option to edit existing options.

Dropdown structure:

```txt
To Do
In Progress
Review
Done
Blocked

+ Create new option
Edit options
```

Each option must support:

```typescript
{
  id: string;
  label: string;
  color: string;
}
```

Acceptance criteria:

- Users can select an existing option.
- Users can create a new option.
- Users can edit an existing option.
- Users can change option text.
- Users can change option color.
- Changes apply to that column across the whole board.

---

### 7.2 Precreated Options for Quick Select Columns

The following quick columns must include predefined options.

#### Status

```typescript
[
  { label: "To Do", color: "gray" },
  { label: "In Progress", color: "blue" },
  { label: "Review", color: "burgundy" },
  { label: "Done", color: "green" },
  { label: "Blocked", color: "red" }
]
```

#### Priority

```typescript
[
  { label: "Low", color: "gray" },
  { label: "Medium", color: "burgundy" },
  { label: "High", color: "yellow" },
  { label: "Critical", color: "red" }
]
```

#### Tags

```typescript
[
  { label: "Frontend", color: "blue" },
  { label: "Backend", color: "green" },
  { label: "Bug", color: "red" },
  { label: "Feature", color: "purple" },
  { label: "Design", color: "yellow" }
]
```

Acceptance criteria:

- Quick columns with select fields include predefined options.
- The options are editable after creation.

---

## 8. Progress Field

### 8.1 Replace Current Percentage Selector

The current progress field must be replaced with a more polished and interactive progress editor.

New behavior:

- The progress cell displays a horizontal progress bar.
- Clicking the progress cell opens a small popover.
- The popover contains:
  - A slider from 0 to 100.
  - A numeric input.
  - Quick buttons.

Quick buttons:

```txt
0%
25%
50%
75%
100%
```

The progress value updates live while moving the slider.

Acceptance criteria:

- The progress bar remains visible in the table.
- Clicking it opens an interactive editor.
- The user can update progress using the slider.
- The user can update progress using the numeric input.
- The user can use quick percentage buttons.
- The final value persists in the task row.

---

## 9. Group Color Customization

### 9.1 Hover Color Square

When the cursor hovers over a group name, a small rounded square must appear to the right of the group name.

Behavior:

- The square uses the current group color.
- The square is hidden by default.
- The square appears on group title hover.
- Clicking the square opens a color pop-up.

Acceptance criteria:

- The color square appears only when hovering the group title area.
- The square displays the current group color.
- Clicking it opens the color editor.

---

### 9.2 Group Color Pop-up

The color pop-up allows the user to change the group color.

The pop-up must include:

- Current color preview.
- Preset colors.
- Optional custom color picker.

Suggested preset colors:

```txt
Burgundy
Yellow
Green
Blue
Purple
Orange
Gray
Red
```

Acceptance criteria:

- User can select a new group color.
- Group header color updates immediately.
- Related group accents update consistently.
- Color persists in the board state.

---

## 10. Filtering and Sorting Buttons

There are two existing filter/sort buttons beside the search bar.

### 10.1 Left Button — Sort by Group Task Count

The left button must sort groups by the number of tasks they contain.

Behavior:

- First click: groups with more tasks appear first.
- Second click: groups with fewer tasks appear first.
- Third click: restore original/manual order using `manualGroupOrder`.

Acceptance criteria:

- Clicking the left button changes group order by task count.
- The current sort direction is visually indicated.
- Manual drag order is preserved separately when sorting is cleared.
- Sorting does not mutate `manualGroupOrder`.

---

### 10.2 Right Button — Sort Alphabetically

The right button must sort groups alphabetically by group name.

Behavior:

- First click: A to Z.
- Second click: Z to A.
- Third click: restore original/manual order using `manualGroupOrder`.

Acceptance criteria:

- Clicking the right button sorts groups alphabetically.
- The current sort direction is visually indicated.
- Manual drag order is preserved separately when sorting is cleared.
- Sorting does not mutate `manualGroupOrder`.

---

## 11. Task Updates and Files

### 11.1 Editable Comments

Inside each task’s updates menu, users must be able to edit comments they previously wrote.

Rules:

- A user can only edit their own comments.
- Edited comments should show an edited indicator.

Example:

```txt
Edited
```

Comment data structure:

```typescript
export interface TaskUpdate {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
  attachments: TaskFile[];
  mentions: BoardMember[];
}
```

Acceptance criteria:

- User can edit their own previous comments.
- User cannot edit comments from other users.
- Edited comments display an edited indicator.
- Updated content persists in the task state.

---

### 11.2 Upload Files in Updates

Users must be able to upload files inside the same update/comment area.

Behavior:

- The update composer includes an attach/upload button.
- A user can attach one or more files before posting.
- Attached files display below the comment.
- Files are associated with the task.

Acceptance criteria:

- A file can be attached to an update.
- The uploaded file appears in the update thread.
- The uploaded file also appears in the task files tab.

---

### 11.3 Task Files Tab

Each task must include a files tab that displays a compendium of uploaded files.

The files tab must support:

- Listing all files uploaded to the task.
- Showing file name.
- Showing file type.
- Showing upload date.
- Showing uploader.
- Previewing supported files.
- Downloading files.

Supported preview examples:

```txt
Images
PDFs
Plain text files
CSV files
```

For unsupported preview types:

```txt
Preview not available
Download file
```

Acceptance criteria:

- Files uploaded in updates appear in the files tab.
- Files can be previewed when supported.
- Files can be downloaded.
- Unsupported files show a clear fallback message.

---

## 12. Mentions

### 12.1 @ Mention Autocomplete

The task update editor must support member mentions.

Behavior:

- When the user types `@`, a small autocomplete rectangle appears.
- As the user continues typing, the list filters matching members.
- The user can click a member.
- The selected member’s name is inserted into the comment.
- The mention is stored in the update data.

Example:

```txt
@Marco
```

Autocomplete behavior:

```txt
Typing "@m" shows:
- Marco Ríos
- Mariana López
```

Important future consideration:

This will later be connected to the notification system. For now, only autocomplete and stored mention data are required.

Acceptance criteria:

- Typing `@` opens the mention menu.
- Typing after `@` filters members.
- Clicking a member inserts the mention.
- Mentioned users are stored in the update object.

---

## 13. Search

### 13.1 Functional Search Bar

The search bar must perform live partial search.

Behavior:

- Search updates as the user types.
- It must not require exact matches.
- It must be case-insensitive.
- Searching `"E"` should immediately filter matching results.
- Search should match against at least:
  - Task title.
  - Assignee names.
  - Status labels.
  - Priority labels.
  - Group names.

Example:

```txt
Search: "e"

Could match:
- Establish Component Architecture
- Implement React Router logic
- Lucía Fernández
- Review
- Core Setup
```

Acceptance criteria:

- Search filters visible tasks live.
- Search supports partial matches.
- Search is case-insensitive.
- Empty search restores the full board.
- Matching groups remain visible if they contain matching tasks.
- If a group name matches, the whole group may remain visible.

---

## 14. Replicability Across Task Boards

All functionality must be reusable for every task board.

Rules:

- No board-specific hardcoded logic.
- Board state must be scoped by `taskBoardId`.
- Columns, groups, tasks, files, updates, views, and `manualGroupOrder` must belong to a specific board.
- Components must accept data through props or context.

Example:

```typescript
export interface TaskBoardState {
  taskBoardId: string;
  views: TaskBoardView[];
  columns: TaskBoardColumn[];
  groups: TaskGroup[];
  members: BoardMember[];
  manualGroupOrder: string[];
}
```

Acceptance criteria:

- The same Task Board components can render different boards.
- Data from one board does not affect another board.
- Creating columns/groups/tasks affects only the active board.
- Manual group order is stored separately per task board.

---

## 15. Component Architecture

The implementation must be abstracted into components.

Suggested component tree:

```txt
TaskBoardPage
├── TaskBoardHeader
│   ├── ViewSelector
│   │   ├── ViewTab
│   │   └── AddViewButton
│   ├── NewButtonMenu
│   ├── TaskBoardSearch
│   └── TaskBoardSortControls
│
├── TaskBoardProvider
│
├── TaskBoardContent
│   └── TaskGroupList
│       └── TaskGroup
│           ├── TaskGroupHeader
│           │   └── GroupColorPicker
│           └── TaskTable
│               ├── TaskTableHeader
│               ├── TaskRow
│               │   ├── TaskTitleCell
│               │   ├── AssigneeCell
│               │   ├── SelectFieldCell
│               │   ├── DateCell
│               │   ├── ProgressCell
│               │   └── TaskUpdatesButton
│               ├── AddTaskRow
│               └── AddColumnCell
│
├── AddViewModal
├── AddColumnModal
├── SelectOptionEditor
├── ProgressEditorPopover
├── AssigneeSelectorPopover
└── TaskDetailsPanel
    ├── UpdatesTab
    │   ├── UpdateComposer
    │   ├── MentionAutocomplete
    │   └── UpdateItem
    └── FilesTab
        ├── FileList
        └── FilePreview
```

Rules:

- Use existing components wherever possible.
- New components must be small and focused.
- Avoid placing all logic in the page component.
- Shared board logic should live in hooks or context.
- Existing drag-and-drop logic must be reused.

Suggested hooks:

```txt
useTaskBoardState
useTaskGroups
useTaskColumns
useTaskSearch
useTaskSorting
useTaskMentions
useTaskFiles
useTaskDragAndDrop
useManualGroupOrder
```

---

## 16. TypeScript Interfaces

```typescript
export type TaskBoardViewType = "table" | "chart" | "calendar" | "files";

export interface TaskBoardView {
  id: string;
  name: string;
  type: TaskBoardViewType;
}

export interface BoardMember {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  initials: string;
}

export type ColumnFieldType =
  | "shortText"
  | "longText"
  | "number"
  | "currency"
  | "percentage"
  | "date"
  | "time"
  | "timeline"
  | "singleSelect"
  | "multiSelect"
  | "person"
  | "file"
  | "checkbox"
  | "url"
  | "email"
  | "phone"
  | "formula";

export interface SelectOption {
  id: string;
  label: string;
  color: string;
}

export interface TaskBoardColumn {
  id: string;
  title: string;
  fieldType: ColumnFieldType;
  width?: number;
  options?: SelectOption[];
  isSystemColumn?: boolean;
}

export interface TaskFile {
  id: string;
  taskId: string;
  updateId?: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: BoardMember;
  uploadedAt: string;
}

export interface TaskUpdate {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
  attachments: TaskFile[];
  mentions: BoardMember[];
}

export interface TaskItem {
  id: string;
  title: string;
  values: Record<string, unknown>;
  assignees: BoardMember[];
  updates: TaskUpdate[];
  files: TaskFile[];
}

export interface TaskGroup {
  id: string;
  name: string;
  color: string;
  collapsed: boolean;
  tasks: TaskItem[];
}

export interface TaskBoardState {
  taskBoardId: string;
  views: TaskBoardView[];
  activeViewId: string;
  columns: TaskBoardColumn[];
  groups: TaskGroup[];
  members: BoardMember[];
  manualGroupOrder: string[];
}
```

---

## 17. State Management Plan

The board should use a centralized state layer.

Recommended approach:

```txt
TaskBoardProvider + reducer
```

State should include:

```typescript
interface TaskBoardUIState {
  searchQuery: string;
  sortMode: "none" | "taskCount" | "alphabetical";
  sortDirection: "asc" | "desc";
  isAddViewModalOpen: boolean;
  isAddColumnModalOpen: boolean;
  selectedColumnId?: string;
  selectedTaskId?: string;
}
```

Core actions:

```typescript
type TaskBoardAction =
  | { type: "ADD_TASK"; groupId: string }
  | { type: "ADD_TASK_TO_FIRST_GROUP" }
  | { type: "ADD_GROUP_AT_SECOND_POSITION" }
  | { type: "REORDER_GROUPS"; manualGroupOrder: string[] }
  | { type: "SET_MANUAL_GROUP_ORDER"; manualGroupOrder: string[] }
  | { type: "ADD_COLUMN"; column: TaskBoardColumn }
  | { type: "UPDATE_COLUMN_TITLE"; columnId: string; title: string }
  | { type: "UPDATE_COLUMN_TYPE"; columnId: string; fieldType: ColumnFieldType }
  | { type: "UPDATE_SELECT_OPTIONS"; columnId: string; options: SelectOption[] }
  | { type: "UPDATE_TASK_VALUE"; taskId: string; columnId: string; value: unknown }
  | { type: "UPDATE_TASK_ASSIGNEES"; taskId: string; assignees: BoardMember[] }
  | { type: "ADD_TASK_UPDATE"; taskId: string; update: TaskUpdate }
  | { type: "EDIT_TASK_UPDATE"; taskId: string; updateId: string; body: string }
  | { type: "ADD_TASK_FILE"; taskId: string; file: TaskFile }
  | { type: "UPDATE_GROUP_COLOR"; groupId: string; color: string }
  | { type: "SET_SEARCH_QUERY"; query: string }
  | { type: "SET_GROUP_SORT"; mode: "none" | "taskCount" | "alphabetical"; direction: "asc" | "desc" };
```

Reducer rules:

- `REORDER_GROUPS` updates only `manualGroupOrder`.
- `SET_GROUP_SORT` updates only UI sorting state.
- Sorting must not reorder the `groups` array.
- Sorting must not mutate `manualGroupOrder`.
- Adding a group must add the new group to `groups` and insert its ID into `manualGroupOrder`.
- Deleting a group must remove the group from `groups` and remove its ID from `manualGroupOrder`.

---

## 18. Persistence

For now, if backend integration is not ready, persist board data in localStorage.

Suggested key:

```txt
task_board_state_${taskBoardId}
```

Example:

```json
{
  "version": 1,
  "taskBoardId": "frontend-design",
  "views": [],
  "columns": [],
  "groups": [],
  "members": [],
  "manualGroupOrder": []
}
```

Backend integration path:

```txt
GET /api/task-boards/:taskBoardId
PUT /api/task-boards/:taskBoardId
POST /api/task-boards/:taskBoardId/tasks
POST /api/task-boards/:taskBoardId/groups
POST /api/task-boards/:taskBoardId/columns
POST /api/tasks/:taskId/updates
POST /api/tasks/:taskId/files
```

Backend notes:

- `manualGroupOrder` must be persisted as part of the board layout.
- The backend should validate that all IDs in `manualGroupOrder` belong to the same task board.
- When returning a board, the backend should include `manualGroupOrder`.
- If `manualGroupOrder` is missing, the frontend should create it from the current `groups` order.

---

## 19. Professional Flow Improvements to Consider

Based on the current board UI, these additions would make the flow feel more complete later.

### 19.1 Empty States

Add clear empty states for:

- Empty board.
- Empty group.
- No search results.
- No files.
- No updates.

Example:

```txt
No tasks found.
Try adjusting your search or create a new task.
```

---

### 19.2 Loading and Error States

Every async operation should eventually support:

- Loading skeletons.
- Upload progress.
- Save failed message.
- Retry action.

---

### 19.3 Column Reordering

Not required yet, but the architecture should not block it.

Future behavior:

- Users can drag columns to reorder them.
- Column order persists per board.

---

### 19.4 Task Row Reordering

Not required yet, but recommended for a professional task board.

Future behavior:

- Users can drag tasks within a group.
- Users can move tasks between groups.

---

### 19.5 Permissions

Consider future permissions:

```txt
Owner
Admin
Member
Viewer
```

Permissions may control:

- Creating columns.
- Editing statuses.
- Changing group colors.
- Uploading files.
- Editing comments.
- Reordering groups.

---

## 20. Non-Functional Requirements

### 20.1 Component Reuse

The implementation must reuse existing project components wherever possible.

Do not create:

- A new modal system if one already exists.
- A new button style if one already exists.
- A new avatar component if one already exists.
- A new table style if one already exists.
- A new drag-and-drop system if one already exists.

---

### 20.2 Code Organization

Follow the current project structure.

Suggested structure only if it matches the project:

```txt
src/
  components/
    task-board/
      TaskBoardPage.tsx
      TaskBoardHeader.tsx
      ViewSelector.tsx
      NewButtonMenu.tsx
      TaskGroupList.tsx
      TaskGroup.tsx
      TaskTable.tsx
      TaskRow.tsx
      AddTaskRow.tsx
      AddColumnModal.tsx
      AssigneeSelectorPopover.tsx
      SelectOptionEditor.tsx
      ProgressEditorPopover.tsx
      TaskDetailsPanel.tsx
      UpdatesTab.tsx
      FilesTab.tsx
  hooks/
    task-board/
      useTaskBoardState.ts
      useTaskSearch.ts
      useTaskSorting.ts
      useTaskDragAndDrop.ts
      useManualGroupOrder.ts
  types/
    taskBoard.ts
  services/
    taskBoardService.ts
  mocks/
    taskBoardMock.ts
```

If the project uses a different folder convention, follow the existing convention instead.

---

## 21. Final Acceptance Criteria

The implementation is complete when:

- The view selector has a working `+` button.
- The `+` button opens an `Add New View` pop-up.
- `New Task` has been renamed to `New`.
- `New` opens a dropdown with `New Item` and `New Group of Items`.
- `New Item` adds a task to the first visible group.
- `New Group of Items` adds an empty group in the second manual position.
- `Add Task` is rendered as a full-width final table row.
- Groups can be reordered using the existing drag-and-drop implementation.
- Dragging groups updates `manualGroupOrder`.
- Sorting groups does not mutate `manualGroupOrder`.
- Clearing sorting restores the latest manual group order.
- Assignee selector supports search.
- Assignee selector supports multiple members.
- Multiple assignees display as avatars only.
- Each table has a final `+` column.
- The `+` column opens an add-column pop-up.
- Users can create quick columns.
- Users can create blank columns.
- Blank columns auto-focus the title.
- Columns support field types.
- Select fields support editable options.
- Select fields support custom text and colors.
- Quick select columns include predefined options.
- The progress field uses an improved interactive editor.
- Group colors can be changed from a hover color square.
- Sort/filter buttons work by task count and alphabetically.
- Task updates support editing own comments.
- Task updates support file uploads.
- The files tab lists, previews, and downloads uploaded files.
- Updates support `@` mention autocomplete.
- Search is live, partial, and case-insensitive.
- All functionality works per `taskBoardId`.
- `manualGroupOrder` is scoped per `taskBoardId`.
- Components are abstracted and reusable.
- Existing components and project structure are respected.

---

## 22. Current Implemented Behavior Contract

This section documents functionality that is currently implemented and must be preserved by future changes.

If future work intentionally changes any behavior in this section, the change must be called out explicitly and this specification must be updated in the same pull request.

---

### 22.1 Board State Ownership

The current implementation uses `TaskBoardProvider` as the single source of truth for board state.

Current state includes:

- Board config.
- Columns.
- Groups.
- Tasks.
- Users.
- Active view.
- Active detail panel state.
- Collapsed groups.
- Manual group order.
- Search query.
- Sort mode and direction.
- Completed tasks.

Board state is scoped by the route-derived board ID:

```txt
${workspaceId}_${boardId}
```

Example:

```txt
magenta_frontend
magenta_backend
```

Acceptance criteria:

- A change in one board must not affect another board unless the user explicitly chooses a cross-board move action.
- Board-specific data must be loaded and saved under the board's scoped storage key.
- State mutation helpers must keep `localStorage` in sync.

---

### 22.2 Persistence and Storage Versioning

The current implementation persists board data in localStorage using:

```txt
task_board_state_${boardId}
```

The stored payload includes a `version` field.

Current behavior:

- The provider reads from localStorage first.
- If stored data is missing, it falls back to mock board data.
- If stored data has an unsupported version, it is discarded and the board reloads from fallback data.
- New persisted states must use the current `STORAGE_VERSION`.
- Existing legacy tasks must be normalized so `assigneeIds` exists.

Acceptance criteria:

- Future schema changes must bump `STORAGE_VERSION` when old saved data is no longer compatible.
- Fallback mock data must remain valid TypeScript for the current task interfaces.
- Persisted board state must include config, groups, tasks, and `manualGroupOrder`.

---

### 22.3 Inline Rename Behavior

Task names and group names are editable inline.

Task item behavior:

- Clicking exactly on the task name cell enters rename mode.
- Editing the task name must not open the task detail panel.
- Pressing `Enter` saves the new name.
- Pressing `Escape` cancels editing and restores the previous displayed value.
- Blurring the input saves the current value.

Group behavior:

- Clicking the group name enters rename mode.
- Pressing `Enter` saves the group name.
- Pressing `Escape` cancels editing.
- Blurring the input saves the current value.

Acceptance criteria:

- Rename works without adding a visible edit button.
- Rename state must not break drag-and-drop.
- Rename must persist in board state.

---

### 22.4 Task Context Menu

Right-clicking a task row opens a context menu.

Current menu options:

```txt
Rename item
Move to group
Change board
Delete item
```

Behavior:

- `Rename item` enters inline rename mode for the task name.
- `Move to group` opens a submenu with groups in the current board.
- Selecting a group moves the task to that group.
- The current group option is disabled.
- `Change board` opens a submenu with other boards in the same workspace.
- Selecting a board opens a second submenu with groups in that board.
- Selecting a target group moves the task to that board and group.
- `Delete item` confirms before deleting the task.
- Deleting a task removes it from its group and closes the detail panel if that task was open.

Acceptance criteria:

- Context menu opens on right-click.
- Menu closes when clicking outside or after choosing an action.
- Cross-board item moves remove the task from the source board and persist it into the target board.
- Cross-board item moves update the moved task's `workspaceId` and `groupId`.
- Cross-board item moves must avoid ID collision in the target board.

---

### 22.5 Group Context Menu

Right-clicking a group header opens a context menu.

Current menu options:

```txt
Rename group
Add item here
Collapse group / Expand group
Change color
Move group to board
Delete group
```

Behavior:

- `Rename group` enters inline group rename mode.
- `Add item here` opens the inline add-task row for that group.
- `Collapse group` collapses the group.
- `Expand group` expands the group.
- `Change color` opens the existing group color picker.
- `Move group to board` opens a submenu with other boards in the same workspace.
- Selecting a board moves the group and all its tasks to that board.
- `Delete group` confirms before deleting.
- Deleting a group deletes the tasks inside that group from the current board.

Acceptance criteria:

- Group context menu opens only from the group header area.
- Moving a group to another board removes it from the source board.
- Moving a group to another board appends it to the target board's group list.
- Moving a group to another board appends its ID to the target board's `manualGroupOrder`.
- Moving a group to another board updates moved tasks to the target board and moved group.
- Group and task ID collisions in the target board must be handled safely.

---

### 22.6 Cross-Board Move Rules

Cross-board movement currently works against locally persisted board states and mock fallback board states.

Board target discovery:

- Available board targets come from mock board summaries for the same workspace.
- Stored board state is used when available so menus reflect user-created groups.
- Current board is excluded from cross-board target menus.

Task move rules:

- A task moved across boards must be removed from the source board's task record.
- The task ID must be preserved if possible.
- If the target board already has the same task ID, generate a collision-safe ID.
- The task's `workspaceId` must become the target board ID.
- The task's `groupId` must become the selected target group ID.

Group move rules:

- A group moved across boards must be removed from the source board.
- All tasks inside the group must move with it.
- The moved group ID must be preserved if possible.
- If the target board already has the same group ID, generate a collision-safe ID.
- All moved tasks must point to the moved group ID.
- The moved group is appended to the target board's manual order.

Acceptance criteria:

- Source and target board localStorage records are both updated.
- The current UI updates immediately after a cross-board move from the active board.
- Future backend integration must preserve equivalent behavior through API calls.

---

### 22.7 Task Detail Panel

The right-side task detail panel contains:

- Updates tab.
- Files tab.
- Activity tab placeholder.

Current close behavior:

- Clicking the `X` closes the panel.
- Clicking outside the panel closes the panel.
- The backdrop is transparent so the visual design remains unchanged.

Acceptance criteria:

- Outside click closes the panel.
- The panel must not require a visible dark overlay.
- Closing the panel clears the selected task.
- Deleting or moving the selected task closes the panel.

---

### 22.8 Updates, Mentions, and Files

Current updates behavior:

- Users can write updates.
- Users can attach local files before posting.
- Posting an update stores attached files in the update and task file list.
- Users can edit their own comments.
- Edited comments show an edited indicator.
- Typing `@` opens member autocomplete.
- Selecting a member inserts the mention into the composer.
- Mentioned member IDs are stored on the update.

Current files behavior:

- Files uploaded through updates appear in the Files tab.
- Files show name, size, uploader, and upload date.
- Images render in a preview dialog.
- PDF/text-like files render in an iframe preview.
- Unsupported files show a fallback state with a download action.

Acceptance criteria:

- Update attachments and task files stay in sync.
- Mention detection remains case-insensitive while searching.
- File preview and download actions must remain available from the Files tab.

---

### 22.9 Column and Cell Editing

Current cell behavior:

- Task name cells support inline text editing.
- Assignee cells support multi-select with search.
- Status and priority cells support editable option lists.
- Select options can be added, renamed, recolored, and deleted.
- Progress cells show a bar and open an editor with slider, number input, and quick percentages.
- Date, budget, numeric, file, and default text cells render according to column type.

Acceptance criteria:

- Board-level status and priority option edits persist to board config.
- Custom column option edits persist to that column definition.
- Assignee edits keep `assigneeId` synchronized with the first value in `assigneeIds` for legacy compatibility.
- Custom field values must be stored under `task.values[column.id]`.

---

### 22.10 Docker and Browser Cache Requirements

The frontend is built into static assets and served by Nginx.

Current Docker behavior:

- `docker compose up` may reuse an old image if the frontend image is not rebuilt.
- After frontend changes, use a rebuild command.

Recommended command:

```powershell
docker compose down
docker compose build --no-cache frontend
docker compose up
```

Nginx cache behavior:

- `index.html` must not be cached.
- `/assets/*` may be cached immutably because Vite emits hashed asset names.

Acceptance criteria:

- Future Nginx config changes must preserve `no-store`/`no-cache` behavior for `index.html`.
- Future Docker workflow documentation must mention rebuilding the frontend image for static bundle changes.
- If the user sees old UI after a rebuild, verify the served `index.html` references the latest generated bundle.

---

## 23. Regression Checklist

Before considering future Task Board work complete, verify at minimum:

- `npm run build` passes in `frontend`.
- The page loads for `/workspaces/magenta/boards/frontend`.
- The page loads for `/workspaces/magenta/boards/backend`.
- The `+` view button opens the `Add New View` pop-up.
- `New > New Item` adds a row to the first visible group.
- `New > New Group of Items` adds a group in the second manual position.
- Clicking a task name allows inline rename.
- Clicking a group name allows inline rename.
- Right-clicking a task opens the task context menu.
- Task context menu can rename, move to group, move to another board/group, and delete.
- Right-clicking a group opens the group context menu.
- Group context menu can rename, add item, collapse/expand, change color, move to another board, and delete.
- Moving a task across boards persists after refresh.
- Moving a group across boards persists after refresh.
- The task detail panel closes with the `X`.
- The task detail panel closes by clicking outside.
- Updates can be posted.
- Mentions can be inserted.
- Files can be attached to updates and viewed in the Files tab.
- Search filters task names, assignees, status labels, priority labels, and group names.
- Sorting by task count cycles desc, asc, none.
- Sorting alphabetically cycles asc, desc, none.
- Clearing sorting restores manual order.
- Group drag-and-drop clears active sort before reordering.
- LocalStorage schema changes bump `STORAGE_VERSION` when needed.
