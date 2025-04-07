import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export function FormatInfo() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-3">Expected File Format</h3>
          <div className="bg-card rounded-lg p-4 overflow-x-auto text-sm font-mono">
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
          <p className="text-sm text-muted-foreground mt-3">
            Files must follow this exact tag structure. Each question must have 4 options (a-d).
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
