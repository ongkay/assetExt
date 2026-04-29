import { AlertCircleIcon, CheckCircle2Icon, InfoIcon, TriangleAlertIcon } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type StatusNoticeTone = "danger" | "info" | "success" | "warning";

type StatusNoticeProps = {
  message: string;
  title: string;
  tone?: StatusNoticeTone;
};

const statusNoticeIcons = {
  danger: AlertCircleIcon,
  info: InfoIcon,
  success: CheckCircle2Icon,
  warning: TriangleAlertIcon,
} satisfies Record<StatusNoticeTone, typeof InfoIcon>;

const statusNoticeStyles = {
  danger:
    "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 [&_svg]:text-red-600 dark:[&_svg]:text-red-400",
  info: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 [&_svg]:text-blue-600 dark:[&_svg]:text-blue-400",
  success:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 [&_svg]:text-emerald-600 dark:[&_svg]:text-emerald-400",
  warning:
    "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 [&_svg]:text-amber-600 dark:[&_svg]:text-amber-400",
} satisfies Record<StatusNoticeTone, string>;

export function StatusNotice({ message, title, tone = "info" }: StatusNoticeProps) {
  const Icon = statusNoticeIcons[tone];
  const styleClass = statusNoticeStyles[tone];

  return (
    <Alert
      variant="default"
      className={`backdrop-blur-md transition-all duration-300 hover:shadow-sm ${styleClass}`}
    >
      <Icon />
      <AlertTitle className="font-semibold">{title}</AlertTitle>
      <AlertDescription className="opacity-90">{message}</AlertDescription>
    </Alert>
  );
}
