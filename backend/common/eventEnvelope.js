
import { v4 as uuidv4 } from "uuid";

export function buildEvent(type, transactionId, userId, payload, correlationId) {
  return {
    id: uuidv4(),
    type,
    version: 1,
    ts: Date.now(),
    transactionId,
    userId,
    payload,
    correlationId
  };
}
