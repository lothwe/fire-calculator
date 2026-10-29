// ============================================================================
//  ALL TEXT ON THE PAGE LIVES HERE.
//  Edit the words between the quotes, save, and refresh the page.
//
//  Rules:
//  - {placeholders} in curly braces are filled in with numbers, ages, years
//    or amounts. You can move them around or delete them, but don't rename
//    them. Each string's comment lists which ones it can use.
//  - **double asterisks** make text bold.
//  - If your text contains a ' (apostrophe), keep the "double quotes"
//    around it, like: "You're on track".
//  - Keep the comma at the end of each line.
// ============================================================================

export const COPY = {

  // ---------------------------------------------------------------- Page ---
  pageTitle: "FIRE Calculator by Laura",                 // browser tab
  metaDescription: "Find your FIRE and Coast FIRE numbers, when you'll reach them, and how much to invest each month.",
  title: "FIRE Calculator",                     // big heading
  titleByline: "by @retirewithlaura",           // handwritten text next to the heading
  titleBylineUrl: "https://www.instagram.com/retirewithlaura/",   // where the byline links to
  lede: "How much do you need to be financially independent, and when will you get there?",

  // ------------------------------------------------- Step 1: Your number ---
  step1Title: "Your number",
  spendLabel: "Spending",
  spendMonthly: "Monthly",
  spendYearly: "Yearly",
  spendHint: "What you spend now (or expect to spend in retirement), in today's money.",
  wrLabel: "Withdrawal rate",
  wrHint: "4% is the classic rule for a ~30-year retirement; 3–3.5% is common for early retirees.",
  ageLabel: "Your age",
  retLabel: "Retirement age",
  retHint: "Retirement age = when you'd normally stop working anyway.",

  // ------------------------------------------- Step 2: Your investments ---
  step2Title: "Your investments",
  pvLabel: "Invested today",
  cLabel: "Monthly contribution",

  // --------------------------------------------------- Step 3: Your goal ---
  step3Title: "Your goal",
  goalLabel: "I want to reach",
  goalFire: "FIRE",
  goalCoast: "Coast FIRE",
  byLabel: "By age",

  // ------------------------------------------ Step 4: Market assumptions ---
  step4Title: "Market assumptions",
  growthLabel: "Market growth / yr",
  inflationLabel: "Inflation / yr",
  growthHint: "**Growth:** average yearly growth of your stock-based investments, before inflation. 8% is in line with historical global equity returns; lower it for a more conservative projections.",
  inflationHint: "**Inflation:** default is the Netherlands' average over the last 50 years (2.7%, 1976–2025). The European Central Bank targets 2%.",
  realGrowth: "Your real growth after inflation: **{rate}**",            // {rate}

  // ---------------------------------------------------- Error messages ---
  errSpend: "Enter your spending",
  errWr: "Pick a withdrawal rate",
  errAge: "Age between 18 and 80",
  errRetMax: "Retirement age up to 80",
  errRetBelowAge: "Must be higher than your current age",
  errGrowth: "Between 0% and 15%",
  errInflation: "Between 0% and 10%",
  errNegative: "Cannot be negative",
  errByBelowAge: "Must be higher than your current age",
  errByMax: "Up to 100",

  // ----------------------------------------------------- Empty states ---
  emptyRequired: "Fill in your spending and age to see your numbers.",
  emptyPortfolio: "Add what you've invested today (0 is fine) to see when you'll reach Coast FIRE and FIRE.",

  // ------------------------------------------------- FIRE number card ---
  fireEyebrow: "Your FIRE number",
  fireMultiple: "{multiple}× your yearly spending of {yearlySpend}.",   // {multiple} {yearlySpend}
  fireFuture: "In {year} money that's about **{futureAmount}**: the balance you'll actually see in your account when you get there. It buys the same as {fireNumber} today, and your {monthlySpend}/month will cost about {futureMonthlySpend}/month by then.",
  //           {year} {futureAmount} {fireNumber} {monthlySpend} {futureMonthlySpend}

  // ------------------------------------------- Coast FIRE number card ---
  coastEyebrow: "Your Coast FIRE number today",
  coastExplain: "Have this invested today and, without adding another cent, it grows into your FIRE number by age {retAge}.",   // {retAge}

  // ------------------------------------------------------------ Warning ---
  warnNegativeReal: "Your growth assumption is below inflation: your money loses value in real terms.",

  // -------------------------------------------- When you reach Coast/FIRE ---
  coastTimelineTitle: "Coast FIRE",
  fireTimelineTitle: "FIRE",
  reachedFuture: "Age {age} · {year}",                                 // {age} {year}
  coastFutureDetail: "In {duration}. After that you could stop investing and still reach FIRE by {retAge}.",   // {duration} {retAge}
  fireFutureDetail: "In {duration}.",                                  // {duration}
  reachedPast: "✓ Reached at ~{age} ({year})",                         // {age} {year}
  reachedPastDetail: "About {duration} ago.",                          // {duration}
  reachedPastEstimate: "Estimate, assuming you invested {contribution}/month at the same return in the past.",  // {contribution}
  reachedPastNoDate: "✓ Already reached",
  reachedBefore18: "On these assumptions, you were there before age 18.",
  addContributionForDate: "Add your monthly contribution to estimate when.",
  coastAlreadyIntro: "You could stop investing today and still reach FIRE by {retAge}.",   // {retAge}
  coastNotBeforeRetirement: "Not before {retAge}",                     // {retAge}
  coastNotBeforeRetirementDetail: "You won't reach Coast FIRE before your retirement age. Focus on the FIRE date.",
  notReached: "Not reached by 100",
  notReachedDetail: "Try increasing your monthly contribution or lowering your spending.",

  // ------------------------------------------- Required monthly (goal) ---
  goalTitle: "To reach {goal} by {byAge}",                             // {goal} {byAge}
  goalAmount: "{amount}",                                              // {amount}
  goalPerMonth: " /month",
  goalMore: "That's **{gap} more** than you invest now.",              // {gap}
  goalLess: "That's **{gap} less** than you invest now. You're ahead of plan.",   // {gap}
  goalExact: "Exactly what you invest now.",
  goalTarget: "Target at that age: {target}.",                         // {target}
  goalOnTrack: "You're on track",
  goalOnTrackDetail: "You'll reach {goal} by {byAge} without further contributions.",   // {goal} {byAge}
  goalCoastTooLate: "Pick an age before your retirement age ({retAge}).",   // {retAge}
  goalInvalidAge: "Enter an age above your current age.",

  // --------------------------------------------------------- Milestones ---
  milestonesTitle: "Milestones",
  milestonesHint: "Account balance as you'll see it in your broker app (incl. inflation).",
  milestoneFuture: "Age {age}",                                        // {age}
  milestoneFutureYear: "{year} · in {shortDuration}",                  // {year} {shortDuration}
  milestonePast: "✓ ~age {age}",                                       // {age}
  milestonePastYear: "~{year} (estimate)",                             // {year}
  milestonePastNoDate: "✓ Reached",
  milestoneNotReached: "Not by 100",

  // -------------------------------------------------------------- Chart ---
  chartTitle: "Your portfolio over time",
  legendPortfolio: "Portfolio",
  legendFire: "FIRE number",
  legendCoast: "Coast FIRE target",
  chartFootnote: "All values in today's money.",
  chartMarkerCoast: "Coast FIRE · {age}",                              // {age}
  chartMarkerFire: "FIRE · {age}",                                     // {age}
  tooltipTitle: "Age {age} · {year}",                                  // {age} {year}
  tooltipPortfolio: "Portfolio: {amount}",                             // {amount}
  tooltipAccount: "In your account: {amount}",                         // {amount}
  tooltipCoast: "Coast FIRE target: {amount}",                              // {amount}

  // ------------------------------------------------ Mobile summary bar ---
  stickyFire: "FIRE",
  stickyCoast: "Coast",
  stickyAt: "at {age}",                                                // {age}
  stickyLink: "Results ↓",

  // ---------------------------------------------------------- Share link ---
  shareButton: "Copy link to my scenario",
  shareCopied: "Link copied ✓",
  sharePrompt: "Copy this link:",

  // ----------------------------------------------------------- Explainer ---
  explainerTitle: "What do FIRE and Coast FIRE mean?",
  explainerFire: "**FIRE** (Financial Independence, Retire Early): you have enough invested to live off it for good. Your FIRE number is your yearly spending divided by your withdrawal rate. At 4%, that's 25× your yearly spending.",
  explainerCoast: "**Coast FIRE**: you have enough invested that, even if you never add another cent, compound growth gets you to your FIRE number by your retirement age. From then on you only need to earn enough to cover today's costs.",

  // -------------------------------------------------------------- Footer ---
  footer: "Educational projection, not financial advice. Assumes constant returns and contributions; excludes tax and fees. Past reach dates are estimates. Nothing you enter leaves your browser.",

  // ------------------------------------------- Durations (used above) ---
  year: "year",
  years: "years",
  month: "month",
  months: "months",
  shortYear: "yr",
  shortYears: "yrs",
  shortMonths: "mo",

  // ==========================================================================
  //  NEW IN v03. If you've edited your own copy.js, paste this whole block
  //  into yours, just above the final  };
  //  Hint texts above (spendHint, wrHint, retHint, growthHint, inflationHint,
  //  milestonesHint, chartFootnote, fireMultiple, fireFuture, coastExplain,
  //  reachedPastEstimate) now show in the (i) hover notes instead of on the page.
  //  No longer used: step3Title, goalLabel, goalTitle. step4Title is now shown as step 3.
  // ==========================================================================
  infoLabel: "More info",                                              // screen readers only
  coastShort: "Grows to {fireNumber} by age {retAge} on its own",     // {fireNumber} {retAge}
  fireFutureShort: "≈ {futureAmount} in {year} money",                 // {futureAmount} {year}

  goalTo: "To reach",
  goalByAge: "by age",

  tableTitle: "Year by year projections",
  tableToday: "Today's money",
  tableNominal: "In your account",
  tableInfo: "**Today's money** removes inflation, so amounts compare to what things cost now. **In your account** is the balance you'd actually see. Market growth is what your investments earned that year.",
  colYear: "Year",
  colAge: "Age",
  colStart: "Starting balance",
  colAdded: "Added",
  colGrowth: "Market growth",
  colEnd: "End balance",
  tagCoast: "Coast FIRE",
  tagFire: "FIRE",

  // ==========================================================================
  //  NEW IN v04. Paste this block into your own copy.js, above the final  };
  //  Also changed: emptyRequired (no longer mentions retirement age).
  //  No longer used: step1Title, step2Title, step4Title, goalTo, goalByAge,
  //  goalCoastTooLate (and step3Title, goalLabel, goalTitle from before).
  // ==========================================================================
  stepBasicsTitle: "Your basics",
  stepInvestTitle: "Your investments",
  stepFactorsTitle: "Your future",
  optionalTag: "Optional",
  stepFactorsHint: "These are hypothetical factors that will affect your projections, and come pre-filled with safe defaults. Change them to test other scenarios, or clear a field to go back to its default.",
  goalFireByAge: "To reach FIRE by age",

  // ==========================================================================
  //  NEW IN v05
  //  No longer used: goalFireByAge, goalOnTrack's old box title (goalTitle).
  // ==========================================================================
  savingsTitle: "Monthly savings goal",
  savingsByAge: "Target FIRE age (if different than above)",           // label next to the age box
  savingsExplain: "This is what you need to invest each month to reach your FIRE goal by age {byAge}.",   // {byAge}

  // ==========================================================================
  //  NEW IN v06
  //  Changed: savingsByAge (new label wording).
  // ==========================================================================
  nameLabel: "First name",
  nameOptional: "optional",
  nameHint: "Only used to personalise your plan image. It stays in your browser and isn't included in shared links.",
  savingsReached: "You've already reached your FIRE number",
  savingsNotReached: "At this rate you won't reach FIRE. Increase your monthly contribution or enter a target FIRE age to see what you'd need.",
  legendMilestone: "Milestones",

  // Plan image export
  exportButton: "Save my plan",
  exportModalTitle: "Your FIRE plan",
  exportDownload: "Download image",
  exportShare: "Share",
  exportTitle: "{name}’s FIRE plan",                                   // {name}
  exportTitleNoName: "My FIRE plan",
  exportSavingsLabel: "Monthly savings goal",
  exportPerMonth: "/mo",
  exportYearsLabel: "Target FIRE age",
  exportYears: "{years} years",                                        // {years}  (no longer used)
  exportTargetAge: "Age {age}",                                        // {age}
  exportTargetSub: "{year} · in {years} years",                        // {year} {years}
  exportSavingsSub: "to hit FIRE goal",
  exportCreatedOn: "Created on {date}",                                // {date}
  // Fun tiles that fill empty spots when fewer than 4 milestones are still ahead
  whimsyProgressTitle: "Freedom loading…",
  whimsyProgressSub: "{percent}% of the way there",                    // {percent}
  whimsySproutTitle: "Compounding in progress",
  whimsySproutSub: "Patience is the strategy",
  whimsySunTitle: "Future you: out of office",
  whimsySunSub: "Back… never",
  exportCoastTitle: "My Coast FIRE number",
  exportFireTitle: "My FIRE number",
  exportFirstMilestone: "First {amount}",                              // {amount}
  exportBy: "by {year} · age {age}",                                   // {year} {age}
  exportReached: "Reached ✓",
  exportNotReached: "Not reached by 100",
  exportCredit: "Created by @retirewithlaura",
};
