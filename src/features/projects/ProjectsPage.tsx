import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  Camera,
  CheckCircle2,
  Clock,
  Edit3,
  Film,
  FolderKanban,
  HardDrive,
  Layers,
  Paperclip,
  Plus,
  Search,
  Sliders,
  Sparkles,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { useData } from '../../app/providers/DataContext';
import { useAuth } from '../../app/providers/AuthContext';
import {
  formatDateDDMMYYYY,
  getTodayKolkataISO,
  isDateOverdue,
} from '../../lib/formatting';
import {
  ALL_PROJECT_STAGES,
  type ProjectRecord,
  type ProjectWorkflowStage,
  type TaskRecord,
  type TaskStatus,
  type WorkflowTrackCategory,
} from '../../types/crm';

const WORKFLOW_TRACKS: WorkflowTrackCategory[] = [
  'Photography editing',
  'Cinematography editing',
  'Album designing',
  'Album printing',
  'Video production',
  'Other custom tasks',
];

const TASK_STATUSES: TaskStatus[] = [
  'Not Started',
  'In Progress',
  'On Hold',
  'Review',
  'Completed',
];

export const ProjectsPage: React.FC = () => {
  const {
    projects,
    tasks,
    bookings,
    team_members,
    updateProjectStage,
    updateProject,
    addTask,
    updateTask,
    deleteTask,
  } = useData();
  const { canAccess } = useAuth();

  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects[0]?.id || ''
  );
  const [viewMode, setViewMode] = useState<'parallel_board' | 'all_tasks_table'>('parallel_board');
  const [trackFilter, setTrackFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Task Modal State
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskRecord | null>(null);
  const [taskForm, setTaskForm] = useState({
    project_id: projects[0]?.id || '',
    task_name: '',
    workflow_track: 'Photography editing' as WorkflowTrackCategory,
    assigned_staff_id: team_members[0]?.id || '',
    start_date: getTodayKolkataISO(),
    deadline: getTodayKolkataISO(),
    priority: 'High' as TaskRecord['priority'],
    progress_percentage: 0,
    status: 'Not Started' as TaskStatus,
    internal_notes: '',
    file_attachments_str: '',
  });

  const activeProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || projects[0] || null,
    [projects, selectedProjectId]
  );

  // Tasks for active project grouped by the 6 parallel tracks
  const activeProjectTasks = useMemo(() => {
    if (!activeProject) return [];
    return tasks.filter((t) => t.project_id === activeProject.id);
  }, [tasks, activeProject]);

  // All tasks filtered for the global table view
  const filteredAllTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        t.task_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.booking_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.assigned_staff_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTrack = trackFilter === 'ALL' || t.workflow_track === trackFilter;
      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
      return matchesSearch && matchesTrack && matchesStatus;
    });
  }, [tasks, searchQuery, trackFilter, statusFilter]);

  const stats = useMemo(() => {
    const overdueTasks = tasks.filter(
      (t) => t.status !== 'Completed' && isDateOverdue(t.deadline)
    );
    const inProgressTasks = tasks.filter(
      (t) => t.status === 'In Progress' || t.status === 'Review'
    );
    const completedTasks = tasks.filter((t) => t.status === 'Completed');
    const activeProjectsCount = projects.filter((p) => p.status !== 'Completed').length;

    return {
      activeProjectsCount,
      inProgressTasksCount: inProgressTasks.length,
      overdueTasksCount: overdueTasks.length,
      completedTasksCount: completedTasks.length,
    };
  }, [projects, tasks]);

  const handleOpenAddTask = (defaultTrack?: WorkflowTrackCategory) => {
    const targetProject = activeProject || projects[0];
    setEditingTask(null);
    setTaskForm({
      project_id: targetProject?.id || '',
      task_name: '',
      workflow_track: defaultTrack || 'Photography editing',
      assigned_staff_id: team_members[0]?.id || '',
      start_date: getTodayKolkataISO(),
      deadline: targetProject?.expected_delivery_date || getTodayKolkataISO(),
      priority: 'High',
      progress_percentage: 0,
      status: 'Not Started',
      internal_notes: '',
      file_attachments_str: '',
    });
    setShowTaskModal(true);
  };

  const handleOpenEditTask = (task: TaskRecord) => {
    setEditingTask(task);
    setTaskForm({
      project_id: task.project_id,
      task_name: task.task_name,
      workflow_track: task.workflow_track,
      assigned_staff_id: task.assigned_staff_id,
      start_date: task.start_date,
      deadline: task.deadline,
      priority: task.priority,
      progress_percentage: task.progress_percentage,
      status: task.status,
      internal_notes: task.internal_notes,
      file_attachments_str: task.file_attachments.join(', '),
    });
    setShowTaskModal(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    const proj = projects.find((p) => p.id === taskForm.project_id) || activeProject;
    if (!proj) return;

    const staff = team_members.find((m) => m.id === taskForm.assigned_staff_id);
    const attachments = taskForm.file_attachments_str
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const autoProgress =
      taskForm.status === 'Completed' ? 100 : Number(taskForm.progress_percentage);

    if (editingTask) {
      updateTask(editingTask.id, {
        project_id: proj.id,
        booking_id: proj.booking_id,
        booking_code: proj.booking_code,
        client_name: proj.client_name,
        task_name: taskForm.task_name,
        workflow_track: taskForm.workflow_track,
        assigned_staff_id: staff?.id || '',
        assigned_staff_name: staff?.full_name || 'Unassigned',
        start_date: taskForm.start_date,
        deadline: taskForm.deadline,
        priority: taskForm.priority,
        progress_percentage: autoProgress,
        status: taskForm.status,
        internal_notes: taskForm.internal_notes,
        file_attachments: attachments,
      });
    } else {
      addTask({
        project_id: proj.id,
        booking_id: proj.booking_id,
        booking_code: proj.booking_code,
        client_name: proj.client_name,
        task_name: taskForm.task_name,
        workflow_track: taskForm.workflow_track,
        assigned_staff_id: staff?.id || '',
        assigned_staff_name: staff?.full_name || 'Unassigned',
        start_date: taskForm.start_date,
        deadline: taskForm.deadline,
        priority: taskForm.priority,
        progress_percentage: autoProgress,
        status: taskForm.status,
        internal_notes: taskForm.internal_notes,
        file_attachments: attachments,
      });
    }
    setShowTaskModal(false);
  };

  const handleToggleCompletedStage = (project: ProjectRecord, stage: ProjectWorkflowStage) => {
    const exists = project.completed_stages.includes(stage);
    const nextCompleted = exists
      ? project.completed_stages.filter((s) => s !== stage)
      : [...project.completed_stages, stage];

    updateProject(project.id, {
      completed_stages: nextCompleted,
      current_stage: stage,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-obsidian-900 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-gold-300">
              <FolderKanban className="h-3.5 w-3.5 text-gold-400" />
              Non-Linear Post-Production Engine
            </span>
          </div>
          <h1 className="mt-2 font-serif text-2xl font-bold text-obsidian-900 sm:text-3xl">
            Projects & Parallel Post-Production Workflows
          </h1>
          <p className="mt-1 text-sm text-obsidian-500">
            Simultaneous multi-track production across Photography Editing, Cinematography, Album Design, Album Printing & Video Production.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex rounded-xl border border-obsidian-200 bg-white p-1">
            <button
              onClick={() => setViewMode('parallel_board')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === 'parallel_board'
                  ? 'bg-obsidian-900 text-gold-300'
                  : 'text-obsidian-600 hover:bg-obsidian-50'
              }`}
            >
              Project Parallel Board
            </button>
            <button
              onClick={() => setViewMode('all_tasks_table')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === 'all_tasks_table'
                  ? 'bg-obsidian-900 text-gold-300'
                  : 'text-obsidian-600 hover:bg-obsidian-50'
              }`}
            >
              All Studio Tasks ({tasks.length})
            </button>
          </div>

          {canAccess('projects', 'create') && (
            <button
              onClick={() => handleOpenAddTask()}
              className="inline-flex items-center gap-2 rounded-xl bg-obsidian-900 px-4 py-2.5 text-sm font-semibold text-gold-300 shadow-sm hover:bg-obsidian-800"
            >
              <Plus className="h-4 w-4" />
              Add Production Task
            </button>
          )}
        </div>
      </div>

      {/* KPI Summary Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="argon-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-obsidian-400">
              Active Wedding Projects
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-obsidian-900 text-gold-400">
              <FolderKanban className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-serif text-2xl font-bold text-obsidian-900">
            {stats.activeProjectsCount}
          </p>
          <p className="mt-1 text-xs text-obsidian-500">1:1 linked to confirmed bookings</p>
        </div>

        <div className="argon-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-obsidian-400">
              Tasks In Production / Review
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Sliders className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-serif text-2xl font-bold text-amber-700">
            {stats.inProgressTasksCount}
          </p>
          <p className="mt-1 text-xs text-obsidian-500">Simultaneous parallel tracks</p>
        </div>

        <div className="argon-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-obsidian-400">
              Overdue Deadlines
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-serif text-2xl font-bold text-rose-700">
            {stats.overdueTasksCount}
          </p>
          <p className="mt-1 text-xs text-obsidian-500">Requires immediate editor priority</p>
        </div>

        <div className="argon-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-obsidian-400">
              Completed Tasks
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-serif text-2xl font-bold text-emerald-700">
            {stats.completedTasksCount}
          </p>
          <p className="mt-1 text-xs text-obsidian-500">Ready for final deliverable handover</p>
        </div>
      </div>

      {viewMode === 'parallel_board' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Project Selector Sidebar */}
          <div className="space-y-3 lg:col-span-3">
            <div className="argon-card p-4">
              <h2 className="font-serif text-sm font-bold uppercase tracking-wider text-obsidian-700">
                Select Wedding Project ({projects.length})
              </h2>
              <div className="mt-3 space-y-2.5">
                {projects.map((proj) => {
                  const isSelected = activeProject?.id === proj.id;
                  const projTasks = tasks.filter((t) => t.project_id === proj.id);
                  const overdueCount = projTasks.filter(
                    (t) => t.status !== 'Completed' && isDateOverdue(t.deadline)
                  ).length;

                  return (
                    <button
                      key={proj.id}
                      onClick={() => setSelectedProjectId(proj.id)}
                      className={`w-full rounded-xl border p-3.5 text-left transition ${
                        isSelected
                          ? 'border-gold-500 bg-obsidian-900 text-white shadow-md'
                          : 'border-obsidian-100 bg-white text-obsidian-900 hover:border-obsidian-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-mono text-[10px] font-semibold ${
                            isSelected ? 'text-gold-300' : 'text-obsidian-500'
                          }`}
                        >
                          {proj.project_code} • {proj.booking_code}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            proj.status === 'Delayed'
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {proj.overall_progress}%
                        </span>
                      </div>
                      <p className="mt-1 font-serif text-sm font-bold">{proj.client_name}</p>
                      <p
                        className={`mt-0.5 text-[11px] ${
                          isSelected ? 'text-obsidian-300' : 'text-obsidian-500'
                        }`}
                      >
                        Stage: {proj.current_stage}
                      </p>

                      <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-obsidian-200/30">
                        <div
                          className="h-full rounded-full bg-gold-500 transition-all"
                          style={{ width: `${proj.overall_progress}%` }}
                        />
                      </div>

                      {overdueCount > 0 && (
                        <div className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-rose-400">
                          <AlertTriangle className="h-3 w-3" />
                          {overdueCount} overdue task(s)
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Active Project 12-Stage Pipeline & 6 Parallel Tracks */}
          <div className="space-y-6 lg:col-span-9">
            {activeProject && (
              <>
                {/* Project Banner + 12-Stage Multi-Toggle Tracker */}
                <div className="argon-card p-6">
                  <div className="flex flex-col gap-4 border-b border-obsidian-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-obsidian-900 px-2.5 py-0.5 font-mono text-xs font-bold text-gold-300">
                          {activeProject.project_code}
                        </span>
                        <span className="rounded-md bg-obsidian-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-obsidian-700">
                          Booking: {activeProject.booking_code}
                        </span>
                        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                          Priority: {activeProject.priority}
                        </span>
                      </div>
                      <h2 className="mt-2 font-serif text-2xl font-bold text-obsidian-900">
                        {activeProject.client_name}
                      </h2>
                      <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-obsidian-500">
                        <span>
                          Wedding Date: <strong>{formatDateDDMMYYYY(activeProject.wedding_date)}</strong>
                        </span>
                        <span>
                          Target Delivery:{' '}
                          <strong>{formatDateDDMMYYYY(activeProject.expected_delivery_date)}</strong>
                        </span>
                        <span className="inline-flex items-center gap-1 text-obsidian-700">
                          <HardDrive className="h-3.5 w-3.5 text-gold-600" />
                          RAW Backup: <strong>{activeProject.raw_backup_drive}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="text-xs font-semibold uppercase text-obsidian-400">
                        Primary Milestone Stage
                      </span>
                      <select
                        value={activeProject.current_stage}
                        onChange={(e) =>
                          updateProjectStage(
                            activeProject.id,
                            e.target.value as ProjectWorkflowStage
                          )
                        }
                        className="mt-1 rounded-xl border border-obsidian-200 bg-obsidian-900 px-3.5 py-2 text-xs font-semibold text-gold-300"
                      >
                        {ALL_PROJECT_STAGES.map((stage) => (
                          <option key={stage} value={stage}>
                            {stage}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 12 Workflow Milestones (Simultaneous Non-Linear Checkboxes) */}
                  <div className="mt-5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wider text-obsidian-500">
                        12 Studio Production Stages (Click any stage to toggle completion — supports parallel progress)
                      </p>
                      <span className="text-xs font-bold text-obsidian-900">
                        {activeProject.completed_stages.length} / {ALL_PROJECT_STAGES.length} Stages Checked
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
                      {ALL_PROJECT_STAGES.map((stage, idx) => {
                        const isDone = activeProject.completed_stages.includes(stage);
                        const isCurrent = activeProject.current_stage === stage;
                        return (
                          <button
                            key={stage}
                            onClick={() => handleToggleCompletedStage(activeProject, stage)}
                            className={`flex flex-col justify-between rounded-xl border p-2.5 text-left transition ${
                              isDone
                                ? 'border-emerald-300 bg-emerald-50/70 text-emerald-900'
                                : isCurrent
                                ? 'border-gold-500 bg-amber-50 text-obsidian-900 ring-1 ring-gold-500'
                                : 'border-obsidian-200 bg-white text-obsidian-600 hover:bg-obsidian-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[10px] font-bold opacity-60">
                                {String(idx + 1).padStart(2, '0')}
                              </span>
                              {isDone && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              )}
                            </div>
                            <span className="mt-1.5 text-[11px] font-semibold leading-tight">
                              {stage}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 6 Parallel Production Tracks Grid */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {WORKFLOW_TRACKS.map((track) => {
                    const trackTasks = activeProjectTasks.filter(
                      (t) => t.workflow_track === track
                    );

                    return (
                      <div key={track} className="argon-card flex flex-col justify-between p-5">
                        <div>
                          <div className="flex items-center justify-between border-b border-obsidian-100 pb-3">
                            <div>
                              <h3 className="font-serif text-base font-bold text-obsidian-900">
                                {track}
                              </h3>
                              <p className="text-[11px] text-obsidian-500">
                                {trackTasks.length} parallel task(s) in this track
                              </p>
                            </div>
                            <button
                              onClick={() => handleOpenAddTask(track)}
                              className="inline-flex items-center gap-1 rounded-lg bg-obsidian-100 px-2.5 py-1.5 text-xs font-semibold text-obsidian-800 hover:bg-obsidian-900 hover:text-gold-300"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add Task
                            </button>
                          </div>

                          <div className="mt-4 space-y-3">
                            {trackTasks.map((task) => {
                              const overdue =
                                task.status !== 'Completed' && isDateOverdue(task.deadline);

                              return (
                                <div
                                  key={task.id}
                                  className={`rounded-xl border p-3.5 transition ${
                                    overdue
                                      ? 'border-rose-300 bg-rose-50/40'
                                      : 'border-obsidian-100 bg-obsidian-50/40'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <h4 className="font-semibold text-obsidian-900">
                                          {task.task_name}
                                        </h4>
                                        {overdue && (
                                          <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                            OVERDUE
                                          </span>
                                        )}
                                      </div>
                                      <p className="mt-0.5 text-xs text-obsidian-500">
                                        Assigned: <strong>{task.assigned_staff_name}</strong> • Due:{' '}
                                        <span className={overdue ? 'font-bold text-rose-700' : ''}>
                                          {formatDateDDMMYYYY(task.deadline)}
                                        </span>
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleOpenEditTask(task)}
                                        className="rounded p-1 text-obsidian-500 hover:bg-white hover:text-obsidian-900"
                                      >
                                        <Edit3 className="h-3.5 w-3.5" />
                                      </button>
                                      {canAccess('projects', 'delete') && (
                                        <button
                                          onClick={() => deleteTask(task.id)}
                                          className="rounded p-1 text-rose-500 hover:bg-white hover:text-rose-700"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {task.internal_notes && (
                                    <p className="mt-2 rounded-lg bg-white p-2 text-[11px] text-obsidian-600">
                                      {task.internal_notes}
                                    </p>
                                  )}

                                  {/* Interactive Status & Progress Slider */}
                                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2">
                                    <select
                                      value={task.status}
                                      onChange={(e) => {
                                        const nextStatus = e.target.value as TaskStatus;
                                        updateTask(task.id, {
                                          status: nextStatus,
                                          progress_percentage:
                                            nextStatus === 'Completed'
                                              ? 100
                                              : task.progress_percentage,
                                        });
                                      }}
                                      className="rounded-lg border border-obsidian-200 bg-white px-2.5 py-1 text-xs font-semibold text-obsidian-800"
                                    >
                                      {TASK_STATUSES.map((st) => (
                                        <option key={st} value={st}>
                                          {st}
                                        </option>
                                      ))}
                                    </select>

                                    <div className="flex items-center gap-2">
                                      <input
                                        type="range"
                                        min={0}
                                        max={100}
                                        step={5}
                                        value={task.progress_percentage}
                                        onChange={(e) => {
                                          const pct = Number(e.target.value);
                                          updateTask(task.id, {
                                            progress_percentage: pct,
                                            status:
                                              pct === 100
                                                ? 'Completed'
                                                : pct > 0 && task.status === 'Not Started'
                                                ? 'In Progress'
                                                : task.status,
                                          });
                                        }}
                                        className="h-1.5 w-24 accent-obsidian-900"
                                      />
                                      <span className="w-9 text-right font-mono text-xs font-bold text-obsidian-800">
                                        {task.progress_percentage}%
                                      </span>
                                    </div>
                                  </div>

                                  {task.file_attachments.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1.5 border-t border-obsidian-100 pt-2">
                                      {task.file_attachments.map((att, idx) => (
                                        <span
                                          key={idx}
                                          className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[10px] font-medium text-obsidian-600"
                                        >
                                          <Paperclip className="h-3 w-3 text-gold-600" />
                                          {att}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {trackTasks.length === 0 && (
                              <div className="rounded-xl border border-dashed border-obsidian-200 py-6 text-center text-xs text-obsidian-400">
                                No active tasks in {track}. Click "+ Add Task" to assign an editor.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        /* ALL STUDIO TASKS TABLE VIEW */
        <div className="argon-card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-obsidian-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-serif text-lg font-bold text-obsidian-900">
                All Studio Post-Production Tasks
              </h2>
              <p className="text-xs text-obsidian-500">
                Filter across all weddings, workflow tracks, editors, and deadlines.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-obsidian-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search task, couple, editor..."
                  className="w-56 rounded-xl border border-obsidian-200 py-1.5 pl-9 pr-3 text-xs"
                />
              </div>

              <select
                value={trackFilter}
                onChange={(e) => setTrackFilter(e.target.value)}
                className="rounded-xl border border-obsidian-200 px-3 py-1.5 text-xs"
              >
                <option value="ALL">All 6 Tracks</option>
                {WORKFLOW_TRACKS.map((tr) => (
                  <option key={tr} value={tr}>
                    {tr}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-obsidian-200 px-3 py-1.5 text-xs"
              >
                <option value="ALL">All Statuses</option>
                {TASK_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-obsidian-50 text-[11px] font-semibold uppercase tracking-wider text-obsidian-500">
                <tr>
                  <th className="px-5 py-3.5">Task & Track</th>
                  <th className="px-4 py-3.5">Wedding Booking</th>
                  <th className="px-4 py-3.5">Assigned Staff</th>
                  <th className="px-4 py-3.5">Start / Deadline</th>
                  <th className="px-4 py-3.5">Priority</th>
                  <th className="px-4 py-3.5">Progress</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-obsidian-100">
                {filteredAllTasks.map((task) => {
                  const overdue =
                    task.status !== 'Completed' && isDateOverdue(task.deadline);
                  return (
                    <tr
                      key={task.id}
                      className={overdue ? 'bg-rose-50/40' : 'hover:bg-obsidian-50/50'}
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-obsidian-900">{task.task_name}</div>
                        <div className="text-xs text-gold-700">{task.workflow_track}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-obsidian-900">{task.client_name}</div>
                        <div className="font-mono text-xs text-obsidian-500">
                          {task.booking_code}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-semibold text-obsidian-800">
                        {task.assigned_staff_name}
                      </td>
                      <td className="px-4 py-3.5 text-xs">
                        <div className="text-obsidian-500">
                          Start: {formatDateDDMMYYYY(task.start_date)}
                        </div>
                        <div className={overdue ? 'font-bold text-rose-700' : 'text-obsidian-900'}>
                          Due: {formatDateDDMMYYYY(task.deadline)} {overdue ? '(OVERDUE)' : ''}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-full bg-obsidian-100 px-2.5 py-0.5 text-xs font-semibold text-obsidian-800">
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs font-bold text-obsidian-900">
                        {task.progress_percentage}%
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                          {task.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleOpenEditTask(task)}
                          className="rounded-lg p-1.5 text-obsidian-600 hover:bg-obsidian-100"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT TASK MODAL */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-obsidian-100 bg-obsidian-900 px-6 py-4 text-white">
              <h3 className="font-serif text-lg font-bold">
                {editingTask ? 'Edit Production Task' : 'Create Parallel Post-Production Task'}
              </h3>
              <button
                onClick={() => setShowTaskModal(false)}
                className="rounded-lg p-1 text-obsidian-300 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-obsidian-700">
                    Wedding Project *
                  </label>
                  <select
                    value={taskForm.project_id}
                    onChange={(e) => setTaskForm({ ...taskForm, project_id: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.booking_code} — {p.client_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-obsidian-700">
                    Parallel Workflow Track *
                  </label>
                  <select
                    value={taskForm.workflow_track}
                    onChange={(e) =>
                      setTaskForm({
                        ...taskForm,
                        workflow_track: e.target.value as WorkflowTrackCategory,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                  >
                    {WORKFLOW_TRACKS.map((tr) => (
                      <option key={tr} value={tr}>
                        {tr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-obsidian-700">
                  Task Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Lightroom Color Grading (850 Candid Photos)"
                  value={taskForm.task_name}
                  onChange={(e) => setTaskForm({ ...taskForm, task_name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-obsidian-700">
                    Assigned Editor / Staff *
                  </label>
                  <select
                    value={taskForm.assigned_staff_id}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, assigned_staff_id: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                  >
                    {team_members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.full_name} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-obsidian-700">
                    Priority *
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) =>
                      setTaskForm({
                        ...taskForm,
                        priority: e.target.value as TaskRecord['priority'],
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-obsidian-700">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={taskForm.start_date}
                    onChange={(e) => setTaskForm({ ...taskForm, start_date: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-obsidian-700">
                    Deadline *
                  </label>
                  <input
                    type="date"
                    required
                    value={taskForm.deadline}
                    onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-obsidian-700">
                    Task Status
                  </label>
                  <select
                    value={taskForm.status}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, status: e.target.value as TaskStatus })
                    }
                    className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                  >
                    {TASK_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-obsidian-700">
                    Progress ({taskForm.progress_percentage}%)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={taskForm.progress_percentage}
                    onChange={(e) =>
                      setTaskForm({
                        ...taskForm,
                        progress_percentage: Number(e.target.value),
                      })
                    }
                    className="mt-3 w-full accent-obsidian-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-obsidian-700">
                  Internal Notes / Drive Folder Reference
                </label>
                <textarea
                  rows={2}
                  value={taskForm.internal_notes}
                  onChange={(e) => setTaskForm({ ...taskForm, internal_notes: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-obsidian-700">
                  File Attachment Names / Links (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="LUT_Profile_Royal.cube, Album_Draft_Spread_v2.pdf"
                  value={taskForm.file_attachments_str}
                  onChange={(e) =>
                    setTaskForm({ ...taskForm, file_attachments_str: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-obsidian-200 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-obsidian-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="rounded-xl border border-obsidian-200 px-4 py-2 text-xs font-semibold text-obsidian-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-obsidian-900 px-5 py-2 text-xs font-semibold text-gold-300"
                >
                  {editingTask ? 'Save Task' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
