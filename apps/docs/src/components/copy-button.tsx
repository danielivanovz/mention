import { CopyControl } from "./copy-control";

export function CopyButton({ value }: { value: string }) {
  return (
    <div className="install-command">
      <code>{value}</code>
      <CopyControl
        value={value}
        iconOnly
        label={`Copy ${value}`}
        failureMessage="Select the command to copy it manually."
      />
    </div>
  );
}
