const cds = require("@sap/cds");

module.exports = class EscalationService extends cds.ApplicationService {
  async init() {
    const { Escalations, Customers } = this.entities;

    // Connect to the remote S/4HANA Business Partner API (or its local mock)
    const bupa = await cds.connect.to("API_BUSINESS_PARTNER");

    // Customers have no local table: forward every read to the remote service.
    // The S/4HANA V2 API can't handle a free-text $search, so turn it into a name filter.
    this.on("READ", Customers, (req) => {
      const query = req.query;
      const search = query.SELECT.search;
      if (search) {
        const term = search.map((s) => s.val).filter(Boolean).join(" ");
        query.SELECT.search = undefined; // overwrite, not delete: the property is inherited
        query.where`contains(name, ${term})`;
      }
      return bupa.run(query);
    });

    // Copy the customer's name from S/4HANA when a customer is set or changed
    this.before(["CREATE", "UPDATE"], Escalations, async (req) => {
      const { customer } = req.data;
      if (customer === undefined) return;
      if (!customer) {
        req.data.customerName = null;
        return;
      }
      const found = await bupa.run(SELECT.one.from(Customers).where({ ID: customer }));
      if (!found) return req.error(400, `Customer ${customer} does not exist`, "customer");
      req.data.customerName = found.name;
    });

     // Validation: a due date must not be in the past when it is set or changed
    this.before(['CREATE', 'UPDATE'], Escalations, async (req) => {
      const { dueDate } = req.data
      if (!dueDate) return

      if (req.event === 'UPDATE') {
        const before = await SELECT.one.from(req.subject).columns('dueDate')
        if (before?.dueDate === dueDate) return   // date unchanged, nothing to check
      }

      const today = new Date().toISOString().slice(0, 10)
      if (dueDate < today) {
        req.error(400, `Due date ${dueDate} is in the past`, 'dueDate')
      }
    })

    // Bound action: close an escalation, unless it is already closed
    this.on("close", Escalations, async (req) => {
      const escalation = await SELECT.one
        .from(req.subject)
        .columns("status_code");
      if (!escalation) return req.error(404, "Escalation not found");
      if (escalation.status_code === "C")
        return req.error(409, "Escalation is already closed");
      await UPDATE(req.subject).with({ status_code: "C" });
    });

    return super.init();
  }
};
