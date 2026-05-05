import { useState } from "react";
import { KeyRoundIcon, SendIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
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
      <FieldGroup>
        <Field data-invalid={Boolean(errorMessage)}>
          <FieldLabel htmlFor="cd-key-code">Kode CD Key</FieldLabel>
          <InputGroup>
            <InputGroupAddon align="inline-start">
              <KeyRoundIcon />
            </InputGroupAddon>
            <InputGroupInput
              aria-invalid={Boolean(errorMessage)}
              autoComplete="off"
              disabled={isRedeeming}
              id="cd-key-code"
              placeholder="Masukkan CD Key"
              value={cdKeyCode}
              onChange={(event) => setCdKeyCode(event.target.value)}
            />
          </InputGroup>
          <FieldDescription>
            {errorMessage ?? "Redeem CD Key untuk memperpanjang akses Asset Manager."}
          </FieldDescription>
        </Field>
        <Button disabled={isSubmitDisabled} type="submit">
          {isRedeeming ? <Spinner data-icon="inline-start" /> : <SendIcon data-icon="inline-start" />}
          Redeem CD Key
        </Button>
      </FieldGroup>
    </form>
  );
}
