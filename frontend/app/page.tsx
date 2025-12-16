"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import PlanView from "@/components/PlanView";
import { fetchCountries, generatePlan, type Pace, type PlanResponse, type PlanRequest } from "@/lib/api";

const paceOptions: { label: string; value: Pace }[] = [
  { label: "Relaxed", value: "relaxed" },
  { label: "Balanced", value: "balanced" },
  { label: "Packed", value: "packed" },
];

// Keep your “suggestions” here (easy to add more later)
const INTEREST_OPTIONS = [
  "museums",
  "nightlife",
  "nature",
  "hiking",
  "beaches",
  "food",
  "shopping",
  "history",
  "art",
  "architecture",
  "local culture",
  "day trips",
];

function InterestsDropdown({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const display = selected.length ? selected.join(", ") : "Select interests";

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const el = wrapRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function toggleInterest(opt: string) {
    const next = new Set(selectedSet);
    if (next.has(opt)) next.delete(opt);
    else next.add(opt);
    onChange(Array.from(next));
  }

  function selectAll() {
    onChange([...options]);
  }

  function clearAll() {
    onChange([]);
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        className="mt-2 w-full rounded-xl border bg-white px-4 py-3 text-left text-sm"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="truncate text-slate-900">{display}</div>
          <div className="text-slate-400">{open ? "▲" : "▼"}</div>
        </div>
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-xl border bg-white p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-600">Choose interests</div>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-md border bg-white px-2 py-1 text-xs"
                onClick={selectAll}
              >
                Select all
              </button>
              <button
                type="button"
                className="rounded-md border bg-white px-2 py-1 text-xs"
                onClick={clearAll}
              >
                Clear
              </button>
            </div>
          </div>

          <div className="max-h-56 overflow-auto rounded-lg border bg-slate-50 p-2">
            <div className="grid grid-cols-2 gap-2">
              {options.map((opt) => {
                const checked = selectedSet.has(opt);
                return (
                  <label
                    key={opt}
                    className="flex cursor-pointer items-center gap-2 rounded-md bg-white px-2 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleInterest(opt)}
                      className="h-4 w-4"
                    />
                    <span className="capitalize">{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="mt-2 text-xs text-slate-500">
            Selected: {selected.length ? selected.join(", ") : "None"}
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const [fromCountry, setFromCountry] = useState("India");
  const [toCountry, setToCountry] = useState("United States");
  const [budget, setBudget] = useState<number>(2500);
  const [startDate, setStartDate] = useState("2025-12-14");
  const [endDate, setEndDate] = useState("2025-12-21");

  // NEW: interests as a checklist selection (still displayed comma-separated)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    "museums",
    "shopping",
    "history",
  ]);

  const [pace, setPace] = useState<Pace>("balanced");

  const [allCountries, setAllCountries] = useState<string[]>([]);
  const [chain, setChain] = useState<string[]>(["India", "United States"]);
  const [newStop, setNewStop] = useState("");

  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [err, setErr] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const list = await fetchCountries();
        setAllCountries(list);
      } catch {
        setAllCountries([
          "India",
          "United Arab Emirates",
          "United States",
          "United Kingdom",
          "France",
          "Italy",
          "Germany",
          "Austria",
          "Spain",
          "Greece",
        ]);
      }
    })();
  }, []);

  useEffect(() => {
    setChain((prev) => {
      if (prev.length >= 3) return prev;
      return [fromCountry, toCountry];
    });
  }, [fromCountry, toCountry]);

  function move(idx: number, dir: -1 | 1) {
    setChain((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      const tmp = next[idx];
      next[idx] = next[j];
      next[j] = tmp;
      return next;
    });
  }

  function remove(idx: number) {
    setChain((prev) => prev.filter((_, i) => i !== idx));
  }

  function resetChainToFromTo() {
    setChain([fromCountry, toCountry]);
  }

  function addStop() {
    const s = newStop.trim();
    if (!s) return;
    setChain((prev) => {
      if (prev.length < 2) return [fromCountry, s, toCountry];
      const next = [...prev];
      next.splice(next.length - 1, 0, s);
      return next;
    });
    setNewStop("");
  }

  async function onGenerate() {
    setErr("");
    setPlan(null);

    const payload: PlanRequest = {
      from_country: fromCountry,
      to_country: toCountry,
      budget_usd: Number(budget) || 0,
      start_date: startDate,
      end_date: endDate,
      interests: selectedInterests, // <-- comes from checklist
      pace,
      country_chain: chain,
    };

    try {
      const res = await generatePlan(payload);
      setPlan(res);
    } catch (e: any) {
      setErr(String(e?.message || e));
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-sky-400 to-emerald-400" />
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Travel Optimizer</h1>
            <p className="mt-1 text-slate-600">Build a smart route and a realistic budget plan in seconds.</p>
            <div className="mt-4 flex gap-2 text-xs text-slate-600">
              <span className="rounded-full border bg-white/70 px-3 py-1">No paid APIs</span>
              <span className="rounded-full border bg-white/70 px-3 py-1">Route + cost estimate</span>
              <span className="rounded-full border bg-white/70 px-3 py-1">FastAPI + Next.js</span>
            </div>
          </div>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <section className="rounded-3xl border bg-white/80 p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Trip preferences</h2>
            <p className="mt-1 text-sm text-slate-600">Choose From/To, then optionally add stops in between.</p>

            <datalist id="country-list">
              {allCountries.map((c) => (
                <option value={c} key={c} />
              ))}
            </datalist>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-slate-700">From</div>
                <input
                  className="mt-2 w-full rounded-xl border px-4 py-3"
                  list="country-list"
                  value={fromCountry}
                  onChange={(e) => setFromCountry(e.target.value)}
                />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-700">To</div>
                <input
                  className="mt-2 w-full rounded-xl border px-4 py-3"
                  list="country-list"
                  value={toCountry}
                  onChange={(e) => setToCountry(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-6 rounded-2xl border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">Country chain</div>
                  <div className="text-xs text-slate-500">This is what we send to the backend (in order).</div>
                </div>
                <button
                  className="rounded-full border bg-white px-3 py-1 text-xs"
                  onClick={resetChainToFromTo}
                  type="button"
                >
                  Reset to From/To
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {chain.map((c, idx) => (
                  <div key={`${c}-${idx}`} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
                    <div className="text-sm">
                      <span className="mr-2 text-slate-400">{idx + 1}.</span>
                      {c}
                    </div>
                    <div className="flex gap-2">
                      <button className="rounded-md border bg-white px-2 py-1 text-xs" onClick={() => move(idx, -1)} type="button">
                        ↑
                      </button>
                      <button className="rounded-md border bg-white px-2 py-1 text-xs" onClick={() => move(idx, 1)} type="button">
                        ↓
                      </button>
                      <button
                        className="rounded-md border bg-white px-2 py-1 text-xs text-red-600"
                        onClick={() => remove(idx)}
                        type="button"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  className="w-full rounded-xl border px-3 py-2 text-sm"
                  placeholder="Add a stop (e.g., United Arab Emirates)"
                  list="country-list"
                  value={newStop}
                  onChange={(e) => setNewStop(e.target.value)}
                />
                <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white" onClick={addStop} type="button">
                  Add
                </button>
              </div>
            </div>

            <div className="mt-6">
              <div className="text-sm font-medium text-slate-700">Budget (USD)</div>
              <input className="mt-2 w-full rounded-xl border px-4 py-3" value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-slate-700">Start date</div>
                <input className="mt-2 w-full rounded-xl border px-4 py-3" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-700">End date</div>
                <input className="mt-2 w-full rounded-xl border px-4 py-3" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            {/* UPDATED: Interests dropdown checklist */}
            <div className="mt-6">
              <div className="text-sm font-medium text-slate-700">Interests</div>
              <InterestsDropdown
                options={INTEREST_OPTIONS}
                selected={selectedInterests}
                onChange={setSelectedInterests}
              />
            </div>

            <div className="mt-6">
              <div className="text-sm font-medium text-slate-700">Pace</div>
              <select className="mt-2 w-full rounded-xl border px-4 py-3" value={pace} onChange={(e) => setPace(e.target.value as Pace)}>
                {paceOptions.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-sky-400 to-emerald-400 px-5 py-3 font-semibold text-slate-900"
              onClick={onGenerate}
            >
              Generate plan
            </button>

            {err && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}

            <div className="mt-3 text-xs text-slate-500">Tip: Add stops like “United Arab Emirates” to simulate realistic multi-country trips.</div>
          </section>

          <section className="rounded-3xl border bg-white/80 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-semibold">Your plan</h2>
                <p className="mt-1 text-sm text-slate-600">We’ve converted the API response into a readable itinerary view.</p>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500">Estimated total</div>
                <div className="text-2xl font-bold text-slate-900">{plan ? `$${plan.estimated_total}` : "—"}</div>
              </div>
            </div>

            <div className="mt-6">
              <PlanView plan={plan} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
