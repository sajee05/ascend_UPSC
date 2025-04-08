import { formatDate, formatTimeHoursMinutesSeconds } from "@/lib/utils";
import { CalendarIcon, ClockIcon, CheckCircle2Icon } from "lucide-react";
import { motion } from "framer-motion";
import { TestAnalytics } from "@shared/schema";

interface TestSummaryProps {
  analytics: TestAnalytics;
}

export function TestSummary({ analytics }: TestSummaryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-8"
    >
      <h2 className="text-2xl font-semibold">{analytics.title} - Attempt {analytics.attemptId}</h2>
      <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
        <div className="flex items-center">
          <CalendarIcon className="h-4 w-4 mr-2" />
          <span>{formatDate(analytics.date)}</span>
        </div>
        <div className="flex items-center">
          <ClockIcon className="h-4 w-4 mr-2" />
          <span>Total Time: {formatTimeHoursMinutesSeconds(analytics.totalTimeSeconds)}</span>
        </div>
        <div className="flex items-center">
          <CheckCircle2Icon className="h-4 w-4 mr-2 text-green-500 dark:text-green-400" />
          <span>Score: {analytics.overallStats.score ? analytics.overallStats.score.toFixed(1) : '0.0'} / {analytics.overallStats.attempts ? analytics.overallStats.attempts * 2 : 0}</span>
        </div>
      </div>
    </motion.div>
  );
}
