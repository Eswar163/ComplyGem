"""Generate realistic demo PDFs for the SIH demo (tender + two bidders)."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))

from app.services.pdf_extract import make_pdf

OUT = Path(__file__).resolve().parents[1] / "demo_docs"

TENDER_PAGES = ["""
GOVERNMENT e-MARKETPLACE
INVITATION OF BID - SUPPLY, INSTALLATION AND COMMISSIONING OF IT INFRASTRUCTURE

Reference No: GeM/2026/B/IT-10428
Issuing Authority: Department of Information Technology, Government of Telangana
Bid Submission Deadline: 30-09-2026, 17:00 hrs

SECTION 5 - ELIGIBILITY AND QUALIFICATION CRITERIA

5.1  The bidder shall have a minimum average annual turnover of Rs. 10 crores during
     the last three (3) financial years. A CA-certified financial statement shall be
     submitted as proof of turnover.

5.2  The bidder must have successfully completed at least 3 similar projects of supply,
     installation and commissioning of IT infrastructure in the last five (5) years.
     Work orders and completion certificates shall be submitted as evidence.

5.3  The bidder should have a minimum of 5 years of relevant experience in the field of
     IT infrastructure supply, installation and maintenance.

5.4  The bidder shall submit a valid ISO 9001:2015 certification issued by an accredited
     certification body. The certificate should remain valid through the contract period.

5.5  The bidder must be registered under GST and possess a valid GSTIN. The GST
     registration certificate shall be uploaded on the GeM portal.

5.6  The bidder shall furnish an OEM Authorization Certificate from the principal
     manufacturer for all quoted items, authorising the bidder to supply, install and
     service the equipment.

5.7  MSME / Udyam registered enterprises are exempted from payment of Earnest Money
     Deposit (EMD) upon submission of a valid Udyam registration certificate.

5.8  The bidder shall be a registered seller on the GeM portal at the time of bid
     submission. Evidence of GeM seller registration shall be provided.

5.9  All documents submitted shall remain valid as on the bid submission deadline.
     Bids with expired certificates shall be summarily rejected.
"""]

ABC_PAGES = ["""
ABC TECHNOLOGIES PRIVATE LIMITED
AUDITED FINANCIAL STATEMENTS - FY 2024-25

Prepared by: Rao & Associates, Chartered Accountants (FRN 012345S)
CA Certificate No: CA/TS/2025/08841

1. FINANCIAL HIGHLIGHTS
The annual turnover of ABC Technologies Private Limited for the financial year
2024-25 was Rs. 14.2 crore as per the audited statement of profit and loss.
Turnover for FY 2023-24 was Rs. 12.8 crore and for FY 2022-23 it was Rs. 11.1 crore.
The three-year average annual turnover therefore stands at Rs. 12.7 crore.

2. STATEMENT OF PROFIT AND LOSS (SUMMARY)
Revenue from operations .......... Rs. 14,20,00,000
Other income ..................... Rs. 8,50,000
Profit before tax ................ Rs. 1,42,00,000

This statement is certified to be true and correct for bid eligibility purposes.
""", """
ABC TECHNOLOGIES PRIVATE LIMITED
CERTIFICATE OF EXPERIENCE - SIMILAR WORKS

To Whom It May Concern:

This is to certify that ABC Technologies Private Limited has successfully completed
4 similar projects of IT infrastructure supply, installation and commissioning in the
last five (5) years. The projects are listed below:

1. Supply of 1,200 desktops and network equipment - Commissionerate of Health,
   Govt. of Telangana (Work Order WO/2023/HM/118, completed 2024, value Rs. 6.8 crore)
2. Data centre fit-out and server supply - Hyderabad Metropolitan Water Authority
   (Work Order WO/2022/HMW/071, completed 2023, value Rs. 4.2 crore)
3. Campus-wide Wi-Fi and IT infrastructure - Kakatiya University
   (Work Order WO/2021/KU/033, completed 2022, value Rs. 2.9 crore)
4. Endpoint and printing infrastructure - Telangana State Road Transport Corporation
   (Work Order WO/2020/TSRTC/052, completed 2021, value Rs. 1.8 crore)

The firm has been providing IT infrastructure services for over 7 years and has
demonstrated 7 years of relevant experience in supply, installation and maintenance
of computing and networking equipment.

Signed,
Director - Operations, ABC Technologies Private Limited
""", """
COMMERCIAL TAXES DEPARTMENT - GOODS AND SERVICES TAX
GST REGISTRATION CERTIFICATE

GSTIN: 36ABCDE1234F1Z5
Legal Name: ABC TECHNOLOGIES PRIVATE LIMITED
Trade Name: ABC Technologies
Constitution of Business: Private Limited Company
Taxpayer Type: Regular
Registration Status: Active
State Jurisdiction: Telangana - Hyderabad
Date of Registration: 12-07-2017

This certificate is computer generated and valid without signature.
""", """
OFFICE OF THE PRINCIPAL MANUFACTURER
OEM AUTHORIZATION CERTIFICATE

Reference: OEM-AUTH/2026/AP-0187

This is to certify that ABC Technologies Private Limited, Hyderabad, is our
Authorized Partner for the supply, installation, commissioning and after-sales
service of the complete range of enterprise servers, storage and networking
equipment quoted in tenders for Government of India / State Government projects.

This authorization is valid until 31-12-2027 and supersedes all earlier
authorizations issued to the partner.

Authorised Signatory - Principal Manufacturer (OEM)
""", """
GOVERNMENT e-MARKETPLACE (GeM)
SELLER REGISTRATION PROOF

Seller ID: TSSH-ABCTECH-4471
Registered Entity: ABC TECHNOLOGIES PRIVATE LIMITED
GSTIN linked to account: 36ABCDE1234F1Z5
Marketplace: GeM Portal (gem.gov.in)
Account Status: Active - Primary User verified
Seller Category: IT Infrastructure, Networking and Computing Devices

The above entity is a registered seller on the GeM portal and is eligible to
participate in bids on the marketplace.
"""]

XYZ_PAGES = ["""
XYZ SYSTEMS LIMITED
PROVISIONAL FINANCIAL STATEMENT - FY 2024-25

Summary prepared by internal finance department (unaudited):
The annual turnover of XYZ Systems Limited for FY 2024-25 was Rs. 7.1 crore.
Turnover for FY 2023-24 was Rs. 6.4 crore. The company expects turnover to
grow following its expansion in the public sector market.

Note: CA certification for FY 2024-25 is in progress and will be provided later.
""", """
XYZ SYSTEMS LIMITED
EXPERIENCE STATEMENT

XYZ Systems Limited has executed 2 similar projects in the IT infrastructure space:
1. Desktop refresh for a private bank (2023)
2. Networking upgrade for a state university department (2024)

The company has 3 years of relevant experience in the IT infrastructure domain.
Work orders can be made available on request.
""", """
GOODS AND SERVICES TAX REGISTRATION CERTIFICATE

GSTIN: 36AAACX1234M1Z7
Legal Name: XYZ SYSTEMS LIMITED
Taxpayer Type: Regular
Registration Status: Active
State Jurisdiction: Telangana - Hyderabad
Date of Registration: 03-11-2018
"""]


def main():
    OUT.mkdir(exist_ok=True)
    for name, pages in [
        ("Tender_IT_Infrastructure_2026.pdf", TENDER_PAGES),
        ("Bidder_ABC_Financial_Statement.pdf", [ABC_PAGES[0]]),
        ("Bidder_ABC_Experience_Certificate.pdf", [ABC_PAGES[1]]),
        ("Bidder_ABC_GST_Certificate.pdf", [ABC_PAGES[2]]),
        ("Bidder_ABC_OEM_Authorization.pdf", [ABC_PAGES[3]]),
        ("Bidder_ABC_GeM_Registration.pdf", [ABC_PAGES[4]]),
        ("Bidder_XYZ_Financial_Statement.pdf", [XYZ_PAGES[0]]),
        ("Bidder_XYZ_Experience_Statement.pdf", [XYZ_PAGES[1]]),
        ("Bidder_XYZ_GST_Certificate.pdf", [XYZ_PAGES[2]]),
    ]:
        data = make_pdf(name, pages)
        (OUT / name).write_bytes(data)
        print(f"wrote {name} ({len(data)} bytes)")


if __name__ == "__main__":
    main()
