import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getMonth, getYear, addMonths, subMonths, getDate, isSameMonth, getDay, startOfWeek } from 'date-fns';
import { useSettings } from '@/hooks/use-settings';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

// Type matching the backend response
type HeatmapDataPoint = {
  date: string; // YYYY-MM-DD
  count: number;
  testNames: string[];
};

// --- MonthGrid Sub-component ---
interface MonthGridProps {
  monthDate: Date;
  heatmapData: Map<string, HeatmapDataPoint>;
  getBackgroundColor: (count: number) => string;
}

const MonthGrid: React.FC<MonthGridProps> = ({ monthDate, heatmapData, getBackgroundColor }) => {
  const daysInMonth = useMemo(() => {
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    return eachDayOfInterval({ start, end });
  }, [monthDate]);

  // Calculate the day of the week for the first day (0=Sun, 1=Mon, ...)
  // Adjust based on desired start of week (e.g., Monday = 1)
  const firstDayOfMonthWeekday = getDay(startOfMonth(monthDate));
  // Assuming week starts on Sunday (getDay default)
  const emptyStartCells = firstDayOfMonthWeekday;

  return (
    <div className="flex flex-col items-center">
      {/* Month Label - Corrected Format */}
      <div className="text-xs font-medium mb-1">
        {format(monthDate, 'MMM yyyy')}
      </div>
      {/* Grid for the month */}
      <div className="grid grid-cols-7 gap-1">
        {/* Placeholder divs for days before the start of the month */}
        {Array.from({ length: emptyStartCells }).map((_, i) => (
          <div key={`empty-start-${i}`} className="h-3 w-3 rounded-sm bg-transparent" /> // Anki-style square size
        ))}
        {/* Day squares */}
        {daysInMonth.map((day) => {
          const dateString = format(day, 'yyyy-MM-dd');
          const dataPoint = heatmapData.get(dateString);
          const count = dataPoint?.count || 0;
          const testNames = dataPoint?.testNames || [];

          return (
            <Tooltip key={dateString} delayDuration={100}>
              <TooltipTrigger asChild>
                <div
                  className="h-3 w-3 rounded-sm border border-black/10 dark:border-white/10" // Anki-style square size & border
                  style={{ backgroundColor: getBackgroundColor(count) }}
                ></div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-semibold">{format(day, 'PPP')}</p>
                <p>Attempts: {count}</p>
                {testNames.length > 0 && (
                  <div>
                    <p className="mt-1 font-medium">Tests:</p>
                    <ul className="list-disc list-inside text-sm">
                      {testNames.map((name, index) => (
                        <li key={index}>{name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};
// --- End MonthGrid Sub-component ---


// --- Main AttemptHeatmap Component ---
const AttemptHeatmap: React.FC = () => {
  const [viewDate, setViewDate] = useState(new Date()); // Represents the *center* month of the 3 visible months
  const [heatmapData, setHeatmapData] = useState<Map<string, HeatmapDataPoint>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const { settings } = useSettings();
  const numberOfMonthsToShow = 3; // Show exactly 3 months

  // Calculate the 3 months to display based on the central viewDate
  const monthRange = useMemo(() => {
    return [
      subMonths(viewDate, 1), // Month before center
      viewDate,              // Center month
      addMonths(viewDate, 1)  // Month after center
    ];
  }, [viewDate]);

  // Fetch heatmap data for the 3 visible months
  const fetchVisibleHeatmapData = useCallback(async () => {
    setIsLoading(true);
    const combinedData = new Map<string, HeatmapDataPoint>();
    try {
      const fetchPromises = monthRange.map(async (monthDate) => {
        const year = getYear(monthDate);
        const month = getMonth(monthDate) + 1;
        const response = await fetch(`/api/heatmap?year=${year}&month=${month}`);
        if (!response.ok) {
          console.error(`Heatmap fetch failed for ${year}-${month}: ${response.status}`);
          return []; // Return empty array on error for this month
        }
        return response.json() as Promise<HeatmapDataPoint[]>;
      });

      const results = await Promise.all(fetchPromises);
      results.flat().forEach(item => {
        combinedData.set(item.date, item);
      });
      setHeatmapData(combinedData);

    } catch (error) {
      console.error("Error fetching heatmap data:", error);
      setHeatmapData(new Map()); // Clear data on error
    } finally {
      setIsLoading(false);
    }
  }, [monthRange]); // Depend on the calculated monthRange

  useEffect(() => {
    fetchVisibleHeatmapData();
  }, [fetchVisibleHeatmapData]); // Use the memoized fetch function

  // Calculate color intensity based on count and theme accent color
  const getBackgroundColor = useCallback((count: number): string => {
    if (count === 0) return 'hsl(var(--muted) / 0.5)'; // Use semi-transparent muted for empty days

    // Map color names to HSL strings (replicating logic from use-settings)
    const colorMap: Record<string, string> = {
      "blue": "211 100% 50%",
      "purple": "270 80% 50%",
      "green": "142 70% 45%",
      "amber": "45 97% 50%",
      "red": "0 84% 60%"
    };

    // Get the HSL string based on the primaryColor name from settings
    const primaryColorName = settings.primaryColor || 'blue'; // Default to blue
    const primaryColorHSL = colorMap[primaryColorName] || colorMap['blue']; // Fallback to blue HSL

    const match = primaryColorHSL.match(/(\d+(\.\d+)?)\s+(\d+(\.\d+)?)%\s+(\d+(\.\d+)?)%/);
    if (!match) {
      console.warn("Could not parse primary color HSL string:", primaryColorHSL);
      // Fallback using CSS variable directly (might not have intensity)
      return `hsl(var(--primary))`;
    }

    const h = parseFloat(match[1]);
    const s = parseFloat(match[3]);
    // Adjust lightness for intensity - make it lighter for more attempts (like Anki)
    const maxCount = 10; // Example cap for scaling intensity
    const intensity = Math.min(count / maxCount, 1); // Normalize count (0 to 1)
    // Start from a base lightness (e.g., 90%) and decrease towards the primary color's lightness
    const baseLightness = 90;
    const targetLightness = parseFloat(match[5]); // The theme's actual primary lightness
    const l = baseLightness - intensity * (baseLightness - targetLightness); // Interpolate lightness

    // Ensure saturation doesn't drop too low for light colors
    const finalS = Math.max(s, 30); // Keep saturation at least 30%

    return `hsl(${h}, ${finalS}%, ${l}%)`;
  }, [settings.primaryColor]); // Depend on the primaryColor name

  // Navigate view by one month
  const handlePrevMonth = () => {
    setViewDate(subMonths(viewDate, 1));
  };

  const handleNextMonth = () => {
    // Optional: Add logic to prevent going too far into the future if desired
    setViewDate(addMonths(viewDate, 1));
  };

  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // Assuming Sunday start

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-card text-card-foreground mb-6">
      <div className="flex justify-between items-center mb-2">
        {/* Header Navigation - Controls the central month (viewDate) */}
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth} aria-label="Previous month">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="font-medium text-center text-sm w-32"> {/* Wider span for full month name */}
            {format(viewDate, 'MMMM yyyy')} {/* Show central month */}
          </span>
          <Button variant="ghost" size="icon" onClick={handleNextMonth} aria-label="Next month">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center p-6 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading heatmap...
        </div>
      ) : (
        <TooltipProvider>
          {/* Container for Weekday labels and Month Grids - Removed overflow-x-auto */}
          <div className="flex space-x-3 pb-2 justify-center"> {/* Added justify-center */}
            {/* Weekday Labels */}
            <div className="flex flex-col space-y-1 pt-5"> {/* pt-5 to align with month labels */}
              {weekdays.map((day, i) => (
                <div key={i} className="h-3 w-3 flex items-center justify-center text-xs text-muted-foreground">{/* Match square size */}
                  {/* Show only M, W, F for less clutter */}
                  {(i === 1 || i === 3 || i === 5) ? day : ''}
                </div>
              ))}
            </div>
            {/* Render Month Grids */}
            {monthRange.map((monthDate) => (
              <MonthGrid
                key={format(monthDate, 'yyyy-MM')}
                monthDate={monthDate}
                heatmapData={heatmapData}
                getBackgroundColor={getBackgroundColor}
              />
            ))}
          </div>
        </TooltipProvider>
      )}
    </div>
  );
};

export default AttemptHeatmap;