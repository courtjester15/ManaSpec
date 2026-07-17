/* Pure compatibility helpers ported from the vanilla source of truth. */
export const dataFoundation = (() => {
  const COMPATIBILITY_META = typeof Symbol === "function"
    ? Symbol("manaspecCompatibilityMeta")
    : "__manaspecCompatibilityMeta";
  const TRANSACTION_TYPES = new Set(["BUY", "SELL"]);
  const FINISHES = new Set(["nonfoil", "foil", "etched"]);
  const CURRENT_DATA_SCHEMA_VERSION = 1;
  const RECONCILIATION_EVENT_SEMANTICS = Object.freeze({
    POSITION_QUANTITY_CORRECTION: Object.freeze({
      purpose: "Correct current owned quantity without representing a market sale.",
      requires: Object.freeze(["trackedPrintingKey", "quantityDelta", "reason", "occurredAt", "provenance"]),
      affectsCash: false,
      reversibleByAnotherEvent: true,
    }),
    TRANSACTION_VOID: Object.freeze({
      purpose: "Mark a specific invalid or test transaction as excluded without deleting history.",
      requires: Object.freeze(["transactionId", "reason", "occurredAt", "provenance"]),
      affectsCash: "explicit_cash_correction_required_if_needed",
      reversibleByAnotherEvent: true,
    }),
    ACCOUNT_CORRECTION: Object.freeze({
      purpose: "Correct cash independently from card ownership.",
      requires: Object.freeze(["amount", "reason", "occurredAt", "provenance"]),
      affectsCash: true,
      reversibleByAnotherEvent: true,
    }),
  });

  function copy(record) {
    return record && typeof record === "object" && !Array.isArray(record) ? { ...record } : {};
  }

  function comparable(value) {
    if (value === undefined) return "__undefined__";
    try {
      return JSON.stringify(value);
    } catch (err) {
      return String(value);
    }
  }

  function attachCompatibilityMeta(normalized, original, derivedFields = []) {
    const raw = copy(original);
    derivedFields.forEach(key => {
      if (Object.prototype.hasOwnProperty.call(raw, key)) return;
      if (!Object.prototype.hasOwnProperty.call(normalized, key)) return;
      Object.defineProperty(normalized, key, {
        configurable: true,
        enumerable: false,
        writable: true,
        value: normalized[key],
      });
    });
    const baseline = {};
    Object.getOwnPropertyNames(normalized).forEach(key => {
      baseline[key] = comparable(normalized[key]);
    });

    Object.defineProperty(normalized, COMPATIBILITY_META, {
      configurable: false,
      enumerable: false,
      writable: false,
      value: {
        raw,
        baseline,
        derivedFields: new Set(derivedFields),
      },
    });
    return normalized;
  }

  function serializeCompatibleRecord(record) {
    if (!record || typeof record !== "object" || Array.isArray(record)) return record;
    const meta = record[COMPATIBILITY_META];
    if (!meta) return { ...record };

    const stored = { ...meta.raw };
    Object.keys(record).forEach(key => {
      const changed = comparable(record[key]) !== meta.baseline[key];
      const existed = Object.prototype.hasOwnProperty.call(meta.raw, key);
      if (!changed) return;
      if (!existed && meta.derivedFields.has(key)) return;
      stored[key] = record[key];
    });
    return stored;
  }

  function serializeCompatibleRecords(records = []) {
    return Array.isArray(records) ? records.map(serializeCompatibleRecord) : [];
  }

  function text(value) {
    if (value === null || value === undefined) return null;
    const normalized = String(value).trim();
    return normalized || null;
  }

  function number(value) {
    if (value === null || value === undefined || value === "") return null;
    const normalized = Number(value);
    return Number.isFinite(normalized) ? normalized : null;
  }

  function nonNegativeNumber(value) {
    const normalized = number(value);
    return normalized !== null && normalized >= 0 ? normalized : null;
  }

  function boolean(value) {
    if (typeof value === "boolean") return value;
    if (value === 1 || value === "1" || String(value).toLowerCase() === "true") return true;
    if (value === 0 || value === "0" || String(value).toLowerCase() === "false") return false;
    return null;
  }

  function date(value) {
    const raw = text(value);
    if (!raw) return null;
    const timestamp = new Date(raw).getTime();
    return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
  }

  function finish(record = {}) {
    const explicit = text(record.finish)?.toLowerCase();
    if (FINISHES.has(explicit)) return explicit;
    const id = String(record.id || record.cardId || "");
    const suffix = id.match(/\|(nonfoil|foil|etched)$/i)?.[1]?.toLowerCase();
    if (FINISHES.has(suffix)) return suffix;
    const isFoil = boolean(record.foil);
    return isFoil === true ? "foil" : isFoil === false ? "nonfoil" : null;
  }

  function scryfallId(record = {}) {
    const raw = text(record.scryfall_id || record.scryfallId || record.cardId || record.id);
    return raw ? raw.replace(/\|(nonfoil|foil|etched)$/i, "") : null;
  }

  function trackedPrintingKey(record = {}) {
    const id = scryfallId(record);
    const normalizedFinish = finish(record);
    return id && normalizedFinish ? `${id}|${normalizedFinish}` : null;
  }

  function plan(record = {}) {
    return {
      plannedQty: nonNegativeNumber(record.plannedQty ?? record.targetQty),
      entryTarget: nonNegativeNumber(record.entryTarget),
      exitTarget: nonNegativeNumber(record.exitTarget ?? record.target),
      holdTime: text(record.holdTime),
      thesis: text(record.thesis),
      conviction: text(record.conviction),
      catalyst: text(record.catalyst),
      reviewDate: date(record.reviewDate),
      riskNote: text(record.riskNote ?? record.reprintConcern),
      strategyTags: Array.isArray(record.strategyTags) ? [...record.strategyTags] : [],
    };
  }

  function trackedRecord(record, source) {
    const original = copy(record);
    const normalizedFinish = finish(original);
    const normalized = {
      ...original,
      id: text(original.id),
      scryfall_id: scryfallId(original),
      oracle_id: text(original.oracle_id ?? original.oracleId),
      trackedPrintingKey: trackedPrintingKey(original),
      finish: normalizedFinish,
      foil: normalizedFinish === "foil" ? true : normalizedFinish === "nonfoil" ? false : boolean(original.foil),
      lang: text(original.lang ?? original.language),
      name: text(original.name),
      set_code: text(original.set_code ?? original.set)?.toUpperCase() || null,
      set_name: text(original.set_name),
      collector_number: text(original.collector_number),
      currentPrice: nonNegativeNumber(original.currentPrice),
      addedDate: date(original.addedDate),
      plan: plan(original),
      compatibilitySource: source,
    };
    return attachCompatibilityMeta(normalized, original, [
      "oracle_id",
      "trackedPrintingKey",
      "finish",
      "lang",
      "plan",
      "compatibilitySource",
    ]);
  }

  function normalizeSpec(record) {
    const original = copy(record);
    const tracked = trackedRecord(original, "specs");
    const normalized = {
      ...tracked,
      oracle_id: tracked.oracle_id,
      trackedPrintingKey: tracked.trackedPrintingKey,
      finish: tracked.finish,
      lang: tracked.lang,
      plan: tracked.plan,
      compatibilitySource: tracked.compatibilitySource,
      qty: nonNegativeNumber(record?.qty),
      buyPrice: nonNegativeNumber(record?.buyPrice),
      buyDate: date(record?.buyDate),
    };
    return attachCompatibilityMeta(normalized, original, [
      "oracle_id", "trackedPrintingKey", "finish", "lang", "plan", "compatibilitySource",
    ]);
  }

  function normalizeRadarItem(record) {
    return trackedRecord(record, "radar");
  }

  function normalizeTransaction(record, inputIndex = 0) {
    const original = copy(record);
    const normalizedFinish = finish(original);
    const normalized = {
      ...original,
      id: text(original.id),
      cardId: text(original.cardId),
      scryfall_id: scryfallId(original),
      trackedPrintingKey: trackedPrintingKey(original),
      finish: normalizedFinish,
      foil: normalizedFinish === "foil" ? true : normalizedFinish === "nonfoil" ? false : boolean(original.foil),
      lang: text(original.lang ?? original.language),
      type: text(original.type)?.toUpperCase() || null,
      quantity: nonNegativeNumber(original.quantity),
      price: nonNegativeNumber(original.price),
      fees: nonNegativeNumber(original.fees) ?? 0,
      shipping: nonNegativeNumber(original.shipping) ?? 0,
      extraCosts: nonNegativeNumber(original.extraCosts) ?? 0,
      cashEffect: number(original.cashEffect),
      date: date(original.date),
      estimatedDate: boolean(original.estimatedDate),
      estimatedPrice: boolean(original.estimatedPrice),
      backfilledFromPositionId: text(original.backfilledFromPositionId),
      __inputIndex: inputIndex,
    };
    return attachCompatibilityMeta(normalized, original, [
      "trackedPrintingKey",
      "finish",
      "lang",
      "shipping",
      "extraCosts",
      "cashEffect",
      "estimatedDate",
      "estimatedPrice",
      "__inputIndex",
    ]);
  }

  function validateTransaction(transaction) {
    const issues = [];
    if (!transaction.id) issues.push("missing_transaction_id");
    if (!transaction.trackedPrintingKey) issues.push("missing_tracked_printing_identity");
    if (!TRANSACTION_TYPES.has(transaction.type)) issues.push("unsupported_transaction_type");
    if (!(transaction.quantity > 0)) issues.push("invalid_quantity");
    if (transaction.price === null) issues.push("invalid_price");
    if (!transaction.date) issues.push("invalid_date");
    return issues;
  }

  function transactionOrder(left, right) {
    const leftTime = left.date ? new Date(left.date).getTime() : Number.POSITIVE_INFINITY;
    const rightTime = right.date ? new Date(right.date).getTime() : Number.POSITIVE_INFINITY;
    return leftTime - rightTime || left.__inputIndex - right.__inputIndex;
  }

  function projectPositionsFromTransactions(records = []) {
    const normalized = records.map(normalizeTransaction);
    const groups = new Map();
    const invalidTransactions = [];

    normalized.forEach(transaction => {
      const issues = validateTransaction(transaction);
      if (issues.length) invalidTransactions.push({
        transactionId: transaction.id,
        inputIndex: transaction.__inputIndex,
        trackedPrintingKey: transaction.trackedPrintingKey,
        issues,
      });
      if (!transaction.trackedPrintingKey) return;
      if (!groups.has(transaction.trackedPrintingKey)) groups.set(transaction.trackedPrintingKey, []);
      groups.get(transaction.trackedPrintingKey).push(transaction);
    });

    const positions = [];
    groups.forEach((transactions, key) => {
      transactions.sort(transactionOrder);
      const issues = [];
      let quantity = 0;
      let deployedCostBasis = 0;
      let realizedPL = 0;
      let stopped = false;

      for (let index = 1; index < transactions.length; index += 1) {
        if (transactions[index].date && transactions[index - 1].date
          && transactions[index].date === transactions[index - 1].date) {
          issues.push({ type: "ambiguous_event_order", transactionIds: [transactions[index - 1].id, transactions[index].id] });
        }
      }

      for (const transaction of transactions) {
        const validation = validateTransaction(transaction);
        if (validation.length) {
          issues.push({ type: "invalid_transaction", transactionId: transaction.id, issues: validation });
          stopped = true;
          continue;
        }
        if (stopped) continue;
        if (transaction.price === 0 && transaction.type === "BUY") {
          issues.push({ type: "zero_price_acquisition", transactionId: transaction.id });
        }
        if (transaction.backfilledFromPositionId
          && transaction.estimatedDate === null
          && transaction.estimatedPrice === null) {
          issues.push({ type: "backfill_provenance_unmarked", transactionId: transaction.id });
        }
        if (transaction.backfilledFromPositionId && (!transaction.date || transaction.price === 0)) {
          issues.push({ type: "uncertain_backfill_value", transactionId: transaction.id });
        }

        const value = transaction.quantity * transaction.price;
        const friction = transaction.fees + transaction.shipping + transaction.extraCosts;
        if (transaction.type === "BUY") {
          quantity += transaction.quantity;
          deployedCostBasis += value + friction;
          continue;
        }
        if (transaction.quantity > quantity) {
          issues.push({
            type: "oversell",
            transactionId: transaction.id,
            availableQuantity: quantity,
            attemptedQuantity: transaction.quantity,
          });
          stopped = true;
          continue;
        }
        const averageCost = quantity > 0 ? deployedCostBasis / quantity : 0;
        const soldBasis = averageCost * transaction.quantity;
        realizedPL += value - friction - soldBasis;
        quantity -= transaction.quantity;
        deployedCostBasis -= soldBasis;
        if (quantity === 0) deployedCostBasis = 0;
      }

      positions.push({
        trackedPrintingKey: key,
        cardId: transactions[0]?.cardId || null,
        name: text(transactions.find(transaction => transaction.name)?.name),
        quantity,
        averageCost: quantity > 0 ? deployedCostBasis / quantity : 0,
        deployedCostBasis,
        realizedPL,
        state: quantity > 0 ? "open" : "closed",
        transactionCount: transactions.length,
        backfillCount: transactions.filter(transaction => transaction.backfilledFromPositionId).length,
        projectionSafe: !stopped && !issues.some(issue => issue.type === "ambiguous_event_order"),
        issues,
      });
    });

    return {
      positions,
      invalidTransactions,
      summary: {
        transactionCount: normalized.length,
        projectedPositionCount: positions.length,
        openPositionCount: positions.filter(position => position.state === "open").length,
        closedPositionCount: positions.filter(position => position.state === "closed").length,
        unsafePositionCount: positions.filter(position => !position.projectionSafe).length,
        invalidTransactionCount: invalidTransactions.length,
      },
    };
  }

  function nearlyEqual(left, right, tolerance) {
    return Math.abs(Number(left || 0) - Number(right || 0)) <= tolerance;
  }

  function compareProjectedPositions(specRecords = [], transactionRecords = [], options = {}) {
    const quantityTolerance = options.quantityTolerance ?? 0;
    const costTolerance = options.costTolerance ?? 0.01;
    const specs = specRecords.map(normalizeSpec);
    const projection = projectPositionsFromTransactions(transactionRecords);
    const projectedByKey = new Map(projection.positions.map(position => [position.trackedPrintingKey, position]));
    const specByKey = new Map(specs.filter(spec => spec.trackedPrintingKey).map(spec => [spec.trackedPrintingKey, spec]));
    const results = [];

    specs.forEach(spec => {
      if (!spec.trackedPrintingKey) {
        results.push({ status: "invalid_spec_identity", specId: spec.id, name: spec.name });
        return;
      }
      const projected = projectedByKey.get(spec.trackedPrintingKey);
      if (!projected) {
        results.push({ status: "no_usable_transaction_history", trackedPrintingKey: spec.trackedPrintingKey, spec });
        return;
      }
      const mismatches = [];
      if (!nearlyEqual(spec.qty, projected.quantity, quantityTolerance)) mismatches.push("quantity");
      if (projected.quantity > 0 && !nearlyEqual(spec.buyPrice, projected.averageCost, costTolerance)) mismatches.push("average_cost");
      if (!projected.projectionSafe) mismatches.push("unsafe_projection");
      results.push({
        status: mismatches.length ? "mismatch" : "matched",
        trackedPrintingKey: spec.trackedPrintingKey,
        mismatches,
        current: { quantity: spec.qty, averageCost: spec.buyPrice },
        projected: { quantity: projected.quantity, averageCost: projected.averageCost, realizedPL: projected.realizedPL, state: projected.state },
        projectionIssues: projected.issues,
      });
    });

    projection.positions.forEach(projected => {
      if (specByKey.has(projected.trackedPrintingKey)) return;
      results.push({
        status: projected.state === "closed" ? "closed_history_only" : "open_projection_without_current_spec",
        trackedPrintingKey: projected.trackedPrintingKey,
        projected,
      });
    });

    const count = status => results.filter(result => result.status === status).length;
    return {
      projection,
      results,
      summary: {
        currentSpecCount: specs.length,
        matchedCount: count("matched"),
        mismatchCount: count("mismatch"),
        noHistoryCount: count("no_usable_transaction_history"),
        invalidSpecIdentityCount: count("invalid_spec_identity"),
        openProjectionWithoutSpecCount: count("open_projection_without_current_spec"),
        closedHistoryOnlyCount: count("closed_history_only"),
        invalidTransactionCount: projection.invalidTransactions.length,
      },
    };
  }

  function getSchemaVersionStatus(value) {
    if (value === null || value === undefined || value === "") {
      return {
        status: "legacy_unversioned",
        version: null,
        assumedVersion: 1,
        currentVersion: CURRENT_DATA_SCHEMA_VERSION,
        migrationRequired: false,
      };
    }
    const version = Number(value);
    if (!Number.isInteger(version) || version < 1) {
      return { status: "invalid", version: value, currentVersion: CURRENT_DATA_SCHEMA_VERSION, migrationRequired: false };
    }
    if (version > CURRENT_DATA_SCHEMA_VERSION) {
      return { status: "future_unsupported", version, currentVersion: CURRENT_DATA_SCHEMA_VERSION, migrationRequired: false };
    }
    if (version < CURRENT_DATA_SCHEMA_VERSION) {
      return { status: "migration_required", version, currentVersion: CURRENT_DATA_SCHEMA_VERSION, migrationRequired: true };
    }
    return { status: "current", version, currentVersion: CURRENT_DATA_SCHEMA_VERSION, migrationRequired: false };
  }

  function getLegacyBackfillProvenance(record = {}) {
    const transaction = normalizeTransaction(record);
    if (!transaction.backfilledFromPositionId) return null;
    return {
      source: "legacy_startup_backfill",
      sourcePositionId: transaction.backfilledFromPositionId,
      dateEstimateStatus: transaction.estimatedDate === null ? "unknown" : transaction.estimatedDate ? "estimated" : "confirmed",
      priceEstimateStatus: transaction.estimatedPrice === null ? "unknown" : transaction.estimatedPrice ? "estimated" : "confirmed",
      runtimeOnly: true,
    };
  }

  function findPositionDeletionRisk(specRecord, transactionRecords = []) {
    const spec = normalizeSpec(specRecord);
    if (!spec.trackedPrintingKey) return { blocked: true, reason: "invalid_position_identity", projected: null };
    const projection = projectPositionsFromTransactions(transactionRecords);
    const projected = projection.positions.find(position => position.trackedPrintingKey === spec.trackedPrintingKey) || null;
    if (!projected || projected.state !== "open") return { blocked: false, reason: "no_open_transaction_projection", projected };
    return {
      blocked: true,
      reason: "would_leave_open_transaction_projection",
      projected: {
        trackedPrintingKey: projected.trackedPrintingKey,
        quantity: projected.quantity,
        averageCost: projected.averageCost,
        transactionCount: projected.transactionCount,
      },
    };
  }

  function buildReconciliationReport(input = {}) {
    const data = input.data && typeof input.data === "object" ? input.data : input;
    const specs = Array.isArray(data.specs) ? data.specs : [];
    const transactions = Array.isArray(data.transactions) ? data.transactions : [];
    const comparison = compareProjectedPositions(specs, transactions);
    const findings = comparison.results.filter(result => !["matched", "closed_history_only"].includes(result.status));
    const legacyBackfillProvenance = transactions.map(getLegacyBackfillProvenance).filter(Boolean);
    return {
      readOnly: true,
      dataSchema: getSchemaVersionStatus(input.dataSchemaVersion),
      summary: {
        ...comparison.summary,
        findingCount: findings.length,
        legacyBackfillCount: legacyBackfillProvenance.length,
        legacyBackfillUnknownDateEstimateCount: legacyBackfillProvenance.filter(item => item.dateEstimateStatus === "unknown").length,
        legacyBackfillUnknownPriceEstimateCount: legacyBackfillProvenance.filter(item => item.priceEstimateStatus === "unknown").length,
      },
      findings,
      projectionIssues: comparison.projection.positions.flatMap(position => position.issues.map(issue => ({
        trackedPrintingKey: position.trackedPrintingKey,
        name: position.name,
        ...issue,
      }))),
      legacyBackfillProvenance,
    };
  }

  return Object.freeze({
    CURRENT_DATA_SCHEMA_VERSION,
    RECONCILIATION_EVENT_SEMANTICS,
    normalizeOptionalText: text,
    normalizeFiniteNumber: number,
    normalizeBoolean: boolean,
    normalizeDate: date,
    normalizeFinish: finish,
    getScryfallPrintingId: scryfallId,
    getTrackedPrintingKey: trackedPrintingKey,
    normalizePlan: plan,
    normalizeSpec,
    normalizeRadarItem,
    normalizeTransaction,
    validateTransaction,
    projectPositionsFromTransactions,
    compareProjectedPositions,
    getSchemaVersionStatus,
    getLegacyBackfillProvenance,
    findPositionDeletionRisk,
    buildReconciliationReport,
    serializeCompatibleRecord,
    serializeCompatibleRecords,
  });
})();
