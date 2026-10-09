namespace escalations;

using { cuid, managed, sap.common.CodeList } from '@sap/cds/common';

entity Escalations : cuid, managed {
  title       : String(100) @mandatory;
  description : String(1000);
  status      : Association to Status default 'N';
  urgency     : Association to Urgency default 'M';
  dueDate     : Date;
  urgencyCriticality : Integer = case when urgency.code = 'H' then 1 when urgency.code = 'M' then 2 when urgency.code = 'L' then 3 else 0 end;
  customer    : String(10);
  customerName: String(81);
  actions     : Composition of many Actions on actions.escalation = $self;
}

entity Actions : cuid, managed {
  escalation : Association to Escalations;
  text       : String(500);
  done       : Boolean default false;
}

entity Status : CodeList {
  key code : String(1);
}

entity Urgency : CodeList {
  key code : String(1);
}