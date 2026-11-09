"use strict";

/**
 * Validate the portfolio structure and supplied price evidence.
 * Verification timestamps and market rules must come from upstream checks.
 */
function validatePortfolio(matchIds, slips) {
  if (!Array.isArray(matchIds) || matchIds.length !== 4 || new Set(matchIds).size !== 4 ||
      matchIds.some(id => typeof id !== "string" || !id.trim())) {
    throw new TypeError("Заключи точно четири различни мача.");
  }

  if (!Array.isArray(slips) || slips.length !== 4) {
    throw new TypeError("Необходими са точно четири фиша.");
  }

  const combinations = new Set();
  return slips.map((selections, index) => {
    if (!Array.isArray(selections) || selections.length !== 4 ||
        selections.some(selection => !selection || typeof selection !== "object")) {
      throw new TypeError(`Фиш ${index + 1} трябва да има точно четири селекции.`);
    }

    const byMatch = new Map(selections.map(selection => [selection.matchId, selection]));
    if (byMatch.size !== 4 || matchIds.some(id => !byMatch.has(id))) {
      throw new TypeError(`Фиш ${index + 1} трябва да съдържа точно заключените мачове.`);
    }

    const ordered = matchIds.map(id => byMatch.get(id));
    const combination = JSON.stringify(ordered.map(({ marketId, outcomeId }) => {
      if (typeof marketId !== "string" || !marketId.trim() ||
          typeof outcomeId !== "string" || !outcomeId.trim()) {
        throw new TypeError("Всяка селекция трябва да има идентификатор на пазар и изход.");
      }
      return [marketId, outcomeId];
    }));

    if (combinations.has(combination)) {
      throw new TypeError("Четирите фиша трябва да са различни.");
    }
    combinations.add(combination);

    const unconfirmedMatchIds = ordered.filter(selection => {
      const { odds, bookmaker, checkedAt, rulesVerified } = selection;
      return bookmaker !== "WINBET" || !Number.isFinite(odds) || odds <= 1 ||
        typeof checkedAt !== "string" || !Number.isFinite(Date.parse(checkedAt)) ||
        rulesVerified !== true;
    }).map(selection => selection.matchId);

    return {
      unconfirmedMatchIds,
      totalOdds: unconfirmedMatchIds.length ? null :
        ordered.reduce((total, selection) => total * selection.odds, 1)
    };
  });
}

module.exports = { validatePortfolio };
