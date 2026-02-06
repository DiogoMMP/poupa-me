
import { AggregateRoot } from "../../../../AggregateRoot.js";
import { MockJobCreatedEvent } from '../events/mockJobCreatedEvent.js'
import { UniqueEntityID } from "../../../../UniqueEntityID.js";
import { MockJobDeletedEvent } from "../events/mockJobDeletedEvent.js";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IMockJobProps {

}

export class MockJobAggregateRoot extends AggregateRoot<IMockJobProps> {
  private constructor (props: IMockJobProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static createJob (props: IMockJobProps, id?: UniqueEntityID): MockJobAggregateRoot {
    const job = new this(props, id);
    job.addDomainEvent(new MockJobCreatedEvent(job.id));
    return job;
  }

  public deleteJob (): void {
    this.addDomainEvent(new MockJobDeletedEvent(this.id))
  }

}
