
import type { IDomainEvent } from "../../../IDomainEvent.js";
import { UniqueEntityID } from "../../../../UniqueEntityID.js";

export class MockJobCreatedEvent implements IDomainEvent {
  dateTimeOccurred: Date;
  id: UniqueEntityID;

  constructor (id: UniqueEntityID) {
    this.id = id;
    this.dateTimeOccurred = new Date();
  }

  getAggregateId (): UniqueEntityID {
    return this.id;
  }
}
