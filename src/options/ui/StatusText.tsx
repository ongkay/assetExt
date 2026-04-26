type StatusTextProps = {
  status: string;
};

export function StatusText({ status }: StatusTextProps) {
  if (!status) {
    return null;
  }

  return (
    <p className="mt-3 text-xs text-gray-400" role="status">
      {status}
    </p>
  );
}
