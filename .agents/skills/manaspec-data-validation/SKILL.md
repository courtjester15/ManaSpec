---
name: manaspec-data-validation
description: Validate ManaSpec changes to exact asset identity, portfolio math, backup, or persistence.
---

Use [Data Model](../../../docs/DATA_MODEL.md) and the [QA contract](../../../docs/WORKFLOW.md#independent-dex-qa-contract). Reconcile cash, allocated basis and realized P/L against exact printing plus finish or sealed product IDs. Include missing, stale and genuine-zero quotes where relevant. Exercise reload, restore and failure recovery on synthetic fixtures. For copied backups, use the read-only verifier documented in [Deployment](../../../docs/DEPLOYMENT.md).
