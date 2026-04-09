from io import BytesIO
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from db import get_pool
from auth import get_current_client

router = APIRouter(tags=["policy-statements"])

PAL_NAVY = colors.HexColor("#002855")
PAL_GOLD  = colors.HexColor("#C9A84C")
LIGHT_GREY = colors.HexColor("#F4F6FA")


def _build_pdf(policy: dict, client: dict) -> bytes:
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=20*mm, rightMargin=20*mm,
        topMargin=20*mm, bottomMargin=20*mm,
    )

    styles = getSampleStyleSheet()
    h1 = ParagraphStyle("h1", parent=styles["Heading1"], textColor=PAL_NAVY, fontSize=18, spaceAfter=2)
    h2 = ParagraphStyle("h2", parent=styles["Heading2"], textColor=PAL_NAVY, fontSize=11, spaceAfter=4)
    small = ParagraphStyle("small", parent=styles["Normal"], fontSize=8, textColor=colors.grey)
    normal = styles["Normal"]
    right = ParagraphStyle("right", parent=styles["Normal"], alignment=TA_RIGHT, fontSize=8, textColor=colors.grey)
    center = ParagraphStyle("center", parent=styles["Normal"], alignment=TA_CENTER, fontSize=8, textColor=colors.grey)

    generated = datetime.now(timezone.utc).strftime("%B %d, %Y at %H:%M UTC")

    def money(v) -> str:
        try:
            return f"TTD {float(v):,.2f}"
        except Exception:
            return str(v)

    def date_fmt(s: str) -> str:
        try:
            return datetime.fromisoformat(str(s).replace("Z", "+00:00")).strftime("%B %d, %Y")
        except Exception:
            return str(s)

    story = []

    # ── Header ────────────────────────────────────────────────────────────────
    header_data = [[
        Paragraph("<b><font color='#002855' size=16>PAL360</font></b><br/>"
                  "<font color='#888888' size=8>Pan American Life Insurance Group</font>", normal),
        Paragraph(f"<font color='#888888' size=8>Policy Statement<br/>"
                  f"Generated: {generated}</font>", right),
    ]]
    header_tbl = Table(header_data, colWidths=["60%", "40%"])
    header_tbl.setStyle(TableStyle([
        ("ALIGN",     (0, 0), (0, 0), "LEFT"),
        ("ALIGN",     (1, 0), (1, 0), "RIGHT"),
        ("VALIGN",    (0, 0), (-1, -1), "MIDDLE"),
        ("LINEBELOW", (0, 0), (-1, 0), 1.5, PAL_GOLD),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
    ]))
    story.append(header_tbl)
    story.append(Spacer(1, 8*mm))

    # ── Policyholder ──────────────────────────────────────────────────────────
    story.append(Paragraph("Policyholder", h2))
    ph_data = [
        ["Name",     client.get("name", "—")],
        ["Email",    client.get("email", "—")],
        ["Client ID", client.get("client_id", "—")],
    ]
    ph_tbl = Table(ph_data, colWidths=["35%", "65%"])
    ph_tbl.setStyle(TableStyle([
        ("FONTSIZE",  (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.grey),
        ("FONTNAME",  (0, 0), (-1, -1), "Helvetica"),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [LIGHT_GREY, colors.white]),
        ("TOPPADDING",    (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING",   (0, 0), (-1, -1), 6),
    ]))
    story.append(ph_tbl)
    story.append(Spacer(1, 6*mm))

    # ── Policy Details ────────────────────────────────────────────────────────
    story.append(Paragraph("Policy Details", h2))

    status_color = "#16a34a" if policy["status"] == "IN-FORCE" else "#dc2626"
    policy_data = [
        ["Policy Number",   policy["policy_id"]],
        ["Line of Business", policy["line"]],
        ["Status",          f'<font color="{status_color}"><b>{policy["status"]}</b></font>'],
        ["Start Date",      date_fmt(policy["start_date"])],
        ["Next Premium Due", date_fmt(policy["due_date"])],
    ]
    pol_tbl = Table(policy_data, colWidths=["35%", "65%"])
    pol_tbl.setStyle(TableStyle([
        ("FONTSIZE",  (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.grey),
        ("FONTNAME",  (0, 0), (-1, -1), "Helvetica"),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [LIGHT_GREY, colors.white]),
        ("TOPPADDING",    (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING",   (0, 0), (-1, -1), 6),
    ]))
    story.append(pol_tbl)
    story.append(Spacer(1, 6*mm))

    # ── Financial Summary ─────────────────────────────────────────────────────
    story.append(Paragraph("Financial Summary", h2))
    fin_data = [
        ["",                "Amount"],
        ["Annual Premium",  money(policy["premium"])],
        ["Coverage Amount", money(policy["coverage_amount"])],
    ]
    fin_tbl = Table(fin_data, colWidths=["50%", "50%"])
    fin_tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0), PAL_NAVY),
        ("TEXTCOLOR",     (0, 0), (-1, 0), colors.white),
        ("FONTNAME",      (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE",      (0, 0), (-1, -1), 9),
        ("ALIGN",         (1, 0), (1, -1), "RIGHT"),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [LIGHT_GREY, colors.white]),
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 6),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 6),
    ]))
    story.append(fin_tbl)
    story.append(Spacer(1, 10*mm))

    # ── Footer ────────────────────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=0.5, color=PAL_GOLD))
    story.append(Spacer(1, 3*mm))
    story.append(Paragraph(
        "This statement is for informational purposes only and does not constitute a contract of insurance. "
        "Pan American Life Insurance Group · Port of Spain, Trinidad & Tobago · pal360.tt",
        center,
    ))

    doc.build(story)
    return buf.getvalue()


@router.get("/policies/{policy_id}/statement")
async def download_statement(
    policy_id: str,
    current: dict = Depends(get_current_client),
):
    """Generate and return a PDF policy statement for the authenticated client."""
    client_id = current["sub"]
    pool = get_pool()

    async with pool.acquire() as conn:
        policy = await conn.fetchrow(
            "SELECT * FROM policies WHERE policy_id = $1 AND client_id = $2",
            policy_id, client_id,
        )
        if not policy:
            raise HTTPException(status_code=404, detail="Policy not found")

        client = await conn.fetchrow(
            "SELECT client_id, name, email FROM clients WHERE client_id = $1",
            client_id,
        )

    pdf_bytes = _build_pdf(dict(policy), dict(client))

    filename = f"PAL360_Statement_{policy_id}_{datetime.now(timezone.utc).strftime('%Y%m%d')}.pdf"
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
