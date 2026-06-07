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
  danger: "border-tvlink-danger-border bg-tvlink-danger-bg text-tvlink-danger [&_svg]:text-tvlink-danger",
  info: "border-tvlink-primary-border bg-tvlink-primary-soft text-tvlink-primary-hover [&_svg]:text-tvlink-primary-hover",
  success:
    "border-tvlink-success-border bg-tvlink-success-bg text-tvlink-success [&_svg]:text-tvlink-success",
  warning:
    "border-tvlink-warning-border bg-tvlink-warning-bg text-tvlink-warning [&_svg]:text-tvlink-warning",
} satisfies Record<StatusNoticeTone, string>;

export function StatusNotice({ message, title, tone = "info" }: StatusNoticeProps) {
  const Icon = statusNoticeIcons[tone];
  const styleClass = statusNoticeStyles[tone];

  return (
    <Alert
      className={`rounded-tvlink-card border px-4 py-3 backdrop-blur-sm ${styleClass}`}
      variant="default"
    >
      <Icon />
      <AlertTitle className="font-semibold text-current">{title}</AlertTitle>
      <AlertDescription className="text-current/90">{message}</AlertDescription>
    </Alert>
  );
}
