# Trading — local first version

Independently authored classic exchange-inspired mobile terminal; not an exact WEX website reproduction. No code copied from GPL Android reference https://github.com/0xnm/BTC-e-client-for-Android.

Files: docs/trading-terminal.js and .css. section-carousel mounts/unmounts the terminal. Existing balances and backend are untouched.

Default is explicit deterministic demo data, no external requests. Optional Binance market-data-only REST provides 48 candles and five bid/ask levels; one combined WebSocket provides candle/depth updates. BTCUSDT/ETHUSDT only. Closing the section or hiding the document stops connections; refresh resumes. No automatic retries. Failure never silently substitutes demo data.

https://github.com/binance/binance-spot-api-docs/blob/master/faqs/market_data_only.md

Orders are session-memory simulations: positive finite amounts, balance reservation, cancellation releases funds. No automatic fills, fees, persistent wallet, matching engine, deposits or withdrawals. Do not present as production exchange. Before publication review market data redistribution terms and network availability. Candles use a basic independently authored SVG, not TradingView; advanced chart interaction is not implemented.
