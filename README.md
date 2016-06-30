# Dev
`heroku local`
all tokens passed over .env variables


# Todo
- Setup objects for Races, Race, Horse
- Create `help` command to show expected structure for betting
- Don't let betting on a runner that doesnt exist
- order odds descending from best to worst
- calculate odds of the whole field
- add "hey bookie place a bet for me" conversation control
- allow bets on runner names
- track runner id better
- standardize responses (string concat)
- regex for actual currency ($100, 1,000.00, $1,000)
- Use a database addon (postgres?)
- Gift users currency command
- Open an end point for payouts



# How to place a Horse Race bet
- State what number race you're betting.
- State the dollar unit of your bet.
- State the type of wager.
- You can bet on a single horse to win, place, or show or on a combination of horses.
- State the number of the horse or horses you’re using.
- Check your ticket before you leave the window.
- Minimum bet of 2 dollars/cogs

# How to calculate the Odds
To compute your $2 win price, take the odds of your horse and multiply the first number by 2, divide that by the second number, and then add $2 — simple as that! Following is a list of payoffs at various odds for quick reference:

Odds	$2 Payoff	Odds	$2 Payoff	Odds	$2 Payoff
1/9	$2.20	8/5	$5.20	7/1	$16.00
1/5	$2.40	9/5	$5.60	8/1	$18.00
2/5	$2.80	2/1	$6.00	9/1	$20.00
1/2	$3.00	5/2	$7.00	10/1	$22.00
3/5	$3.20	3/1	$8.00	11/1	$24.00
4/5	$3.60	7/2	$9.00	12/1	$26.00
1/1	$4.00	4/1	$10.00	13/1	$28.00
6/5	$4.40	9/2	$11.00	14/1	$30.00
7/5	$4.80	5/1	$12.00	15/1	$32.00
3/2	$5.00	6/1	$14.00	16/1	$34.00

1. Start with the total amount bet to place and subtract 15 percent for the takeout (the percentage withheld from the betting pool by the host track).
2. From that total, subtract the place money wagered on your horse and the highest amount of place money bet on another horse to get the profit from the place pool.
3. Split the profit amount between the two place horses.
4. Divide that amount by the number of $2 place bets on your horse.
5. Add $2, and you get your estimate place price.

# Close the pool
- Determine a time before the race starts to accept no more bets
- final odds and payouts can be calculated

# Cite
- https://github.com/mvaragnat/botkit-express-demo/blob/master/app/controllers/botkit.js
