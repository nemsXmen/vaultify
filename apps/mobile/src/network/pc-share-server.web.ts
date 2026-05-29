import type { PcTransferSession } from "@/src/state/vault-state";

export type PcShareServerSession = {
  readonly url: string;
  readonly port: number;
  readonly stop: () => Promise<void>;
};

export async function startPcShareServer(_session: PcTransferSession): Promise<PcShareServerSession> {
  throw new Error("Local PC sharing is only available on a native mobile build.");
}
