import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

export function AnalyticsButton() {
  const [, navigate] = useLocation();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <Button
        size="lg"
        onClick={() => navigate("/overall-analytics")}
        className="rounded-full shadow-lg h-14 w-14 p-0 bg-primary hover:bg-primary/90"
      >
        <BarChart3 className="h-6 w-6" />
        <span className="sr-only">Analytics</span>
      </Button>
    </motion.div>
  );
}