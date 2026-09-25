"""Roles and what each role may do.

To change who can do what, edit ROLE_PERMISSIONS below. "*" means everything.
Later modules add their own permissions (e.g. "crm.view_phone").
"""

ROLES: dict[str, str] = {
    "owner": "Owner",
    "manager": "Admin / Manager",
    "sales": "Sales",
    "designer": "Designer",
    "factory_manager": "Factory Manager",
    "factory_staff": "Factory Staff",
    "supervisor": "Site Supervisor",
    "accounts": "Accounts",
    "marketing": "Marketing",
}

# Every permission used anywhere in the app, with a plain-English meaning.
PERMISSIONS: dict[str, str] = {
    "dashboard.view": "See the home dashboard",
    "users.manage": "Add/edit staff and their roles",
    "settings.manage": "Change business settings",
    "modules.manage": "Switch modules on/off and test mode",
    "knowledge.view": "Read knowledge files",
    "knowledge.edit": "Edit knowledge files",
    "masterdata.view": "See rate card, materials, vendors …",
    "masterdata.import": "Import master data from Excel/CSV",
    "approvals.view": "See the approvals queue",
    "approvals.decide": "Approve/reject items addressed to your role",
    "outbox.view": "See outgoing messages (and test-mode messages)",
    "audit.view": "See the audit log",
    "customers.view_contact": "See customer phone numbers and addresses",
    "backups.run": "Run a backup now",
}

ROLE_PERMISSIONS: dict[str, set[str]] = {
    "owner": {"*"},
    "manager": set(PERMISSIONS) - {"users.manage", "modules.manage", "settings.manage"},
    "sales": {"dashboard.view", "knowledge.view", "masterdata.view", "approvals.view", "customers.view_contact"},
    "designer": {"dashboard.view", "knowledge.view", "masterdata.view"},
    "factory_manager": {"dashboard.view", "masterdata.view", "masterdata.import", "approvals.view", "approvals.decide"},
    "factory_staff": set(),  # Telegram only
    "supervisor": {"dashboard.view", "knowledge.view", "customers.view_contact"},
    "accounts": {"dashboard.view", "masterdata.view", "approvals.view", "approvals.decide", "outbox.view"},
    "marketing": {"dashboard.view", "knowledge.view", "approvals.view"},
}


def has_permission(role: str | None, permission: str) -> bool:
    if not role:
        return False
    perms = ROLE_PERMISSIONS.get(role, set())
    return "*" in perms or permission in perms


def can_decide_approval(role: str | None, approver_role: str) -> bool:
    """The owner can decide anything; others only items addressed to their role."""
    if role == "owner":
        return True
    return role == approver_role and has_permission(role, "approvals.decide")
