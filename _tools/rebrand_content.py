#!/usr/bin/env python3
"""
Rewrite every user-facing string in content.json from the NRG "Build Your Data
Center" story to Sofia Smart Contracting's general-contracting story
(UAE market, residential + commercial).

Mechanics are left untouched: frames, node positions, media ids, screen types,
pageLoad/linkClick analytics keys, deepDive keys and tour-location keys all stay
exactly as they were. Only human-readable text (titles, headings, body copy,
badges, labels) changes.

Nodes/blocks are matched on their CURRENT text before replacement, so a
mis-count raises rather than silently corrupting the file.
"""
import json, sys, io

PATH = "site/content.json"

with io.open(PATH, encoding="utf-8") as f:
    data = json.load(f)

problems = []

def expect(cond, msg):
    if not cond:
        problems.append(msg)

def find(seq, key, needle):
    """Return first item in seq whose item[key] contains needle."""
    for it in seq:
        v = it.get(key, "")
        if needle in v:
            return it
    problems.append("NOT FOUND: %r in field %r" % (needle, key))
    return {}

# ---------------------------------------------------------------- labels
data["labels"]["baseOffering"] = "Core Scope"
data["labels"]["additionalOffering"] = "Self-Delivered"
# scrollMessage stays "Scroll to explore"

phases = data["phases"]

# ============================================================ PHASE 1
p = phases[0]
expect(p["menuLink"] == "Site Evaluation", "P1 menuLink")
p["menuLink"] = "Design & Feasibility"
s = p["screens"]

# intro
s[0]["phaseTitle"] = ["Design &", "Feasibility"]
s[0]["large"] = ("In Phase 1, Sofia works with the client to understand the brief, "
                 "assess the site, develop the design, and confirm the budget and "
                 "approvals needed to build.")

# screen 1 nodes (3)
s[1]["screenSummary"] = "Confirm the essentials — the client's brief, the site conditions, and a clear budget."
n = s[1]["nodes"]
find(n, "title", "Fiber Connection").update(
    title="Client Brief",
    content="Sit down with the client to capture the vision, requirements, and priorities for the project.")
find(n, "title", "Water Supply").update(
    title="Site Survey",
    content="Survey the plot — levels, soil, boundaries, and existing services — to understand exactly what we're building on.")
find(n, "title", "Natural Gas Supply").update(
    title="In-House Design",
    content="Sofia's own design and engineering team develops the drawings, 3D visuals, and specifications in-house — keeping design and build under one roof.")

# screen 2 nodes (4)
s[2]["screenSummary"] = "Start early on cost, programme, and the authority approvals every UAE project needs."
n = s[2]["nodes"]
find(n, "title", "Load Ramp Plan").update(
    title="Project Programme",
    content="Set out the construction stages and timeline so every trade and delivery is sequenced from day one.")
find(n, "title", "TSP & ISO Engagement").update(
    title="Authority Engagement",
    content="Engage early with the municipality, civil defence, and utility providers (DEWA / ADDC) to confirm what each will require.")
find(n, "title", "Application Materials Review").update(
    title="Cost Plan & Estimate",
    content="Price the works in detail — a transparent cost plan the client can rely on before committing to build.")
find(n, "title", "Turbine Reservation").update(
    title="Value Engineering",
    content="Sofia reviews the design for smarter methods, materials, and sequencing that protect quality while reducing cost and time.")

# screen 3 nodes (5)
s[3]["screenSummary"] = "Confirm the design, approvals, and sustainability goals before breaking ground."
n = s[3]["nodes"]
find(n, "title", "Land + Environmental").update(
    title="<span>Design</span><span>Approvals</span>",
    content="Submit the design for building permit and authority approvals, and resolve comments to reach a permit to build.")
find(n, "title", "Lower-Carbon Options").update(
    title="Sustainable Design",
    content="Agree the client's sustainability goals — Estidama Pearl, LEED, energy efficiency — and build them into the design.")
find(n, "title", "Community Alignment").update(
    title="Approvals & NOCs",
    content="Coordinate NOCs and clearances from every stakeholder — utilities, telecoms, and neighbouring plots — to keep the programme moving.")
find(n, "title", "Air Permitting").update(
    title="Method Statements",
    content="Sofia prepares construction method statements and risk assessments in-house so work starts safely and to spec.")
find(n, "title", "CCS Studies").update(
    title="Site Investigation",
    content="Where needed, Sofia carries out soil and geotechnical investigation to confirm the foundation design before construction.")

# ============================================================ PHASE 2
p = phases[1]
expect(p["menuLink"] == "Site Development", "P2 menuLink")
p["menuLink"] = "Approvals & Procurement"
s = p["screens"]

s[0]["phaseTitle"] = ["Approvals &", "Procurement"]
s[0]["large"] = ("In Phase 2, permits are secured and the supply chain is built — "
                 "awarding trades and ordering materials so construction can start on time.")

# nodeDotPoints A
expect(s[1]["badge"] == "Grid-Connected Solutions", "P2 badgeA")
s[1]["badge"] = "Authority Approvals"
b = s[1]["blocks"]
find(b, "heading", "Site + Grid Reviews").update(
    heading="Building Permit Application",
    content="Submit the approved design to the municipality for a building permit, with all drawings and calculations.")
find(b, "heading", "Load Request to TSP").update(
    heading="Utility Applications",
    content="Apply to DEWA / ADDC and telecom providers for the power, water, and connectivity the project will need.")
find(b, "heading", "TSP Agreement + Deposit").update(
    heading="Authority Approvals Secured",
    content="Civil defence, municipality, and utility approvals are issued and fees settled — clearing the way to build.")
find(b, "heading", "Long-Lead Orders").update(
    heading="Long-Lead Procurement",
    content="Order long-lead items early — lifts, chillers, façade, bespoke joinery — so they never hold up the programme.")
find(b, "heading", "Permitting + Entitlements").update(
    heading="Contracts & Insurances",
    content="Put the main contract, warranties, and project insurances in place, confirming scope and responsibility for all parties.")

# break heading
expect(s[2]["heading"] == "Onsite generation needs:", "P2 breakHeading")
s[2]["heading"] = "Building the supply chain:"

# nodeDotPoints B
expect(s[3]["badge"] == "Onsite Generation", "P2 badgeB")
s[3]["badge"] = "Procurement & Subcontracts"
b = s[3]["blocks"]
find(b, "heading", "BYOP Plan").update(
    heading="Trade Package Scoping",
    content="Break the works into clear trade packages — structure, MEP, façade, finishes — ready to tender.")
find(b, "heading", "BYOP Interconnection Applications").update(
    heading="Tender & Award",
    content="Invite trusted subcontractors to tender, compare on price and capability, and award each package.")
find(b, "heading", "Full Interconnection Study").update(
    heading="Subcontractor Onboarding",
    content="Vet and onboard each subcontractor — track record, safety, and capacity — and sign the trade contracts.")
find(b, "heading", "BYOP Equipment Orders").update(
    heading="Material Procurement",
    content="Finalise orders for key materials and equipment, locking in prices and delivery dates against the programme.")

# deepDiveFeature
expect(s[4]["heading"] == "Bridge Power Solution", "P2 deepDiveFeature")
s[4]["heading"] = "Enabling Works"
s[4]["content"] = ("Sofia can start early with enabling works — site setup, hoarding, "
                   "temporary services, and shoring — so groundworks begin the moment approvals land.")
s[4]["buttonLabel"] = "Explore Enabling Works"

# ============================================================ PHASE 3
p = phases[2]
expect(p["menuLink"] == "Construction", "P3 menuLink")
# menuLink stays "Construction"
s = p["screens"]
# phaseTitle stays ["Construction"]
s[0]["large"] = ("In Phase 3, Sofia mobilises on site and builds — from foundations "
                 "and structure to the building envelope — with quality and safety managed daily.")

s[1]["screenSummary"] = "Break ground — set out the site, build the foundations, and raise the main structure."
n = s[1]["nodes"]
find(n, "title", "Load Interconnection").update(
    title="<span>Foundations &</span><span>Substructure</span>",
    content="Excavate, lay foundations, and build the substructure — the base every project depends on, set out and checked to the millimetre.")
find(n, "title", "BYOP Construction").update(
    title="Main Structure",
    content="Sofia's own crews raise the main structure — concrete frame, columns, and slabs — self-delivered for full control over quality and pace.")

s[2]["screenSummary"] = "Enclose the building — structure, envelope, and first-fix services take shape."
n = s[2]["nodes"]
find(n, "title", "Site Mobilization").update(
    title="Site Mobilisation",
    content="Sofia sets up the site — crews, plant, welfare, and safety — and gets materials flowing to the workface.")
find(n, "title", "Data Hall Construction").update(
    title="Blockwork & Partitions",
    content="Subcontractors build internal and external walls, defining every room and space within the structure.")
find(n, "title", "Natural Gas Infrastructure").update(
    title="MEP First Fix",
    content="Mechanical, electrical, and plumbing services are routed through the structure — the hidden network behind every wall and ceiling.")
find(n, "title", "Equipment Delivery").update(
    title="Material Delivery",
    content="Sofia coordinates deliveries of key materials and equipment to site, just in time for each stage of work.")
find(n, "title", "Shell Construction + Facilities").update(
    title="Envelope & Façade",
    content="The building envelope goes up — roofing, cladding, windows, and façade — sealing the structure against the weather.")

# ============================================================ PHASE 4
p = phases[3]
expect(p["menuLink"] == "Power Ramp-up", "P4 menuLink")
p["menuLink"] = "Fit-Out & Finishes"
s = p["screens"]
s[0]["phaseTitle"] = ["Fit-Out", "& Finishes"]
s[0]["large"] = ("In Phase 4, the building is fitted out — services completed, finishes "
                 "installed, and every system tested and commissioned.")

# nodeDotRail
rail = s[2]
expect(rail["toggle1"] == "Grid-Connected Solutions", "P4 toggle1")
rail["toggle1"] = "Main Contract Works"
rail["toggle2"] = "Specialist Fit-Out"
b = rail["blocks"]
find(b, "heading", "Grid Interconnection Live").update(
    heading="MEP Second Fix",
    content="With walls and ceilings closed up, MEP teams install fixtures and terminals — sockets, lights, taps, and grilles.")
find(b, "heading", "Bridge Power Online").update(
    heading="Temporary Services (Optional)",
    content="Where needed, temporary power and water keep fit-out moving until permanent services are energised.")
find(b, "heading", "Phased Power Delivery").update(
    heading="Internal Finishes",
    content="Plaster, paint, flooring, tiling, and joinery bring each space to life, room by room.")
find(b, "heading", "BYOP Online").update(
    heading="Utilities Energised",
    content="Permanent power and water are connected and live, and the building runs on its own services.")
find(b, "heading", "Full-Capacity Ramp").update(
    heading="Testing & Commissioning",
    content="Every system — electrical, HVAC, plumbing, life-safety — is tested and commissioned to prove it performs.")
find(b, "heading", "CCGT Supplement").update(
    heading="External Works & Landscaping",
    content="Driveways, hardscaping, pools, and landscaping complete the setting around the finished building.")

# ============================================================ PHASE 5
p = phases[4]
expect(p["menuLink"] == "Fully Operational", "P5 menuLink")
p["menuLink"] = "Handover & Aftercare"
s = p["screens"]
s[0]["phaseTitle"] = ["Handover &", "Aftercare"]
s[0]["large"] = ("In Phase 5, the project is snagged, cleaned, and handed over — and "
                 "Sofia stays on for warranty and aftercare.")

s[1]["screenSummary"] = "Hand over a finished project — snag-free, certified, and backed by ongoing support."
n = s[1]["nodes"]
find(n, "title", "Retail Power + Support").update(
    title="Aftercare & Maintenance",
    content="Sofia stays on after handover — a defects-liability warranty and optional maintenance to keep the building in top condition.")
find(n, "title", "Lower-Carbon Options").update(
    title="Sustainability Delivered",
    content="The sustainability targets set at design — Estidama, LEED, efficiency — are verified and certified at completion.")
find(n, "title", "BYOP Operations").update(
    title="Snagging & Handover",
    content="Sofia's team walks the project, closes every snag, and hands over keys, warranties, and O&M manuals to the client.")

# ============================================================ PHASE 6 (tour intro)
p = phases[5]
expect(p["menuLink"] == "Virtual Tour", "P6 menuLink")
p["menuLink"] = "Project Tour"
s = p["screens"]
# badge "Take a tour" stays; button stays
s[0]["phaseTitle"] = ["Explore Your", "Project"]
s[0]["large"] = ("The project is complete and handed over. Step inside to see how everything "
                 "comes together — from structure and finishes to systems, comfort, and sustainability.")

# ============================================================ PHASE 7 (tour nodes)
p = phases[6]
n = p["screens"][0]["nodes"]
tour_titles = {
    "Security + Data": "Security & Smart Home",
    "Cooling + Climate": "Cooling & Climate",
    "Power + Connectivity": "Power & Connectivity",
    "Battery + Balance": "Backup & Resilience",
    "Operations + People": "Living & Working Spaces",
    "Sustainability + Water": "Sustainability & Water",
}
for node in n:
    t = node.get("title")
    if t in tour_titles:
        node["title"] = tour_titles[t]
    else:
        problems.append("tour node title unexpected: %r" % t)

# ============================================================ TOUR blocks
tour = data["tour"]
def setblock(loc, bid, heading, content):
    blk = find(tour[loc]["blocks"], "id", bid)
    blk.update(heading=heading, content=content)

setblock("Security", "securi", "Security & Access",
    "Layered security — access control, CCTV, and smart-home integration — keeps the building and everyone in it safe.")
setblock("Security", "datahs", "Smart Building Systems",
    "Building-management systems tie lighting, climate, and security together, controllable from a single dashboard.")

setblock("Cooling", "hvaca", "HVAC & Airflow",
    "HVAC systems circulate and filter fresh air, holding a comfortable, healthy climate throughout the building.")
setblock("Cooling", "cools", "Cooling Systems",
    "Efficient chillers and air-conditioning keep every room at the right temperature, even in peak UAE summer heat.")

setblock("Power", "gridi", "Power Distribution",
    "This is where utility power enters the building and is distributed safely to every circuit, panel, and room.")
setblock("Power", "fiberc", "Connectivity & Fibre",
    "High-speed fibre and structured cabling connect the building to the world — internet, TV, and smart devices throughout.")

setblock("Battery", "batts", "Backup Power",
    "Standby generators and UPS stand ready to keep essential systems running the moment mains power drops.")
setblock("Battery", "powerm", "Energy Management",
    "Smart metering and controls balance loads and trim consumption — lower bills and a lighter footprint.")

setblock("Operations", "onsites", "Living & Working Spaces",
    "Bedrooms, offices, kitchens, and majlis are finished and furnished — spaces designed around how people actually live and work.")
setblock("Operations", "controlr", "Comfort & Detailing",
    "It's the details that make a space — level floors, crisp joinery, and finishes that feel right underfoot and to the touch.")

setblock("Sustainability", "sust", "Sustainability",
    "Solar panels, efficient systems, and smart controls cut energy use — an Estidama-minded building that costs less to run.")
setblock("Sustainability", "waterp", "Water & Efficiency",
    "Low-flow fixtures and greywater reuse cut water waste, with irrigation tuned for a desert climate.")

# ============================================================ DEEP DIVES
dd = data["deepDives"]
BRAND = "#b39a72"

# LowerCarbonPathways -> Sustainable Building Options (key kept)
d = dd["LowerCarbonPathways"]
d["title"] = "Sustainable Building Options"
d["color"] = BRAND
acc = {
    "lc1": ("Estidama Pearl Rating",
            "Design and build to the UAE's Estidama Pearl Rating System, hitting the sustainability targets set for the project."),
    "lc2": ("LEED Certification",
            "Deliver to LEED standards where the client wants globally recognised green-building certification."),
    "lc3": ("Energy-Efficient MEP",
            "High-efficiency chillers, LED lighting, and smart controls that cut running costs for the life of the building."),
    "lc4": ("Solar PV & Battery",
            "Rooftop solar and battery storage to generate clean power on site and reduce reliance on the grid."),
    "lc5": ("Sustainable Materials",
            "Low-carbon concrete, responsibly sourced timber, and regional materials that lower the project's footprint."),
    "lc6": ("Water Efficiency",
            "Low-flow fixtures, greywater reuse, and climate-tuned irrigation to save water in a desert environment."),
    "lc7": ("Smart Building Management",
            "A building-management system that monitors and optimises energy and water use automatically, day and night."),
}
for blk in d["blocks"]:
    h, c = acc[blk["id"]]
    blk["heading"], blk["content"] = h, c

# BridgePower -> Enabling Works (key kept)
d = dd["BridgePower"]
d["title"] = "Enabling Works"
d["intro"] = "Start early with enabling works so groundworks begin the moment approvals are in hand"
d["color"] = BRAND
tbl = d["blocks"][0]
tbl["title"] = "Enabling works Sofia can self-deliver"
tbl["rows"] = [
    ["Early Start", "Groundworks can begin the moment the building permit is issued"],
    ["Scope", "Site clearance, hoarding, shoring, dewatering, and temporary services"],
    ["Programme", "Runs in parallel with procurement to compress the overall schedule"],
    ["Delivery", "Self-performed by Sofia's own crews for full control of cost and pace"],
]

# GasCapabilities -> Self-Delivery Capabilities (key kept)
d = dd["GasCapabilities"]
d["title"] = "Sofia's Self-Delivery Capabilities"
d["intro"] = ("Sofia self-performs core trades with its own crews and equipment — keeping "
              "quality, cost, and programme under one roof across residential and commercial projects.")
d["color"] = BRAND
tbl = d["blocks"][0]
tbl["rows"] = [
    ["Concrete & Structure:", "In-house crews for foundations, concrete frames, and structural works."],
    ["Blockwork & Finishes:", "Directly delivered masonry, plaster, and finishing trades."],
    ["MEP Coordination:", "Managed mechanical, electrical, and plumbing works across every discipline."],
    ["Direct Labour:", "Our own skilled workforce means fewer handoffs and tighter control on site."],
    ["Cost Certainty:", "Self-delivery removes subcontractor mark-ups and reduces the risk of delay claims."],
]
txt = d["blocks"][1]
txt["title"] = "Projects across the UAE"
txt["content"] = ("From villas and residential compounds to commercial and retail fit-out, "
                  "Sofia delivers projects across the Emirates.")

# RetailOfferings -> Aftercare & Maintenance (key kept)
d = dd["RetailOfferings"]
d["title"] = "Aftercare & Maintenance"
d["intro"] = "Ongoing support after handover — from the defects-liability period to long-term maintenance"
d["color"] = BRAND
tbl = d["blocks"][0]
tbl["title"] = "Support tailored to how the client uses the building:"
tbl["rows"] = [
    ["Defects Liability:", "A warranty period after handover during which Sofia fixes any defects at no cost."],
    ["Maintenance Contracts:", "Optional annual maintenance — MEP servicing, HVAC, and general upkeep."],
    ["Warranties & O&M:", "Manufacturer warranties and operation & maintenance manuals handed over in full."],
    ["Responsive Callouts:", "A single point of contact for snags and callouts long after the keys are handed over."],
]

# Onsite -> What is Self-Delivery (key kept)
d = dd["Onsite"]
d["title"] = "What is Self-Delivery"
d["color"] = BRAND
d["blocks"][0]["content"] = (
    "Self-delivery means Sofia performs the work directly with its own in-house crews, "
    "plant, and equipment — rather than passing it to a subcontractor. <br><br> Keeping core "
    "trades in-house gives tighter control over quality, cost, and programme, and fewer handoffs on site.")

# Contact -> Ready to build with Sofia?
d = dd["Contact"]
d["title"] = "Ready to build with Sofia?"
d["color"] = BRAND
# intro "Whatever you need, we'll help you get it done." stays
d["blocks"][1]["content"] = (
    'By clicking the "Get in Touch" button, you agree to be contacted by Sofia Smart '
    "Contracting about your enquiry using the phone, email, or mobile number you provided. "
    "We use your details only to respond to you and never share them with third parties for marketing.")

# ---------------------------------------------------------------- write
if problems:
    print("ABORTED — unresolved matches:")
    for pr in problems:
        print("  -", pr)
    sys.exit(1)

with io.open(PATH, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=1, ensure_ascii=False)
    f.write("\n")

print("OK — content.json rewritten.")
