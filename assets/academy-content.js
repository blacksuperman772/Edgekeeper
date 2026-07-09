/* EdgeKeeper Academy — static learning content per module.
 *
 * window.EK_ACADEMY = {
 *   primers:  { moduleKey: "<p>…</p>" }   // short readable lesson, shown before the chat
 *   quizzes:  { moduleKey: [ { q, options:[…], answer:<idx>, explain } ] }
 *   diagrams: { moduleKey: "<svg>…</svg>" } // optional visual, rendered inside the primer
 * }
 *
 * Primers are plain HTML paragraphs. Quizzes are self-checks (not graded, not gated) —
 * answers live client-side by design. Diagrams use currentColor so they inherit the theme.
 */
(function () {
  const gold = 'var(--theo, #B8A06A)';

  const diagrams = {
    reading_a_chart: `
<svg viewBox="0 0 320 170" role="img" aria-label="Price and time axes on a chart" style="width:100%;height:auto;">
  <line x1="42" y1="14" x2="42" y2="140" stroke="currentColor" stroke-opacity="0.5"/>
  <line x1="42" y1="140" x2="300" y2="140" stroke="currentColor" stroke-opacity="0.5"/>
  <text x="8" y="26" fill="currentColor" font-size="9" opacity="0.7">Price</text>
  <text x="250" y="158" fill="currentColor" font-size="9" opacity="0.7">Time →</text>
  <polyline points="42,120 80,110 118,124 156,80 194,92 232,52 270,66 300,40"
            fill="none" stroke="${gold}" stroke-width="2"/>
  <circle cx="300" cy="40" r="3" fill="${gold}"/>
  <text x="235" y="34" fill="${gold}" font-size="8">last price</text>
</svg>`,
    candlestick_basics: `
<svg viewBox="0 0 300 180" role="img" aria-label="Anatomy of a candlestick" style="width:100%;height:auto;">
  <!-- bullish candle -->
  <line x1="90" y1="20" x2="90" y2="150" stroke="currentColor" stroke-opacity="0.6"/>
  <rect x="76" y="60" width="28" height="60" fill="${gold}" fill-opacity="0.25" stroke="${gold}"/>
  <text x="118" y="26" fill="currentColor" font-size="9" opacity="0.75">high (wick)</text>
  <text x="118" y="70" fill="currentColor" font-size="9" opacity="0.75">close</text>
  <text x="118" y="118" fill="currentColor" font-size="9" opacity="0.75">open</text>
  <text x="118" y="150" fill="currentColor" font-size="9" opacity="0.75">low (wick)</text>
  <text x="60" y="170" fill="${gold}" font-size="9">bullish: close &gt; open</text>
</svg>`,
    support_resistance: `
<svg viewBox="0 0 320 170" role="img" aria-label="Price bouncing off a support level, then breaking it" style="width:100%;height:auto;">
  <line x1="30" y1="110" x2="300" y2="110" stroke="${gold}" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="30" y="104" fill="${gold}" font-size="8">support</text>
  <polyline points="30,60 60,104 90,70 120,106 150,66 180,108 210,80 240,130 270,150 300,150"
            fill="none" stroke="currentColor" stroke-width="1.6" stroke-opacity="0.8"/>
  <text x="196" y="150" fill="currentColor" font-size="8" opacity="0.7">breaks &amp; holds below</text>
</svg>`,
    trend_identification: `
<svg viewBox="0 0 320 170" role="img" aria-label="An uptrend of higher highs and higher lows" style="width:100%;height:auto;">
  <polyline points="30,140 70,90 100,110 140,60 170,80 210,34 240,54 290,20"
            fill="none" stroke="${gold}" stroke-width="1.8"/>
  <circle cx="70" cy="90" r="2.5" fill="${gold}"/><text x="52" y="84" fill="currentColor" font-size="7" opacity="0.75">HH</text>
  <circle cx="140" cy="60" r="2.5" fill="${gold}"/><text x="124" y="54" fill="currentColor" font-size="7" opacity="0.75">HH</text>
  <circle cx="210" cy="34" r="2.5" fill="${gold}"/><text x="196" y="28" fill="currentColor" font-size="7" opacity="0.75">HH</text>
  <circle cx="100" cy="110" r="2.5" fill="currentColor"/><text x="86" y="126" fill="currentColor" font-size="7" opacity="0.6">HL</text>
  <circle cx="170" cy="80" r="2.5" fill="currentColor"/><text x="156" y="96" fill="currentColor" font-size="7" opacity="0.6">HL</text>
  <text x="120" y="164" fill="${gold}" font-size="8">uptrend: higher highs &amp; higher lows</text>
</svg>`,
    risk_reward_ratio: `
<svg viewBox="0 0 300 170" role="img" aria-label="Risk of one unit below entry, reward of two units above" style="width:100%;height:auto;">
  <line x1="60" y1="100" x2="240" y2="100" stroke="currentColor" stroke-opacity="0.7"/>
  <text x="245" y="103" fill="currentColor" font-size="8" opacity="0.75">entry</text>
  <rect x="120" y="100" width="60" height="40" fill="#C77" fill-opacity="0.18" stroke="#C77" stroke-opacity="0.5"/>
  <text x="184" y="126" fill="#c88" font-size="8">risk = 1R (stop)</text>
  <rect x="120" y="20" width="60" height="80" fill="${gold}" fill-opacity="0.18" stroke="${gold}" stroke-opacity="0.6"/>
  <text x="184" y="58" fill="${gold}" font-size="8">reward = 2R (target)</text>
  <text x="60" y="160" fill="currentColor" font-size="8" opacity="0.7">1:2 — win 40% and still come out ahead</text>
</svg>`,
    moving_averages: `
<svg viewBox="0 0 320 170" role="img" aria-label="Jagged price riding above a smooth rising moving average" style="width:100%;height:auto;">
  <polyline points="20,120 50,90 70,112 100,70 120,96 150,60 180,82 210,46 240,66 300,36" fill="none" stroke="currentColor" stroke-width="1.4" stroke-opacity="0.85"/>
  <polyline points="20,132 60,118 100,106 140,94 180,80 220,68 260,56 300,46" fill="none" stroke="${gold}" stroke-width="2"/>
  <text x="242" y="30" fill="currentColor" font-size="8" opacity="0.7">price</text>
  <text x="120" y="152" fill="${gold}" font-size="8">the average — a floor on pullbacks</text>
</svg>`,
    volume_basics: `
<svg viewBox="0 0 320 170" role="img" aria-label="A breakout confirmed by a tall volume bar" style="width:100%;height:auto;">
  <polyline points="20,80 60,72 100,78 140,64 180,66 210,40 260,30 300,26" fill="none" stroke="currentColor" stroke-width="1.5" stroke-opacity="0.85"/>
  <text x="196" y="20" fill="currentColor" font-size="8" opacity="0.7">breakout</text>
  <rect x="20" y="120" width="12" height="20" fill="currentColor" fill-opacity="0.2"/>
  <rect x="55" y="125" width="12" height="15" fill="currentColor" fill-opacity="0.2"/>
  <rect x="90" y="118" width="12" height="22" fill="currentColor" fill-opacity="0.2"/>
  <rect x="125" y="128" width="12" height="12" fill="currentColor" fill-opacity="0.2"/>
  <rect x="160" y="130" width="12" height="10" fill="currentColor" fill-opacity="0.2"/>
  <rect x="195" y="95" width="12" height="45" fill="${gold}" fill-opacity="0.5" stroke="${gold}"/>
  <rect x="250" y="108" width="12" height="32" fill="currentColor" fill-opacity="0.2"/>
  <text x="120" y="158" fill="${gold}" font-size="8">high volume confirms the move</text>
</svg>`,
    chart_patterns: `
<svg viewBox="0 0 320 170" role="img" aria-label="A bull flag: strong pole, small pullback, breakout" style="width:100%;height:auto;">
  <polyline points="20,140 55,60" fill="none" stroke="${gold}" stroke-width="2"/>
  <text x="18" y="128" fill="currentColor" font-size="8" opacity="0.7">pole</text>
  <polyline points="55,60 75,72 95,64 115,78" fill="none" stroke="currentColor" stroke-width="1.4"/>
  <line x1="52" y1="52" x2="118" y2="70" stroke="currentColor" stroke-opacity="0.35" stroke-dasharray="3 3"/>
  <line x1="58" y1="80" x2="122" y2="96" stroke="currentColor" stroke-opacity="0.35" stroke-dasharray="3 3"/>
  <text x="66" y="104" fill="currentColor" font-size="8" opacity="0.7">flag</text>
  <polyline points="115,78 140,40 175,20" fill="none" stroke="${gold}" stroke-width="2"/>
  <text x="140" y="16" fill="${gold}" font-size="8">breakout (once confirmed)</text>
</svg>`,
    multi_timeframe: `
<svg viewBox="0 0 320 170" role="img" aria-label="Higher-timeframe uptrend with a lower-timeframe pullback into support" style="width:100%;height:auto;">
  <polyline points="20,130 80,90 140,100 200,60 260,72 300,40" fill="none" stroke="currentColor" stroke-width="1.6"/>
  <text x="20" y="120" fill="currentColor" font-size="8" opacity="0.7">daily: uptrend</text>
  <line x1="138" y1="100" x2="205" y2="100" stroke="${gold}" stroke-opacity="0.5" stroke-dasharray="4 3"/>
  <circle cx="170" cy="100" r="5" fill="none" stroke="${gold}"/>
  <text x="120" y="122" fill="${gold}" font-size="8">15m pullback into support = the entry</text>
</svg>`,
    one_percent_rule: `
<svg viewBox="0 0 320 170" role="img" aria-label="Steady 1 percent equity curve survives while oversized risk blows up" style="width:100%;height:auto;">
  <line x1="30" y1="20" x2="30" y2="140" stroke="currentColor" stroke-opacity="0.4"/>
  <line x1="30" y1="140" x2="300" y2="140" stroke="currentColor" stroke-opacity="0.4"/>
  <polyline points="30,130 90,118 150,104 210,88 300,66" fill="none" stroke="${gold}" stroke-width="2"/>
  <text x="225" y="60" fill="${gold}" font-size="8">1% risk — survives</text>
  <polyline points="30,130 80,72 120,92 160,44 200,112 240,150 262,152" fill="none" stroke="#C77" stroke-width="1.6"/>
  <text x="120" y="166" fill="#c88" font-size="8">oversized — one streak ends it</text>
</svg>`,
    drawdown_management: `
<svg viewBox="0 0 320 170" role="img" aria-label="A 50 percent drawdown needs a 100 percent gain to recover" style="width:100%;height:auto;">
  <line x1="30" y1="30" x2="30" y2="145" stroke="currentColor" stroke-opacity="0.4"/>
  <line x1="30" y1="85" x2="300" y2="85" stroke="currentColor" stroke-opacity="0.25" stroke-dasharray="3 3"/>
  <text x="34" y="80" fill="currentColor" font-size="7" opacity="0.6">starting equity</text>
  <polyline points="30,50 90,55 130,120 200,120" fill="none" stroke="#C77" stroke-width="1.8"/>
  <text x="120" y="136" fill="#c88" font-size="8">−50%</text>
  <polyline points="200,120 300,50" fill="none" stroke="${gold}" stroke-width="1.8" stroke-dasharray="4 3"/>
  <text x="200" y="42" fill="${gold}" font-size="8">needs +100% just to get back</text>
</svg>`,
    how_orders_work: `
<svg viewBox="0 0 320 170" role="img" aria-label="Market, limit and stop orders relative to the current price" style="width:100%;height:auto;">
  <line x1="60" y1="20" x2="60" y2="150" stroke="currentColor" stroke-opacity="0.35"/>
  <text x="40" y="16" fill="currentColor" font-size="7" opacity="0.6">price</text>
  <line x1="60" y1="90" x2="285" y2="90" stroke="currentColor" stroke-width="1.4"/>
  <circle cx="150" cy="90" r="3" fill="${gold}"/>
  <text x="160" y="86" fill="${gold}" font-size="8">market — fills now</text>
  <line x1="60" y1="55" x2="285" y2="55" stroke="currentColor" stroke-opacity="0.4" stroke-dasharray="4 3"/>
  <text x="160" y="51" fill="currentColor" font-size="8" opacity="0.75">stop — triggers above</text>
  <line x1="60" y1="128" x2="285" y2="128" stroke="currentColor" stroke-opacity="0.4" stroke-dasharray="4 3"/>
  <text x="160" y="124" fill="currentColor" font-size="8" opacity="0.75">limit — waits below</text>
</svg>`,
    market_sessions: `
<svg viewBox="0 0 320 120" role="img" aria-label="Asia, London and New York sessions with the London/New York overlap" style="width:100%;height:auto;">
  <rect x="20" y="30" width="90" height="16" fill="currentColor" fill-opacity="0.15"/>
  <text x="24" y="26" fill="currentColor" font-size="8" opacity="0.7">Asia</text>
  <rect x="120" y="52" width="120" height="16" fill="currentColor" fill-opacity="0.15"/>
  <text x="124" y="48" fill="currentColor" font-size="8" opacity="0.7">London</text>
  <rect x="200" y="74" width="100" height="16" fill="currentColor" fill-opacity="0.15"/>
  <text x="204" y="70" fill="currentColor" font-size="8" opacity="0.7">New York</text>
  <rect x="200" y="52" width="40" height="16" fill="${gold}" fill-opacity="0.4" stroke="${gold}"/>
  <text x="90" y="110" fill="${gold}" font-size="8">London/NY overlap — busiest, tightest spreads</text>
</svg>`,
    entry_exit_mechanics: `
<svg viewBox="0 0 320 170" role="img" aria-label="Entry, stop and target all defined before the trade" style="width:100%;height:auto;">
  <polyline points="30,110 90,100 140,112 200,70 260,60 300,40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-opacity="0.85"/>
  <circle cx="140" cy="112" r="4" fill="${gold}"/>
  <text x="96" y="128" fill="${gold}" font-size="8">entry</text>
  <line x1="30" y1="140" x2="300" y2="140" stroke="#C77" stroke-opacity="0.5" stroke-dasharray="4 3"/>
  <text x="205" y="152" fill="#c88" font-size="8">stop (you were wrong)</text>
  <line x1="30" y1="45" x2="300" y2="45" stroke="${gold}" stroke-opacity="0.5" stroke-dasharray="4 3"/>
  <text x="200" y="40" fill="${gold}" font-size="8">target (you were right)</text>
</svg>`,
    setting_stops_targets: `
<svg viewBox="0 0 320 170" role="img" aria-label="Stop placed just beyond the level that invalidates the trade" style="width:100%;height:auto;">
  <line x1="30" y1="95" x2="300" y2="95" stroke="${gold}" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="30" y="89" fill="${gold}" font-size="8">support level</text>
  <polyline points="40,60 90,80 140,70 190,88 240,66 290,50" fill="none" stroke="currentColor" stroke-width="1.5" stroke-opacity="0.85"/>
  <circle cx="140" cy="70" r="3.5" fill="currentColor"/>
  <text x="150" y="66" fill="currentColor" font-size="8" opacity="0.75">entry</text>
  <line x1="30" y1="112" x2="300" y2="112" stroke="#C77" stroke-opacity="0.5" stroke-dasharray="3 3"/>
  <text x="120" y="128" fill="#c88" font-size="8">stop just below — where the idea is wrong</text>
</svg>`,
    position_sizing: `
<svg viewBox="0 0 320 170" role="img" aria-label="A tight stop allows a larger position and a wide stop a smaller one, for the same risk" style="width:100%;height:auto;">
  <text x="20" y="24" fill="currentColor" font-size="8" opacity="0.7">same $ risk, different stops:</text>
  <line x1="30" y1="55" x2="70" y2="55" stroke="#C77" stroke-width="2"/>
  <text x="30" y="48" fill="#c88" font-size="7">tight stop</text>
  <rect x="120" y="46" width="150" height="16" fill="${gold}" fill-opacity="0.35" stroke="${gold}"/>
  <text x="200" y="58" fill="${gold}" font-size="8">big size</text>
  <line x1="30" y1="110" x2="110" y2="110" stroke="#C77" stroke-width="2"/>
  <text x="30" y="103" fill="#c88" font-size="7">wide stop</text>
  <rect x="120" y="101" width="70" height="16" fill="${gold}" fill-opacity="0.35" stroke="${gold}"/>
  <text x="200" y="113" fill="${gold}" font-size="8">small size</text>
  <text x="20" y="150" fill="currentColor" font-size="8" opacity="0.7">size = risk ÷ stop distance</text>
</svg>`,
    what_risk_means: `
<svg viewBox="0 0 320 150" role="img" aria-label="After ten losses, 1 percent risk leaves most of the account while 20 percent wipes it" style="width:100%;height:auto;">
  <text x="20" y="24" fill="currentColor" font-size="8" opacity="0.7">account after a 10-loss streak:</text>
  <rect x="20" y="40" width="260" height="18" fill="none" stroke="currentColor" stroke-opacity="0.3"/>
  <rect x="20" y="40" width="234" height="18" fill="${gold}" fill-opacity="0.35"/>
  <text x="20" y="74" fill="${gold}" font-size="8">1% risk → about 90% still there</text>
  <rect x="20" y="90" width="260" height="18" fill="none" stroke="currentColor" stroke-opacity="0.3"/>
  <rect x="20" y="90" width="28" height="18" fill="#C77" fill-opacity="0.4"/>
  <text x="20" y="124" fill="#c88" font-size="8">20% risk → almost nothing left</text>
</svg>`,
    rsi_macd: `
<svg viewBox="0 0 320 170" role="img" aria-label="Bearish divergence: price makes a higher high while the oscillator makes a lower high" style="width:100%;height:auto;">
  <polyline points="20,70 60,40 100,60 140,25 180,55" fill="none" stroke="currentColor" stroke-width="1.5"/>
  <text x="20" y="18" fill="currentColor" font-size="7" opacity="0.6">price: higher high</text>
  <circle cx="60" cy="40" r="2.5" fill="currentColor"/><circle cx="140" cy="25" r="2.5" fill="currentColor"/>
  <line x1="60" y1="40" x2="140" y2="25" stroke="currentColor" stroke-opacity="0.4" stroke-dasharray="3 3"/>
  <polyline points="20,140 60,110 100,128 140,120 180,132" fill="none" stroke="${gold}" stroke-width="1.5"/>
  <text x="20" y="162" fill="${gold}" font-size="7">RSI: lower high = divergence</text>
  <circle cx="60" cy="110" r="2.5" fill="${gold}"/><circle cx="140" cy="120" r="2.5" fill="${gold}"/>
  <line x1="60" y1="110" x2="140" y2="120" stroke="${gold}" stroke-opacity="0.5" stroke-dasharray="3 3"/>
</svg>`,
    compounding_principles: `
<svg viewBox="0 0 320 170" role="img" aria-label="A compounding curve accelerating above a straight line" style="width:100%;height:auto;">
  <line x1="30" y1="20" x2="30" y2="145" stroke="currentColor" stroke-opacity="0.4"/>
  <line x1="30" y1="145" x2="300" y2="145" stroke="currentColor" stroke-opacity="0.4"/>
  <line x1="30" y1="145" x2="290" y2="72" stroke="currentColor" stroke-opacity="0.3" stroke-dasharray="4 3"/>
  <text x="238" y="82" fill="currentColor" font-size="7" opacity="0.55">linear</text>
  <path d="M30,145 C130,140 210,110 290,25" fill="none" stroke="${gold}" stroke-width="2"/>
  <text x="120" y="58" fill="${gold}" font-size="8">consistent gains compound</text>
</svg>`,
    backtesting_basics: `
<svg viewBox="0 0 320 170" role="img" aria-label="A strategy built on in-sample data and then tested on out-of-sample data" style="width:100%;height:auto;">
  <rect x="20" y="34" width="150" height="106" fill="currentColor" fill-opacity="0.06"/>
  <rect x="170" y="34" width="130" height="106" fill="${gold}" fill-opacity="0.05"/>
  <line x1="170" y1="28" x2="170" y2="146" stroke="currentColor" stroke-opacity="0.4" stroke-dasharray="4 3"/>
  <polyline points="20,110 55,90 90,100 130,70 170,84 210,60 250,78 300,48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-opacity="0.85"/>
  <text x="34" y="26" fill="currentColor" font-size="8" opacity="0.7">in-sample (built here)</text>
  <text x="180" y="26" fill="${gold}" font-size="8">out-of-sample (real test)</text>
</svg>`,
  };

  const primers = {
    what_are_markets: `
<p>A market is just a place where buyers and sellers agree on a price. Nothing more mystical than that. When you buy, someone on the other side is selling to you; when you sell, someone is buying. Every trade has a counterparty.</p>
<p>Price is not set by anyone in charge. It moves to wherever the most aggressive side pushes it. More eager buyers than sellers, and price ticks up until sellers are willing to meet them. More eager sellers, and it falls. That live tug-of-war between supply and demand is all a chart is showing you.</p>
<p>"Liquidity" is how easily you can get filled without moving the price. A liquid market has plenty of buyers and sellers standing by; a thin one can jump on a single order. Keep the counterparty in mind: if you feel certain, remember someone equally certain is taking the other side.</p>`,
    asset_classes: `
<p>The four you will meet most are stocks, forex, futures, and crypto. They trade on the same basic mechanics but behave very differently, and those differences decide what suits you.</p>
<p>Stocks are ownership in a company, traded during set market hours. Forex is one currency against another (like EURUSD), trades 24 hours on weekdays, and usually comes with high leverage. Futures are standardised contracts to buy or sell something later, popular for indices and commodities. Crypto trades 24/7 and tends to be the most volatile of the group.</p>
<p>Two questions matter as a beginner: when is it open, and how much can it move? A market that trades around the clock suits someone with a day job; a highly volatile one can teach expensive lessons fast.</p>`,
    how_orders_work: `
<p>An order is how you tell the market what you want. The three you must know are market, limit, and stop.</p>
<p>A market order fills right now at the best available price — fast, but you take whatever price is there. A limit order only fills at your price or better, so you control the price but not whether you get filled. A stop order sits dormant until price reaches a trigger, then becomes a market order; traders use it to cut losses or enter on a breakout.</p>
<p>Two words to respect: spread, the gap between the buy and sell price, and slippage, when fast-moving price fills you worse than expected. A fill is never guaranteed at the price you saw. In a fast market, a stop can trigger and fill well past your level.</p>`,
    reading_a_chart: `
<p>Before any indicator or pattern, a chart is only two axes: price up the side, time along the bottom. The line or candles show where price traded at each moment. That is the raw feed everything else is built on.</p>
<p>The timeframe is the length each bar or candle represents — one minute, one hour, one day. The same market looks calm on the daily and frantic on the one-minute. Neither is lying; they are different zoom levels of the same thing.</p>
<p>Learn to read the raw price first. If you cannot describe what price is doing in plain words — rising, falling, going sideways — no indicator will save you.</p>`,
    candlestick_basics: `
<p>A candle packs four numbers into one shape: the open, the close, the high, and the low for that period. The thick part is the body, between open and close. The thin lines above and below are the wicks, reaching to the high and the low.</p>
<p>A candle that closes above its open is usually drawn light or hollow — buyers won the period. One that closes below its open is drawn dark — sellers won. The body tells you who finished in control; the wicks tell you how far each side pushed before being turned back.</p>
<p>A long lower wick means sellers drove price down but buyers shoved it back up by the close. That single shape carries a small story about the fight that just happened.</p>`,
    market_sessions: `
<p>Markets have a rhythm across the day. The three major sessions are Asia, London, and New York. Activity and volatility concentrate when big centres are awake, and thin out when they sleep.</p>
<p>The busiest window is the London/New York overlap, when both are trading at once — the most movement and the tightest spreads of the day in forex. The quiet stretch between the New York close and the Asia open is the opposite: slow, thin, easy to get chopped up in.</p>
<p>Match your trading time to your style. A fast scalper wants the busy overlap; someone holding for days cares far less. Trading the quiet hours because that is when you are free is a real cost to be honest about.</p>`,
    market_participants: `
<p>You are not the only one in the room. Broadly there are retail traders like you, institutions (funds, banks), and market makers who quote both sides to keep things liquid.</p>
<p>A market maker is not betting on direction — they earn the spread and profit from flow. Institutions move size and often think in longer horizons. Knowing who else is present changes how you read a move: a sharp rally on no news might be larger players selling into a crowd of eager retail buyers, not a reason to chase.</p>
<p>You do not need to track them trade by trade. You just need the humility that comes from remembering the other side is often better resourced than you are.</p>`,
    paper_trading: `
<p>A demo (paper) account lets you trade real prices with fake money. It is the right place to learn the mechanics — the buttons, the order types, your platform — without paying tuition to the market.</p>
<p>What it cannot teach you is the feeling. Real money brings fear, hesitation, and the urge to break your own rules, and none of that shows up when nothing is at stake. Many traders are calm and disciplined on demo and fall apart the day they go live.</p>
<p>Use paper trading to get fluent, then move to live with the smallest size you can. The goal of going small is not profit; it is to meet the emotions early, while the stakes are trivial.</p>`,
    choosing_a_broker: `
<p>Your broker holds your money and executes your trades, so choosing one is a trust decision before it is a features decision. Start with regulation: a broker overseen by a serious regulator has rules to answer to. An unregulated one does not.</p>
<p>Then look at costs (spread and commission), execution quality (do orders fill cleanly or slip), and withdrawals — how easily can you actually get your money out. Read the withdrawal terms before you deposit, not after.</p>
<p>Treat red flags as red flags. Enormous leverage, deposit bonuses, and pressure to fund quickly are marketing aimed at the impatient, not signs of a good home for your capital. The first thing to check is always whether they are properly regulated.</p>`,
    what_risk_means: `
<p>Risk is not simply "losing money." It is your exposure to loss — how much a single trade, or a bad run of them, can take from you. Understanding it is the foundation everything else rests on.</p>
<p>Think in terms of risk per trade. If you risk 1% of your account on each trade, a brutal ten-loss streak costs about 10% — painful, but survivable, and you are still in the game. Risk 20% per trade and that same streak ends you. Same losing streak, completely different outcome, decided entirely by size.</p>
<p>The unit traders use is R: one R is the amount you risk on a trade. Winners and losers measured in R keep you focused on the decision, not the dollar figure. Survival first; the returns can only come to a trader who is still trading.</p>`,

    support_resistance: `
<p>Support and resistance are the levels where price has repeatedly stopped and turned. Support is a floor buyers keep defending; resistance is a ceiling sellers keep pressing. Together they are the most useful map on any chart.</p>
<p>Why do they hold? Because traders remember them. A price that bounced three times becomes a place people expect it to bounce again, so they act there, and the level reinforces itself. The more touches, the more significance it carries.</p>
<p>Levels also break. When price closes firmly through one and holds, the role flips: old resistance often becomes new support, and old support becomes resistance. That role reversal is one of the most reliable ideas in technical analysis.</p>`,
    trend_identification: `
<p>Before any trade, answer one question: is price trending up, trending down, or going sideways? Get this wrong and every other decision is built on sand.</p>
<p>An uptrend is a staircase of higher highs and higher lows. A downtrend is lower highs and lower lows. A range is neither, price bouncing between a floor and a ceiling with no net progress. Read the swing points and the answer is usually plain.</p>
<p>Trend depends on timeframe. The daily can be up while the 5-minute is falling. Decide which timeframe you are trading and read the trend there first. The bias is to trade with the trend, not to fight it.</p>`,
    moving_averages: `
<p>A moving average is the average price over the last N periods, redrawn each bar. It smooths the noise so you can see the underlying direction, at the cost of lagging behind. It always describes the past.</p>
<p>Traders use it two ways. As trend context: price above a rising average is an uptrend backdrop, and that average often acts as a floor on pullbacks. And as dynamic support or resistance, since price tends to react around it rather than at a single fixed line.</p>
<p>The simple average weights every period equally; the exponential one weights recent prices more, so it turns faster. Neither predicts. A crossover of two averages will always describe a move that already happened, never guarantee the next one.</p>`,
    volume_basics: `
<p>Volume is how many units traded in a period. On its own it means little; as confirmation it is one of the most honest signals on the chart, because it tells you whether a move has real participation behind it.</p>
<p>A breakout on high volume is far more trustworthy than the same breakout on thin volume, which often fails and snaps back. A healthy trend usually carries healthy volume; a rally on fading volume is running out of fuel.</p>
<p>Watch for divergence: price makes a new high but volume is well below the last push. That warns you fewer traders are behind the move, and the trend may be tiring even though price still looks strong.</p>`,
    rsi_macd: `
<p>RSI and MACD are momentum indicators. They measure the speed and strength of a move, not direction alone. Used well they add context; used blindly they lose money.</p>
<p>RSI runs 0 to 100 and flags "overbought" above 70 and "oversold" below 30. The trap: in a strong trend, price can stay overbought or oversold for a long time, so RSI at 80 inside a powerful uptrend is not a sell signal by itself. MACD tracks the relationship between two moving averages to show momentum shifting.</p>
<p>The most useful signal from either is divergence, where price makes a new extreme but the indicator does not, hinting the move is losing strength. Treat both as a second opinion on price, never as the decision itself.</p>`,
    chart_patterns: `
<p>Chart patterns are recurring shapes that reflect how crowds behave: flags, wedges, triangles, head and shoulders. They are useful because they describe a build-up of pressure, but they are probabilities, not promises.</p>
<p>Roughly, patterns are either continuation (the trend pauses then resumes, like a flag after a strong move) or reversal (the trend tops or bottoms, like a head and shoulders). A pattern only counts once its key level breaks and holds. Before that, it is just a drawing.</p>
<p>Respect the failures. A textbook head and shoulders whose neckline break fails and reclaims is telling you sellers could not follow through, often a strong signal the other way. A pattern that does not do what it "should" is information.</p>`,
    multi_timeframe: `
<p>Multi-timeframe analysis means lining up a higher timeframe for context with a lower one for the entry. It is one of the most practical skills in technical trading, and it keeps you from fighting the bigger picture.</p>
<p>The higher timeframe sets the bias, say the daily is in a clear uptrend. The lower timeframe finds the trigger, like a 15-minute pullback into support inside that uptrend. When they align, the trade has the wind at its back.</p>
<p>When they conflict, the higher timeframe usually wins. If your entry chart says buy but the daily is in a firm downtrend, that is a low-probability trade dressed up as a setup. Alignment first, entry second.</p>`,
    entry_exit_mechanics: `
<p>Knowing where to trade is not the same as getting in and out cleanly. Mechanics are the difference between a good idea and a good trade.</p>
<p>Pre-define the whole thing before you click: the trigger that gets you in, the stop that says you were wrong, and the target that says you were right. Deciding the exit before you enter is what protects you from your own emotions once the trade is live and moving.</p>
<p>Do not chase. If price has already run away from your level, the clean entry is gone. Wait for the next one rather than jumping in late, where your stop has to be wider and your reward smaller.</p>`,
    setting_stops_targets: `
<p>A stop-loss is where you admit the idea was wrong; a target is where you take the reward. Placed well, they turn trading into a repeatable process. Placed by feeling, they quietly bleed the account.</p>
<p>Put the stop where the trade idea is actually invalidated, just beyond the level that would prove you wrong, not at whatever distance feels comfortable. A stop set where it "hurts least" is usually the one that gets tapped right before price reverses.</p>
<p>Set the target by structure and by risk versus reward: the next level price is likely to reach, measured against what you are risking. If a setup only offers a reward smaller than its risk, the best trade is often no trade.</p>`,

    position_sizing: `
<p>Position sizing answers the most important question in trading: how much do I put on this trade? Get it right and you survive the inevitable losing streaks. Get it wrong and one bad run ends you, however good your analysis was.</p>
<p>You size off risk, not gut feeling. Decide the amount you are willing to lose on the trade, measure the distance to your stop, and the position size falls out of the arithmetic. The same risk on every trade, regardless of how confident you feel.</p>
<p>An example: a 10,000 account risking 1% is risking 100. With a 2-point stop, that is 100 divided by 2, a 50-unit position. Widen the stop and the size must shrink to keep the risk constant. The size serves the risk, never the other way around.</p>`,
    one_percent_rule: `
<p>The one percent rule says risk no more than 1% of your account on any single trade. It sounds timid to a beginner and obvious to a professional, and that gap is most of what separates them.</p>
<p>The math is the point. At 1% risk, a brutal ten-loss streak costs about 10% of the account, painful but survivable. Push risk to 5% and the same streak costs closer to 40%, the kind of hole that changes how you trade and rarely gets climbed out of calmly.</p>
<p>Small risk per trade keeps your equity curve smooth enough that you can keep making clear decisions. It is not about caution for its own sake. It is about staying in the game long enough for your edge to show up.</p>`,
    risk_reward_ratio: `
<p>Risk/reward is the ratio between what you stand to lose and what you stand to gain on a trade. Risk 1 to make 2 and you have a 1:2 setup. It matters more than most beginners expect, and it changes what a "good" win rate even means.</p>
<p>With a 1:2 ratio you can be wrong more often than right and still make money. Win 40% of the time at 1:2 and the winners more than cover the losers over a run of trades. That is why professionals weigh the ratio, not just the hit rate.</p>
<p>Use it as a filter. Before entering, ask what the realistic reward is against the risk. If a setup only offers a reward smaller than its risk, it usually is not worth taking, however tempting the story around it.</p>`,
    daily_loss_limits: `
<p>A daily loss limit is a hard cap on how much you allow yourself to lose in one day. Hit it and you are done, screens off, no exceptions. It is one of the simplest protections a trader can build, and one of the most ignored.</p>
<p>It works because of psychology. After a couple of losses, judgment degrades and the urge to force it back grows. A limit decided while you were calm pulls you away before a bad day becomes a disastrous one.</p>
<p>Set it as a number you can state in advance, say 2% or three losing trades, and make it non-negotiable. The whole value comes from following it on exactly the day you least want to.</p>`,
    drawdown_management: `
<p>A drawdown is a stretch where your account sits below its recent peak. Every trader has them; the ones who last handle them without making the hole deeper. That is a skill, not a mood.</p>
<p>The instinct in a drawdown is to size up and win it back fast. That instinct is usually what turns a manageable drawdown into a blown account. The correct move is the opposite: cut size, tighten execution, and give yourself room to steady.</p>
<p>There is also cruel math. A 50% drawdown needs a 100% gain just to get back to even. That asymmetry is the whole argument for protecting the downside first and treating recovery as a slow, deliberate process.</p>`,
    account_preservation: `
<p>Early on, the primary goal is not to make a big return. It is to not lose the account. Capital that stays in the account can compound; capital that leaves it cannot come back and work for you.</p>
<p>This reframes every decision. A trade that risks blowing up the account is a bad trade even if it might have paid off, because survival is what makes all future gains possible. Optionality has value: staying in the game keeps every future opportunity open.</p>
<p>Beginners chase returns and lose accounts. Traders who last guard the account first and let the returns follow. Preservation is not the boring part of the job. It is the job.</p>`,
    compounding_principles: `
<p>Compounding is how small, consistent gains turn into large results over time, as each period grows on top of the last. It is the quiet engine behind most durable trading success, and it rewards patience more than brilliance.</p>
<p>The catch is asymmetry. Losses hurt compounding far more than equivalent gains help it. Steady 2% months compound powerfully, but a single minus-50% month erases years of that work. One large loss damages the curve more than many small ones of the same total.</p>
<p>So the way to compound is not to swing for enormous months. It is to protect the downside and let consistent, modest gains stack. Guarding against the one big loss is worth more than chasing the one big win.</p>`,
    when_to_stop: `
<p>Knowing when to stop is the set of rules that send you away from the screen: a daily loss limit hit, a target reached, tilt creeping in, or simply a bad state of mind. Most traders can name these rules and still ignore them.</p>
<p>They get ignored because of timing. The moment you most need to stop is the moment you least want to, so the decision cannot be made live. It has to be written down beforehand, while you are calm, so it holds when you are not.</p>
<p>Treat discipline here as design, not willpower. Rules written in advance, and made non-negotiable, do the work that raw self-control fails to do in the heat of a session.</p>`,

    what_is_edge: `
<p>An edge is a positive expectancy that only shows up over many trades. It is not a good day or a lucky week. It is a statistical tilt in your favour that, repeated enough times, produces a profit.</p>
<p>This is why win rate alone tells you little. A setup that wins only 40% of the time but makes three times its risk on winners is genuinely profitable over 100 trades. A setup that wins 70% but loses big on the other 30% can bleed money. Expectancy, not hit rate, is the measure.</p>
<p>To know whether you actually have an edge, you need a sample. A handful of trades is noise. Only over a meaningful number does the real expectancy separate from luck, which is why patience and record-keeping matter more than any single result.</p>`,
    backtesting_basics: `
<p>Backtesting is checking how a strategy would have performed on historical data. Done honestly it builds confidence before you risk real money; done carelessly it manufactures false confidence the market later takes back.</p>
<p>The great trap is curve-fitting: tuning a strategy until it looks perfect on the exact data you built it on. That is memorising the past, not finding something repeatable. A flawless backtest on its own data is not evidence, it is a warning to test further.</p>
<p>Stronger tests use out-of-sample data the strategy never saw, and forward testing on new price as it arrives. Sample size matters too. If an edge only appears on a handful of cherry-picked trades, it probably is not real.</p>`,
    journaling_for_refinement: `
<p>A trading journal is only a diary until you use it to refine. The difference between a trader who improves and one who stagnates is often what their journal is doing, not whether they keep one.</p>
<p>Record the why, not just the what. Entry, exit, and result are the score; the rationale, the emotion, and the setup type are what let you improve. Tag each trade by setup and a pattern emerges that raw P&amp;L hides, like one setup quietly losing money while another carries the account.</p>
<p>Then review by category and separate process errors from bad luck. A good trade that lost was still a good decision; a reckless trade that won was still a bad one. The journal is where you learn to tell the two apart.</p>`,
    building_your_rulebook: `
<p>A rulebook is your strategy written clearly enough to follow under pressure. Vague rules feel fine when you are calm and dissolve the moment a trade is live and your pulse is up.</p>
<p>"Buy when it looks strong" is not a rule. "Buy the retest of a level that broke on above-average volume, with the stop just below the level" is. The test is whether someone else could follow it without asking you a single question.</p>
<p>Write entry, exit, and risk rules in plain if-then form, with no room for interpretation. The point is not bureaucracy. It is to make the right action automatic when your judgment is least reliable.</p>`,
    mechanical_vs_discretionary: `
<p>Mechanical trading follows fully specified rules: the same inputs always produce the same action, regardless of how you feel. Discretionary trading uses judgment within a framework, reading context that no rule fully captures.</p>
<p>Each has a cost. The mechanical trader gives up adaptability and must trust the system through drawdowns. The discretionary trader gains flexibility but takes on a real risk: letting emotion pose as judgment, calling a bad impulse a "read".</p>
<p>Most traders land somewhere in between, with a rules-based core and a little judgment at the edges. Knowing which way you lean, and being honest about the failure mode that comes with it, matters more than picking a side.</p>`,
    your_trading_system: `
<p>A trading system is entry, exit, risk, and review pulled into one coherent thing you can actually run. Not a collection of tips, but a single process, written down, that answers every question before the market asks it.</p>
<p>A complete system states, on paper: what I trade, when I enter, where I exit, how much I risk, and how I review. If any of those is missing, that gap is where discretion and emotion leak in and quietly undo the rest.</p>
<p>The test is simple. Could a disciplined trader take your written system and run it without asking you anything? Where they would have to ask, you have a gap to close before you scale it.</p>`,

    what_is_trading: `
<p>Strip away the charts and trading is making decisions under uncertainty. You never know the outcome of the next trade; you only control the quality of the decision. That distinction is the foundation of a trader's psychology.</p>
<p>So separate decision quality from outcome quality. A well-planned trade that loses was still a good decision. A reckless trade that wins was still a bad one. The market rewards and punishes both correctly and randomly in the short run, which is why chasing outcomes warps your judgment.</p>
<p>Think in probability and expectation. No single result proves you right or wrong. Only the process, repeated across many trades, reveals whether your decisions are sound. Judge yourself on the decision, and let the outcomes average out.</p>`,
    risk_position_sizing: `
<p>Size is not just a risk-management number; it is an emotional dial. The same market move feels completely different at 1% risk than at 10%, and that feeling is what breaks most traders.</p>
<p>A 1% loss barely registers, so you stay calm and follow your plan. The same move on a 10% position floods you with fear and turns a routine drawdown into a decision made in a panic. Oversize corrupts even sound analysis.</p>
<p>So build sizing habits that keep feeling out of the trade: fixed risk per trade, decided before you enter, small enough that no single loss can rattle you. Sizing is how you regulate your own emotions before the market gets the chance to.</p>`,
    market_structure: `
<p>Market structure is the rhythm underneath the noise: is price trending, ranging, expanding, or contracting? Reading it first is what lets you act on structure instead of impulse.</p>
<p>The same signal means different things in different structure. A breakout entry that works beautifully in a trending market is a trap in a choppy range. Context grades the signal, and structure is that context.</p>
<p>Under uncertainty, structure gives you something stable to lean on. Before reacting to any single candle, name the structure you are in. Half of good decision-making is refusing to trade a signal the current structure does not support.</p>`,
    psychology_basics: `
<p>The forces that break most traders are not complicated: fear, greed, overconfidence, and revenge trading. They are ordinary human reactions that happen to be expensive in markets. The skill is catching them in yourself, in the moment.</p>
<p>Revenge trading is the sharpest example. From the inside it feels like conviction: a bigger, faster trade right after a loss, aimed at getting it back. Naming it as it starts is the whole game, because once it has you, reasoning arrives too late.</p>
<p>You cannot delete these emotions, and trying to is a losing battle. The realistic goal is awareness fast enough to act: to notice the trigger, name the state, and step back before it makes the decision for you.</p>`,
    trading_journal_setup: `
<p>A journal that only records wins and losses tells you the score. A journal built to improve you records what you felt and why you acted, which is where the real lessons hide.</p>
<p>Log the setup, your rationale, your size, your emotional state, and the outcome. Review on a regular cadence, not randomly. Over time the entries reveal patterns you would never notice trade by trade, like losses clustering right after a win, or your best trades all sharing one condition.</p>
<p>The one thing most traders skip is the emotional note, and it is the one that matters most. The numbers tell you what happened; the feelings and reasons tell you how to change what happens next.</p>`,
    trading_plan: `
<p>A trading plan defines what you trade, when you trade, and how you manage risk, all decided in advance. Its whole power is that it is a pre-commitment made while you are calm, to be obeyed when you are not.</p>
<p>State the instruments, the sessions, the setups you take, your risk per trade, and your daily limits. "I trade these two setups, this size, and I stop for the day at minus 2%" is worth more than any amount of in-the-moment resolve.</p>
<p>A decision about risk is far more reliable written into a plan beforehand than made live inside a trade, when the position is moving and your judgment is compromised. The plan is you, at your most clear-headed, instructing you at your least.</p>`,
    discipline_process: `
<p>There are two kinds of discipline. One is willpower, gritting your teeth to resist a bad impulse. The other is design, arranging things so the right action is the easy default. The second is the one that lasts.</p>
<p>Willpower runs out, especially under stress and after losses, exactly when you need it most. Design does not. A hard position-size cap set in your platform removes the choice to oversize, so the system holds the line instead of your self-control.</p>
<p>So the question is not "how do I be more disciplined?" It is "how do I build my process so the good behaviour happens even on a day my discipline is gone?" Answer that, and consistency stops depending on how you feel.</p>`,
    trade_management: `
<p>Trade management is what you do once you are in a position. The plan got you here; now the job is to follow it without letting emotion improvise.</p>
<p>Distinguish a real adjustment from a fearful one. Moving a stop to breakeven because the structure now supports it is management. Yanking the stop wider because you cannot accept the loss is fear wearing management's clothes. The difference is whether there is a reason beyond the discomfort.</p>
<p>Most mid-trade mistakes are attempts to escape a feeling: taking profit early out of anxiety, widening a stop to avoid being wrong. Decide the rules before you enter, and let the trade play out inside them rather than renegotiating live.</p>`,
    weekly_review: `
<p>The weekly review is what separates improving traders from stagnant ones. Not a glance at the P&amp;L, but a deliberate look back at how you actually behaved over the week.</p>
<p>Review by setup and by process, not just by result. The goal is to find one concrete thing to fix. "I broke my risk rule three times, all on Fridays" is worth more than a dozen vague resolutions, because it points at a specific, fixable behaviour.</p>
<p>Separate process errors from variance. A losing week where you followed your plan is very different from a winning week where you got away with breaking it. The review is where you grade the process, not the luck.</p>`,
    advanced_psychology: `
<p>Beneath your trading habits sit your beliefs and your identity, and they quietly drive the surface behaviour. Two traders with the identical strategy can get opposite results because of what is underneath.</p>
<p>A trader who believes, deep down, that they do not deserve to win will find ways to give it back, no matter how good the setup. Self-sabotage rarely announces itself; it shows up as "mistakes" that keep repeating in the same shape.</p>
<p>Working at this layer means noticing the story you tell about yourself as a trader and questioning it. The recurring pattern you cannot seem to break usually has a belief holding it in place. Change the belief and the behaviour finally moves.</p>`,
    consistency: `
<p>Consistency does not come from motivation. Motivation is unreliable by nature; some days it is there and some days it is not. Consistency comes from infrastructure: routine, environment, and conditions that make the right behaviour repeat regardless of mood.</p>
<p>The same pre-market routine, the same rules, the same review, done every day, produce consistent behaviour far more reliably than trying to summon discipline each morning. You are building a system that runs whether or not you feel like it.</p>
<p>So if you want to be consistent, stop asking yourself to feel a certain way and start designing the conditions. Remove decisions, reduce friction on the good habits, and let repetition do the work motivation cannot.</p>`,
    drawdown_recovery: `
<p>Recovering from a losing stretch is as much psychological as mechanical. The instinct is to size up and win it back fast, and that instinct is usually what turns a drawdown into a blown account.</p>
<p>The steadier path is the opposite of the instinct: cut size, clean up your execution, and rebuild confidence on small, well-managed wins. You are trying to steady your decision-making first, because that is what actually got shaky, not the market.</p>
<p>Give it time. A drawdown climbed out of slowly, with smaller size and clearer rules, leaves you intact. One you try to erase in a single big swing usually leaves you worse. Recovery is a process, not a rescue.</p>`,
    review_system: `
<p>A complete review system works at three timescales. Daily, you check whether you followed your rules. Weekly, you look for patterns across the trades. Monthly, you question the strategy and the goals themselves.</p>
<p>Each lens sees something the others cannot. The daily review catches process slips while they are fresh. The weekly catches recurring behaviour. The monthly asks the bigger question of whether the whole approach is still working.</p>
<p>The point of all three is to close the loop: to turn what you observe into a specific change. A review that ends without a decision is just record-keeping. The system is what carries an insight into next month's behaviour.</p>`,

    behavioral_analytics: `
<p>P&amp;L tells you what happened. Behavioural analytics tells you why, by turning your own trading history into data about your decisions: when you trade, how you size, what you do after a win or a loss.</p>
<p>This is a different question from performance. Instead of "did I make money?" it asks "what do I reliably do, and does it help or hurt?" The data might show your losses cluster in the first thirty minutes after a win, a pattern raw P&amp;L would never surface.</p>
<p>The value is self-knowledge you can act on. Once a behaviour is visible in the data, it stops being a vague feeling and becomes something specific you can change. You cannot fix what you cannot see.</p>`,
    pattern_recognition_self: `
<p>Every trader has recurring patterns, both the ones that cost money and the ones that make it. This module is about finding yours in your own history, not in a textbook.</p>
<p>Look across a real sample of your trades. A single bad trade is noise; a pattern is the same mistake showing up again and again in the same shape, or the same condition quietly producing your best results. The difference between the two is repetition.</p>
<p>Then act asymmetrically. Cut or guard against the patterns that lose, and lean into the ones that win. If your biggest winners all came from one setup traded before noon, that is not a curiosity, it is an instruction about where to concentrate.</p>`,
    scaling_responsibly: `
<p>Scaling up means increasing size, and it is where a lot of good traders undo themselves. The mistake is scaling on a good week rather than on proven, repeatable consistency.</p>
<p>Size also carries emotion. Doubling your position often doubles the psychological pressure before the process is proven, and both the account and your nerves can crack at once. A strategy that ran smoothly small can feel unrecognisable large.</p>
<p>So scale in increments, only after real consistency, and be willing to scale back down the moment execution slips. "I had a good week" is not the bar. Demonstrated, repeatable process at the current size is.</p>`,
    sustained_performance: `
<p>Lasting performance needs more than a good strategy. Energy, sleep, environment, routine, and recovery all feed into the quality of your decisions, and a tired trader with a real edge can still bleed it away.</p>
<p>Treat it like an athletic performance rather than a desk job. The edge only pays out through a functioning person who can execute it, and execution degrades quietly when you are exhausted, distracted, or burned out.</p>
<p>So protect the inputs. Guard your focus, cap your screen time, build a routine you can sustain, and recover deliberately. Skill sets the ceiling; the state you show up in decides how much of that ceiling you actually reach.</p>`,
    mentor_candidate: `
<p>The final shift is from student to practitioner to someone who could guide others. It is less about a profit figure and more about earned, integrated competence, and the humility that comes with it.</p>
<p>Teaching is a real test of mastery. You know you have integrated something when you can explain it clearly to another person, and when you are honest about the edges of what you still do not know. A profitable trader and a trader ready to guide others are not the same thing.</p>
<p>With that shift comes responsibility. Guiding someone means owning the limits of your own edge and never dressing up confidence as certainty. The best practitioners stay students of the market even as others start learning from them.</p>`,
  };

  const quizzes = {
    what_are_markets: [
      { q: 'You buy, and price immediately drops. What does that most likely tell you?', options: ['You were cheated by the broker', 'Sellers were the more aggressive side just then', 'The market is broken', 'You should buy more to average down'], answer: 1, explain: 'Price falls when sellers are pushing harder than buyers. It says nothing about the broker — just who was more aggressive in that moment.' },
      { q: 'Every trade you make has…', options: ['A guaranteed profit if you are patient', 'No one on the other side', 'A counterparty taking the opposite position', 'A fixed price set by the exchange'], answer: 2, explain: 'For you to buy, someone must sell to you. There is always a counterparty, often one who feels just as certain as you do.' },
      { q: 'A "liquid" market is one where…', options: ['Prices never move', 'You can get filled easily without moving the price much', 'Only institutions can trade', 'There is no spread at all'], answer: 1, explain: 'Liquidity is depth: plenty of buyers and sellers standing by, so your order fills without jolting the price.' },
    ],
    asset_classes: [
      { q: 'Which asset class trades around the clock on weekdays and usually offers high leverage?', options: ['Individual stocks', 'Forex', 'Company bonds', 'None of them'], answer: 1, explain: 'Forex trades 24 hours on weekdays and typically comes with high leverage — which cuts both ways.' },
      { q: 'For a beginner with a full-time day job, the most practical first question about an asset is…', options: ['Which one makes the most money', 'When it is open and how much it moves', 'Which one celebrities trade', 'Which has the coolest chart'], answer: 1, explain: 'Trading hours and volatility decide whether an asset even fits your life and temperament.' },
      { q: 'Compared with a single stock, crypto is generally…', options: ['Less volatile and calmer', 'Only open during business hours', 'More volatile and open 24/7', 'Impossible to chart'], answer: 2, explain: 'Crypto trades continuously and tends to be the most volatile of the common asset classes.' },
    ],
    how_orders_work: [
      { q: 'You want to buy only if price falls to 100. Which order type fits?', options: ['Market order', 'Limit order at 100', 'Stop order above the market', 'No order can do this'], answer: 1, explain: 'A limit order fills at your price or better, so a buy limit at 100 waits for price to come to you.' },
      { q: 'The main trade-off of a market order is that…', options: ['It never fills', 'You control the price but not the fill', 'You get filled now but take whatever price is there', 'It only works on stocks'], answer: 2, explain: 'A market order prioritises speed of execution over price — you fill immediately, but at whatever price is available.' },
      { q: 'Slippage is…', options: ['A type of chart', 'When price fills you worse than expected in a fast market', 'A guaranteed profit', 'A broker fee'], answer: 1, explain: 'In fast-moving markets your order can fill past the price you saw. That gap is slippage, and a stop can suffer it badly.' },
    ],
    reading_a_chart: [
      { q: 'Before any indicators, a chart is fundamentally…', options: ['A prediction of the future', 'Price on one axis and time on the other', 'A list of news events', 'A broker advertisement'], answer: 1, explain: 'Strip everything away and a chart is just price against time. Everything else is built on that raw feed.' },
      { q: 'The same market looks calm on the daily but frantic on the 1-minute. This means…', options: ['One chart is wrong', 'They are different zoom levels of the same price', 'The broker is manipulating you', 'You should only ever use one timeframe'], answer: 1, explain: 'Timeframes are zoom levels. Neither is lying; they show the same price at different resolutions.' },
      { q: 'The single most important skill this module builds is…', options: ['Memorising indicator settings', 'Describing what price is doing in plain words', 'Predicting tomorrow exactly', 'Drawing perfect trendlines'], answer: 1, explain: 'If you cannot say plainly whether price is rising, falling, or ranging, no indicator will rescue the read.' },
    ],
    candlestick_basics: [
      { q: 'The body of a candle shows…', options: ['The highest and lowest prices', 'The distance between open and close', 'The volume traded', 'The time of day'], answer: 1, explain: 'The body spans open to close and tells you who finished the period in control. The wicks show the extremes.' },
      { q: 'A candle with a small body and a long upper wick suggests…', options: ['Buyers pushed up but sellers forced price back down by the close', 'Nothing happened', 'A guaranteed rally', 'The chart is broken'], answer: 0, explain: 'The long upper wick means price was driven up during the period, then rejected back down before the close — a small story of sellers regaining control.' },
      { q: 'A candle that closes above its open means…', options: ['Sellers won the period', 'Buyers won the period', 'The market is closed', 'Nothing can be read from it'], answer: 1, explain: 'Close above open means buyers finished the period in control — a bullish candle.' },
    ],
    market_sessions: [
      { q: 'The most active, highest-volatility window in forex is usually…', options: ['The Asia session alone', 'The London/New York overlap', 'The weekend', 'Right after the New York close'], answer: 1, explain: 'When London and New York trade at once, volume and volatility peak and spreads tighten.' },
      { q: 'A scalper is most likely to avoid…', options: ['The busy session overlaps', 'The quiet hours between the New York close and the Asia open', 'Any volatility', 'Liquid markets'], answer: 1, explain: 'Thin, quiet hours make it easy to get chopped up. Scalpers want the active, liquid windows.' },
      { q: 'Trading only the quiet hours because that is when you are free is…', options: ['Always fine, timing does not matter', 'A real cost worth being honest about', 'A guaranteed edge', 'The professional approach'], answer: 1, explain: 'Session choice affects your results. Trading thin hours out of convenience is a cost, even if a necessary one.' },
    ],
    market_participants: [
      { q: 'A market maker primarily profits from…', options: ['Predicting direction correctly', 'Earning the spread and the flow of orders', 'Long-term investing', 'Insider tips'], answer: 1, explain: 'Market makers quote both sides and earn the spread. They are built around flow, not directional bets.' },
      { q: 'A sharp rally on no news might actually be…', options: ['A reason to always chase', 'Larger players selling into eager retail buyers', 'Proof the trend is permanent', 'Impossible'], answer: 1, explain: 'Knowing who else is present changes the read. A newsless spike can be bigger players distributing into a retail crowd.' },
      { q: 'The practical takeaway about other participants is…', options: ['Track every institution trade by trade', 'Ignore them entirely', 'Stay humble — the other side is often better resourced', 'They do not exist'], answer: 2, explain: 'You cannot track them all, but remembering they are often better resourced keeps you humble and careful.' },
    ],
    paper_trading: [
      { q: 'The one thing paper trading cannot teach you is…', options: ['The order types', 'The platform buttons', 'The real emotions of money at risk', 'How charts look'], answer: 2, explain: 'Fear and the urge to break your rules only show up when real money is on the line. Demo cannot simulate that.' },
      { q: 'The best use of a demo account is to…', options: ['Trade it forever to stay safe', 'Get fluent with mechanics, then go live small', 'Prove you are a genius', 'Practise huge position sizes'], answer: 1, explain: 'Use demo to learn the mechanics, then move to the smallest live size to meet the emotions while stakes are trivial.' },
      { q: 'Why go live with tiny size rather than staying on demo?', options: ['To make big profits immediately', 'To meet the real emotions early, cheaply', 'Because demo is illegal', 'There is no reason'], answer: 1, explain: 'Small live size is not about profit. It is the cheapest way to experience the psychology demo can never reproduce.' },
    ],
    choosing_a_broker: [
      { q: 'The very first thing to check before depositing a dollar is…', options: ['The size of the deposit bonus', 'Whether the broker is properly regulated', 'How much leverage they offer', 'Their logo'], answer: 1, explain: 'Regulation means the broker answers to rules. It is the foundation the other factors sit on.' },
      { q: 'Which of these is a red flag, not an opportunity?', options: ['Clear withdrawal terms', 'Reasonable, disclosed costs', 'Enormous leverage plus deposit bonuses and pressure to fund fast', 'A serious regulator'], answer: 2, explain: 'Extreme leverage, bonuses, and urgency are marketing aimed at the impatient — classic red flags.' },
      { q: 'Withdrawal terms should be read…', options: ['Never', 'Only after you have problems', 'Before you deposit', 'By your broker, not you'], answer: 2, explain: 'Getting money out matters as much as putting it in. Read the withdrawal terms before you fund the account.' },
    ],
    what_risk_means: [
      { q: 'Risking 1% per trade instead of 20% mainly protects you by…', options: ['Guaranteeing you win', 'Letting you survive a losing streak and keep trading', 'Removing all losses', 'Increasing leverage'], answer: 1, explain: 'A ten-loss streak costs about 10% at 1% risk — survivable. At 20% it ends the account. Survival is the point.' },
      { q: 'In trading, "R" refers to…', options: ['The return on the whole account', 'The amount you risk on a single trade', 'A chart pattern', 'The broker rating'], answer: 1, explain: 'One R is your risk on a trade. Measuring outcomes in R keeps your focus on the decision, not the raw dollars.' },
      { q: 'Risk is best defined as…', options: ['Simply losing money', 'Your exposure to loss — how much a trade or a bad run can take', 'Something only beginners face', 'The broker fee'], answer: 1, explain: 'Risk is exposure to loss, not just the act of losing. Sizing it deliberately is the foundation of everything else.' },
    ],

    support_resistance: [
      { q: 'Price bounces off 50 four times, then closes decisively below it. What does 50 likely become?', options: ['Permanent support', 'New resistance (role reversal)', 'Irrelevant', 'A guaranteed buy'], answer: 1, explain: 'When a level breaks and holds, its role flips. Old support tends to become new resistance.' },
      { q: 'Support and resistance levels tend to hold because…', options: ['The exchange enforces them', 'Traders remember them and act there, reinforcing the level', 'They are random', 'Brokers set them'], answer: 1, explain: 'Levels are self-reinforcing: people expect a reaction there, trade accordingly, and make the reaction more likely.' },
      { q: 'More clean touches of a level generally make it…', options: ['Weaker', 'More significant', 'Invisible', 'Meaningless'], answer: 1, explain: 'Each clean touch adds weight, because more traders are watching and acting at that level.' },
    ],
    trend_identification: [
      { q: 'A staircase of higher highs and higher lows is…', options: ['A downtrend', 'An uptrend', 'A range', 'Noise'], answer: 1, explain: 'Higher highs and higher lows define an uptrend, and the bias is to trade with it.' },
      { q: 'The daily shows lower highs and lower lows. Is buying dips a high-probability play?', options: ['Yes, always buy dips', 'No — that is fighting a downtrend', 'It cannot be known', 'Only on Fridays'], answer: 1, explain: 'In a downtrend, buying dips fights the prevailing direction and is low probability.' },
      { q: 'Whether price is trending depends heavily on…', options: ['The broker', 'The timeframe you are reading', 'Candle colour', 'Luck'], answer: 1, explain: 'Trend is timeframe-specific. The daily can be up while the 5-minute falls, so choose a timeframe and read it there.' },
    ],
    moving_averages: [
      { q: 'A moving-average crossover…', options: ['Predicts the future reliably', 'Always describes a move that already happened', 'Never lags', 'Guarantees profit'], answer: 1, explain: 'Averages are built from past prices, so a crossover confirms a move after the fact. It never guarantees the next one.' },
      { q: 'Price above a rising 50-period average suggests…', options: ['A downtrend', 'Uptrend context, with the average often acting as a floor', 'Nothing at all', 'An immediate crash'], answer: 1, explain: 'Price above a rising average is an uptrend backdrop, and that average frequently supports pullbacks.' },
      { q: 'Compared with a simple average, an exponential average…', options: ['Ignores price', 'Weights recent prices more, so it turns faster', 'Is always flat', 'Predicts reversals'], answer: 1, explain: 'The exponential average emphasises recent data, so it reacts sooner than the equally weighted simple average.' },
    ],
    volume_basics: [
      { q: 'A breakout is most trustworthy when it happens on…', options: ['Thin volume', 'High volume', 'No volume', 'A weekend'], answer: 1, explain: 'High volume shows real participation. Thin-volume breakouts often fail and snap back.' },
      { q: 'Price makes a new high but volume is far below the last rally. This warns that…', options: ['The trend is guaranteed to continue', 'Fewer traders are behind the move; the trend may be tiring', 'Volume does not matter', 'You should add size'], answer: 1, explain: 'That divergence says participation is fading even as price rises — a caution the move is losing fuel.' },
      { q: 'Volume is most valuable as…', options: ['A standalone buy signal', 'Confirmation of what price is doing', 'A price target', 'A stop level'], answer: 1, explain: 'Volume shines as confirmation: it tells you whether a price move has genuine backing.' },
    ],
    rsi_macd: [
      { q: 'RSI reads 80 during a strong, healthy uptrend. This is…', options: ['An automatic sell signal', 'Not a sell by itself; strong trends stay overbought', 'A broker error', 'Proof of a top'], answer: 1, explain: 'Overbought can persist for a long time in a strong trend. RSI at 80 alone is not a reason to sell.' },
      { q: 'The most useful single signal from RSI or MACD is often…', options: ['The exact price', 'Divergence between the indicator and price', 'The colour', 'The volume'], answer: 1, explain: 'Divergence — price making a new extreme while the indicator does not — hints momentum is fading.' },
      { q: 'Momentum indicators are best treated as…', options: ['The final decision', 'A second opinion on price, not the decision itself', 'Guaranteed signals', 'Irrelevant'], answer: 1, explain: 'They add context to price. Trading them blindly, without reading price, is a common way to lose.' },
    ],
    chart_patterns: [
      { q: 'A chart pattern only counts once…', options: ['You draw it', 'Its key level breaks and holds', 'It appears', 'Someone names it'], answer: 1, explain: 'Until the decisive level breaks and holds, a pattern is just a drawing, not a signal.' },
      { q: 'A flag after a strong move typically signals…', options: ['Reversal', 'Continuation, once confirmed', 'Nothing', 'A crash'], answer: 1, explain: 'A flag is a continuation pattern: a brief pause before the prior move tends to resume, once the break confirms.' },
      { q: 'A head-and-shoulders neckline break fails and price reclaims. This failure…', options: ['Means nothing', 'Is information, often signalling the opposite direction', 'Guarantees a top', 'Should be ignored'], answer: 1, explain: 'When sellers cannot follow through on a textbook break, that failure often becomes a strong signal the other way.' },
    ],
    multi_timeframe: [
      { q: 'Your entry chart says buy, but the daily is in a firm downtrend. This is…', options: ['A high-probability trade', 'A low-probability trade; the higher timeframe carries more weight', 'Guaranteed profit', 'Impossible'], answer: 1, explain: 'When timeframes conflict, the higher one usually wins. Buying into a daily downtrend is low probability.' },
      { q: 'The higher timeframe is mainly used to…', options: ['Time the exact entry', 'Set the bias and context', 'Pick lot size', 'Choose a broker'], answer: 1, explain: 'The higher timeframe sets direction and context; the lower timeframe finds the precise trigger.' },
      { q: 'An aligned long setup looks like…', options: ['Daily downtrend plus a lower-timeframe rally', 'Daily uptrend plus a lower-timeframe pullback into support', 'Any two random charts', 'A coin flip'], answer: 1, explain: 'Alignment means the higher-timeframe trend and the lower-timeframe trigger point the same way.' },
    ],
    entry_exit_mechanics: [
      { q: 'Deciding your exit before you enter mainly protects you from…', options: ['Broker fees', 'Your own emotions mid-trade', 'The spread', 'Slippage'], answer: 1, explain: 'A pre-set exit removes the in-the-moment decision — exactly when emotion does the most damage.' },
      { q: 'Price has already run far from your level. The clean entry is…', options: ['Still there', 'Gone; wait for the next one rather than chase', 'Better now', 'Guaranteed'], answer: 1, explain: 'Chasing a move that already ran forces a wider stop and smaller reward. Wait for the next clean entry.' },
      { q: 'Good mechanics mean…', options: ['Improvising as you go', 'Pre-defining trigger, stop, and target before clicking', 'Only having a target', 'Never using a stop'], answer: 1, explain: 'Clean execution comes from deciding the trigger, stop, and target in advance, not mid-trade.' },
    ],
    setting_stops_targets: [
      { q: 'A stop-loss belongs…', options: ['At a comfortable fixed distance', 'Just beyond the level that would prove the idea wrong', 'At a round number', 'Wherever it hurts least'], answer: 1, explain: 'Place the stop at invalidation — beyond the point that says the idea is wrong — not at an arbitrary comfortable distance.' },
      { q: 'A stop set "where it hurts least" tends to…', options: ['Never trigger', 'Get tapped right before price reverses', 'Guarantee a win', 'Widen the reward'], answer: 1, explain: 'Comfortable stops sit at obvious spots and often get hit on noise, right before the intended move resumes.' },
      { q: 'If a setup offers a reward smaller than its risk, the best trade is often…', options: ['A bigger position', 'No trade', 'A wider stop', 'Doubling down'], answer: 1, explain: 'When the reward does not justify the risk, passing is a decision. The best trade is frequently no trade.' },
    ],

    position_sizing: [
      { q: 'Your stop is twice as far away as usual. To keep dollar risk the same, your position size must…', options: ['Double', 'Halve', 'Stay the same', 'Go to zero'], answer: 1, explain: 'Risk equals size times stop distance. If the stop doubles, size must halve to hold the risk constant.' },
      { q: 'Position size should be driven by…', options: ['How confident you feel', 'Your defined risk and stop distance', 'The size of the last winner', "A friend's position"], answer: 1, explain: 'You size off risk and stop distance, not confidence, so the risk stays constant trade to trade.' },
      { q: 'A 10,000 account risking 1% with a 2-point stop gives roughly…', options: ['A 500-unit position', 'A 50-unit position', 'A 5-unit position', 'No position'], answer: 1, explain: '100 of risk divided by a 2-point stop is a 50-unit position.' },
    ],
    one_percent_rule: [
      { q: 'At 1% risk per trade, a ten-loss streak costs about…', options: ['1%', '10%', '50%', 'The whole account'], answer: 1, explain: 'Ten losses at roughly 1% each is about 10% — painful but survivable.' },
      { q: 'The main purpose of the one percent rule is to…', options: ['Make trades exciting', 'Keep you in the game through losing streaks', 'Maximise every win', 'Impress other traders'], answer: 1, explain: 'Small, constant risk keeps the equity curve survivable so your edge has time to show.' },
      { q: 'Compared with 1% risk, risking 5% per trade…', options: ['Is safer', 'Turns the same losing streak into a much deeper hole', 'Has no effect', 'Guarantees bigger profits'], answer: 1, explain: 'At 5%, a streak that was survivable at 1% becomes a hole that is hard to climb out of calmly.' },
    ],
    risk_reward_ratio: [
      { q: 'With a 1:2 risk/reward, you can be profitable while winning…', options: ['Only above 90% of trades', 'Less than half your trades', 'Exactly 50%', 'Never'], answer: 1, explain: 'At 1:2, winners are twice the size of losers, so even a sub-50% hit rate can be profitable over a run.' },
      { q: 'Risk/reward is best used as…', options: ['A prediction of the future', 'A filter on whether a setup is worth taking', 'A guarantee', 'A lot-size calculator'], answer: 1, explain: 'Before entering, weigh realistic reward against risk. A poor ratio is a reason to pass.' },
      { q: 'A setup offers less reward than its risk. This generally means…', options: ['Take it anyway', 'It usually is not worth taking', 'Double the size', 'It is a sure thing'], answer: 1, explain: 'When the reward is smaller than the risk, the odds are stacked against you regardless of the story.' },
    ],
    daily_loss_limits: [
      { q: 'A daily loss limit works mainly because…', options: ['It increases leverage', 'It pulls you away before a bad day becomes disastrous', 'It guarantees profit', 'It impresses the broker'], answer: 1, explain: 'After a few losses judgment degrades. A pre-set limit removes you before the damage compounds.' },
      { q: 'A daily loss limit should be…', options: ['Decided in the heat of the moment', 'A number set in advance and made non-negotiable', 'Ignored on bad days', 'Different every hour'], answer: 1, explain: 'The value comes entirely from following a limit you set while calm, on the day you least want to.' },
      { q: 'The hardest and most valuable time to honour the limit is…', options: ['On a winning day', 'On exactly the day you most want to keep trading', 'When markets are closed', 'Never'], answer: 1, explain: 'The limit earns its keep precisely when the urge to force it back is strongest.' },
    ],
    drawdown_management: [
      { q: 'The instinct deep in a drawdown to size up and win it back fast is…', options: ['The professional move', 'Usually what turns a drawdown into a blown account', 'Risk-free', 'Required'], answer: 1, explain: 'Sizing up in a drawdown amplifies the damage. The steadier move is to cut size and tighten execution.' },
      { q: 'A 50% drawdown requires what gain just to break even?', options: ['50%', '100%', '25%', '10%'], answer: 1, explain: 'Halving your capital means you must double what remains to get back to even — the asymmetry that argues for protecting downside.' },
      { q: 'The correct response to a drawdown is usually to…', options: ['Increase size', 'Cut size and steady your execution', 'Stop using stops', 'Trade more often'], answer: 1, explain: 'Smaller size and cleaner execution protect your decision-making while you recover.' },
    ],
    account_preservation: [
      { q: 'For a beginner, the primary goal should be…', options: ['A huge return this month', 'Not losing the account', 'Beating everyone online', 'Maximum leverage'], answer: 1, explain: 'Capital that survives can compound. Losing the account ends the game, so preservation comes first.' },
      { q: 'Why does "do not lose the account" beat "make a big return" early on?', options: ['It does not', 'Because surviving keeps every future opportunity open', 'Because returns do not matter', 'Because brokers require it'], answer: 1, explain: 'A surviving account retains optionality. You cannot compound capital you no longer have.' },
      { q: 'A trade that risks blowing up the account is…', options: ['Fine if it might pay off', 'A bad trade even if it might have won', 'The best kind', 'Required occasionally'], answer: 1, explain: 'Survival makes all future gains possible, so a trade that threatens the account is a bad decision regardless of outcome.' },
    ],
    compounding_principles: [
      { q: 'One large loss damages a compounding curve…', options: ['Less than several small losses of the same total', 'Far more than several small losses of the same total', 'Not at all', 'Only on paper'], answer: 1, explain: 'Because of asymmetry, a single deep loss sets compounding back much further than the same amount lost in small pieces.' },
      { q: 'The way to compound well is to…', options: ['Swing for huge months', 'Protect the downside and stack consistent modest gains', 'Use maximum leverage', 'Trade constantly'], answer: 1, explain: 'Compounding rewards consistency and downside protection far more than occasional big swings.' },
      { q: 'Steady 2% months versus one minus-50% month:', options: ['The big loss barely matters', 'The big loss can erase years of steady gains', 'They cancel out evenly', 'The loss helps'], answer: 1, explain: 'Losses hurt compounding disproportionately, so one large drawdown can wipe out a long run of steady gains.' },
    ],
    when_to_stop: [
      { q: 'The rules for when to stop should be written…', options: ['In the heat of the session', 'Before the session, while you are calm', 'By your broker', 'Never'], answer: 1, explain: 'You least want to stop at the moment you most need to, so the rule must be set in advance to hold.' },
      { q: 'Discipline about stopping is best treated as…', options: ['Pure willpower', 'Design: rules written in advance and made non-negotiable', 'Optional', 'A weakness'], answer: 1, explain: 'Pre-written, non-negotiable rules do the work that raw self-control fails at under pressure.' },
      { q: 'A good stop condition is one you can…', options: ['Feel vaguely', 'State clearly in advance, like 2% or three losing trades', 'Change mid-trade', 'Ignore when winning'], answer: 1, explain: 'Concrete, pre-stated conditions are followable. Vague intentions collapse in the moment.' },
    ],

    what_is_edge: [
      { q: 'A strategy wins only 40% of its trades. Can it still be a real edge?', options: ['No, it must win more than half', 'Yes, if winners are large enough relative to losers', 'Only with leverage', 'Never'], answer: 1, explain: 'Expectancy, not win rate, decides. Winning 40% at 1:3 can be very profitable over a sample.' },
      { q: 'An edge shows up…', options: ['In a single trade', 'Over many trades, as expectancy', 'On good days only', 'Never measurably'], answer: 1, explain: 'One trade is noise. A real edge separates from luck only over a meaningful sample.' },
      { q: 'The better measure of a strategy is…', options: ['Win rate alone', 'Expectancy across many trades', 'The last trade', 'How exciting it feels'], answer: 1, explain: 'Expectancy combines hit rate and the size of wins versus losses, which win rate alone misses.' },
    ],
    backtesting_basics: [
      { q: 'A backtest looks flawless on the data it was built on. This is…', options: ['Proof it will work', 'Not yet evidence; it may be curve-fit', 'A guarantee', 'Irrelevant'], answer: 1, explain: 'Tuning to one dataset can memorise the past. Real confidence needs out-of-sample and forward testing.' },
      { q: 'Curve-fitting means…', options: ['Drawing trendlines', 'Tuning a strategy until it fits past data perfectly', 'Using a moving average', 'Trading live'], answer: 1, explain: 'Curve-fitting optimises to historical noise, producing a strategy that looks great on old data and fails live.' },
      { q: 'A stronger backtest uses…', options: ['Only the data you built on', 'Out-of-sample data and a decent sample size', 'A single cherry-picked trade', 'No data'], answer: 1, explain: 'Testing on data the strategy never saw, over enough trades, separates a real edge from a fitted illusion.' },
    ],
    journaling_for_refinement: [
      { q: 'The difference between an improving and a stagnant trader is often…', options: ['Whether they keep a journal', 'What their journal is doing with the entries', 'Their broker', 'Their screen size'], answer: 1, explain: 'Both may keep journals. Refinement comes from reviewing the why and acting on patterns, not just logging results.' },
      { q: 'Beyond entry, exit, and result, a useful journal records…', options: ['Nothing else', 'The rationale, emotion, and setup type', 'Only winners', 'The weather'], answer: 1, explain: 'The reasons and context are what let you improve; the numbers alone only tell you the score.' },
      { q: 'A good trade that lost money was…', options: ['A mistake', 'Still a good decision if it followed your process', 'Proof the plan is broken', 'Bad luck to be punished'], answer: 1, explain: 'Outcome does not grade the decision. Separating process from luck is exactly what the journal teaches.' },
    ],
    building_your_rulebook: [
      { q: '"Buy when it looks strong" fails as a rule because…', options: ['It is too long', 'It is vague and collapses under pressure', 'It uses the word buy', 'It is too precise'], answer: 1, explain: 'Vague rules feel fine when calm but give no clear action in a live, stressful moment.' },
      { q: 'A good trading rule is…', options: ['A feeling', 'A clear if-then statement with no room for interpretation', 'A secret', 'Whatever the guru says'], answer: 1, explain: 'Precise if-then rules make the right action automatic when your judgment is least reliable.' },
      { q: 'A useful test of a rule is whether…', options: ['It sounds clever', 'Someone else could follow it without asking you anything', 'You alone understand it', 'It changes daily'], answer: 1, explain: 'If another disciplined trader could execute it with no questions, the rule is specific enough.' },
    ],
    mechanical_vs_discretionary: [
      { q: 'The main risk a discretionary trader takes on is…', options: ['Too much consistency', 'Letting emotion pose as judgment', 'No flexibility', 'Following rules too closely'], answer: 1, explain: 'Discretion gains flexibility but risks dressing up a bad impulse as a read.' },
      { q: 'A purely mechanical system…', options: ['Adapts freely to context', 'Executes the same regardless of feeling', 'Requires no trust', 'Guarantees profit'], answer: 1, explain: 'Mechanical rules produce the same action from the same inputs, which demands trusting the system through drawdowns.' },
      { q: 'Most traders are best served by…', options: ['Pure emotion', 'A rules-based core with a little judgment at the edges', 'No rules at all', 'Copying others'], answer: 1, explain: 'A rules-based core with limited discretion, plus honesty about your failure mode, tends to beat picking one extreme.' },
    ],
    your_trading_system: [
      { q: 'A complete trading system answers, on paper…', options: ['Only where to enter', 'What you trade, when you enter, where you exit, how much you risk, and how you review', 'Just your goals', 'Nothing specific'], answer: 1, explain: 'A coherent system covers entry, exit, risk, and review with no gaps for emotion to leak through.' },
      { q: 'A missing piece in your system is…', options: ['Fine, ignore it', 'Where discretion and emotion leak in', 'A strength', 'Impossible'], answer: 1, explain: 'Any gap is exactly where undisciplined decisions creep in and undo the rest of the system.' },
      { q: 'A good test of your system is whether…', options: ['It looks impressive', 'A disciplined trader could run it without asking you anything', 'Only you can run it', 'It changes weekly'], answer: 1, explain: 'If someone else could execute it with no questions, it is complete enough to trust and scale.' },
    ],

    what_is_trading: [
      { q: 'A trade you took by your rules loses money. Was it a mistake?', options: ['Yes, all losses are mistakes', 'Not necessarily; the decision can be good even when the outcome is bad', 'Only if you feel bad', 'Always'], answer: 1, explain: 'Outcome does not grade the decision. A sound, rule-based trade that loses was still a good decision.' },
      { q: 'Trading is fundamentally…', options: ['Predicting the future exactly', 'Making decisions under uncertainty', 'Guaranteed if you work hard', 'Pure luck'], answer: 1, explain: 'You control decision quality, not outcomes. Trading is decision-making under uncertainty.' },
      { q: 'You should judge yourself mainly on…', options: ['The last outcome', 'The quality of your decisions over many trades', 'Your best day', 'Other people'], answer: 1, explain: 'Single outcomes are noisy. Process quality across a sample is the honest measure.' },
    ],
    risk_position_sizing: [
      { q: 'Why does trading too large corrupt decisions even when analysis is sound?', options: ['It does not', 'Because oversize floods you with fear and panics you out of the plan', 'Because big size is illegal', 'Because charts change'], answer: 1, explain: 'Size is an emotional dial. Oversize turns a routine move into a panic, overriding good analysis.' },
      { q: 'Fixed risk per trade mainly serves to…', options: ['Maximise profit', 'Keep emotion out of the trade', 'Impress others', 'Increase leverage'], answer: 1, explain: 'Constant, pre-decided risk keeps each trade emotionally manageable, so feeling does not drive decisions.' },
      { q: 'The same market move at 1% versus 10% risk…', options: ['Feels identical', 'Feels completely different, and the difference is what breaks traders', 'Cannot be compared', 'Only matters to beginners'], answer: 1, explain: 'A 1% loss barely registers; a 10% position turns it into fear. That emotional gap is the danger.' },
    ],
    market_structure: [
      { q: 'The same entry signal can be good in one condition and a trap in another because…', options: ['Signals are random', 'Structure is the context that grades the signal', 'Brokers change it', 'It cannot'], answer: 1, explain: 'Structure decides what a signal means. A breakout that works in a trend fails in a choppy range.' },
      { q: 'Before reacting to a single candle, you should first…', options: ['Add size', 'Name the structure you are in', 'Close all trades', 'Check social media'], answer: 1, explain: 'Reading structure first keeps you acting on context rather than impulse.' },
      { q: 'Under uncertainty, market structure gives you…', options: ['A guarantee', 'Something stable to lean on when deciding', 'A price prediction', 'Nothing useful'], answer: 1, explain: 'Structure is a stable reference. Half of good decisions is refusing signals the structure does not support.' },
    ],
    psychology_basics: [
      { q: 'Revenge trading, from the inside, feels like…', options: ['Obvious panic', 'Conviction, which is why it is dangerous', 'Boredom', 'Nothing'], answer: 1, explain: 'It disguises itself as conviction, so naming it early, before it takes over, is the whole skill.' },
      { q: 'The realistic goal with trading emotions is to…', options: ['Delete them entirely', 'Notice the trigger and act before it decides for you', 'Ignore them', 'Amplify them'], answer: 1, explain: 'You cannot erase these emotions. Fast awareness lets you step back before they drive the decision.' },
      { q: 'The forces that break most traders are…', options: ['Highly technical and rare', 'Ordinary human reactions like fear, greed, and revenge', 'Only found in beginners', 'Impossible to notice'], answer: 1, explain: 'They are everyday emotions that happen to be expensive in markets. Catching them in yourself is the work.' },
    ],
    trading_journal_setup: [
      { q: 'The one thing most traders skip in a journal, and the one that matters most, is…', options: ['The entry price', 'The emotional state and reasons', 'The date', 'The instrument'], answer: 1, explain: 'Numbers tell you what happened; the feelings and rationale tell you how to change what happens next.' },
      { q: 'A journal built to improve you records…', options: ['Only wins and losses', 'Setup, rationale, size, emotion, and outcome', 'Just the P&L', 'Nothing'], answer: 1, explain: 'Recording the why and the context is what surfaces patterns you would never see trade by trade.' },
      { q: 'Reviewing the journal reveals…', options: ['Nothing new', 'Patterns invisible trade by trade, like losses clustering after a win', 'Only random noise', 'The future'], answer: 1, explain: 'Over time the entries expose behavioural patterns a single trade never shows.' },
    ],
    trading_plan: [
      { q: 'A decision about risk is most reliable when…', options: ['Made live inside the trade', 'Written into a plan beforehand, while calm', 'Left to instinct', 'Copied from others'], answer: 1, explain: 'The plan is you at your clearest instructing you at your least. Live decisions are compromised by the moving position.' },
      { q: 'A trading plan is best understood as…', options: ['A wish list', 'A pre-commitment obeyed when you are not calm', 'A prediction', 'Optional paperwork'], answer: 1, explain: 'Its power is that it commits you in advance to behaviour that emotion would otherwise override.' },
      { q: 'A good plan states…', options: ['Only your goals', 'What you trade, when, your risk, and your daily limits', 'Just a target', 'Nothing specific'], answer: 1, explain: 'Concrete instruments, sessions, setups, risk, and limits make the plan followable under pressure.' },
    ],
    discipline_process: [
      { q: 'Willpower fails as a discipline strategy because…', options: ['It never existed', 'It runs out under stress, exactly when you need it', 'It is illegal', 'It is too strong'], answer: 1, explain: 'Under stress and after losses willpower depletes. Design does not, which is why it lasts.' },
      { q: 'Discipline as design means…', options: ['Trying harder', 'Arranging things so the right action is the easy default', 'Using more indicators', 'Trading more'], answer: 1, explain: 'A hard size cap, a checklist, removed choices — these make good behaviour automatic without relying on self-control.' },
      { q: 'The better question to ask is…', options: ['How do I be more disciplined', 'How do I build my process so the good behaviour happens even when discipline is gone', 'How do I feel motivated', 'How do I trade more'], answer: 1, explain: 'Designing the process so it holds without willpower is what makes consistency independent of mood.' },
    ],
    trade_management: [
      { q: 'Moving a stop to breakeven because structure supports it is…', options: ['Fear', 'Management', 'Always wrong', 'Revenge trading'], answer: 1, explain: 'A stop moved for a real, structural reason is management. Moving it to avoid a loss is fear.' },
      { q: 'Most mid-trade mistakes are attempts to…', options: ['Follow the plan', 'Escape a feeling, like anxiety or being wrong', 'Add a stop', 'Reduce size'], answer: 1, explain: 'Taking profit early from anxiety or widening a stop to avoid being wrong are emotional escapes, not management.' },
      { q: 'The safeguard against emotional mid-trade decisions is to…', options: ['Improvise more', 'Decide the rules before you enter and let the trade play out inside them', 'Watch every tick', 'Remove your stop'], answer: 1, explain: 'Pre-set rules let the trade unfold without renegotiating live under emotional pressure.' },
    ],
    weekly_review: [
      { q: 'A strong weekly review looks for…', options: ['Only the P&L total', 'One concrete, fixable behaviour', 'Reasons to feel good', 'Someone to blame'], answer: 1, explain: '"I broke my risk rule three times, all on Fridays" points at a specific fix, unlike a vague resolution.' },
      { q: 'A losing week where you followed your plan is…', options: ['The same as breaking it', 'Very different from a winning week where you broke it', 'A disaster', 'Proof the plan fails'], answer: 1, explain: 'The review grades the process, not the luck. Following the plan through a loss is a good week by that measure.' },
      { q: 'The weekly review should separate…', options: ['Nothing', 'Process errors from variance', 'Winners from the calendar', 'Traders from brokers'], answer: 1, explain: 'Distinguishing your mistakes from randomness is what makes the review actionable.' },
    ],
    advanced_psychology: [
      { q: 'Two traders with the identical strategy can get opposite results because of…', options: ['The broker', 'The beliefs and identity underneath their behaviour', 'The weather', 'Pure chance only'], answer: 1, explain: 'The layer beneath the rules — what you believe about yourself as a trader — quietly drives the surface behaviour.' },
      { q: 'Self-sabotage usually shows up as…', options: ['An obvious announcement', 'Mistakes that keep repeating in the same shape', 'A one-time error', 'Better results'], answer: 1, explain: 'It rarely announces itself; it appears as a recurring pattern held in place by a belief.' },
      { q: 'To change a recurring pattern you cannot break, you often have to…', options: ['Add indicators', 'Question the belief holding it in place', 'Trade bigger', 'Switch markets'], answer: 1, explain: 'The stubborn pattern usually rests on a belief. Change the belief and the behaviour finally moves.' },
    ],
    consistency: [
      { q: 'Consistency comes mainly from…', options: ['Daily motivation', 'Infrastructure: routine, environment, and conditions', 'Luck', 'Bigger size'], answer: 1, explain: 'Motivation is unreliable. Consistent behaviour comes from a system that runs regardless of mood.' },
      { q: 'To become more consistent you should…', options: ['Try to feel motivated each day', 'Design conditions that make the right behaviour repeat', 'Trade on instinct', 'Remove all routine'], answer: 1, explain: 'Removing decisions and reducing friction on good habits lets repetition do what motivation cannot.' },
      { q: 'The reliable engine of consistency is…', options: ['Willpower', 'Repetition built into routine and environment', 'Excitement', 'New strategies'], answer: 1, explain: 'Same routine, same rules, same review, every day, produces consistency far better than summoning discipline.' },
    ],
    drawdown_recovery: [
      { q: 'Deep in a drawdown, the instinct to size up and win it back fast is…', options: ['The right move', 'Usually what turns a drawdown into a blown account', 'Risk-free', 'Required'], answer: 1, explain: 'Sizing up amplifies the damage. Recovery comes from cutting size and steadying execution.' },
      { q: 'The steadier path out of a drawdown is to…', options: ['Increase size', 'Cut size, clean up execution, rebuild on small wins', 'Stop journaling', 'Trade more often'], answer: 1, explain: 'You steady your decision-making first, because that is what got shaky, with smaller size and clearer rules.' },
      { q: 'Recovery from a drawdown is best treated as…', options: ['A single big rescue trade', 'A slow, deliberate process', 'An emergency', 'Impossible'], answer: 1, explain: 'Climbed out slowly you stay intact; trying to erase it in one swing usually leaves you worse.' },
    ],
    review_system: [
      { q: 'A monthly review lets you see what a daily one cannot, namely…', options: ['The exact next trade', 'Whether the whole strategy and goals still work', 'Nothing', 'The weather'], answer: 1, explain: 'The monthly lens questions the approach itself; the daily lens catches process slips while fresh.' },
      { q: 'The three timescales of a full review system are…', options: ['Hourly, daily, yearly', 'Daily, weekly, monthly', 'Only monthly', 'Random'], answer: 1, explain: 'Daily checks rule-following, weekly finds patterns, monthly questions the strategy.' },
      { q: 'A review that ends without a decision is…', options: ['Ideal', 'Just record-keeping', 'A breakthrough', 'Dangerous'], answer: 1, explain: 'The point is to close the loop, turning an observation into a specific change in behaviour.' },
    ],

    behavioral_analytics: [
      { q: 'P&L tells you what happened. Behavioural analytics answers…', options: ['The same question', 'Why: what you reliably do and whether it helps', 'Nothing', 'The future price'], answer: 1, explain: 'Behavioural data surfaces patterns in your decisions that P&L alone cannot show.' },
      { q: 'An example of a behavioural pattern is…', options: ['A random loss', 'Losses clustering in the 30 minutes after a win', 'The market opening', 'A single trade'], answer: 1, explain: 'Timing and context patterns in your own decisions are exactly what behavioural analytics reveals.' },
      { q: 'The value of making a behaviour visible in data is that…', options: ['It stays a vague feeling', 'It becomes something specific you can change', 'It disappears', 'It guarantees profit'], answer: 1, explain: 'You cannot fix what you cannot see. Data turns a vague habit into an actionable target.' },
    ],
    pattern_recognition_self: [
      { q: 'The difference between a random bad trade and a real pattern is…', options: ['Nothing', 'Repetition — the same shape recurring', 'The broker', 'The date'], answer: 1, explain: 'One bad trade is noise; a pattern is the same mistake or the same winning condition showing up repeatedly.' },
      { q: 'Once you find your patterns, you should…', options: ['Ignore them', 'Guard against the losing ones and lean into the winning ones', 'Trade the opposite always', 'Stop trading'], answer: 1, explain: 'Act asymmetrically: cut what loses, concentrate where you reliably win.' },
      { q: 'If your biggest winners all share one condition, that is…', options: ['A coincidence to ignore', 'An instruction about where to concentrate', 'Bad luck', 'Irrelevant'], answer: 1, explain: 'A repeated winning condition tells you where to focus, not a curiosity to shrug off.' },
    ],
    scaling_responsibly: [
      { q: 'You are ready to increase size once…', options: ['You have one good week', 'You have proven, repeatable consistency', 'You feel confident', 'The market is calm'], answer: 1, explain: 'Scale on demonstrated, repeatable process at the current size, not on a single good week.' },
      { q: 'Scaling up too fast is risky mainly because…', options: ['It is illegal', 'It multiplies emotional pressure before the process is proven', 'It lowers profit', 'It has no effect'], answer: 1, explain: 'Bigger size raises the psychological load, and both the account and your nerves can crack at once.' },
      { q: 'If execution slips after scaling up, you should…', options: ['Push harder', 'Be willing to scale back down', 'Add more size', 'Ignore it'], answer: 1, explain: 'Scaling back down protects the process. Size should track your demonstrated consistency in both directions.' },
    ],
    sustained_performance: [
      { q: 'A genuinely skilled trader can still underperform because of…', options: ['Strategy alone', 'Exhaustion, poor routine, and a bad state', 'The broker', 'Nothing'], answer: 1, explain: 'The edge pays out only through a functioning person; fatigue and burnout quietly degrade execution.' },
      { q: 'Sustained performance is best treated like…', options: ['A hobby', 'An athletic performance needing energy and recovery', 'A one-time effort', 'A guarantee'], answer: 1, explain: 'Sleep, routine, focus, and recovery all feed decision quality, just as they do for an athlete.' },
      { q: 'To protect performance you should…', options: ['Trade more hours', 'Guard focus, cap screen time, and recover deliberately', 'Ignore your state', 'Remove all routine'], answer: 1, explain: 'Skill sets the ceiling; the state you show up in decides how much of it you reach.' },
    ],
    mentor_candidate: [
      { q: 'The difference between a profitable trader and one ready to guide others is…', options: ['Nothing', 'Earned, integrated competence and the humility to know its limits', 'Account size only', 'A certificate'], answer: 1, explain: 'Being profitable is not the same as being able to teach and owning the edges of what you do not know.' },
      { q: 'Teaching is a useful test of mastery because…', options: ['It pays well', 'You must explain something clearly to prove you have integrated it', 'It is easy', 'It avoids trading'], answer: 1, explain: 'If you can teach it clearly and stay honest about your gaps, you have genuinely integrated it.' },
      { q: 'A responsible guide never…', options: ['Admits uncertainty', 'Dresses up confidence as certainty', 'Keeps learning', 'Owns their limits'], answer: 1, explain: 'Guiding others means owning the limits of your edge and staying a student of the market.' },
    ],
  };

  window.EK_ACADEMY = { primers, quizzes, diagrams };
})();
