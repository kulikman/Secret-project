export type BrainAdapterErrorCode =
  | "BRAIN_API_ERROR"
  | "BRAIN_NOT_CONFIGURED"
  | "BRAIN_CAPABILITY_NOT_IMPLEMENTED";

export class BrainAdapterError extends Error {
  constructor(
    readonly code: BrainAdapterErrorCode,
    message: string,
    readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "BrainAdapterError";
  }
}

export function brainCapabilityNotImplemented(
  capability: string,
  reason: string
): BrainAdapterError {
  return new BrainAdapterError("BRAIN_CAPABILITY_NOT_IMPLEMENTED", `${capability}: ${reason}`, {
    capability,
  });
}

export function isBrainAdapterError(error: unknown): error is BrainAdapterError {
  return error instanceof BrainAdapterError;
}
