import { randomUUID } from "crypto";
import type { DomainEvent, DomainEventName } from "./types";

export function createDomainEvent(params: {
  name: DomainEventName;
  entityId: number;
  entityType: DomainEvent["entityType"];
  payload?: Record<string, unknown>;
  actorId?: number;
}): DomainEvent {
  return {
    id: randomUUID(),
    name: params.name,
    entityId: params.entityId,
    entityType: params.entityType,
    occurredAt: new Date().toISOString(),
    actorId: params.actorId,
    payload: params.payload ?? {},
  };
}
