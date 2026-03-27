import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function BackLink() {
  return (
    <Link
      to="/issues"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <ArrowLeft className="size-4" /> Back to Issues
    </Link>
  );
}
