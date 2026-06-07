import { ChartLineIcon } from "lucide-react";

type LogoProps = {
  className?: string;
  id?: string;
  title?: string;
};

export function Logo({ className, id = "tvlink-logo", title = "TvLink logo" }: LogoProps) {
  return (
    <ChartLineIcon
      aria-describedby={id}
      aria-label={title}
      className={className}
      role="img"
      strokeWidth={2.25}
    />
  );
}
