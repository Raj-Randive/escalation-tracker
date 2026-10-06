using { EscalationService } from './escalation-service';

// Every request must come from a logged-in user with one of the two roles
annotate EscalationService with @requires: [ 'Agent', 'Manager' ];

// Agents work on escalations but may not delete them; managers may do everything
annotate EscalationService.Escalations with @restrict: [
  { grant: [ 'READ', 'CREATE', 'UPDATE', 'close' ], to: 'Agent' },
  { grant: '*',                                     to: 'Manager' }
];

// Actions are the to-do items inside an escalation: both roles manage them
annotate EscalationService.Actions with @restrict: [
  { grant: '*', to: [ 'Agent', 'Manager' ] }
];
