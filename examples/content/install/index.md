# Install

CuraOS ships one artifact set across four deployment profiles.

| Profile | Orchestration | Notes |
|---|---|---|
| Cloud SaaS | K8s / Helm | Vendor-managed, horizontal scale |
| On-prem | K8s | Customer infra, overlays opt-in |
| Hybrid | Control plane + data plane split | Audit + secrets on customer infra |
| Home lab / air-gap | Zarf singular bundle | Same artifacts, zero external egress |

See the signed v1.0.0 bundles for the cosign-verifiable install media.
