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

export function StatusNotice({ message, title, tone = "info" }: StatusNoticeProps) {
  const Icon = statusNoticeIcons[tone];

  return (
    <Alert variant={tone === "danger" ? "destructive" : "default"}>
      <Icon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
