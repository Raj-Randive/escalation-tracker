// The Fiori preview plugin is not needed for API tests and would keep the test process running
process.env.CDS_PLUGIN_UI5_ACTIVE = 'false'

const cds = require('@sap/cds')

// Start the whole app once for this file: in-memory SQLite, and S/4HANA mocked from the CSV in srv/external/data
const { GET, POST, PATCH, DELETE, expect } = cds.test('serve', 'all', '--with-mocks', '--in-memory').in(__dirname, '..')

// ---------- test users (the mocked users from package.json) ----------
const agent   = { auth: { username: 'agent',   password: 'agent'   } }
const manager = { auth: { username: 'manager', password: 'manager' } }
const guest   = { auth: { username: 'guest',   password: 'guest'   } }

// ---------- helpers ----------
const svc = '/odata/v4/escalation'
const active = (ID) => `${svc}/Escalations(ID=${ID},IsActiveEntity=true)`
const draft  = (ID) => `${svc}/Escalations(ID=${ID},IsActiveEntity=false)`
const daysFromNow = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10)

// The seed escalations from db/data/escalations-Escalations.csv
const PRODUCTION_LINE = 'a1b2c3d4-0001-4000-8000-000000000001' // urgency H
const INVOICE         = 'a1b2c3d4-0002-4000-8000-000000000002' // urgency M, status New
const SPARE_PARTS     = 'a1b2c3d4-0003-4000-8000-000000000003' // urgency L, due date already in the past

// Escalations are draft-enabled, so "create" = new draft + activate, like clicking Create and Save in Fiori
async function createEscalation (data, user = agent) {
  const { data: created } = await POST(`${svc}/Escalations`, data, user)
  return POST(`${draft(created.ID)}/EscalationService.draftActivate`, {}, user)
}

// "edit" = draftEdit + change the draft + activate, like clicking Edit, changing fields and Save
async function editEscalation (ID, changes, user = agent) {
  await POST(`${active(ID)}/EscalationService.draftEdit`, { PreserveChanges: true }, user)
  await PATCH(draft(ID), changes, user)
  return POST(`${draft(ID)}/EscalationService.draftActivate`, {}, user)
}

// Runs a request that is expected to fail and returns the error, so tests can check status and message
async function failed (request) {
  try { await request } catch (error) { return error }
  throw new Error('Expected the request to fail, but it succeeded')
}


describe('Authentication and authorization', () => {

  it('rejects anonymous requests with 401', async () => {
    const error = await failed(GET(`${svc}/Escalations`))
    expect(error.status).to.equal(401)
  })

  it('rejects logged-in users without a role with 403', async () => {
    const error = await failed(GET(`${svc}/Escalations`, guest))
    expect(error.status).to.equal(403)
  })

  it('lets agents read escalations', async () => {
    const { status, data } = await GET(`${svc}/Escalations?$filter=IsActiveEntity eq true`, agent)
    expect(status).to.equal(200)
    expect(data.value.length).to.be.at.least(3)
  })

  it('forbids agents to delete escalations', async () => {
    const error = await failed(DELETE(active(INVOICE), agent))
    expect(error.status).to.equal(403)
  })

  it('lets managers delete escalations', async () => {
    const { data } = await createEscalation({ title: 'To be deleted' }, manager)
    const { status } = await DELETE(active(data.ID), manager)
    expect(status).to.equal(204)
    const error = await failed(GET(active(data.ID), manager))
    expect(error.status).to.equal(404)
  })
})


describe('Escalation data', () => {

  it('serves seed data with status and urgency names', async () => {
    const { data } = await GET(`${active(PRODUCTION_LINE)}?$expand=status,urgency,actions`, agent)
    expect(data.title).to.equal('Production line stopped')
    expect(data.status.name).to.equal('In Progress')
    expect(data.urgency.name).to.equal('High')
    expect(data.actions.length).to.equal(2)
  })

  it('computes the urgency criticality used for colors', async () => {
    const { data } = await GET(`${svc}/Escalations?$filter=IsActiveEntity eq true&$select=ID,urgency_code,urgencyCriticality`, agent)
    const byId = Object.fromEntries(data.value.map((e) => [e.ID, e.urgencyCriticality]))
    expect(byId[PRODUCTION_LINE]).to.equal(1) // High   -> red
    expect(byId[INVOICE]).to.equal(2)         // Medium -> orange
    expect(byId[SPARE_PARTS]).to.equal(3)     // Low    -> green
  })
})


describe('Due date validation', () => {

  it('rejects a new escalation with a due date in the past', async () => {
    const error = await failed(createEscalation({ title: 'Too late', dueDate: daysFromNow(-1) }))
    expect(error.status).to.equal(400)
    expect(error.message).to.match(/is in the past/)
  })

  it('accepts a new escalation with a future due date', async () => {
    const { status, data } = await createEscalation({ title: 'On time', dueDate: daysFromNow(7) })
    expect(status).to.equal(201)
    expect(data.status_code).to.equal('N') // default status
  })

  it('allows editing an old escalation when the due date is not changed', async () => {
    const { status, data } = await editEscalation(SPARE_PARTS, { description: 'Customs cleared' })
    expect(status).to.equal(200)
    expect(data.description).to.equal('Customs cleared')
  })

  it('rejects changing a due date to the past', async () => {
    const { data } = await createEscalation({ title: 'Will be moved', dueDate: daysFromNow(7) })
    const error = await failed(editEscalation(data.ID, { dueDate: daysFromNow(-3) }))
    expect(error.status).to.equal(400)
  })
})


describe('Close action', () => {

  it('closes an open escalation', async () => {
    const { data } = await createEscalation({ title: 'Ready to close' })
    const { status } = await POST(`${active(data.ID)}/EscalationService.close`, {}, agent)
    expect(status).to.equal(204)
    const { data: after } = await GET(active(data.ID), agent)
    expect(after.status_code).to.equal('C')
  })

  it('refuses to close an escalation twice', async () => {
    const { data } = await createEscalation({ title: 'Closed twice' })
    await POST(`${active(data.ID)}/EscalationService.close`, {}, agent)
    const error = await failed(POST(`${active(data.ID)}/EscalationService.close`, {}, agent))
    expect(error.status).to.equal(409)
    expect(error.message).to.match(/already closed/)
  })
})


describe('Customers from S/4HANA (mocked)', () => {

  it('lists customers from the mocked Business Partner API', async () => {
    const { data } = await GET(`${svc}/Customers`, agent)
    expect(data.value).to.deep.include({ ID: '1000039', name: 'Horizon Air' })
  })

  it('turns a search into a name filter', async () => {
    const { data } = await GET(`${svc}/Customers?$search=Air`, agent)
    expect(data.value).to.deep.equal([{ ID: '1000039', name: 'Horizon Air' }])
  })

  it('copies the customer name from S/4HANA when saving', async () => {
    const { data } = await createEscalation({ title: 'With customer', customer: '1000033' })
    expect(data.customerName).to.equal('Capital Fasteners Inc')
  })

  it('ignores a customer name sent by the client', async () => {
    const { data } = await createEscalation({ title: 'Fake name', customer: '202', customerName: 'HACKED' })
    expect(data.customerName).to.equal('Nue tech inc')
  })

  it('rejects a customer that does not exist in S/4HANA', async () => {
    const error = await failed(createEscalation({ title: 'Unknown customer', customer: '9999999' }))
    expect(error.status).to.equal(400)
    expect(error.message).to.match(/Customer 9999999 does not exist/)
  })
})
