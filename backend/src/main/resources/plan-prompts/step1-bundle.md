=====FILE: PRD.md=====
# PRD: TrafficCast

## Identity
A traffic prediction and route-suggestion dashboard that helps a city traffic-control operator anticipate congestion and compare an alternative route before a bottleneck worsens. [Proposed: team to confirm]

## Problem and target user
[Proposed: team to confirm] The target user is a city traffic-control-room operator monitoring vehicle movement during a busy commute. Congestion can build between periodic checks, leaving the operator reacting after traffic has already slowed. The stated idea is to predict congestion before it happens and suggest alternatives, with a live GPS-based monitoring dashboard as supporting context. The current alternative is to watch a live map or rely on reports after a slowdown; these do not, by themselves, demonstrate a forecast or explain why a route is recommended.

## Rubric strategy
| Criterion | Weight | How this project scores | Proof the judges will see |
|---|---:|---|---|
| Innovation and Creativity | 25% | Show a future congestion risk and an actionable alternative in one view, rather than only displaying current traffic. [Proposed: team to confirm] | A road segment changes to a predicted high-risk state and an alternative route is highlighted. |
| Technical Implementation | 25% | Implement a reproducible prediction/risk calculation and route comparison with a clear data contract. [Proposed: team to confirm] | The same scenario produces a visible risk result and route suggestion on demand. |
| Impact and Practicality | 20% | Explain how earlier warning could help an operator intervene before a bottleneck grows. [Proposed: team to confirm] | A scenario card states the risk, estimated time window, and suggested action. |
| User Experience and Design | 15% | Keep the first screen focused on map, risk, and alternative route. [Proposed: team to confirm] | A judge can identify the affected segment and next action without navigating multiple screens. |
| Presentation and Demonstration | 15% | Use one prepared scenario that completes in under 60 seconds, with a no-network fallback. [Proposed: team to confirm] | The full journey works from the landing screen through the prediction and route recommendation. |

## Core scenarios
- [Proposed: team to confirm] A traffic-control operator opens the dashboard at the start of a commute and sees monitored road segments with current or simulated vehicle activity.
- [Proposed: team to confirm] When the operator selects a road segment, the system calculates or loads its near-future congestion risk and displays the reason or input signals.
- [Proposed: team to confirm] When the segment is marked high risk, the operator requests an alternative and sees a highlighted route plus a short explanation.
- The team lead, @stormy_otter, runs the prepared scenario and answers judge questions using the same dashboard.

## Functional requirements
- FR-001 [MUST] Show a dashboard map or clearly labelled schematic with monitored road segments - Rubric: User Experience and Design
- FR-002 [MUST] Let the presenter select one road segment or scenario - Rubric: Presentation and Demonstration
- FR-003 [MUST] Display a near-future congestion risk for the selected segment, labelled as predicted or simulated as appropriate - Rubric: Technical Implementation
- FR-004 [MUST] Show at least one alternative route when the selected segment is high risk - Rubric: Impact and Practicality
- FR-005 [MUST] Provide a deterministic sample scenario that works without live GPS or third-party traffic APIs - Rubric: Technical Implementation
- FR-006 [MUST] Display a concise reason for the risk result and route suggestion, using available scenario inputs - Rubric: Innovation and Creativity
- FR-007 [SHOULD] Show current/simulated vehicle activity alongside the predicted risk - Rubric: Impact and Practicality
- FR-008 [SHOULD] Show a time horizon for the prediction and label it as an estimate - Rubric: User Experience and Design
- FR-009 [SHOULD] Let the presenter reset the scenario to its initial state - Rubric: Presentation and Demonstration
- FR-010 [SHOULD] Show the route trade-off using distance, estimated travel time, or a clearly stated qualitative comparison - Rubric: Impact and Practicality
- FR-011 [SHOULD] Display a small legend for risk levels and route highlighting - Rubric: User Experience and Design
- FR-012 [SHOULD] Keep a visible indication of whether the dashboard is using live data or demo data - Rubric: Technical Implementation
- FR-013 [COULD] Show a small trend chart for the selected segment's risk over time - Rubric: Innovation and Creativity
- FR-014 [COULD] Allow switching between two or more prepared traffic scenarios - Rubric: Presentation and Demonstration
- FR-015 [COULD] Show a short impact note describing how an operator might use the warning - Rubric: Impact and Practicality

## Non-functional requirements
- The prepared end-to-end demo must complete in 60 seconds or less after the dashboard is loaded.
- The risk result and route suggestion must appear within 2 seconds on the prepared local scenario.
- The core flow must remain usable with network access disabled or external APIs unavailable.
- Use synthetic or otherwise non-sensitive demonstration data; do not expose real vehicle identifiers or personal location histories.
- Text, risk labels, and route colours must remain distinguishable without relying on colour alone.

## User flow
1. Open the TrafficCast dashboard and see the demo-data status.
2. Select the prepared busy-commute road segment.
3. Inspect the predicted congestion risk, time horizon, and short explanation.
4. Request or reveal an alternative route and compare it with the risky segment.
5. State the recommended operator action and reset the scenario if asked.

## Out of scope
- City-wide live GPS ingestion: integration risk and unnecessary for the first demo.
- Production-grade machine-learning training: no dataset or model details were provided.
- Turn-by-turn navigation for the public: different product and user journey.
- Accounts, roles, and administration: not needed for a single-operator demo.
- Real-time emergency dispatch or signal control: safety-critical and outside the prototype.
- Guaranteed travel-time accuracy: no verified traffic feed or evaluation dataset was provided.

## Demo success criteria
- [ ] The dashboard loads and clearly identifies demo data versus live data.
- [ ] The presenter can select a road segment without editing files or code.
- [ ] A predicted or simulated congestion risk appears within 2 seconds.
- [ ] A high-risk scenario reveals at least one visibly distinct alternative route.
- [ ] The risk explanation and route suggestion are understandable within 30 seconds.
- [ ] The complete demo still works when external services are unavailable.

## Assumptions and risks
- Assumption: The two approved ideas are combined, with congestion prediction and alternative-route suggestion as the primary product and the GPS monitoring dashboard as supporting context, because the first idea describes the clearest judge-visible action.
- Assumption: The target user is a city traffic-control-room operator; no named target user was supplied.
- Assumption: One person is the available team because only @stormy_otter is listed. Duration was not provided, so a reliable hour budget cannot be calculated.
- Assumption: Build a local deterministic demo using synthetic traffic values and a simple, explainable risk heuristic unless the team already has a working prediction model. Do not present a heuristic as a trained AI model.
- Assumption: A schematic map or a single prepared route is acceptable for the working prototype; no map provider or GPS source was specified.
- Assumption: @stormy_otter owns backend, presentation, QA, and demo operation. Frontend and data/model tasks are assigned to the same person because no other team roles are listed; this is a staffing constraint, not an additional skill claim.
- Budget: 1 people x unknown h x 0.5 = unknown productive hours; MUST scope about 6 h. Assumption: the missing event duration prevents a precise budget, so the MUST scope is capped at roughly 6 focused hours as a planning limit, not a stated event duration.
- AI usage: AI tools and APIs are permitted. Disclose significant AI-generated contributions and ensure the team can explain the code and prediction method.
- Rule conflict: The idea mentions live GPS data, but no GPS source or external service is confirmed. The MVP uses synthetic/demo data with an explicit label and a working offline path instead of depending on an unverified feed.
- Main risks: the prediction may be a rule-based heuristic rather than validated ML; route recommendations may be illustrative rather than computed on a real road graph; the single listed team member must cover frontend, backend, scenario data, testing, and the presentation; missing duration makes delivery capacity uncertain.
- Mitigations: freeze the core flow early, use one prepared scenario, avoid new integrations unless already working, and rehearse the offline fallback.

## Reality check
- No traffic dataset, trained model, validation metric, map provider, GPS feed, or route engine was supplied. Without them, the demo can prove a repeatable risk-and-route workflow, not real-world forecast accuracy.
- A dashboard that merely colours roads is easy to reproduce. The project must visibly connect a forecast to a specific alternative route and explain the recommendation to avoid looking like a generic traffic map.
- Live GPS and external routing are the likeliest failure points. If they are not already working, integrating them risks consuming the time needed for a reliable end-to-end demo.
- Other hackathon teams may build traffic maps, congestion classifiers, or route planners. The defensible difference here is the compact operator journey from an early warning to a concrete route choice, with the data mode disclosed.
- Scope is feasible only as a single-scenario prototype with synthetic data and a simple risk calculation. A validated predictive model, live fleet ingestion, and city-scale routing do not fit a plan with one listed team member and no confirmed duration.
=====END FILE=====
=====FILE: MVP.md=====
# MVP: TrafficCast

## Core flow
1. Open the dashboard and point out that the scenario is using labelled demo data.
2. Select the prepared busy-commute road segment.
3. Show its predicted/simulated congestion risk, time horizon, and short explanation.
4. Reveal an alternative route and compare it with the high-risk segment.
5. Explain the suggested operator action, then reset the scenario if needed.

## Wow moment
A road segment becomes high risk and the dashboard immediately highlights an alternative route with a short explanation. [Proposed: team to confirm]
Lands at second 35 of the demo.

## Reality ledger
| Component | Status | Owner role | Notes |
|---|---|---|---|
| Dashboard map or schematic | Planned | Backend, Presenter, QA / Demo operator (@stormy_otter) | No existing implementation was confirmed. Use a schematic if map integration is not already available. |
| Prepared demo traffic scenario | Planned | Backend, Presenter, QA / Demo operator (@stormy_otter) | Use deterministic synthetic values so the demo does not depend on a live feed. |
| Segment selection | Planned | Backend, Presenter, QA / Demo operator (@stormy_otter) | Must be selectable in the UI; do not require editing source files during the demo. |
| Congestion risk calculation/display | Planned | Backend, Presenter, QA / Demo operator (@stormy_otter) | Start with an explainable heuristic if no working model exists; label the output honestly. |
| Alternative route highlight/comparison | Planned | Backend, Presenter, QA / Demo operator (@stormy_otter) | A prepared alternative is acceptable for the demo; do not claim live routing unless implemented. |
| Risk explanation and demo/live status | Planned | Backend, Presenter, QA / Demo operator (@stormy_otter) | Use available scenario inputs and label demo data clearly. |
| Reset and demo rehearsal | Planned | Backend, Presenter, QA / Demo operator (@stormy_otter) | Verify the whole path before presentation. |

## Scope
**In**
- FR-001, FR-002, FR-003, FR-004, FR-005, FR-006; core flow steps 1 to 4: one dashboard, one selectable segment, one deterministic risk result, one alternative route, and a brief explanation.
- Core flow step 5: a rehearsed explanation of the operator action and a reset where time permits. FR-009 is SHOULD, so reset may be cut.

**Out**
- Live GPS ingestion and reliance on external traffic APIs.
- A trained model or accuracy claims without a dataset and evaluation.
- Multiple cities, many scenarios, public navigation, accounts, and signal-control integrations.
- Trend charts and extra visual polish until the complete core path works.

## Cut list
1. Remove trend charts and extra scenario switching; the risk-to-route moment remains.
2. Remove route metrics if they cannot be computed reliably; keep a clearly labelled qualitative comparison.
3. Replace an interactive map with a labelled schematic if map setup threatens the end-to-end flow.
4. Remove reset and secondary controls; rehearse the main path from a clean reload.
5. Remove live data integrations entirely if they are unstable; keep demo data clearly labelled.

## Health checklist
- [ ] The demo runs end to end from dashboard load to alternative route.
- [ ] The core flow works with every external service unavailable.
- [ ] A judge understands the problem and proposed action within 30 seconds.
- [ ] The wow moment lands inside the first minute.
- [ ] Risk output is labelled as predicted or simulated and does not claim unmeasured accuracy.
- [ ] @stormy_otter can explain the risk calculation and all significant AI-generated contributions.
- [ ] No real vehicle identifiers or personal location histories appear in the demo.

## What breaks first
The most fragile part is the assumption that live GPS, a traffic prediction model, and route computation will all be available and stable. The fallback is a deterministic synthetic commute scenario, a transparent risk heuristic, and a pre-defined alternative route, all visibly labelled as demo data. This still demonstrates the end-to-end product idea without pretending to validate live traffic prediction.

## Differentiation
A basic traffic dashboard reports where traffic is now; TrafficCast focuses the demo on where congestion may form next and what alternative an operator can consider. Its key proof is the linked sequence of risk, explanation, and route choice, with a clear distinction between simulated inputs and any live data.
=====END FILE=====
