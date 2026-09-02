"use client";

import { useState } from "react";
import { RoleGuard } from "@/components/platform/RoleGuard";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { PBadgePill, PButton, PCard, PEmptyState, PSectionTitle } from "@/components/platform/ui";
import { usePlatform } from "@/platform/store";
import type { TeacherUser } from "@/platform/types";

function AnnouncementsView() {
  const { state, postAnnouncement, replyDoubt, currentUser } = usePlatform();
  const teacher = currentUser as TeacherUser;
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [classNum, setClassNum] = useState(teacher.classesHandled[0] ?? 6);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const myAnnouncements = state.announcements
    .filter((a) => a.authorId === teacher.id)
    .sort((a, b) => +new Date(b.createdISO) - +new Date(a.createdISO));

  const myDoubts = state.doubts
    .filter((d) => d.teacherId === teacher.id)
    .sort((a, b) => +new Date(b.createdISO) - +new Date(a.createdISO));

  const post = () => {
    if (!title.trim() || !body.trim()) return;
    postAnnouncement({
      schoolId: teacher.schoolId,
      authorId: teacher.id,
      authorName: teacher.name,
      audience: "class",
      classNum,
      section: "A",
      title: title.trim(),
      body: body.trim(),
    });
    setTitle("");
    setBody("");
  };

  return (
    <div>
      <PSectionTitle title="Announcements" subtitle="Post updates to your class and answer student questions." />

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <PCard className="mb-6 flex flex-col gap-3">
            <p className="font-extrabold text-[var(--p-ink)]">Post to Class</p>
            <select value={classNum} onChange={(e) => setClassNum(Number(e.target.value))} className="p-input">
              {teacher.classesHandled.map((c) => (
                <option key={c} value={c}>
                  Class {c}A
                </option>
              ))}
            </select>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="p-input" />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message" rows={3} className="p-input" />
            <PButton onClick={post} disabled={!title.trim() || !body.trim()} className="self-start">
              Post Announcement
            </PButton>
          </PCard>

          <div className="flex flex-col gap-3">
            {myAnnouncements.map((a) => (
              <PCard key={a.id}>
                <p className="font-bold text-[var(--p-ink)]">{a.title}</p>
                <p className="mt-1 text-sm text-[var(--p-ink-soft)]">{a.body}</p>
                <p className="mt-2 text-xs text-[var(--p-muted)]">
                  Class {a.classNum}
                  {a.section} · {new Date(a.createdISO).toLocaleDateString()}
                </p>
              </PCard>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-4 font-extrabold text-[var(--p-ink)]">Student Questions</p>
          <div className="flex flex-col gap-3">
            {myDoubts.length === 0 && <PEmptyState emoji="💬" title="No questions yet" />}
            {myDoubts.map((d) => {
              const student = state.students.find((s) => s.id === d.studentId);
              return (
                <PCard key={d.id}>
                  <div className="flex items-center gap-2">
                    <span>{student?.avatarEmoji}</span>
                    <p className="text-sm font-bold text-[var(--p-ink)]">{student?.name}</p>
                    <PBadgePill tone="muted">{d.subject}</PBadgePill>
                  </div>
                  <p className="mt-2 text-sm text-[var(--p-ink-soft)]">{d.message}</p>
                  {d.reply ? (
                    <p className="mt-3 rounded-xl bg-[var(--p-success-soft)] p-2 text-sm text-[#166534]">
                      Your reply: {d.reply}
                    </p>
                  ) : (
                    <div className="mt-3 flex gap-2">
                      <input
                        value={replyDrafts[d.id] ?? ""}
                        onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [d.id]: e.target.value }))}
                        placeholder="Type a reply…"
                        className="p-input"
                      />
                      <PButton
                        size="sm"
                        onClick={() => {
                          if (!replyDrafts[d.id]?.trim()) return;
                          replyDoubt(d.id, replyDrafts[d.id].trim());
                        }}
                      >
                        Reply
                      </PButton>
                    </div>
                  )}
                </PCard>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TeacherAnnouncementsPage() {
  return (
    <RoleGuard allow={["teacher"]}>
      <PlatformShell>
        <AnnouncementsView />
      </PlatformShell>
    </RoleGuard>
  );
}
