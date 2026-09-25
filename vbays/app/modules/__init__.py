"""List of all business modules. Each can be switched on/off in the admin website.

When a module is built, set built=True and add its folder (e.g. m01_marketing/)
with a `register(app)` function; main.py loads only the modules that are ON.
"""
from dataclasses import dataclass


@dataclass(frozen=True)
class ModuleInfo:
    code: str
    name: str
    phase: int
    built: bool = False
    package: str | None = None  # python package with register(app)


MODULES: list[ModuleInfo] = [
    ModuleInfo("M01", "Marketing (Instagram, YouTube, LinkedIn)", 2, built=True,
               package="app.modules.m01_marketing"),
    ModuleInfo("M02", "WhatsApp Sales Agent", 3),
    ModuleInfo("M03", "CRM & Lead Pipeline", 3),
    ModuleInfo("M04", "Site Visit & Measurement", 4),
    ModuleInfo("M05", "Design & Quotation", 4),
    ModuleInfo("M06", "Orders & Payments", 5),
    ModuleInfo("M07", "Factory Production", 6),
    ModuleInfo("M08", "Inventory & Purchase", 6),
    ModuleInfo("M09", "Project Execution (Site)", 7),
    ModuleInfo("M10", "Handover & After-sales", 7),
    ModuleInfo("M11", "Staff & Tasks", 8),
    ModuleInfo("M12", "Owner Dashboard & AI Assistant", 8),
    ModuleInfo("M13", "Own MCP Server (Claude Desktop)", 9),
]

BY_CODE = {m.code: m for m in MODULES}
