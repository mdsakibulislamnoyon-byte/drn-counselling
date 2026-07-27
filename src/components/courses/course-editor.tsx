'use client';

import { useEffect, useState } from 'react';
import type { Course, CourseModule, Lesson, LessonResource } from '@/types/database';

type ModuleWithLessons = CourseModule & { lessons: (Lesson & { lesson_resources: LessonResource[] })[] };

async function jsonFetch<T>(url: string, options?: RequestInit): Promise<{ ok: boolean; data: T | null; error?: string }> {
  const res = await fetch(url, options);
  const body = await res.json().catch(() => null);
  if (!res.ok) return { ok: false, data: null, error: body?.error ?? `Request failed (${res.status}).` };
  return { ok: true, data: body as T };
}

export function CourseEditor({ courseId }: { courseId: string }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<ModuleWithLessons[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const res = await jsonFetch<{ course: Course; modules: ModuleWithLessons[] }>(`/api/courses/${courseId}`);
    if (res.ok && res.data) {
      setCourse(res.data.course);
      setModules(res.data.modules.sort((a, b) => a.position - b.position));
      setError(null);
    } else {
      setError(res.error ?? 'Unable to load course.');
    }
    setLoading(false);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  if (loading) return <p className="text-sm text-ink-700">Loading course…</p>;
  if (error || !course) return <p className="text-sm text-red-600">{error ?? 'Course not found.'}</p>;

  return (
    <div className="space-y-8">
      <CourseSettingsForm course={course} onSaved={reload} />

      <div>
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-ink-900">Modules & lessons</h2>
        </div>
        <div className="mt-4 space-y-6">
          {modules.map((mod) => (
            <ModuleEditor key={mod.id} module={mod} onChanged={reload} />
          ))}
        </div>
        <AddModuleForm courseId={courseId} nextPosition={modules.length + 1} onAdded={reload} />
      </div>
    </div>
  );
}

function CourseSettingsForm({ course, onSaved }: { course: Course; onSaved: () => void }) {
  const [title, setTitle] = useState(course.title);
  const [subtitle, setSubtitle] = useState(course.subtitle ?? '');
  const [descriptionMd, setDescriptionMd] = useState(course.description_md);
  const [thumbnailUrl, setThumbnailUrl] = useState(course.thumbnail_url ?? '');
  const [price, setPrice] = useState((course.price_cents / 100).toString());
  const [dripDays, setDripDays] = useState(course.drip_interval_days.toString());
  const [mentorshipMonths, setMentorshipMonths] = useState(course.mentorship_months.toString());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    const res = await jsonFetch(`/api/courses/${course.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        subtitle: subtitle || null,
        descriptionMd,
        thumbnailUrl: thumbnailUrl || null,
        priceCents: Math.round(parseFloat(price || '0') * 100),
        dripIntervalDays: parseInt(dripDays || '7', 10),
        mentorshipMonths: parseInt(mentorshipMonths || '12', 10),
      }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      onSaved();
    } else {
      setError(res.error ?? 'Unable to save.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h2 className="font-serif text-xl text-ink-900">Course settings</h2>

      <div>
        <label className="label">Course image (URL)</label>
        {thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbnailUrl} alt="" className="mb-2 aspect-video w-full max-w-sm rounded-xl object-cover" />
        )}
        <input className="input" placeholder="https://…" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} />
      </div>

      <div>
        <label className="label">Title</label>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div>
        <label className="label">Subtitle</label>
        <input className="input" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
      </div>
      <div>
        <label className="label">Description</label>
        <textarea className="input" rows={4} value={descriptionMd} onChange={(e) => setDescriptionMd(e.target.value)} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Price (USD)</label>
          <input className="input" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </div>
        <div>
          <label className="label">Drip interval (days)</label>
          <input className="input" type="number" value={dripDays} onChange={(e) => setDripDays(e.target.value)} />
        </div>
        <div>
          <label className="label">Mentorship (months)</label>
          <input className="input" type="number" value={mentorshipMonths} onChange={(e) => setMentorshipMonths(e.target.value)} />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? 'Saving…' : saved ? 'Saved' : 'Save course settings'}
      </button>
    </form>
  );
}

function ModuleEditor({ module, onChanged }: { module: ModuleWithLessons; onChanged: () => void }) {
  const [title, setTitle] = useState(module.title);
  const [position, setPosition] = useState(module.position.toString());
  const [dripDayOffset, setDripDayOffset] = useState(module.drip_day_offset?.toString() ?? '');
  const [saving, setSaving] = useState(false);
  const [showAddLesson, setShowAddLesson] = useState(false);

  async function handleSave() {
    setSaving(true);
    await jsonFetch(`/api/courses/modules/${module.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        position: parseInt(position || '1', 10),
        dripDayOffset: dripDayOffset === '' ? null : parseInt(dripDayOffset, 10),
      }),
    });
    setSaving(false);
    onChanged();
  }

  async function handleDelete() {
    if (!confirm(`Delete module "${module.title}" and all its lessons?`)) return;
    await fetch(`/api/courses/modules/${module.id}`, { method: 'DELETE' });
    onChanged();
  }

  return (
    <div className="card">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1">
          <label className="label">Module title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="w-24">
          <label className="label">Position</label>
          <input className="input" type="number" value={position} onChange={(e) => setPosition(e.target.value)} />
        </div>
        <div className="w-36">
          <label className="label">Unlock day</label>
          <input
            className="input"
            type="number"
            placeholder="auto"
            value={dripDayOffset}
            onChange={(e) => setDripDayOffset(e.target.value)}
          />
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-secondary">
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button onClick={handleDelete} className="btn-ghost text-red-600">
          Delete module
        </button>
      </div>

      <div className="mt-5 space-y-3 border-t border-ink-100 pt-4">
        {module.lessons
          ?.sort((a, b) => a.position - b.position)
          .map((lesson) => (
            <LessonEditor key={lesson.id} lesson={lesson} onChanged={onChanged} />
          ))}

        {showAddLesson ? (
          <AddLessonForm
            moduleId={module.id}
            nextPosition={(module.lessons?.length ?? 0) + 1}
            onAdded={() => {
              setShowAddLesson(false);
              onChanged();
            }}
            onCancel={() => setShowAddLesson(false)}
          />
        ) : (
          <button onClick={() => setShowAddLesson(true)} className="btn-ghost text-sm">
            + Add lesson
          </button>
        )}
      </div>
    </div>
  );
}

function LessonEditor({
  lesson,
  onChanged,
}: {
  lesson: Lesson & { lesson_resources: LessonResource[] };
  onChanged: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState(lesson.title);
  const [position, setPosition] = useState(lesson.position.toString());
  const [videoUrl, setVideoUrl] = useState(lesson.video_url ?? '');
  const [contentMd, setContentMd] = useState(lesson.content_md ?? '');
  const [durationSeconds, setDurationSeconds] = useState(lesson.duration_seconds?.toString() ?? '');
  const [isPreview, setIsPreview] = useState(lesson.is_preview);
  const [saving, setSaving] = useState(false);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [addingResource, setAddingResource] = useState(false);

  async function handleSave() {
    setSaving(true);
    await jsonFetch(`/api/courses/lessons/${lesson.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        position: parseInt(position || '1', 10),
        videoUrl: videoUrl || null,
        contentMd: contentMd || null,
        durationSeconds: durationSeconds === '' ? null : parseInt(durationSeconds, 10),
        isPreview,
      }),
    });
    setSaving(false);
    onChanged();
  }

  async function handleDelete() {
    if (!confirm(`Delete lesson "${lesson.title}"?`)) return;
    await fetch(`/api/courses/lessons/${lesson.id}`, { method: 'DELETE' });
    onChanged();
  }

  async function handleAddResource(e: React.FormEvent) {
    e.preventDefault();
    setAddingResource(true);
    const res = await jsonFetch(`/api/courses/lessons/${lesson.id}/resources`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: resourceTitle, url: resourceUrl }),
    });
    setAddingResource(false);
    if (res.ok) {
      setResourceTitle('');
      setResourceUrl('');
      onChanged();
    }
  }

  async function handleDeleteResource(id: string) {
    await fetch(`/api/courses/resources/${id}`, { method: 'DELETE' });
    onChanged();
  }

  return (
    <div className="rounded-xl bg-ink-50 p-3">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between text-left text-sm font-medium text-ink-900"
      >
        <span>
          {lesson.position}. {lesson.title} {lesson.is_preview && <span className="badge bg-brand-50 text-brand-700 ml-1">Preview</span>}
        </span>
        <span className="text-ink-700">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 border-t border-ink-100 pt-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="label">Lesson title</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="w-20">
              <label className="label">Position</label>
              <input className="input" type="number" value={position} onChange={(e) => setPosition(e.target.value)} />
            </div>
            <div className="w-28">
              <label className="label">Duration (sec)</label>
              <input className="input" type="number" value={durationSeconds} onChange={(e) => setDurationSeconds(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Video URL (YouTube, Vimeo, or direct MP4 link)</label>
            <input className="input" placeholder="https://…" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
          </div>
          <div>
            <label className="label">Lesson notes / content</label>
            <textarea className="input" rows={3} value={contentMd} onChange={(e) => setContentMd(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" checked={isPreview} onChange={(e) => setIsPreview(e.target.checked)} />
            Free preview (visible on the public course page before purchase)
          </label>

          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving} className="btn-secondary">
              {saving ? 'Saving…' : 'Save lesson'}
            </button>
            <button onClick={handleDelete} className="btn-ghost text-red-600">
              Delete lesson
            </button>
          </div>

          <div className="border-t border-ink-100 pt-3">
            <p className="label">Additional resources</p>
            <div className="space-y-1">
              {lesson.lesson_resources?.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg bg-white px-3 py-1.5 text-sm">
                  <a href={r.url} target="_blank" rel="noreferrer" className="text-brand-700 underline">
                    {r.title}
                  </a>
                  <button onClick={() => handleDeleteResource(r.id)} className="text-xs text-red-600">
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddResource} className="mt-2 flex gap-2">
              <input
                className="input"
                placeholder="Resource title"
                value={resourceTitle}
                onChange={(e) => setResourceTitle(e.target.value)}
                required
              />
              <input
                className="input"
                placeholder="https://…"
                value={resourceUrl}
                onChange={(e) => setResourceUrl(e.target.value)}
                required
              />
              <button type="submit" disabled={addingResource} className="btn-ghost shrink-0 text-sm">
                Add
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AddModuleForm({ courseId, nextPosition, onAdded }: { courseId: string; nextPosition: number; onAdded: () => void }) {
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await jsonFetch(`/api/courses/${courseId}/modules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, position: nextPosition }),
    });
    setSaving(false);
    if (res.ok) {
      setTitle('');
      onAdded();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
      <input
        className="input"
        placeholder={`Module ${nextPosition} title`}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <button type="submit" disabled={saving} className="btn-primary shrink-0">
        {saving ? 'Adding…' : '+ Add module'}
      </button>
    </form>
  );
}

function AddLessonForm({
  moduleId,
  nextPosition,
  onAdded,
  onCancel,
}: {
  moduleId: string;
  nextPosition: number;
  onAdded: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await jsonFetch(`/api/courses/modules/${moduleId}/lessons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, position: nextPosition }),
    });
    setSaving(false);
    if (res.ok) onAdded();
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        className="input"
        placeholder={`Lesson ${nextPosition} title`}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <button type="submit" disabled={saving} className="btn-secondary shrink-0">
        {saving ? 'Adding…' : 'Add'}
      </button>
      <button type="button" onClick={onCancel} className="btn-ghost shrink-0">
        Cancel
      </button>
    </form>
  );
}
