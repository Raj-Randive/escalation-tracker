using EscalationService as service from '../../srv/escalation-service';

// Field-level annotations: labels, texts, value helps
annotate service.Escalations with {
  title       @title: 'Title';
  description @title: 'Description'  @UI.MultiLineText;
  status      @title: 'Status'   @Common.Text: status.name  @Common.TextArrangement: #TextOnly  @Common.ValueListWithFixedValues;
  urgency     @title: 'Urgency'  @Common.Text: urgency.name @Common.TextArrangement: #TextOnly @Common.ValueListWithFixedValues;
  dueDate     @title: 'Due Date';
  customer    @title: 'Customer'  @Common.Text: customerName  @Common.TextArrangement: #TextFirst
              @Common.ValueList: {
                CollectionPath: 'Customers',
                Parameters: [
                  { $Type: 'Common.ValueListParameterInOut',       LocalDataProperty: customer, ValueListProperty: 'ID' },
                  { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' }
                ]
              };
  customerName @title: 'Customer Name'  @readonly;
};

// Page-level annotations: what goes where
annotate service.Escalations with @(
  UI.HeaderInfo: {
    TypeName       : 'Escalation',
    TypeNamePlural : 'Escalations',
    Title          : { Value: title },
    Description    : { Value: description }
  },
  UI.SelectionFields: [ status_code, urgency_code, dueDate ],
  UI.LineItem: [
    { Value: title },
    { Value: status_code },
    { Value: urgency_code, Criticality: urgencyCriticality },
    { Value: dueDate },
    { Value: customer },
    { $Type: 'UI.DataFieldForAction', Action: 'EscalationService.close', Label: 'Close' }
  ],
  UI.Identification: [
    { $Type: 'UI.DataFieldForAction', Action: 'EscalationService.close', Label: 'Close' }
  ],
  UI.FieldGroup #General: { Data: [
    { Value: title },
    { Value: description }
  ]},
  UI.FieldGroup #Details: { Data: [
    { Value: status_code },
    { Value: urgency_code, Criticality: urgencyCriticality },
    { Value: dueDate },
    { Value: customer }
  ]},
  UI.Facets: [
    { $Type: 'UI.ReferenceFacet', ID: 'General', Label: 'General Information', Target: '@UI.FieldGroup#General' },
    { $Type: 'UI.ReferenceFacet', ID: 'Details', Label: 'Details',             Target: '@UI.FieldGroup#Details' },
    { $Type: 'UI.ReferenceFacet', ID: 'Actions', Label: 'Actions',             Target: 'actions/@UI.LineItem' }
  ]
);

annotate service.Actions with {
  text @title: 'Action';
  done @title: 'Done';
};

annotate service.Actions with @(
  UI.HeaderInfo: {
    TypeName       : 'Action',
    TypeNamePlural : 'Actions',
    Title          : { Value: text }
  },
  UI.LineItem: [
    { Value: text },
    { Value: done }
  ]
);

// Refresh the status on screen after the Close button runs
annotate service.Escalations actions {
  close @Common.SideEffects: { TargetProperties: ['in/status_code'] };
};

annotate service.Customers with {
  ID   @title: 'Customer ID';
  name @title: 'Customer Name';
};
