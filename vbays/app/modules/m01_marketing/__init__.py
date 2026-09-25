"""M01 Marketing: automatic Instagram, YouTube and LinkedIn content + leads from social media."""


def register(app) -> None:
    from app.integrations import telegram_bot
    from app.modules.m01_marketing import jobs, publisher  # noqa: F401  (publisher registers approval handlers)
    from app.modules.m01_marketing.routes import router
    from app.modules.m01_marketing.telegram import add_handlers

    app.include_router(router)
    jobs.register()
    if add_handlers not in telegram_bot.HANDLER_HOOKS:
        telegram_bot.HANDLER_HOOKS.append(add_handlers)
