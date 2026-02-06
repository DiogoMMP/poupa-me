
import type { IDomainEvent } from "../../../IDomainEvent.js";
import { UniqueEntityID } from "../../../../UniqueEntityID.js";

export class MockJobDeletedEvent implements IDomainEvent {
  dateTimeOccurred: Date;
  id: UniqueEntityID;

  constructor (id: UniqueEntityID) {
    this.dateTimeOccurred = new Date();
    this.id = id;
  }

  getAggregateId (): UniqueEntityID {
    return this.id;
  }
}
