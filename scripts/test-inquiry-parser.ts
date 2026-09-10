import { parseInquiry, buildRequirement } from '../lib/inquiryParser';

const samples: Record<string, string> = {
  'Sample 1 — Oxford to Rio (dry ice)': `Please find below our quotation for the airfreight shipment from Oxford, UK to Rio de Janeiro (GIG), Brazil.
Shipment Details
Incoterm: EXW
Origin: Refeyn Ltd, Oxford, United Kingdom
Destination: GIG – Rio de Janeiro, Brazil
Cargo:
1 pc – 40 × 40 × 40 cm – 9 kg – Dry Ice / -80°C
1 pc – 35 × 28 × 40 cm – 2 kg – 18–25°C
Total: 2 pcs / 11 kg
Flight Details – Emirates
07 September 2026
cUSTOMER : "Zafar - River Edge Shipping Services LLC" <zafar@riveredge.ae>
LHR 09:05 → DXB 19:50
Flight: EK008
Our Quotation
Service
Amount
EXW Collection – Oxford to LHR
GBP 17.36
Airfreight LHR → GIG
GBP 207.75
TOTAL QUOTATION
GBP 569`,

  'Sample 2 — Barking to Dubai (table)': `AIR FREIGHT QUOTATION
Quotation Date: 6 September 2026
Ready Date: 6 September 2026
SHIPMENT DETAILS
Description
Details
Collection
Barking, IG11 7ZG, United Kingdom
Destination
Dubai, United Arab Emirates
Terms
EXW – Final Address
Commodity
General Cargo
Package Type
Box
Number of Packages
10 Boxes
Dimensions per Box
58 × 45 × 60 cm
Weight per Box
20 kg
Total Gross Weight
200 kg
Chargeable Weight
261 kg
Routing
London Heathrow (LHR) – Bahrain (BAH) – Dubai (DXB)
Airline
Gulf Air
FREIGHT & ORIGIN CHARGES
Service
Amount
Air Freight – LHR to DXB
£313.20
Export Customs Clearance
£71.50
TOTAL
£523.15
TOTAL QUOTED AMOUNT
£523.15`,

  'Sample 3 — Egypt to Sheffield': `Origin: Egypt (Madinat Al-Amal 11727)
Destination: Sheffield S1 1AU, United Kingdom
Ready Date: 28 August 2026
Terms: Ex-Works | Final Address Delivery
Package Type: Box
Dimensions: 33 x 33 x 23 cm
Weight: 6 kg
Quantity: 1 Box
Customer email : "Carl@cargoexpresslogistics.com" <Carl@cargoexpresslogistics.com>
Shipment type :: AIR`,
};

for (const [name, text] of Object.entries(samples)) {
  const p = parseInquiry(text);
  console.log(`\n===== ${name} =====`);
  const { cargoLines, ...rest } = p;
  console.log(rest);
  console.log('cargoLines:', cargoLines);
  console.log('--- requirement ---');
  console.log(buildRequirement(p));
}
