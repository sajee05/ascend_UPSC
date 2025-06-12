import React, { useState } from 'react';
import { useUIState } from '@/hooks/use-ui-state';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
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
import { toast } from '@/hooks/use-toast';
import { AlertCircle, Loader2, Download, Edit, Trash2, ClipboardX, Maximize2, Minimize2 } from 'lucide-react'; // Added ClipboardX and expand/collapse icons
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { type QuestionNote } from '@/../../shared/sqlite-schema'; // Import the type

// Define a more detailed type if needed, joining with test/tag info
interface DetailedNote extends QuestionNote {
  testName?: string;
  tagName?: string; // Assuming one primary tag for now
}

export function NotesModal() {
  const { uiState, updateUIState } = useUIState();
  const queryClient = useQueryClient();
  const [timeFilter, setTimeFilter] = useState('all time');
  const [tagFilter, setTagFilter] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [currentNoteText, setCurrentNoteText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false); // State for modal expansion
  const { data: allTags, isLoading: isLoadingTags } = useQuery<string[]>({ // Fetch tags
    queryKey: ['tags'],
    queryFn: async () => {
      const response = await axios.get<string[]>('/api/tags');
      return response.data;
    },
    enabled: uiState.notesModalOpen, // Only fetch when this modal is open
  });

  // Fetching function for all notes - Use correct QueryFunctionContext type
  const fetchNotes = async (context: import('@tanstack/react-query').QueryFunctionContext) => {
    const [_key, time, tag] = context.queryKey as readonly [string, string, string]; // Assert specific structure
    const params = new URLSearchParams();
    if (time && time !== 'all time') params.append('timeFilter', time);
    if (tag) params.append('tagFilter', tag);

    // TODO: Adjust API endpoint if it returns DetailedNote structure directly
    const response = await axios.get<DetailedNote[]>(`/api/notes?${params.toString()}`);
    return response.data;
  };

  // useQuery hook for notes
  const { data: notesData, isLoading, isError, error } = useQuery<DetailedNote[], Error>({
    queryKey: ['notes', timeFilter, tagFilter], // Query key for notes
    queryFn: fetchNotes,
    enabled: uiState.notesModalOpen, // Only fetch when this modal is open
  });

   // Mutation for updating a note (Deletion could be added later)
   const noteUpdateMutation = useMutation({
    mutationFn: async (noteData: { noteId: number; noteText: string }) => {
      await axios.patch(`/api/notes/${noteData.noteId}`, { noteText: noteData.noteText });
    },
    onSuccess: () => {
      toast({ title: "Note updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ['notes', timeFilter, tagFilter] }); // Refetch notes
      setEditingNoteId(null);
      setCurrentNoteText('');
    },
    onError: (error: any) => {
      toast({ title: "Error updating note", description: error.message, variant: "destructive" });
    },
  });

  // Handlers for note editing
  const handleEditNoteClick = (note: DetailedNote) => {
    setEditingNoteId(note.id);
    setCurrentNoteText(note.noteText);
  };

  const handleSaveNote = () => {
    if (editingNoteId === null) return;
    noteUpdateMutation.mutate({ noteId: editingNoteId, noteText: currentNoteText });
  };

  const handleCancelEditNote = () => {
    setEditingNoteId(null);
    setCurrentNoteText('');
  };

  const handleOpenChange = (isOpen: boolean) => {
    updateUIState({ notesModalOpen: isOpen });
    if (!isOpen) {
        setEditingNoteId(null); // Reset editing state on close
    }
  };

  // Handler for export
  const handleExport = async () => {
    try {
        const params = new URLSearchParams();
        if (timeFilter && timeFilter !== 'all time') params.append('timeFilter', timeFilter);
        if (tagFilter) params.append('tagFilter', tagFilter);

        const response = await axios.get(`/api/notes/export?${params.toString()}`, {
            responseType: 'blob', // Important to handle file download
        });

        // Create a link and trigger download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `ascend_upsc_notes_${timeFilter}_${tagFilter || 'all'}.md`); // Dynamic filename
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast({ title: "Export Successful", description: "Notes downloaded as Markdown." });

    } catch (err: any) {
        console.error("Export error:", err);
        toast({ title: "Export Failed", description: err.message || "Could not export notes.", variant: "destructive" });
    }
  };


  return (
    <Dialog open={uiState.notesModalOpen} onOpenChange={handleOpenChange}>
      <DialogContent className={`
        ${isExpanded
          ? "w-[95vw] max-w-[95vw] h-[95vh] max-h-[95vh]"
          : "sm:max-w-[80%] md:max-w-[70%] lg:max-w-[60%] xl:max-w-[50%] h-[80vh]"}
        flex flex-col transition-all duration-300 ease-in-out
      `}>
        <DialogHeader className="flex flex-row justify-between items-center pr-6">
           <div>
             <DialogTitle>Manage Notes</DialogTitle>
             <DialogDescription>
               View, edit, and export notes added to incorrect questions.
             </DialogDescription>
           </div>
           <div className="flex space-x-2"> {/* Wrap buttons */}
             {/* Wrongs Button */}
             <Button
               variant="outline"
               size="sm"
               onClick={() => {
                 updateUIState({ notesModalOpen: false, wrongsModalOpen: true }); // Switch modals
               }}
             >
               <ClipboardX className="h-4 w-4 mr-2" />
               Wrongs
             </Button>
             {/* Export Button */}
             <Button
               variant="outline"
               size="sm"
               onClick={handleExport}
               disabled={isLoading || !Array.isArray(notesData) || notesData.length === 0} // Check if array
             >
               <Download className="h-4 w-4 mr-2" />
               Export
             </Button>
             <Button
               variant="outline"
               size="icon"
               onClick={() => setIsExpanded(!isExpanded)}
               className="h-9 w-9" // Adjusted size to match other header buttons better
             >
               {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
               <span className="sr-only">{isExpanded ? 'Collapse' : 'Expand'}</span>
             </Button>
           </div>
        </DialogHeader>

       <div className={`flex-grow overflow-y-auto p-4 space-y-4 ${isExpanded ? 'h-[calc(95vh-200px)]' : 'h-[calc(80vh-200px)]'}`}> {/* Adjust height based on expansion, rough estimate for header/footer */}
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
          </div>

          {/* List of Notes */}
          <div className="space-y-3">
            {isLoading && (
              <div className="flex items-center justify-center p-6">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="ml-2">Loading notes...</p>
              </div>
            )}
            {isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Notes</AlertTitle>
                <AlertDescription>
                  {error?.message || 'Could not fetch notes.'}
                </AlertDescription>
              </Alert>
            )}
            {!isLoading && !isError && (!Array.isArray(notesData) || notesData.length === 0) && ( // Check if array
              <p className="text-center text-muted-foreground p-4">No notes found matching the current filters.</p>
            )}
            {!isLoading && !isError && Array.isArray(notesData) && notesData.map((note: DetailedNote) => ( // Check if array and type note
              <div key={note.id} className="p-3 border rounded bg-card shadow-sm">
                 {editingNoteId === note.id ? (
                    // Editing View
                    <div className="space-y-2">
                      <Textarea
                        value={currentNoteText}
                        onChange={(e) => setCurrentNoteText(e.target.value)}
                        rows={4}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button size="sm" variant="ghost" onClick={handleCancelEditNote}>Cancel</Button>
                        <Button size="sm" onClick={handleSaveNote} disabled={noteUpdateMutation.isPending}>
                          {noteUpdateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                          Save Changes
                        </Button>
                      </div>
                    </div>
                 ) : (
                    // Display View
                    <div>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-2">
                            {note.noteText}
                        </p>
                        <div className="flex justify-between items-center border-t pt-2 mt-2">
                            <p className="text-xs text-muted-foreground">
                                Test: {note.testName || 'N/A'} | Tag: {note.tagName || 'N/A'} | Added: {new Date(note.createdAt).toLocaleDateString()}
                            </p>
                            <div>
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEditNoteClick(note)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                {/* TODO: Add Delete Button */}
                                {/* <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-4 w-4" />
                                </Button> */}
                            </div>
                        </div>
                    </div>
                 )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="mt-auto">
          <Button onClick={() => handleOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}