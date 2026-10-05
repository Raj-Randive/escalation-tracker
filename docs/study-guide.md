# SAP CAP Backend Developer: Study Guide and Capstone Plan

Oct 4, 2026 · @Raj

The course takes one incident-management app from `cds init` to a Work Zone tile on Cloud Foundry in 8 units (about 9 h 55 min); this guide condenses each unit, maps them into a capstone project, and covers the exam.

## Course map

Units 2–8 each end in a hands-on exercise that follows a public SAP tutorial, so you can do all of it on a free BTP account.

| Unit | Topic | Time | Hands-on tutorial |
| --- | --- | --- | --- |
| 1 | Discovering CAP: side-by-side extensibility, CAP architecture, BTP Developer's Guide | 46 min | Concepts only |
| 2 | Setting up the CAP project: OData, JSON/YAML, use case, first service | 37 min | [Build a CAP Application](https://developers.sap.com/tutorials/build-cap-app.html) |
| 3 | Serving UIs: SAP Fiori elements, Fiori tools | 1 h 17 min | [Add SAP Fiori Elements UIs](https://developers.sap.com/tutorials/add-fiori-elements-uis.html) |
| 4 | Custom business logic: event handlers, error handling, local launch page | 55 min | [Add Custom Logic](https://developers.sap.com/tutorials/add-custom-logic.html), [Use a Local Launch Page](https://developers.sap.com/tutorials/use-local-launch-page.html) |
| 5 | Authorization and trust: XSUAA, CDS restrictions and roles | 35 min | [Add Authorization](https://developers.sap.com/tutorials/add-authorization.html) |
| 6 | External services: connectivity, unit tests, Business Partner API | 1 h 21 min | [Add Test Cases](https://developers.sap.com/tutorials/add-test-cases.html), [Extend with Business Partner API](https://developers.sap.com/tutorials/remote-service-extend-cf.html), [Test the extension](https://developers.sap.com/tutorials/remote-service-run-dev-test.html) |
| 7 | Deployment: Cloud Foundry, Kyma, SaaS, MTA, approuter | 1 h 47 min | [Prepare BTP CF](https://developers.sap.com/tutorials/prepare-btp-cf.html), [Prepare for Production](https://developers.sap.com/tutorials/prep-for-prod.html), [Deploy to CF](https://developers.sap.com/tutorials/deploy-to-cf.html), [Assign Roles](https://developers.sap.com/tutorials/user-role-assignment.html) |
| 8 | SAP Build Work Zone, standard edition | 22 min | [Integrate with Work Zone](https://developers.sap.com/tutorials/integrate-with-work-zone.html) |

Unit times are as listed on the course page. The course lists two mandatory prerequisites: the Managing Clean Core for S/4HANA Cloud learning journey and Getting started with SAP Cloud Application Programming Model. For the exercises you need an SAP BTP Free Tier account and a Business Application Studio dev space of type Full Stack Cloud Applications.

## Foundations (Units 1–2)

CAP is model-first: you describe the domain and services in CDS, and generic providers give you a working OData API before you write any code.

### Why side-by-side (Unit 1)

- **Clean core:** you don't modify S/4HANA Cloud. You consume its APIs and extend on SAP BTP. Key-user (in-app) extensibility covers simple cases like custom fields; real business logic needs side-by-side.
- **Runtimes on BTP:** ABAP environment (ABAP RAP), Cloud Foundry, Kyma. This course is the non-ABAP track: CAP + Node.js + Cloud Foundry. Pro-code and low-code (SAP Build: Apps, Process Automation, Work Zone) can be combined in "Fusion Teams".
- **SAP BTP Developer's Guide:** a curated blueprint of services, automated setup and best practices. Its key components are CAP, ABAP Cloud and SAP Build Code.

### CAP building blocks

- **CDS (Core Data Services):** the backbone. Data models and service definitions, written in CDL.
- **Service SDKs (Node.js, Java):** provide and consume services through synchronous queries and asynchronous messaging, with built-in integration for auth and SaaS tenant on/offboarding.
- **Databases:** SAP HANA Cloud for production, SQLite for local development, PostgreSQL also supported.
- **Frontends:** SAP Fiori is first-class; Vue, Angular or React work against the same service.
- **Deployment targets:** Cloud Foundry or Kyma.
- **Release cadence:** a new major roughly every 12 months (around May), monthly minors, semver. Start new projects on the latest major.

### OData

- An OASIS standard for RESTful APIs. HTTP verbs map to CRUD: `GET` read, `POST` create, `PUT` replace, `PATCH` partial update, `DELETE` remove.
- Payload formats: AtomPub (XML) and JSON. JSON is lighter and what SAPUI5 consumes.
- Every service exposes two documents: the **service document** at `/<service>/` (entity sets, functions, singletons) and the **metadata document** at `/<service>/$metadata` (XML entity data model, the only format it supports).
- In CAP every functional component is a service defined in CDS and served by the runtime. OData is the default protocol. Protocol adapters switch it to REST or GraphQL, or to one you write yourself.
- Not spelled out in the lesson but you will use them constantly: the query options `$filter`, `$select`, `$expand`, `$orderby`, `$top`, `$skip`, `$count`.

### Config formats and project layout

- JSON and YAML: YAML is a strict superset of JSON. You will touch `package.json` (the `cds` section), `xs-security.json` and `mta.yaml`.
- A CAP project has three folders: `db/` (data model), `srv/` (service definitions and handlers), `app/` (UIs).
- The course use case: ACME, an electronics company, has call-center agents who log customer incidents. The app is a Fiori elements List Report plus Object Page, and customer data comes from SAP S/4HANA Cloud.

## Build the app (Units 3–4)

Fiori elements UIs are generated from your service metadata plus annotations, and everything non-trivial in the backend hangs off before, on and after handlers.

### UIs (Unit 3)

- Any UI framework can consume a CAP service with plain AJAX calls. SAP Fiori elements gets out-of-the-box support: Fiori annotations, search, value helps and **draft**.
- Draft protects against data loss if the app dies and stops two users editing the same object at once.
- Fiori elements reads `$metadata` and the entity definitions, then uses UI-specific annotations to build the pages. Annotations and all Fiori apps live in the `app/` folder, and one CAP project can hold several apps.
- **SAP Fiori tools** come preinstalled in Business Application Studio and as a VS Code extension pack. The **Page Map** editor is a visual designer that generates the annotation files for you, and you commit those.
- Exercise result: a List Page of incidents and an Object Page for details, with create, edit and delete.

### Event handlers (Unit 4)

- Generic providers already handle `CREATE`, `READ`, `UPDATE` and `DELETE`. You write handlers only where the defaults fall short.
- **Three phases:** `before`, `on`, `after`, run in that order. You can register several handlers per phase, and one handler can serve several events. An `on` handler is mandatory for external services (nothing generic can serve them) and can override generic CRUD, but prefer the generic path.
- **Registering the implementation:**
  1. A `.js` file next to the `.cds` file with the same name (picked up automatically).
  2. The `@impl` annotation in the `.cds` file, when file names differ or you want the link explicit.
  3. Options 3 and 4 use the `cds.serve` API to bootstrap services yourself (advanced).
  4. For external services, the `on` handler registration described above.
- **Request object (`req`):** carries the request data, HTTP method and user, is how you send errors and messages back, and lets you register callbacks for completed, succeeded or failed requests.
- **Service API** has four parts: construct/reflection (rarely used), querying (sync, including the database), messaging (async) and event handling. The unit focuses on event handling.
- The lesson's own example runs an `after READ` handler on every entity to compute an `eligible_for_replacement` flag from device age. The exercise applies the same idea to add highlighting to fields in the incident list.

```js
const cds = require('@sap/cds')

module.exports = class IncidentsService extends cds.ApplicationService {
  init() {
    this.before('CREATE', 'Incidents', (req) => {
      if (!req.data.title) req.error(400, 'Title is required')
    })
    this.after('READ', 'Incidents', (rows) => {
      for (const r of rows) r.criticality = r.urgency === 'high' ? 1 : 3
    })
    return super.init()
  }
}
```

### Error handling

- **Two kinds of errors:** programmer errors (bugs, must be fixed) and operational errors (a faulty remote system, must be handled).
- **"Let it crash":** fail loudly, log unexpected errors, don't catch what you can't handle, and don't code defensively. After an unexpected error the app should not keep running, especially in multitenant apps where a shared resource may be affected and data could leak.
- **Never hide the cause.** When you catch and rethrow, augment the original error (add to `message` or extra properties) and rethrow the same object.
- **Custom error handler:** `this.on('error', (err, req) => { ... })` lets you rewrite messages, for example turning `UNIQUE_CONSTRAINT_VIOLATION` into "The entry already exists."
- **Inside handlers:** throw to interrupt, or call `req.error(409, '...')` to collect an error and return it in the response.
- **Local launch page (exercise):** a Fiori launchpad sandbox page for testing the app locally before any deployment.

## Secure and connect (Units 5–6)

Authorization is declared twice, as scopes and roles in `xs-security.json` for XSUAA and as restrictions in CDS, while connectivity is a `cds.requires` entry plus, in production, the Destination service.

### Authorization and trust (Unit 5)

- The **SAP Authorization and Trust Management service** manages user authorizations and trust to identity providers (an identity authentication tenant, an on-premise SAP system or your corporate IdP). Authorizations are technical roles per app, grouped into role collections.
- **Platform users** (developers, admins, operators) default to the SAP ID service. **Business users** (end users of your app) can come from your own corporate IdP.
- **XSUAA** (Extended Services User Account and Authentication) authenticates users and gives your app their identity and scopes. It is SAP's extension of the open-source Cloud Foundry UAA OAuth2 provider. It does **not** store real users, so it must trust an external IdP.
- **The hierarchy:** a *scope* is an access right, prefixed with `$XSAPPNAME`. A *role* holds one or more scopes (defined as a role template). A *role collection* holds roles and is the only thing you assign to a business user.
- **`xs-security.json`** is the declaration of your app's security: `xsappname`, `tenant-mode`, `scopes`, `role-templates` with `scope-references`, and `attributes`. The course example defines `IncidentViewer` and `IncidentManager`. The same content can live in `mta.yaml`.
- For production, `cds add xsuaa --for production` generates `xs-security.json` from the authorization annotations in your CDS models. Rerun `cds compile --to xsuaa` whenever the annotations change.
- **CDS restrictions (exercise):** you add authentication and authorization annotations to the service definition and mock users for local testing. The standard CAP syntax is below (the lesson text itself doesn't show it).

```cds
annotate ProcessorService.Incidents with @(restrict: [
  { grant: ['READ'], to: 'support' },
  { grant: ['*'],    to: 'admin'   }
]);
```

### Extensibility and connectivity (Unit 6)

- **Extensibility:** data model (add entities and fields without touching the core), behavioral (handlers), UI (customize Fiori apps), service (extra OData services) and localization.
- **Connectivity:** database abstraction (HANA, SQLite, PostgreSQL, H2 for Java only), HTTP/REST/GraphQL service calls, event-based communication, message queues and event brokers such as SAP Enterprise Messaging, SAP Integration Suite, and OAuth 2.0 security.
- **Consuming the S/4HANA Business Partner API:**
  1. Take the API definition (EDMX, OData V2 or V4) from the SAP Business Accelerator Hub into `srv/external/`.
  2. Register it under `cds.requires` in `package.json` with a `kind`, a `model` and `credentials.url` pointing at the sandbox.
  3. Use it in your service and add the business-partner field to the UI.
- **Destinations:** the `package.json` entry is an *application-defined destination*, fine for local work. The SAP BTP **Destination service** and **Connectivity service** only exist once the app runs on BTP and are bound to it. The Connectivity service provides a proxy to on-premise systems, and an on-premise target also needs the **Cloud Connector**.
- **Deployment gotcha from the course:** if the deployed app crashes with "No credentials configured for API\_BUSINESS\_PARTNER", add a `credentials` object with `kind` set to `odata-v2`, rebuild and redeploy.

```json
"cds": { "requires": { "API_BUSINESS_PARTNER": {
  "kind": "odata-v2",
  "model": "srv/external/API_BUSINESS_PARTNER",
  "credentials": { "url": "https://sandbox.api.sap.com/s4hanacloud/sap/opu/odata/sap/API_BUSINESS_PARTNER/" }
} } }
```

### Unit tests

- Unit tests are isolated, fast and repeatable. They catch bugs early, make refactoring safe, run in CI/CD and push you toward modular code.
- The lesson uses Mocha (runner) and Chai (assertions): `npm install mocha chai --save-dev`, then `"test": "mocha"` in `package.json`.
- In a CAP project the usual route is `cds.test`, which boots your server in-process so you can call the real OData endpoints from the test (standard CAP, not in the lesson text). The exercise adds test cases against the authorized incident service.

## Ship it (Units 7–8)

Deployment is a few `cds add` commands for production features, `mbt build` to produce an MTA archive and `cf deploy` to push it, and Work Zone then exposes the deployed app as a launchpad tile.

### Deployment options (Unit 7)

- **Cloud Foundry runtime:** uses the Multitarget Application (MTA) approach. Simpler, higher-level abstractions.
- **Kyma runtime:** CAP uses Pack buildpacks and Helm charts, so you don't write Dockerfiles or build images yourself. Pick it when you need control over containers and microservices in a Kubernetes ecosystem.
- **SaaS (multitenant), on either runtime:** `npm add @sap/cds-mtxs`, then set `multitenancy`, `extensibility` and `toggles` under `cds.requires`. The app registers with the SAP BTP SaaS Provisioning service, the Service Manager creates one HDI container per tenant, and you use a standalone approuter.
- **Custom builds:** `cds build --production` stages everything for deployment in `./gen`.

### Cloud Foundry deployment, step by step

Assumed in place: a BTP subaccount with the Cloud Foundry environment, a space, the entitlements, and a running SAP HANA Cloud instance.

1. `cds add hana --for production` (swap the in-memory database for HANA Cloud).
2. `cds add xsuaa --for production` (generates `xs-security.json`).
3. `cds add mta` (generates `mta.yaml`).
4. `cds add approuter --for production`.
5. `cds build --production` (optional dry run, `mbt build` does it for you).
6. `mbt build -t gen --mtar mta.tar` (the lesson says the archive lands in `gen`).
7. `cf deploy gen/mta.tar`. The approuter URL is at the end of the log.
8. Assign the role collections to your user in the BTP cockpit.

Course gotcha: before this the app ran on an in-memory database with basic auth, so the "Prepare for Production" exercise is where HANA, XSUAA and the approuter get wired in.

### MTA and the approuter

- A **multitarget application** is one logical app built from modules in different technologies, deployed to different targets, with a single lifecycle.
- **Descriptors:** `mta.yaml` (development) becomes the `mtad.yaml` deployment descriptor inside the MTA archive (MTAR). An admin can add an `mtaext.yaml` extension descriptor. The MTA deployer runs it.
- **Contents of `mta.yaml`:** global elements, *modules* (e.g. the HANA DB deployer and the Node.js `srv`), *resources* (backing services the app needs but doesn't provide: XSUAA, HDI container, job scheduler), *properties* and *parameters*. Business Application Studio also has a graphical MTA editor.
- **Approuter:** the single entry point and reverse proxy. Backends are not directly reachable. It serves static content and runs the OAuth2 authorization-code flow with XSUAA for unauthenticated requests.
- **Managed approuter** comes with the SAP Build Work Zone subscription (apps live in the HTML5 repository). **Standalone approuter** is for when you need approuter extensibility or build multitenant SaaS (app lives in the CF space).

### SAP Build Work Zone, standard edition (Unit 8)

- It builds business sites that give one central access point to apps and information on any device, from prebuilt templates, UI cards and content widgets.
- Sites are role-based and personalized. It integrates BTP services (inbox, identity) and third-party services, and is customizable through shell plugins, branding, translation and custom domains.
- Getting started: create a subscription, set up the site, integrate your applications, customize.
- Exercise: integrate your deployed app so Work Zone becomes the one entry point for your BTP apps. Follow the tutorial step by step, since the lesson text doesn't spell out the mechanics.

## How the pieces fit

&#91;embedded content: runtime architecture · 8 components\]

A user opens the app from a Work Zone tile, the approuter sends unauthenticated users to XSUAA to log in, then proxies the request to your CAP service. The service reads and writes HANA Cloud and calls the S/4HANA Business Partner API through a destination.

## Capstone project: Service Escalation Tracker

Build a CAP Node.js app where support agents log customer escalations enriched with S/4HANA business partners, deployed to Cloud Foundry behind an approuter and surfaced in Work Zone. It's far enough from the course's incident app to be yours, and it exercises every unit.

### Data model

| Entity | Key fields | Notes |
| --- | --- | --- |
| `Escalations` | ID, title, description, status, urgency, dueDate, customer | Draft-enabled; status and urgency are code lists |
| `Actions` | ID, escalation, text, done | Composition of `Escalations`, shown as a table on the Object Page |
| `Customers` | ID, name | Read-only projection on the remote `API_BUSINESS_PARTNER` service, nothing stored locally |
| `Status`, `Urgency` | code, name | Code lists seeded from CSV in `db/data/` |

### Build order

| # | Phase | You build | Unit | Done when |
| --- | --- | --- | --- | --- |
| 1 | Model and service | `cds init`, `db/schema.cds`, service in `srv/`, CSV seed data, `cds watch` | 2 | `$metadata` loads and `GET .../Escalations` returns seed rows |
| 2 | UI | Fiori elements List Report + Object Page via Fiori tools, draft enabled | 3 | You can create, edit and delete an escalation in draft from the UI |
| 3 | Logic | `before CREATE` validation, `after READ` criticality, a bound `close` action with a status-transition guard, a custom `error` handler, local launch page | 4 | An invalid create returns 400 with your message and the list colors urgency |
| 4 | Authorization | `Agent` and `Manager` roles via `@restrict`, mock users | 5 | An agent gets 403 on delete, a manager succeeds |
| 5 | External service | `cds import` the Business Partner EDMX, remote service config, `on READ` delegation, customer value help | 6 | The Object Page shows customer names from the sandbox API |
| 6 | Tests | `cds.test` suites for happy path, validation, authorization, with the remote service mocked | 6 | `npm test` is green locally and in a GitHub Actions run |
| 7 | Production and deploy | `cds add hana,xsuaa,mta,approuter --for production`, `mbt build`, `cf deploy`, role collection assignment | 7 | You log in through the approuter URL and role checks work against HANA Cloud |
| 8 | Work Zone | Integrate the deployed app into a site | 8 | A launchpad tile opens the app |

### Stretch goals beyond the course

- **Kyma:** deploy the same app with `cds add helm` and Helm charts. The course only names Kyma, and your Docker and Kubernetes background makes this the cheapest stretch.
- **Multitenancy:** add `@sap/cds-mtxs` and run it as SaaS with the standalone approuter.
- **Messaging:** emit an event when an escalation closes and consume it in a second service.
- **CI/CD:** a pipeline that runs `cds build`, the tests and `mbt build`. The exam has a whole topic area on DevOps and continuous delivery that this course barely touches.

## Cheat sheet

These are the commands and files you will use from first run to deployed app.

```bash
# Local development
npm i -g @sap/cds-dk
cds init escalation-tracker && cd escalation-tracker
cds watch                     # SQLite in memory, mocked auth, live reload

# Remote service: EDMX -> CSN, adds the cds.requires entry
cds import srv/external/API_BUSINESS_PARTNER.edmx

# Query your service (OData V4)
curl "http://localhost:4004/odata/v4/escalation/Escalations?\$filter=urgency_code eq 'H'&\$select=title&\$top=5"

# Production features
cds add hana --for production
cds add xsuaa --for production
cds add mta
cds add approuter --for production
cds compile --to xsuaa        # rerun after changing auth annotations

# Build and deploy to Cloud Foundry
cds build --production        # optional dry run into ./gen
mbt build -t gen --mtar mta.tar
cf deploy gen/mta.tar         # approuter URL is at the end of the log
```

| File | What lives there |
| --- | --- |
| `db/schema.cds` | Entities, associations, aspects |
| `srv/*.cds` | Service definitions and `@restrict` / `@requires` |
| `srv/*.js` | Handlers: same base name as the `.cds`, or linked with `@impl` |
| `app/*/annotations.cds` | Fiori elements UI annotations |
| `srv/external/` | Imported remote API definitions |
| `package.json`, `cds` section | `requires` for database, auth and remote services |
| `xs-security.json` | Scopes and role templates for XSUAA |
| `mta.yaml` | Modules, resources and bindings for deployment |
| `gen/` | Build output and the MTAR |

The query URL above assumes a service named `EscalationService` served at the default path. Check the startup log of `cds watch` for the real paths.

## Certification

The exam is SAP Certified Associate – Backend Developer – SAP Cloud Application Programming Model, and this course is one input to it rather than the whole syllabus.

### What I could confirm

- **Exam code:** SAP's own certification page opened under [C\_CPE\_16](https://training.sap.com/certification/C_CPE_16), while a [third-party listing](https://www.mynextmove.org/profile/certinfo/13078-D) shows C\_CPE\_2409. SAP versions these exams, so a newer release may exist. Confirm the current code on SAP's site before you book.
- **Not confirmed:** number of questions, duration and passing score were not on any page I could open. Take them from the current SAP exam page.
- **SAP's own prep mapping:** SAP Learning's [Get Certified live session](https://learning.sap.com/live-sessions/get-certified-sap-certified-associate-backend-developer-sap-cloud-application-programming-model) for this certification reviews four courses: BAS400 (Business Application Studio), CLD200 (this course), CF400 (Cloud Foundry runtime apps) and KYM400 (Kyma runtime apps).

### Topic areas and how this course covers them

Weights are from SAP's C\_CPE\_16 page and may differ in the current version. The coverage column is my own read of the course content.

| Topic area | Weight | Course coverage |
| --- | --- | --- |
| Application Extension Development & Deployment | 21–30% | Strong: units 2–4, 6, 7 |
| Application Security | 11–20% | Good: unit 5 (XSUAA, restrictions) plus the approuter in unit 7 |
| SAP Cloud Application Programming Model | 11–20% | Strong: units 1–4, 6 |
| DevOps and Continuous Delivery | 11–20% | Thin: MTA build and `cf deploy` only, no pipeline |
| SAP S/4HANA Cloud Extensibility | 11–20% | Partial: clean core and side-by-side in unit 1, Business Partner API in unit 6 |
| SAP Build Process Automation | up to 10% | None beyond naming it in unit 1 |

### Plan

1. Do units 1–8 with every exercise and every unit quiz.
2. Build the capstone, phase by phase, without copying the tutorial code.
3. Cover the gaps: a CI/CD pipeline for the capstone, the Kyma stretch goal, and the SAP Build Process Automation basics.
4. Work through the CF400, KYM400 and BAS400 content that SAP maps to this certification.
5. Check the exam page for the current code, question count, duration and passing score, then book.

## Sources

- [Develop extensions with CAP following the SAP BTP Developer's Guide (course)](https://learning.sap.com/courses/develop-extensions-with-cap-following-the-sap-btp-developer-s-guide)
- [Introducing the OData Protocol (lesson)](https://learning.sap.com/courses/develop-extensions-with-cap-following-the-sap-btp-developer-s-guide/introducing-the-odata-protocol_fd5e2134-54e9-456f-af87-02b0c228dbd7)
- [SAP Developers tutorials for CAP](https://developers.sap.com/)
- [SAP certification page, Backend Developer for SAP CAP (C\_CPE\_16)](https://training.sap.com/certification/c_cpe_16)
- [SAP Learning: Get Certified live sessions](https://learning.sap.com/)
- [O\*NET listing for C\_CPE\_2409](https://www.mynextmove.org/)
- [CAPire, the CAP documentation](https://cap.cloud.sap/docs/)
