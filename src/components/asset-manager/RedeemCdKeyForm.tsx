import { useState } from "react";
import { KeyRoundIcon, SendIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";

type RedeemCdKeyFormProps = {
  errorMessage?: string;
  isRedeeming?: boolean;
  onRedeemCdKey: (cdKeyCode: string) => void | Promise<void>;
};

export function RedeemCdKeyForm({ errorMessage, isRedeeming = false, onRedeemCdKey }: RedeemCdKeyFormProps) {
  const [cdKeyCode, setCdKeyCode] = useState("");
  const isSubmitDisabled = isRedeeming || cdKeyCode.trim().length === 0;

  const handleSubmitRedeemCdKey = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedCdKeyCode = cdKeyCode.trim();

    if (!normalizedCdKeyCode) {
      return;
    }

    void onRedeemCdKey(normalizedCdKeyCode);
  };

  return (
    <form onSubmit={handleSubmitRedeemCdKey}>
      <div className="rounded-tvlink-card border border-tvlink-app-border bg-tvlink-card-bg p-4 shadow-tvlink-soft">
        <Field data-invalid={Boolean(errorMessage)}>
          <FieldLabel htmlFor="cd-key-code">Redeem Code</FieldLabel>
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <KeyRoundIcon />
            </InputGroupAddon>
            <InputGroupInput
              aria-invalid={Boolean(errorMessage)}
              autoComplete="off"
              disabled={isRedeeming}
              id="cd-key-code"
              placeholder="XXX-XXX-XXX"
              className="text-sm"
              value={cdKeyCode}
              onChange={(event) => setCdKeyCode(event.target.value)}
            />
          </InputGroup>
          {errorMessage ? (
            <FieldDescription className="text-red-400 text-xs">{errorMessage ?? ""}</FieldDescription>
          ) : null}
        </Field>
        <Button
          className="mt-2 inline-flex h-9 w-full items-center justify-center rounded-md border-0 bg-[linear-gradient(135deg,var(--tvlink-button-gradient-start)_0%,var(--tvlink-button-gradient-end)_100%)] text-sm font-semibold text-white shadow-tvlink-button transition duration-150 hover:-translate-y-0.5 hover:shadow-tvlink-button-hover"
          disabled={isSubmitDisabled}
          type="submit"
        >
          {isRedeeming ? <Spinner data-icon="inline-start" /> : <SendIcon data-icon="inline-start" />}
          Redeem Now
        </Button>
      </div>
    </form>
  );
}
