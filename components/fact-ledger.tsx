"use client";

import { useState } from "react";
import {
  type InvestigationFact,
  useInvestigationStore,
} from "@/store/use-investigation-store";

type FactFilter = "all" | "forensic" | "testimonial";

const filters: { label: string; value: FactFilter }[] = [
  { label: "[ ALL ]", value: "all" },
  { label: "[ FORENSIC ]", value: "forensic" },
  { label: "[ TESTIMONIAL ]", value: "testimonial" },
];

function matchesFilter(fact: InvestigationFact, filter: FactFilter) {
  return filter === "all" || fact.type === filter;
}

export function FactLedger() {
  const [activeFilter, setActiveFilter] = useState<FactFilter>("all");
  const facts = useInvestigationStore((state) => state.facts);
  const pinFactToBoard = useInvestigationStore((state) => state.pinFactToBoard);
  const filteredFacts = facts.filter((fact) =>
    matchesFilter(fact, activeFilter),
  );

  return (
    <div className="h-full w-full overflow-y-auto p-3 font-mono md:w-[360px] md:p-4">
      <div className="mb-4 border-4 border-[var(--ink)] bg-[var(--panel)] p-3 shadow-[4px_4px_0_var(--ink)] rounded-none">
        <p className="text-xs font-bold uppercase tracking-normal">
          Indexed Evidence
        </p>
        <h2 className="text-2xl font-black uppercase leading-none tracking-normal">
          Fact Ledger
        </h2>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setActiveFilter(filter.value)}
            className={`min-h-11 border-4 border-[var(--ink)] px-2 py-1 text-[11px] font-black uppercase shadow-[3px_3px_0_var(--ink)] rounded-none ${
              activeFilter === filter.value
                ? "bg-[var(--ink)] text-[var(--paper)]"
                : "bg-[var(--panel)] text-[var(--ink)]"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <table className="w-full border-collapse border-4 border-[var(--ink)] bg-[var(--panel)] text-left text-[11px] uppercase rounded-none">
        <thead>
          <tr>
            <th className="border-4 border-[var(--ink)] bg-[var(--ink)] px-2 py-2 align-top font-black text-[var(--paper)]">
              Fact
            </th>
            <th className="w-[116px] border-4 border-[var(--ink)] bg-[var(--ink)] px-2 py-2 align-top font-black text-[var(--paper)]">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredFacts.map((fact) => (
            <tr key={fact.id}>
              <td className="border-4 border-[var(--ink)] bg-[var(--paper)] px-2 py-2 align-top font-bold leading-tight">
                <div className="mb-2 flex flex-wrap gap-1 text-[10px]">
                  <span className="border-2 border-[var(--ink)] bg-[var(--panel)] px-1 py-0.5">
                    {fact.type}
                  </span>
                  <span className="border-2 border-[var(--ink)] bg-[var(--panel)] px-1 py-0.5">
                    {fact.status}
                  </span>
                </div>
                {fact.text}
              </td>
              <td className="border-4 border-[var(--ink)] bg-[var(--panel)] px-2 py-2 align-top">
                <button
                  type="button"
                  onClick={() => pinFactToBoard(fact.text)}
                  className="min-h-11 w-full border-2 border-[var(--ink)] bg-[var(--accent)] px-1 py-2 text-[10px] font-black uppercase leading-tight text-[var(--ink)] shadow-[3px_3px_0_var(--ink)] active:translate-x-1 active:translate-y-1 active:shadow-none rounded-none"
                >
                  [ PIN TO BOARD ]
                </button>
              </td>
            </tr>
          ))}
          {filteredFacts.length === 0 ? (
            <tr>
              <td
                colSpan={2}
                className="border-4 border-[var(--ink)] bg-[var(--paper)] px-2 py-4 text-center font-black"
              >
                No facts logged.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
