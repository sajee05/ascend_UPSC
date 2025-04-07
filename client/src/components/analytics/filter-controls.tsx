import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";

export interface AnalyticsFilter {
  dateRange: string;
  subjects: string[];
  tags: string[];
  confidenceLevel: string | null;
  knowledgeFlag: boolean | null;
  techniqueFlag: boolean | null;
  guessworkFlag: boolean | null;
}

// Interface for grouped tags
interface SubjectTagGroup {
  subject: string;
  tags: string[];
}

// Helper function to extract subject from tag
function extractSubjectFromTag(tag: string): string {
  // Handle tags like "Economics: BANKING"
  if (tag.includes(":")) {
    return tag.split(":")[0].trim();
  }
  
  // Handle tags in older format
  const knownSubjects = [
    "Economics", 
    "Ancient History", 
    "Medieval History", 
    "Modern History",
    "Polity", 
    "Geography", 
    "Environment", 
    "Science and Technology",
    "CSAT"
  ];
  
  for (const subject of knownSubjects) {
    if (tag.startsWith(subject)) {
      return subject;
    }
  }
  
  return "Other";
}

interface FilterControlsProps {
  availableSubjects: string[];
  availableTags: string[];
  onFilterChange: (filters: AnalyticsFilter) => void;
}

export function FilterControls({ 
  availableSubjects, 
  availableTags, 
  onFilterChange 
}: FilterControlsProps) {
  const [filters, setFilters] = useState<AnalyticsFilter>({
    dateRange: "all",
    subjects: [],
    tags: [],
    confidenceLevel: null,
    knowledgeFlag: null,
    techniqueFlag: null,
    guessworkFlag: null,
  });

  const [showMoreFilters, setShowMoreFilters] = useState(false);
  
  // Group tags by subject for better organization in the UI
  const groupedTags = useMemo(() => {
    const groups: Record<string, string[]> = {};
    
    availableTags.forEach(tag => {
      const subject = extractSubjectFromTag(tag);
      if (!groups[subject]) {
        groups[subject] = [];
      }
      groups[subject].push(tag);
    });
    
    // Convert to array structure for rendering
    return Object.entries(groups).map(([subject, tags]) => ({
      subject,
      tags
    }));
  }, [availableTags]);

  const handleFilterChange = <K extends keyof AnalyticsFilter>(key: K, value: AnalyticsFilter[K]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSubjectChange = (value: string) => {
    if (value === "all") {
      handleFilterChange("subjects", []);
    } else {
      handleFilterChange("subjects", [value]);
    }
  };

  const handleTagChange = (value: string) => {
    if (value === "all") {
      handleFilterChange("tags", []);
    } else {
      handleFilterChange("tags", [value]);
    }
  };

  const handleApplyFilters = () => {
    onFilterChange(filters);
  };

  const handleResetFilters = () => {
    const resetFilters: AnalyticsFilter = {
      dateRange: "all",
      subjects: [],
      tags: [],
      confidenceLevel: null,
      knowledgeFlag: null,
      techniqueFlag: null,
      guessworkFlag: null,
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="mb-8"
    >
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="block text-sm font-medium mb-1">Date Range</Label>
              <Select 
                value={filters.dateRange} 
                onValueChange={(value) => handleFilterChange("dateRange", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="30days">Last 30 days</SelectItem>
                  <SelectItem value="3months">Last 3 months</SelectItem>
                  <SelectItem value="6months">Last 6 months</SelectItem>
                  <SelectItem value="1year">Last year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="block text-sm font-medium mb-1">Subjects</Label>
              <Select 
                value={filters.subjects[0] || "all"} 
                onValueChange={handleSubjectChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Subjects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {availableSubjects.map(subject => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="block text-sm font-medium mb-1">Tags</Label>
              <Select 
                value={filters.tags[0] || "all"} 
                onValueChange={handleTagChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  
                  {groupedTags.map(group => (
                    <SelectGroup key={group.subject}>
                      <SelectLabel>{group.subject}</SelectLabel>
                      {group.tags.map(tag => (
                        <SelectItem 
                          key={tag} 
                          value={tag}
                          className="pl-6" // Add extra padding for nested items
                        >
                          {tag.includes(':') 
                            ? tag.split(':')[1].trim() 
                            : tag.replace(group.subject, '').trim()}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {showMoreFilters && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4"
            >
              <div>
                <Label className="block text-sm font-medium mb-1">Confidence</Label>
                <Select 
                  value={filters.confidenceLevel || "all"} 
                  onValueChange={(value) => handleFilterChange("confidenceLevel", value === "all" ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any Confidence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Confidence</SelectItem>
                    <SelectItem value="high">High Confidence</SelectItem>
                    <SelectItem value="mid">Medium Confidence</SelectItem>
                    <SelectItem value="low">Low Confidence</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="block text-sm font-medium mb-2">Knowledge</Label>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={filters.knowledgeFlag === true}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleFilterChange("knowledgeFlag", true);
                      } else if (filters.knowledgeFlag === true) {
                        handleFilterChange("knowledgeFlag", null);
                      } else {
                        handleFilterChange("knowledgeFlag", false);
                      }
                    }}
                  />
                  <span className="text-sm">
                    {filters.knowledgeFlag === null ? "Any" : filters.knowledgeFlag ? "Yes" : "No"}
                  </span>
                </div>
              </div>

              <div>
                <Label className="block text-sm font-medium mb-2">Technique</Label>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={filters.techniqueFlag === true}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleFilterChange("techniqueFlag", true);
                      } else if (filters.techniqueFlag === true) {
                        handleFilterChange("techniqueFlag", null);
                      } else {
                        handleFilterChange("techniqueFlag", false);
                      }
                    }}
                  />
                  <span className="text-sm">
                    {filters.techniqueFlag === null ? "Any" : filters.techniqueFlag ? "Yes" : "No"}
                  </span>
                </div>
              </div>

              <div>
                <Label className="block text-sm font-medium mb-2">Guesswork</Label>
                <div className="flex items-center space-x-2">
                  <Switch 
                    checked={filters.guessworkFlag === true}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleFilterChange("guessworkFlag", true);
                      } else if (filters.guessworkFlag === true) {
                        handleFilterChange("guessworkFlag", null);
                      } else {
                        handleFilterChange("guessworkFlag", false);
                      }
                    }}
                  />
                  <span className="text-sm">
                    {filters.guessworkFlag === null ? "Any" : filters.guessworkFlag ? "Yes" : "No"}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          <div className="mt-4 flex flex-wrap justify-between items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowMoreFilters(!showMoreFilters)}
            >
              {showMoreFilters ? "Hide Advanced Filters" : "Show Advanced Filters"}
            </Button>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleResetFilters}
              >
                Reset
              </Button>
              <Button 
                size="sm" 
                onClick={handleApplyFilters}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
