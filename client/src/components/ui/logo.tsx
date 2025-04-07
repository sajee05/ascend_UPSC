import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  withText?: boolean;
}

export function Logo({ className, withText = true }: LogoProps) {
  return (
    <div className={cn("flex items-center space-x-3", className)}>
      <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-r from-primary to-amber-500 rounded-xl">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="18" 
          height="18" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="text-white"
        >
          <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
          <path d="M6 12v5c3 3 9 3 12 0v-5"/>
        </svg>
      </div>
      {withText && <h1 className="font-semibold text-xl">Ascend UPSC</h1>}
    </div>
  );
}
