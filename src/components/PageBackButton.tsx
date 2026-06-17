import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageBackButtonProps {
  to: string;
  label?: string;
  className?: string;
}

export function PageBackButton({ to, label = "Back", className }: PageBackButtonProps) {
  return (
    <Button variant="ghost" size="sm" className={className ?? "-ml-2 mb-2 w-fit"} asChild>
      <Link to={to}>
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        {label}
      </Link>
    </Button>
  );
}
