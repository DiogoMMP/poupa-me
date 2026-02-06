
import { MockJobCreatedEvent } from "../events/mockJobCreatedEvent.js";
import { MockJobDeletedEvent } from "../events/mockJobDeletedEvent.js";
import type { IHandle } from "../../../IHandle.js";
import { DomainEvents } from "../../../DomainEvents.js";
import type { IDomainEvent } from "../../../IDomainEvent.js";

export class MockPostToSocial implements IHandle<MockJobCreatedEvent>, IHandle<MockJobDeletedEvent> {
  constructor () {

  }

  /**
   * This is how we may setup subscriptions to domain events.
   */

  setupSubscriptions (): void {
    DomainEvents.register((event: IDomainEvent) => this.handleJobCreatedEvent(event as MockJobCreatedEvent), MockJobCreatedEvent.name);
    DomainEvents.register((event: IDomainEvent) => this.handleDeletedEvent(event as MockJobDeletedEvent), MockJobDeletedEvent.name);
  }

  /**
   * These are examples of how we define the handlers for domain events.
   */

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleJobCreatedEvent (_event: MockJobCreatedEvent): void {
    console.log('A job was created!!!')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleDeletedEvent (_event: MockJobDeletedEvent): void {
    console.log('A job was deleted!!!')
  }
}
