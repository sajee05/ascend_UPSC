import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/use-settings";
import { motion } from "framer-motion";
import { Copy, ExternalLink } from "lucide-react";

export function FormatInfo() {
  const { toast } = useToast();
  const { settings } = useSettings();
  
  const parsingPrompt = `I have a PDF/document of an UPSC mock test. Please convert it into the following format:

#QuestionStart
[Question number]) [Full question text]
a) [Option A text]
b) [Option B text]
c) [Option C text]
d) [Option D text]
#QuestionEnd
#AnswerStart
Answer: [correct option letter]) [Correct option text]
#AnswerEnd

Make sure to preserve tables, formatting, and special characters. Ensure each question follows this exact format with the tags. Process all questions in the document.`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(parsingPrompt);
    toast({
      title: "Copied to clipboard",
      description: "The parsing prompt has been copied to your clipboard",
    });
  };
  
  const openGeminiChat = () => {
    window.open("https://aistudio.google.com/prompts/new_chat", "_blank");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-3">Expected File Format</h3>
          <div className="bg-card rounded-lg p-4 overflow-x-auto text-sm font-mono border border-border">
            <pre className="whitespace-pre-line text-foreground opacity-80">
              #QuestionStart
              Q1) [Question text here]
              a) Option A text
              b) Option B text
              c) Option C text
              d) Option D text
              #QuestionEnd
              #AnswerStart
              Answer: a) Option A text
              #AnswerEnd
            </pre>
          </div>
          <p className="text-sm text-muted-foreground mt-3 mb-4">
            Files must follow this exact tag structure. Each question must have 4 options (a-d).
          </p>
          
          <div className="border-t pt-4 mt-2">
            <p className="text-sm font-medium mb-3">
              To parse test files, copy this prompt and paste it with your test's PDF/text to Gemini:
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button 
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleCopyPrompt}
              >
                <Copy size={16} />
                <span>Copy parsing prompt</span>
              </Button>
              <Button 
                variant="default"
                className="flex-1 gap-2"
                onClick={openGeminiChat}
              >
                <ExternalLink size={16} />
                <span>Open Gemini Chat</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
