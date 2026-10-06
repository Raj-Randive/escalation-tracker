const cds = require("@sap/cds");

module.exports = class EscalationService extends cds.ApplicationService {
  init() {
    const { Escalations } = this.entities;

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
