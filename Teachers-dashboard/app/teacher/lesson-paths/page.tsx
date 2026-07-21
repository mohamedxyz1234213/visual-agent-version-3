"use client";

import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "@/features/shared/config";
import { useClasses } from "@/features/teacher/hooks";
import { IconFileText, IconUsers, IconX } from "@/components/shared/FluxIcons";

interface LessonPathItem {
  _id: string;
  title: string;
  description: string;
  teacherId: string;
  subjectId?: any;
  lessons: { _id: string; lessonId?: any; title: string; order: number; mandatory: boolean }[];
  assignedStudentIds: { _id: string; studentCode: string }[];
  difficulty: string;
  estimatedWeeks: number;
  isActive: boolean;
  isPublished: boolean;
  createdAt: string;
}

export default function TeacherLessonPathsPage() {
  const [paths, setPaths] = useState<LessonPathItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editingPath, setEditingPath] = useState<LessonPathItem | null>(null);
  const [newPath, setNewPath] = useState({ title: "", description: "", difficulty: "beginner", estimatedWeeks: 1 });
  const [refreshing, setRefreshing] = useState(0);
  const [selectedStudents, setSelectedStudents] = useState<Record<string, string[]>>({});
  const { classes } = useClasses();

  const allStudents = Object.values(classes || {}).flat().map((s: any) => ({
    id: s.id,
    username: s.username || s.studentCode,
    studentCode: s.studentCode,
  }));

  const fetchPaths = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await apiRequest("/teacher/lesson-paths");
      setPaths(res?.paths || []);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPaths(); }, [fetchPaths, refreshing]);

  const handleCreate = async () => {
    if (!newPath.title.trim()) return;
    try {
      await apiRequest("/teacher/lesson-paths", {
        method: "POST",
        body: JSON.stringify(newPath),
      });
      setNewPath({ title: "", description: "", difficulty: "beginner", estimatedWeeks: 1 });
      setShowCreate(false);
      setRefreshing((r) => r + 1);
    } catch (e: any) {
      alert(e.message || "Failed to create");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this lesson path?")) return;
    try {
      await apiRequest(`/teacher/lesson-paths/${id}`, { method: "DELETE" });
      setRefreshing((r) => r + 1);
    } catch {}
  };

  const handleAssignStudents = async (pathId: string) => {
    const studentIds = selectedStudents[pathId] || allStudents.map((s) => s.id);
    if (studentIds.length === 0) {
      alert("Select at least one student");
      return;
    }
    try {
      await apiRequest(`/teacher/lesson-paths/${pathId}/assign`, {
        method: "POST",
        body: JSON.stringify({ studentIds }),
      });
      setSelectedStudents((prev) => ({ ...prev, [pathId]: [] }));
      setRefreshing((r) => r + 1);
    } catch (e: any) {
      alert(e.message || "Failed to assign");
    }
  };

  const handlePublishToggle = async (path: LessonPathItem) => {
    try {
      await apiRequest(`/teacher/lesson-paths/${path._id}`, {
        method: "PUT",
        body: JSON.stringify({ isPublished: !path.isPublished }),
      });
      setRefreshing((r) => r + 1);
    } catch {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#18181B]">Lesson Paths</h2>
          <p className="text-sm text-gray-500 mt-1">
            Create structured learning paths for your students
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-5 py-2.5 bg-[#A78BFA] text-white rounded-xl font-semibold text-sm hover:bg-[#8b5cf6] transition-colors"
        >
          {showCreate ? "Cancel" : "+ New Path"}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-[#18181B]">Create New Lesson Path</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Path Title *</label>
              <input
                value={newPath.title}
                onChange={(e) => setNewPath((p) => ({ ...p, title: e.target.value }))}
                className="flux-pill-input w-full"
                placeholder="e.g., Python Fundamentals"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Difficulty</label>
              <select
                value={newPath.difficulty}
                onChange={(e) => setNewPath((p) => ({ ...p, difficulty: e.target.value }))}
                className="flux-pill-input w-full"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Description</label>
              <textarea
                value={newPath.description}
                onChange={(e) => setNewPath((p) => ({ ...p, description: e.target.value }))}
                className="flux-pill-input w-full min-h-[80px] resize-none"
                placeholder="Brief description of this learning path..."
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Estimated Weeks</label>
              <input
                type="number"
                value={newPath.estimatedWeeks}
                onChange={(e) => setNewPath((p) => ({ ...p, estimatedWeeks: parseInt(e.target.value) || 1 }))}
                className="flux-pill-input w-24"
                min={1}
                max={52}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!newPath.title.trim()}
              className="px-6 py-2 bg-[#A78BFA] text-white rounded-xl font-semibold text-sm hover:bg-[#8b5cf6] disabled:opacity-50 transition-colors"
            >
              Create Path
            </button>
          </div>
        </div>
      )}

      {/* Paths list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl shadow-sm animate-pulse" />
          ))}
        </div>
      ) : paths.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
          <IconFileText size={40} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-[#18181B] mb-2">No lesson paths yet</h3>
          <p className="text-gray-500 text-sm">
            Create a structured learning path to organize your lessons.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paths.map((path) => (
            <div key={path._id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-[#18181B] truncate">{path.title}</h3>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      path.difficulty === "beginner"
                        ? "bg-green-100 text-green-700"
                        : path.difficulty === "intermediate"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {path.difficulty}
                    </span>
                    {path.isPublished && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        Published
                      </span>
                    )}
                  </div>
                  {path.description && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{path.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{path.lessons?.length || 0} lessons</span>
                    <span>{path.assignedStudentIds?.length || 0} students</span>
                    <span>{path.estimatedWeeks} week(s)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handlePublishToggle(path)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      path.isPublished
                        ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                    }`}
                  >
                    {path.isPublished ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    onClick={() => handleDelete(path._id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <IconX size={16} />
                  </button>
                </div>
              </div>

              {/* Student assignment */}
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <IconUsers size={14} className="text-gray-400" />
                  <span className="text-xs font-semibold text-gray-600">Assign to students</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        const current = selectedStudents[path._id] || [];
                        setSelectedStudents((prev) => ({
                          ...prev,
                          [path._id]: [...current, e.target.value],
                        }));
                      }
                    }}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 min-w-[160px]"
                  >
                    <option value="">Select students...</option>
                    {allStudents
                      .filter((s) => !(selectedStudents[path._id] || []).includes(s.id))
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.username} ({s.studentCode})
                        </option>
                      ))}
                  </select>
                  <button
                    onClick={() => handleAssignStudents(path._id)}
                    className="px-3 py-1.5 bg-[#D6F63E] text-[#0F0F0F] rounded-lg text-xs font-semibold hover:bg-[#c5e535] transition-colors"
                  >
                    Assign
                  </button>
                </div>
                {(selectedStudents[path._id] || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {(selectedStudents[path._id] || []).map((sid) => {
                      const s = allStudents.find((st) => st.id === sid);
                      return (
                        <span key={sid} className="inline-flex items-center gap-1 px-2 py-1 bg-[#A78BFA]/10 text-[#A78BFA] rounded-lg text-[11px] font-medium">
                          {s?.username || sid}
                          <button
                            onClick={() =>
                              setSelectedStudents((prev) => ({
                                ...prev,
                                [path._id]: (prev[path._id] || []).filter((id) => id !== sid),
                              }))
                            }
                            className="hover:text-red-500"
                          >
                            <IconX size={12} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
