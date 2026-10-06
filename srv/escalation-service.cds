using { escalations as db } from '../db/schema';

service EscalationService {
  @odata.draft.enabled
  entity Escalations as projection on db.Escalations actions {
    action close();
  };
  entity Actions     as projection on db.Actions;
  @readonly entity Status  as projection on db.Status;
  @readonly entity Urgency as projection on db.Urgency;
}