import {
  ApplicationDurationReport,
  DomainDurationReport,
  TitleDurationReport,
  CategoryDurationReport,
} from "@/types/activity";
import { useState, useEffect, useMemo } from "react";
import { calculateDurationsReport } from "@/services/ReportBuilder";
import TimeBreakdown from "./components/TimeBreakDown";
import { CategoryMapper } from "@/services/CategoryMapper";
import { CategoryTreeView } from "./components/CategoryTreeView";
import { BoardReport } from "./components/BoardReport";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";

export default function DashboardPage() {
  const [durationReports, setDurationReports] = useState<{
    applications: ApplicationDurationReport[];
    domains: DomainDurationReport[];
    titles: TitleDurationReport[];
  }>({ applications: [], domains: [], titles: [] });
  const [categoryReport, setCategoryReport] = useState<CategoryDurationReport[]>([]);
  const { data: activitySettings } = useQuery({
    queryKey: ["user.getActivitySettings"],
    queryFn: async () => {
      const data = await trpcClient.user.getActivitySettings.query();
      return data;
    },
  });
  const queryClient = useQueryClient();
  const {
    data: activities,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["activityWindow"],
    queryFn: async () => {
      const activities = await trpcClient.activity.getActivities.query();
      return activities;
    },
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (!activities) {
      return;
    }
    const durationReports = calculateDurationsReport(activities);
    setDurationReports(durationReports);
  }, [activities]);

  useEffect(() => {
    if (!activities) {
      return;
    }
    const categoryMapper = new CategoryMapper();
    const categories = categoryMapper.buildCategoryTree(activities);
    setCategoryReport(categories);
  }, [activities]);

  const appUsageData = useMemo(
    () =>
      durationReports.applications.map((report) => ({
        name: report.applicationName,
        duration: Math.round(report.totalDuration / 1000), // Convert to seconds
        percentage:
          (report.totalDuration /
            durationReports.applications.reduce((sum, report) => sum + report.totalDuration, 0)) *
          100,
      })),
    [durationReports.applications]
  );
  const domainUsageData = useMemo(
    () =>
      durationReports.domains.map((report) => ({
        name: report.domain,
        duration: Math.round(report.totalDuration / 1000), // Convert to seconds
        percentage:
          (report.totalDuration /
            durationReports.domains.reduce((sum, report) => sum + report.totalDuration, 0)) *
          100,
      })),
    [durationReports.domains]
  );
  const titleUsageData = useMemo(
    () =>
      durationReports.titles.map((report) => ({
        name: report.title,
        duration: Math.round(report.totalDuration / 1000), // Convert to seconds
        percentage:
          (report.totalDuration /
            durationReports.titles.reduce((sum, report) => sum + report.totalDuration, 0)) *
          100,
      })),
    [durationReports.titles]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-tracksy-blue/5 to-tracksy-gold/5 dark:from-tracksy-blue/10 dark:to-tracksy-gold/10">
      <div className="container mx-auto p-6">
        <h1 className="mb-8 text-3xl font-bold text-tracksy-blue dark:text-white">
          Activity Dashboard
          <div className="mt-2 h-1 w-20 rounded bg-tracksy-gold dark:bg-tracksy-gold/70"></div>
        </h1>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          <BoardReport />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <TimeBreakdown
            reports={appUsageData}
            title="Application Usage"
            className="rounded-lg border border-tracksy-gold/20 bg-white/80 shadow-lg backdrop-blur-sm dark:border-tracksy-gold/10 dark:bg-gray-900/80"
          />
          <TimeBreakdown
            reports={domainUsageData}
            title="Domain Usage"
            permissionDisabled={!activitySettings?.accessibilityPermission}
            onEnablePermission={async () => {
              await trpcClient.user.updateActivitySettings.mutate({
                accessibilityPermission: true,
              });
              queryClient.invalidateQueries({ queryKey: ["user.getActivitySettings"] });
            }}
            className="rounded-lg border border-tracksy-gold/20 bg-white/80 shadow-lg backdrop-blur-sm dark:border-tracksy-gold/10 dark:bg-gray-900/80"
          />
          <TimeBreakdown
            reports={titleUsageData}
            title="Title Usage"
            permissionDisabled={!activitySettings?.screenRecordingPermission}
            onEnablePermission={async () => {
              await trpcClient.user.updateActivitySettings.mutate({
                screenRecordingPermission: true,
              });
              queryClient.invalidateQueries({ queryKey: ["user.getActivitySettings"] });
            }}
            className="rounded-lg border border-tracksy-gold/20 bg-white/80 shadow-lg backdrop-blur-sm dark:border-tracksy-gold/10 dark:bg-gray-900/80"
          />

          <div className="rounded-lg border border-tracksy-gold/20 bg-white/80 p-4 shadow-lg backdrop-blur-sm dark:border-tracksy-gold/10 dark:bg-gray-900/80">
            <CategoryTreeView categories={categoryReport} />
          </div>
        </div>
      </div>
    </div>
  );
}
