import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

import { useQuery } from "@tanstack/react-query";
import { trpcClient } from "@/utils/trpc";
import { TimeRange } from "./TimeRangeSelector";
interface HourlyFocusChartProps {
  timeRange: TimeRange;
}
export default function HourlyFocusChart({ timeRange }: HourlyFocusChartProps) {
  const { data: hourlyData, isLoading } = useQuery({
    queryKey: ["activityWindow"],
    queryFn: async () => {
      const data = await trpcClient.dashboard.getFocusedTimeByHour.query({
        startDate: timeRange.start.getTime(),
        endDate: timeRange.end.getTime(),
      });
      return data;
    },
    refetchInterval: 10000,
  });

  type FormatedData = {
    hour: string;
    focusedTime: number;
    activities: {
      title: string;
      ownerName: string;
      duration: number;
    }[];
  };

  const formattedData: FormatedData[] =
    hourlyData?.map((item) => ({
      hour: `${item.hour}:00`,
      focusedTime: Math.round(item.totalFocusedTime / (1000 * 60)), // Convert to minutes
      activities: item.activities,
    })) ?? [];

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Hourly Focus Time</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[300px] items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-sm text-muted-foreground">Loading chart data...</p>
            </div>
          </div>
        ) : (
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={formattedData}>
                <XAxis
                  dataKey="hour"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}m`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data: FormatedData = payload[0].payload;
                      return (
                        <div
                          className="max-h-[400px] overflow-auto rounded-lg border bg-background p-4 shadow-sm"
                          style={{ minWidth: "300px" }}
                        >
                          <div className="grid gap-2">
                            <div className="sticky top-0 flex items-center justify-between gap-2 border-b bg-background py-2">
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Time
                                </span>
                                <span className="font-bold">{data.hour}</span>
                              </div>
                              <div className="flex flex-col items-end">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Total Focus
                                </span>
                                <span className="font-bold">{data.focusedTime}m</span>
                              </div>
                            </div>
                            {data.activities && data.activities.length > 0 && (
                              <div>
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  Activities
                                </span>
                                <div className="mt-2 space-y-3">
                                  {data.activities.map((activity, i) => (
                                    <div key={i} className="flex flex-row justify-between gap-1">
                                      <div className="line-clamp-2 text-sm font-medium">
                                        {activity.title}
                                      </div>
                                      <div className="flex items-center justify-between gap-1 text-xs text-muted-foreground">
                                        <span className="max-w-[180px] truncate">
                                          {activity.ownerName}
                                        </span>
                                        <span className="font-medium">
                                          {Math.round(activity.duration / (1000 * 60))}m
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="focusedTime"
                  fill="currentColor"
                  radius={[4, 4, 0, 0]}
                  className="fill-primary"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
