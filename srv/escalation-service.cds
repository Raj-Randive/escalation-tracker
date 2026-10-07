using { escalations as db } from '../db/schema';
using { API_BUSINESS_PARTNER as bupa } from './external/API_BUSINESS_PARTNER';

service EscalationService {
  @odata.draft.enabled
  entity Escalations as projection on db.Escalations actions {
    action close();
  };
  entity Actions     as projection on db.Actions;
  @readonly entity Status  as projection on db.Status;
  @readonly entity Urgency as projection on db.Urgency;

  // Customers live in S/4HANA: nothing is stored locally, every read goes to the remote API
  @readonly entity Customers as projection on bupa.A_BusinessPartner {
    key BusinessPartner         as ID,
        BusinessPartnerFullName as name
  };
}