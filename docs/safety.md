# Safety notes

## Crisis support numbers (Sri Lanka)

Shown in the help section on the homepage (`src/components/home/help-section.tsx`).

| Service | Number |
|---|---|
| National Mental Health Helpline (NIMH, 24 hours) | 1926 |
| Suwa Seriya ambulance | 1990 |
| Police emergency | 119 |

**Verify these numbers before every release.** Also consider adding services such as CCCline (1333) and Sumithrayo after confirming their current numbers and hours.

For users outside Sri Lanka, the UI currently tells them to call their local emergency number. A future improvement is a per-country helpline directory.

## Content rules

- Never diagnose, and never suggest medication or treatment.
- Insights must be descriptive ("you recorded more episodes on high-stress days"), never causal.
- Mood responses are validating and low-pressure. Avoid streaks and guilt-based nudges.
- Machine-translated text for mental-health content must be reviewed by a fluent speaker before it counts as a curated language.
