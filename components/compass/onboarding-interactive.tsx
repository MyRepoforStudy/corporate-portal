"use client";

import { useEffect, useState } from "react";
import { ONBOARDING_STAGES, ONBOARDING_TASKS } from "@/lib/compass/mock-data";
import { computeStageStatuses, getActiveStageId } from "@/lib/compass/stage-status";
import { WelcomeHero } from "@/components/compass/welcome-hero";
import { OnboardingRoadmap } from "@/components/compass/onboarding-roadmap";
import { TodayTasks } from "@/components/compass/today-tasks";
import { ProgressCard } from "@/components/compass/progress-card";
import type { Dictionary, Locale } from "@/lib/i18n";

export function OnboardingInteractive({
  userId,
  fullName,
  positionTitle,
  departmentName,
  hireDate,
  photoUrl,
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
  locale: Locale;
  dict: Dictionary["compass"];
  common: Dictionary["common"];
}) {
  const storageKey = `compass-tasks-${userId}`;
  const statuses = computeStageStatuses(hireDate);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [activeStageId, setActiveStageId] = useState(() => getActiveStageId(statuses));

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) setCompleted(JSON.parse(raw));
    } catch {
      // storage unavailable (private mode, blocked site data, etc.)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const roadmapStages = ONBOARDING_STAGES.map((stage) => ({
    id: stage.id,
    title: dict.stages[stage.titleKey],
    status: statuses[stage.id],
  }));

  const visibleTasks = ONBOARDING_TASKS.filter((task) => task.stageId === activeStageId).map((task) => ({
    id: task.id,
    title: dict.tasks[task.titleKey],
    completed: !!completed[task.id],
  }));

  const doneCount = ONBOARDING_TASKS.filter((task) => completed[task.id]).length;
  const progressPercent =
    ONBOARDING_TASKS.length > 0 ? Math.round((doneCount / ONBOARDING_TASKS.length) * 100) : 0;

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
      <OnboardingRoadmap
        stages={roadmapStages}
        activeStageId={activeStageId}
        onSelect={setActiveStageId}
        title={dict.roadmapTitle}
        statusLabels={dict.stageStatusLabel}
      />
      <TodayTasks
        tasks={visibleTasks}
        onToggle={toggleTask}
        title={dict.todayTasksTitle}
        emptyText={dict.tasksEmpty}
      />
      <ProgressCard
        done={doneCount}
        total={ONBOARDING_TASKS.length}
        title={dict.progressCardTitle}
        motivation={dict.progressMotivation}
        doneOfTotalTemplate={dict.progressDoneOfTotal}
      />
    </>
  );
}
