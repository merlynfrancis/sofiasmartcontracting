#!/usr/bin/env python3
"""
Remove em-dashes from content.json copy (rewriting each line into natural
punctuation, not a blind comma swap) and fix the two node titles that used the
inline-<span> line-break trick on short two-word titles (which glued them into
one overflowing token in the collapsed pill).
"""
import json, io, sys

PATH = "site/content.json"
raw = io.open(PATH, encoding="utf-8").read()

# (old, new) — every string is asserted present before replacing.
REPL = [
 # --- pill titles: drop the two-span trick, use a plain spaced string ---
 ("<span>Design</span><span>Approvals</span>", "Design Approvals"),
 ("<span>Foundations &</span><span>Substructure</span>", "Foundations & Substructure"),

 # --- em-dash removals ---
 ("Confirm the essentials — the client's brief, the site conditions, and a clear budget.",
  "Confirm the essentials: the client's brief, the site conditions, and a clear budget."),
 ("Survey the plot — levels, soil, boundaries, and existing services — to understand exactly what we're building on.",
  "Survey the plot for levels, soil, boundaries, and existing services, to understand exactly what we're building on."),
 ("specifications in-house — keeping design and build under one roof.",
  "specifications in-house, keeping design and build under one roof."),
 ("Price the works in detail — a transparent cost plan the client can rely on before committing to build.",
  "Price the works in detail: a transparent cost plan the client can rely on before committing to build."),
 ("Agree the client's sustainability goals — Estidama Pearl, LEED, energy efficiency — and build them into the design.",
  "Set the client's sustainability goals, whether Estidama Pearl, LEED, or energy efficiency, and build them into the design."),
 ("Coordinate NOCs and clearances from every stakeholder — utilities, telecoms, and neighbouring plots — to keep the programme moving.",
  "Coordinate NOCs and clearances from every stakeholder, including utilities, telecoms, and neighbouring plots, to keep the programme moving."),
 ("In Phase 2, permits are secured and the supply chain is built — awarding trades and ordering materials so construction can start on time.",
  "In Phase 2, permits are secured and the supply chain is built, awarding trades and ordering materials so construction can start on time."),
 ("Civil defence, municipality, and utility approvals are issued and fees settled — clearing the way to build.",
  "Civil defence, municipality, and utility approvals are issued and fees settled, clearing the way to build."),
 ("Order long-lead items early — lifts, chillers, façade, bespoke joinery — so they never hold up the programme.",
  "Order long-lead items early, from lifts and chillers to façade and bespoke joinery, so they never hold up the programme."),
 ("Break the works into clear trade packages — structure, MEP, façade, finishes — ready to tender.",
  "Break the works into clear trade packages for structure, MEP, façade, and finishes, ready to tender."),
 ("Vet and onboard each subcontractor — track record, safety, and capacity — and sign the trade contracts.",
  "Vet and onboard each subcontractor for track record, safety, and capacity, then sign the trade contracts."),
 ("Sofia can start early with enabling works — site setup, hoarding, temporary services, and shoring — so groundworks begin the moment approvals land.",
  "Sofia can start early with enabling works like site setup, hoarding, temporary services, and shoring, so groundworks begin the moment approvals land."),
 ("In Phase 3, Sofia mobilises on site and builds — from foundations and structure to the building envelope — with quality and safety managed daily.",
  "In Phase 3, Sofia mobilises on site and builds, from foundations and structure to the building envelope, with quality and safety managed daily."),
 ("Break ground — set out the site, build the foundations, and raise the main structure.",
  "Break ground: set out the site, build the foundations, and raise the main structure."),
 ("Excavate, lay foundations, and build the substructure — the base every project depends on, set out and checked to the millimetre.",
  "Excavate, lay foundations, and build the substructure, the base every project depends on, set out and checked to the millimetre."),
 ("Sofia's own crews raise the main structure — concrete frame, columns, and slabs — self-delivered for full control over quality and pace.",
  "Sofia's own crews raise the main structure, from concrete frame to columns and slabs, self-delivered for full control over quality and pace."),
 ("Enclose the building — structure, envelope, and first-fix services take shape.",
  "Enclose the building: structure, envelope, and first-fix services take shape."),
 ("Sofia sets up the site — crews, plant, welfare, and safety — and gets materials flowing to the workface.",
  "Sofia sets up the site with crews, plant, welfare, and safety, and gets materials flowing to the workface."),
 ("Mechanical, electrical, and plumbing services are routed through the structure — the hidden network behind every wall and ceiling.",
  "Mechanical, electrical, and plumbing services are routed through the structure, the hidden network behind every wall and ceiling."),
 ("The building envelope goes up — roofing, cladding, windows, and façade — sealing the structure against the weather.",
  "The building envelope goes up with roofing, cladding, windows, and façade, sealing the structure against the weather."),
 ("In Phase 4, the building is fitted out — services completed, finishes installed, and every system tested and commissioned.",
  "In Phase 4, the building is fitted out: services completed, finishes installed, and every system tested and commissioned."),
 ("With walls and ceilings closed up, MEP teams install fixtures and terminals — sockets, lights, taps, and grilles.",
  "With walls and ceilings closed up, MEP teams install fixtures and terminals: sockets, lights, taps, and grilles."),
 ("Every system — electrical, HVAC, plumbing, life-safety — is tested and commissioned to prove it performs.",
  "Every system, from electrical and HVAC to plumbing and life-safety, is tested and commissioned to prove it performs."),
 ("In Phase 5, the project is snagged, cleaned, and handed over — and Sofia stays on for warranty and aftercare.",
  "In Phase 5, the project is snagged, cleaned, and handed over, and Sofia stays on for warranty and aftercare."),
 ("Hand over a finished project — snag-free, certified, and backed by ongoing support.",
  "Hand over a finished project: snag-free, certified, and backed by ongoing support."),
 ("Sofia stays on after handover — a defects-liability warranty and optional maintenance to keep the building in top condition.",
  "Sofia stays on after handover, with a defects-liability warranty and optional maintenance to keep the building in top condition."),
 ("The sustainability targets set at design — Estidama, LEED, efficiency — are verified and certified at completion.",
  "The sustainability targets set at design, from Estidama and LEED to efficiency, are verified and certified at completion."),
 ("comes together — from structure and finishes to systems, comfort, and sustainability.",
  "comes together, from structure and finishes to systems, comfort, and sustainability."),
 ("Layered security — access control, CCTV, and smart-home integration — keeps the building and everyone in it safe.",
  "Layered security, from access control and CCTV to smart-home integration, keeps the building and everyone in it safe."),
 ("High-speed fibre and structured cabling connect the building to the world — internet, TV, and smart devices throughout.",
  "High-speed fibre and structured cabling connect the building to the world, carrying internet, TV, and smart devices throughout."),
 ("Smart metering and controls balance loads and trim consumption — lower bills and a lighter footprint.",
  "Smart metering and controls balance loads and trim consumption, for lower bills and a lighter footprint."),
 ("Bedrooms, offices, kitchens, and majlis are finished and furnished — spaces designed around how people actually live and work.",
  "Bedrooms, offices, kitchens, and majlis are finished and furnished, spaces designed around how people actually live and work."),
 ("It's the details that make a space — level floors, crisp joinery, and finishes that feel right underfoot and to the touch.",
  "It's the details that make a space: level floors, crisp joinery, and finishes that feel right underfoot and to the touch."),
 ("Solar panels, efficient systems, and smart controls cut energy use — an Estidama-minded building that costs less to run.",
  "Solar panels, efficient systems, and smart controls cut energy use, for an Estidama-minded building that costs less to run."),
 ("with its own crews and equipment — keeping quality, cost, and programme under one roof across residential and commercial projects.",
  "with its own crews and equipment, keeping quality, cost, and programme under one roof across residential and commercial projects."),
 ("Ongoing support after handover — from the defects-liability period to long-term maintenance",
  "Ongoing support after handover, from the defects-liability period to long-term maintenance"),
 ("Optional annual maintenance — MEP servicing, HVAC, and general upkeep.",
  "Optional annual maintenance covering MEP servicing, HVAC, and general upkeep."),
 ("plant, and equipment — rather than passing it to a subcontractor.",
  "plant, and equipment, rather than passing it to a subcontractor."),
]

missing = [old for old, _ in REPL if old not in raw]
if missing:
    print("ABORTED — these strings were not found verbatim:")
    for m in missing:
        print("  -", m[:80])
    sys.exit(1)

for old, new in REPL:
    raw = raw.replace(old, new)

# validate JSON parses, then write
json.loads(raw)
io.open(PATH, "w", encoding="utf-8").write(raw)

remaining = raw.count("—")
print("OK — replaced %d strings. Em-dashes remaining in content.json: %d" % (len(REPL), remaining))
