"""Command-line helpers.

    python -m app.cli init-db          create/update database tables
    python -m app.cli create-owner     create the owner login (asks for details)
    python -m app.cli import-master    import every CSV in master_data/
    python -m app.cli backup           back up the database now
    python -m app.cli test-telegram    send a test message to the owner on Telegram
    python -m app.cli test-ai "question"   ask the AI a question from the knowledge files
"""
import argparse
import getpass
import sys

from sqlalchemy import select

from app.core.db import session_scope
from app.core.setup import create_owner, import_folder, init_db


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(prog="vbays")
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("init-db")
    co = sub.add_parser("create-owner")
    co.add_argument("--name")
    co.add_argument("--email")
    co.add_argument("--phone")
    co.add_argument("--password", help="leave out to be asked safely")
    sub.add_parser("import-master")
    sub.add_parser("backup")
    sub.add_parser("test-telegram")
    ta = sub.add_parser("test-ai")
    ta.add_argument("question")
    args = p.parse_args(argv)

    if args.cmd == "init-db":
        init_db()
        print("Database is ready.")
    elif args.cmd == "create-owner":
        init_db()
        name = args.name or input("Owner name: ")
        email = args.email or input("Owner email (used to log in): ")
        phone = args.phone if args.phone is not None else (input("Phone (optional): ") or None)
        password = args.password or getpass.getpass("Password (min 8 characters): ")
        with session_scope() as db:
            u = create_owner(db, name, email, password, phone)
            print(f"Owner login ready: {u.email}")
    elif args.cmd == "import-master":
        init_db()
        with session_scope() as db:
            for key, result in import_folder(db).items():
                print(f"{key:22} {result}")
    elif args.cmd == "backup":
        from app.core import backup
        from app.core.scheduler import run_job

        run_job("manual_backup", backup.run_backup)
        files = backup.list_backups()
        print(f"Latest backup: {files[0] if files else 'none (see Backups page for the error)'}")
    elif args.cmd == "test-telegram":
        from app.core.models import User
        from app.integrations import telegram_bot

        with session_scope() as db:
            owners = [u for u in db.scalars(select(User).where(User.role == "owner")) if u.telegram_chat_id]
            if not owners:
                print("No owner has linked Telegram yet. Create a link code on the Staff page first.")
                return 1
            for u in owners:
                telegram_bot.send_message(str(u.telegram_chat_id), "👋 Test message from Vbays. Telegram is working!")
                print(f"Sent to {u.name}")
    elif args.cmd == "test-ai":
        from app.core import ai

        with session_scope() as db:
            print(ai.ask(db, args.question))
    return 0


if __name__ == "__main__":
    sys.exit(main())
