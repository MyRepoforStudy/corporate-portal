"use client";

import { useEffect, useState } from "react";
import type { OnboardingTask } from "@prisma/client";
import { ONBOARDING_STAGES } from "@/lib/compass/mock-data";
import { WelcomeHero } from "@/components/compass/welcome-hero";
import { TodayTasks } from "@/components/compass/today-tasks";
import type { Dictionary, Locale } from "@/lib/i18n";

const STAGE_TITLE_KEY_BY_ID = Object.fromEntries(ONBOARDING_STAGES.map((s) => [s.id, s.titleKey]));

export function OnboardingInteractive({
  userId,
  fullName,
  positionTitle,
  departmentName,
  hireDate,
  photoUrl,
  tasks,
  locale,
  dict,
  common,
}: {
  userId: string;
  fullName: string;
  positionTitle: string;
  departmentName: string;
  hireDate: Date | null;
  photoUrl: string | null;
  tasks: OnboardingTask[];
  locale: Locale;
  dict: Dictionary["compass"];
  common: Dictionary["common"];
}) {
  const storageKey = `compass-tasks-${userId}`;
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setCompleted(JSON.parse(raw));
    } catch {
      // storage unavailable (private mode, blocked site data, etc.)
    }
  }, [storageKey]);

  function toggleTask(id: string) {
    setCompleted((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // keep in-memory only if storage is unavailable
      }
      return next;
    });
  }

  const visibleTasks = tasks.map((task) => {
    const titleKey = STAGE_TITLE_KEY_BY_ID[task.stageId];
    return {
      id: task.id,
      title: task.title,
      completed: !!completed[task.id],
      stageLabel: titleKey ? dict.stages[titleKey] : task.stageId,
    };
  });

  const doneCount = tasks.filter((task) => completed[task.id]).length;
  const progressPercent = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  return (
    <>
      <WelcomeHero
        fullName={fullName}
        positionTitle={positionTitle}
        departmentName={departmentName}
        hireDate={hireDate}
        photoUrl={photoUrl}
        progressPercent={progressPercent}
        locale={locale}
        title={dict.title}
        subtitle={dict.subtitle}
        hireDateLabel={dict.hireDateLabel}
        progressLabel={dict.heroProgressLabel}
        openPhotoLabel={common.openPhoto}
        closePhotoLabel={common.close}
      />
      <TodayTasks
        tasks={visibleTasks}
        onToggle={toggleTask}
        title={dict.todayTasksTitle}
        emptyText={dict.tasksEmpty}
      />
    </>
  );
}
