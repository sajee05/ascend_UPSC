import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/use-settings";
import { motion } from "framer-motion";
import { Copy, ExternalLink } from "lucide-react";

export function FormatInfo() {
  const { toast } = useToast();
  const { settings } = useSettings();

  // Use the new parsing prompt from the user
  const parsingPrompt = `Your Task:** You are an expert data formatter. Your goal is to convert all questions, answers, and explanatios fom the provided input text into a specific, structured format. Adhere strictly to the rules below.

**Input:** The input text will contain one or more questions, typically with multiple-choice options, a designated correct answer, and an accompanying explanation.

**Output Format:** For *each* question found in the input, you MUST structure the output exactly as follows:

#QuestionStart
Q1) [Insert the full question text here]
[Insert option A here, e.g., a) Option text]
[Insert option B here, e.g., b) Option text]
[Insert option C here, e.g., c) Option text]
[Insert option D here, e.g., d) Option text]
[Add more options if present in the input]
#QuestionEnd
#AnswerStart
Answer: [Insert the correct answer letter and text exactly as provided in the input, e.g., a) Yadagiri fort]
#AnswerEnd

#QuestionStart
Q2) [Insert the full question text here (i) statement 1 if any, (ii) statement 2 if any]
[Insert option A here, e.g., a) Option text]
[Insert option B here, e.g., b) Option text]
[Insert option C here, e.g., c) Option text]
[Insert option D here, e.g., d) Option text]
[Add more options if present in the input]
#QuestionEnd
#AnswerStart
Answer: [Insert the correct answer letter and text exactly as provided in the input, e.g., a) Yadagiri fort]
#AnswerEnd

#QuestionStart
Q3) [Insert the full question text here
table in text blocks if any (identify from pdf)
|---------------------------------|
| abc | xyz | 
|---------------------------------|]
[Insert option A here, e.g., a) Option text]
[Insert option B here, e.g., b) Option text]
[Insert option C here, e.g., c) Option text]
[Insert option D here, e.g., d) Option text]
[Add more options if present in the input]
#QuestionEnd
#AnswerStart
Answer: [Insert the correct answer letter and text exactly as provided in the input, e.g., a) Yadagiri fort]
#AnswerEnd

#QuestionStart
Q4) [Insert the full question text here (⭐ Please Re-check)]
[Insert option A here, e.g., a) Option text]
[Insert option B here, e.g., b) Option text]
[Insert option C here, e.g., c) Option text]
[Insert option D here, e.g., d) Option text]
[Add more options if present in the input]
#QuestionEnd
#AnswerStart
Answer: [Insert the correct answer letter and text exactly as provided in the input, e.g., a) Yadagiri fort]
#AnswerEnd

*Mandatory Rules & Constraints:**

1. **Exact Formatting:** Ensure table formatting is exactly as it is above (add "|" in between the options). If there are statements in the questions, involve them just below the question without spacing, given you the output below to be used as a rigid example. Use the precise tags (`#QuestionStart`, `#QuestionEnd`, `#AnswerStart`, `#AnswerEnd`) and prefixes (`Q1)`, `Answer:`, `Explanation:`) as shown. Maintain the line breaks as demonstrated in the format structure and the example.

2. **100% Accuracy to Input:** Reproduce the question text, all options, the identified correct answer, and the explanation text *exactly* as they appear in the input provided format. Do not rephrase, summarize, or omit any part of the original content unless addressing rule #5, in which case add the correction with in a bracket along with explanation but dont modify original..

3. **Stay Within Scope:** (Remove any sources like-Laxmikant/NCERT/etc, coaching names like forum IAS/visionIAS, links mentioned)=from the explanation. Do NOT add any information, details, or context that is not explicitly present in the original input provided for that specific question.

4. **No Hallucination:** Ensure, the answer is not just "a" but "a) answer". Output Should be exactly like depicted in the example. with proper line spacing vertically. Do not invent questions, answers, options, or explanations. Stick strictly to the provided source material.

5. **Error Identification and Correction (Questions Only):**

  - Carefully review the \`Question and its respective answer\` text provided in the input for each question.
  - If you identify a clear general knowledge error, factual inaccuracy, or logical inconsistency , you MUST:
    - Place a star emoji (⭐) immediately *after* the question.
    - Immediately following the ⭐, write: "please re-check" enclosed in parentheses \`()\`. (see Q4) from above example)
  - **Important:** Apply this error correction *only* by indicating asa specified. Do *not* alter the question, options, or the indicated correct answer even if you suspect they are wrong in the source; reproduce them as given. If the source explanation itself seems factually flawed *according to common knowledge/factually/logically or inconsistency in option and its explanation*, apply the correction method by just indicating to recheck. I repeat, NEVER CHANGE ANY TEXT just indicate as described above.
6. **OCR correction:** it is possible the input provided to you maybe in jumbled or abruptly broken text format, convert it into normal paragraphs but DO NOT change the content. **Example**: *Jumbled-ocr Input*:
  The President of India is empowered to proclaim a national emergency only after receiving a
  written recommendation from the Union Cabinet.
  *nomralised*:
  The President of India is empowered to proclaim a national emergency only after receiving a written recommendation from the Union Cabinet.

7. CRITICAL! NEVER INSERT answer's explanation. just verify that correct answer and explanation given in the answer is matching internally. in the output only mention the correct option with option number i.e. a), b), c), d) and its answer in front of it. for eg: a) America


*Process all questions present in the input text according to these rules, only output the output no unnecessary text like "here is your output" + give it to me in code-block so that i can directly copy paste*.`;

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