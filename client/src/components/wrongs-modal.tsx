import React, { useState, useEffect } from 'react'; // Added useEffect
import { useUIState } from '@/hooks/use-ui-state';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios'; // Import axios for fetching
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Import Select components
import { toast } from '@/hooks/use-toast';
import { AlertCircle, Loader2, Lightbulb, ClipboardX } from 'lucide-react'; // Added Lightbulb & ClipboardX
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSettings } from '@/hooks/use-settings'; // Import useSettings
import { getQuestionExplanation } from '@/lib/gemini'; // Import explanation function
import ReactMarkdown from 'react-markdown'; // Import markdown renderer
import remarkGfm from 'remark-gfm'; // Import GFM plugin for tables
import rehypeSanitize from 'rehype-sanitize'; // Import sanitizer
import { type UserAnswerWithDetails, type Tag, type UserAnswer } from '@/../../shared/sqlite-schema'; // Import the types, add UserAnswer

export function WrongsModal() {
  const { uiState, updateUIState } = useUIState();
  const queryClient = useQueryClient(); // Get query client instance
  const [timeFilter, setTimeFilter] = useState('all time');
  const [tagFilter, setTagFilter] = useState('');
  const [filterType, setFilterType] = useState<'Wrongs' | 'No knowledge' | 'Tukke' | 'Low confidence' | 'Medium confidence'>('Wrongs'); // Add state for new filter
  const [editingNoteAnswerId, setEditingNoteAnswerId] = useState<number | null>(null);
  const [currentNoteText, setCurrentNoteText] = useState('');
  const [explanations, setExplanations] = useState<Record<number, { explanation: string | null; isLoading: boolean; error: string | null }>>({}); // State for explanations
  const { settings } = useSettings();
  const { data: allTags, isLoading: isLoadingTags } = useQuery<string[]>({ // Fetch all available tags
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await axios.get<string[]>('/api/tags');
      return response.data;
    },
    enabled: uiState.wrongsModalOpen, // Only fetch when modal is open
  });

  // Fetching function - Use correct QueryFunctionContext type and include filterType
  // Explicitly type the context parameter to match the queryKey structure
  const fetchWrongs = async (context: import('@tanstack/react-query').QueryFunctionContext<['wrongs', string, string, string]>) => {
    const [_key, time, tag, type] = context.queryKey; // Destructure from readonly key, add type
    console.log('[fetchWrongs] Fetching with filterType:', type); // Log the type used by the query
    const params = new URLSearchParams();
    if (time && time !== 'all time') params.append('timeFilter', time);
    if (tag) params.append('tagFilter', tag);
    // Always include filterType, even if it's the default 'Wrongs'
    params.append('filterType', type || 'Wrongs');

    // Assuming API directly returns the array based on route definition
    const directResponse = await axios.get<UserAnswerWithDetails[]>(`/api/wrongs?${params.toString()}`);
    return directResponse.data;
  };

  // Log state right before useQuery to check its value when the hook runs/re-runs
  console.log('[WrongsModal] filterType state before useQuery:', filterType);

  // useQuery hook - include filterType in queryKey
  const { data: wrongsData, isLoading, isError, error } = useQuery<UserAnswerWithDetails[], Error>({
    queryKey: ['wrongs', timeFilter, tagFilter, filterType], // Add filterType to queryKey
    queryFn: fetchWrongs,
    enabled: uiState.wrongsModalOpen,
    // Keep data fresh but don't refetch automatically on window focus etc. while modal is open
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Fetch when modal opens
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
  });

  // Effect to manually refetch when filters change
  useEffect(() => {
    // Only refetch if the modal is open to avoid background fetches
    if (uiState.wrongsModalOpen) {
      console.log('[WrongsModal useEffect] Filters changed, refetching wrongs query.');
      queryClient.invalidateQueries({ queryKey: ['wrongs', timeFilter, tagFilter, filterType] });
    }
  }, [timeFilter, tagFilter, filterType, uiState.wrongsModalOpen, queryClient]); // Add dependencies

  // Mutation for adding/updating a note
  const noteMutation = useMutation({
    mutationFn: async (noteData: { userAnswerId: number; noteText: string; noteId?: number }) => {
      if (noteData.noteId) {
        // Update existing note
        await axios.patch(`/api/notes/${noteData.noteId}`, { noteText: noteData.noteText });
      } else {
        // Add new note
        await axios.post('/api/notes', { userAnswerId: noteData.userAnswerId, noteText: noteData.noteText });
      }
    },
    onSuccess: () => {
      toast({ title: "Note saved successfully!" });
      // Ensure the exact query key used in useQuery is invalidated
      queryClient.invalidateQueries({ queryKey: ['wrongs', timeFilter, tagFilter, filterType] });
      setEditingNoteAnswerId(null); // Close editing area
      setCurrentNoteText('');
    },
    onError: (error: Error) => { // Correctly place onError outside onSuccess
      toast({ title: "Error saving note", description: error.message, variant: "destructive" });
    },
  });

  // Handler for fetching AI explanation
  const handleFetchExplanation = async (answer: UserAnswerWithDetails) => {
    if (!settings.aiEnabled || !settings.aiApiKey) {
      toast({ title: "AI Disabled", description: "Please enable AI and provide an API key in settings.", variant: "destructive" });
      return;
    }
    if (explanations[answer.id]?.isLoading) return; // Prevent multiple requests

    setExplanations(prev => ({
      ...prev,
      [answer.id]: { explanation: null, isLoading: true, error: null }
    }));

    try {
      // Extract only the properties matching the UserAnswer type expected by getQuestionExplanation
      // Ensure all properties from UserAnswer are included, using null/defaults if not in UserAnswerWithDetails
      // Map confidence number to level string enum expected by UserAnswer type
      let confidenceLevelString: 'high' | 'mid' | 'low' | null = null;
      if (answer.confidence === 3) confidenceLevelString = 'high';
      else if (answer.confidence === 2) confidenceLevelString = 'mid';
      else if (answer.confidence === 1) confidenceLevelString = 'low';

       const userAnswerForExplanation: UserAnswer = {
         id: answer.id,
         attemptId: answer.attemptId,
         questionId: answer.questionId,
         selectedOption: answer.selectedOption,
         isCorrect: answer.isCorrect,
         isLeft: answer.isLeft,
         answerTime: answer.answerTime, // Keep original field name from backend schema if needed
         knowledgeFlag: answer.knowledgeFlag,
         techniqueFlag: answer.techniqueFlag,
         guessworkFlag: answer.guessworkFlag,
         confidence: answer.confidence, // Keep original numeric confidence if needed elsewhere
         notes: answer.notes && answer.notes.length > 0 ? JSON.stringify(answer.notes) : null, // Fix: Use null instead of undefined
         createdAt: answer.createdAt, // Keep as string if UserAnswer expects string

         // Add missing fields based on TS error to satisfy UserAnswer type
         attemptNumber: answer.attempt?.attemptNumber ?? null, // Get from nested attempt object
         answerTimeSeconds: answer.answerTime, // Map answerTime to answerTimeSeconds if needed by UserAnswer type
         confidenceLevel: confidenceLevelString, // Use the mapped string enum value
         timestamp: answer.createdAt ? new Date(answer.createdAt) : null, // Use createdAt converted to Date
       };


      const explanationText = await getQuestionExplanation(
        answer.question as any, // Cast for now, assuming getQuestionExplanation can handle or needs conversion
        userAnswerForExplanation, // Pass the correctly typed object
        settings.aiApiKey,
        settings.aiModel || 'gemini-1.0-pro', // Use default model if not set
        settings.explanationPrompt || '' // Use default prompt if not set
      );
      setExplanations(prev => ({
        ...prev,
        [answer.id]: { explanation: explanationText, isLoading: false, error: null }
      }));
    } catch (err: any) {
      console.error("Error fetching AI explanation:", err);
      setExplanations(prev => ({
        ...prev,
        [answer.id]: { explanation: null, isLoading: false, error: err.message || "Failed to get explanation" }
      }));
      toast({ title: "AI Explanation Error", description: err.message || "Could not fetch explanation.", variant: "destructive" });
    }
  }; // Add missing closing brace for handleFetchExplanation

  // Handlers for note editing
  const handleAddOrEditNoteClick = (answer: UserAnswerWithDetails) => {
    setEditingNoteAnswerId(answer.id);
    // If there's an existing note, pre-fill the textarea (assuming one note per answer for now)
    setCurrentNoteText(answer.notes?.[0]?.noteText || '');
  };

  const handleSaveNote = () => {
    if (editingNoteAnswerId === null) return;

    const answerData = Array.isArray(wrongsData) ? wrongsData.find(a => a.id === editingNoteAnswerId) : undefined; // Check if array
    if (!answerData) return;

    noteMutation.mutate({
      userAnswerId: editingNoteAnswerId,
      noteText: currentNoteText,
      noteId: answerData.notes?.[0]?.id // Pass existing note ID if updating
    });
  };

  const handleCancelEditNote = () => {
    setEditingNoteAnswerId(null);
    setCurrentNoteText('');
  };

  const handleOpenChange = (isOpen: boolean) => {
    updateUIState({ wrongsModalOpen: isOpen });
  };

  return (
    <Dialog open={uiState.wrongsModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[80%] md:max-w-[70%] lg:max-w-[60%] xl:max-w-[50%] h-[80vh] flex flex-col"> {/* Adjusted size */}
        <DialogHeader className="flex flex-row justify-between items-center pr-6"> {/* Added flex layout */}
          <div> {/* Wrap title and description */}
            <DialogTitle>Review Incorrect Questions (Wrongs)</DialogTitle>
            <DialogDescription>
              Review questions you answered incorrectly across all tests. Add notes or get AI explanations.
            </DialogDescription>
          </div>
          {/* Notes Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              updateUIState({ wrongsModalOpen: false, notesModalOpen: true }); // Switch modals
            }}
          >
            Notes
          </Button>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {/* Filters */}
          <div className="p-4 border rounded-md bg-muted/40 space-y-3">
            <div className="flex space-x-4 items-center">
              <p className="text-sm font-medium">Time:</p>
              <Button size="sm" variant={timeFilter === 'this week' ? 'default' : 'outline'} onClick={() => setTimeFilter('this week')}>This Week</Button>
              <Button size="sm" variant={timeFilter === 'this month' ? 'default' : 'outline'} onClick={() => setTimeFilter('this month')}>This Month</Button>
              <Button size="sm" variant={timeFilter === 'all time' ? 'default' : 'outline'} onClick={() => setTimeFilter('all time')}>All Time</Button>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
               <p className="text-sm font-medium mr-2">Tags:</p>
               <Button size="sm" variant={tagFilter === '' ? 'default' : 'outline'} onClick={() => setTagFilter('')}>All Tags</Button>
               {isLoadingTags && <Loader2 className="h-4 w-4 animate-spin" />}
               {!isLoadingTags && allTags?.map(tag => (
                 <Button
                   key={tag}
                   size="sm"
                   variant={tagFilter === tag ? 'default' : 'outline'}
                   onClick={() => setTagFilter(tag)}
                 >
                   {tag}
                 </Button>
               ))}
           </div>
           {/* New Filter Type Dropdown */}
           <div className="flex space-x-4 items-center">
              <p className="text-sm font-medium">Filter by:</p>
              <Select value={filterType} onValueChange={(value) => {
                  console.log('[Select onValueChange] New filterType selected:', value); // Log the selected value
                  setFilterType(value as typeof filterType);
                }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Wrongs">Wrongs</SelectItem>
                  <SelectItem value="No knowledge">No Knowledge</SelectItem>
                  <SelectItem value="Tukke">Tukke (Guess)</SelectItem>
                  <SelectItem value="Low confidence">Low Confidence</SelectItem>
                  <SelectItem value="Medium confidence">Medium Confidence</SelectItem>
                </SelectContent>
              </Select>
           </div>
         </div>

          {/* List of Wrong Questions */}
          <div className="space-y-3">
            {isLoading && (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="ml-2">Loading incorrect questions...</p>
              </div>
            )}
            {isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Wrongs</AlertTitle>
                <AlertDescription>
                  {error?.message || 'Could not fetch incorrect questions.'}
                </AlertDescription>
              </Alert>
            )}
            {!isLoading && !isError && (!Array.isArray(wrongsData) || wrongsData.length === 0) && ( // Check if array
              <p className="text-center text-muted-foreground p-4">No incorrect questions found matching the current filters.</p>
            )}
            {!isLoading && !isError && Array.isArray(wrongsData) && wrongsData.map((wrongAnswer: UserAnswerWithDetails) => ( // Check if array and type wrongAnswer
              <div key={wrongAnswer.id} className="p-3 border rounded bg-card shadow-sm">
                <div className="font-semibold text-sm prose dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{wrongAnswer.question.questionText}</ReactMarkdown>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Tags: {wrongAnswer.question.tags.map((t: Tag) => t.tagName).join(', ') || 'N/A'} | Test: {wrongAnswer.attempt.test.name} {/* Use imported Tag type */}
                </p>
                <div className="text-sm mt-2 space-y-1">
                  <p className={wrongAnswer.selectedOption === 'A' ? 'text-red-600' : ''}>A) {wrongAnswer.question.optionA}</p>
                  <p className={wrongAnswer.selectedOption === 'B' ? 'text-red-600' : ''}>B) {wrongAnswer.question.optionB}</p>
                  <p className={wrongAnswer.selectedOption === 'C' ? 'text-red-600' : ''}>C) {wrongAnswer.question.optionC}</p>
                  <p className={wrongAnswer.selectedOption === 'D' ? 'text-red-600' : ''}>D) {wrongAnswer.question.optionD}</p>
                </div>
                 <p className="text-sm mt-2">
                    Your Answer: <span className="font-medium text-red-600">{wrongAnswer.selectedOption || 'Unanswered'}</span>
                 </p>
                <p className="text-sm mt-1">
                    Correct Answer: <span className="font-medium text-green-600">{wrongAnswer.question.correctAnswer}</span>
                </p>
               {/* Notes Section */}
               <div className="mt-3 border-t pt-3">
                 <h4 className="text-xs font-semibold mb-1">Notes:</h4>
                 {editingNoteAnswerId === wrongAnswer.id ? (
                   // Editing View
                   <div className="space-y-2">
                     <Textarea
                       value={currentNoteText}
                       onChange={(e) => setCurrentNoteText(e.target.value)}
                       placeholder="Add your notes here..."
                       rows={3}
                     />
                     <div className="flex justify-end space-x-2">
                       <Button size="sm" variant="ghost" onClick={handleCancelEditNote}>Cancel</Button>
                       <Button size="sm" onClick={handleSaveNote} disabled={noteMutation.isPending}>
                         {noteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                         Save Note
                       </Button>
                     </div>
                   </div>
                 ) : (
                   // Display View
                   <div className="flex items-start justify-between">
                     <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                       {wrongAnswer.notes?.[0]?.noteText || <span className="italic">No notes added yet.</span>}
                     </p>
                     <Button size="sm" variant="outline" onClick={() => handleAddOrEditNoteClick(wrongAnswer)}>
                       {wrongAnswer.notes?.length ? 'Edit Note' : 'Add Note'}
                     </Button>
                   </div>
                 )}
               </div>
               {/* AI Explanation Section */}
               <div className="mt-3 border-t pt-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-blue-500" />
                      <h4 className="text-xs font-semibold">AI Explanation</h4>
                    </div>
                    {/* Show button only if explanation not loaded/loading */}
                    {!explanations[wrongAnswer.id]?.isLoading && !explanations[wrongAnswer.id]?.explanation && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFetchExplanation(wrongAnswer)} // Pass the specific wrongAnswer
                        disabled={!settings.aiEnabled || !settings.aiApiKey || explanations[wrongAnswer.id]?.isLoading}
                      >
                        {explanations[wrongAnswer.id]?.isLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1"/> : <Lightbulb className="h-3 w-3 mr-1" />}
                        Get Explanation
                      </Button>
                    )}
                  </div>
                  {/* Loading State */}
                  {explanations[wrongAnswer.id]?.isLoading && (
                    <div className="flex justify-center items-center p-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating...
                    </div>
                  )}
                  {/* Error State */}
                  {explanations[wrongAnswer.id]?.error && (
                    <Alert variant="destructive" className="p-2 text-xs">
                      <AlertCircle className="h-3 w-3" />
                      <AlertTitle className="text-xs">Error</AlertTitle>
                      <AlertDescription className="text-xs">
                        {explanations[wrongAnswer.id]?.error}
                      </AlertDescription>
                    </Alert>
                  )}
                  {/* Explanation Content */}
                  {explanations[wrongAnswer.id]?.explanation && (
                    <div className="prose prose-sm dark:prose-invert max-w-none p-2 border rounded bg-muted/30">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
                        {explanations[wrongAnswer.id]?.explanation ?? ''}
                      </ReactMarkdown>
                    </div>
                  )}
               </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="mt-auto">
           {/* TODO: Add Notes Button functionality */}
           <Button variant="secondary">Notes</Button>
          <Button onClick={() => handleOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}