import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  }
  
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function formatTimeHoursMinutesSeconds(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  let result = '';
  
  if (hours > 0) {
    result += `${hours}h `;
  }
  
  if (minutes > 0 || hours > 0) {
    result += `${minutes}m `;
  }
  
  result += `${remainingSeconds}s`;
  
  return result;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

export function calculateAccuracy(correct: number, incorrect: number): number {
  if (correct + incorrect === 0) return 0;
  return (correct / (correct + incorrect)) * 100;
}

export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

export function kebabToTitle(kebabCase: string): string {
  return kebabCase
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function generateFileName(baseName: string, extension: string): string {
  return `${baseName}_${new Date().toISOString().split('T')[0]}.${extension}`;
}

export function getConfidenceEmoji(level: string | null): string {
  switch (level) {
    case 'high': return '🟢';
    case 'mid': return '🟡';
    case 'low': return '🔴';
    default: return '';
  }
}

export function getYesNoEmoji(value: boolean | null): string {
  if (value === null) return '';
  return value ? '✅' : '❌';
}

export function getGSScore(correct: number, incorrect: number): number {
  return correct * 2 - incorrect * 0.66;
}

export function getCSATScore(correct: number, incorrect: number): number {
  return correct * 2.5 - incorrect * 0.83;
}

export function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export function generateCSV(data: Array<Record<string, any>>, columns: string[]): string {
  const header = columns.join(',');
  const rows = data.map(row => {
    return columns.map(column => {
      const value = row[column];
      // Wrap fields with commas or newlines in quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  return [header, ...rows].join('\n');
}

export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
