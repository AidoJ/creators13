# Card Game Pop-Out + Discount Engine — Build Plan

## 1. Data model (new columns on `creator_types`)

Add five admin-editable fields to the existing `creator_types` table (one row per type, already 13 rows):

- `famous_person_name` (text) — e.g. "Anne Hathaway"
- `famous_person_image_url` (text) — image stored in the `email-assets` bucket (or a new `creator-card-assets` bucket)
- `fact_signature` (text) — "Signature" paragraph from the MD
- `fact_at_the_table` (text) — "At the table" paragraph
- `fact_shadow_side` (text) — "Shadow side" paragraph
- `fact_you_might_be` (text) — "You might be a … if" paragraph

All four fact fields stored permanently; only one shown at a time on the card pop-out.

Seed migration will pre-populate all 13 rows from the attached `13creators_card_back_fun_facts.md`. Famous-person names will be seeded from the "Who's Who in the Zoo" reference (Anne Hathaway → Snow, Taylor Swift → Lava, Will Ferrell → Lightning, Bruce Lee → Whirlwind, Hugh Jackman → Mountain, Melissa McCarthy → Sun, Kate Winslet → Lake, Simone Biles → Fire, Ryan Reynolds → River, Matthew McConaughey → Ocean, Ben Stiller → Tree, Judi Dench → Soil — Sky to be filled in by admin). Images themselves will be left blank for admin upload (copyright-safe path), with placeholders rendering until uploaded.

## 2. Admin panel — Creator Type editor

A new admin section **"Creator Cards"** (tab on `/admin`) showing the 13 types in a list. Each row opens an editor with 5 sections in this order, exactly as you described:

1. **Famous Person** — name field + image uploader (drag/drop, stored in Lovable Cloud storage)
2. **Signature** — textarea
3. **At the table** — textarea
4. **Shadow side** — textarea
5. **You might be a {Type} if** — textarea (label auto-fills with the type name)

Save writes back to `creator_types`. Same UI used for all 13.

## 3. Card pop-out behaviour (player-facing)

When the player opens a creator card pop-out:

- Always show the **famous person image + name** at the top (fixed, never rotates)
- Below it, show **one of the four fun-fact paragraphs**, picked at random on each open
- Across a game session, rotate so the player sees a different fact each time they reopen the same card (track shown-facts in component state / localStorage keyed by type, reset once all four have been seen)
- A small "Show another" link lets them cycle manually

This keeps the pop-out short and re-readable across a game.

## 4. Discount engine

New table `game_discount_tiers` (admin-editable, seeded with your three tiers):

| points_threshold | discount_percent | label |
|---|---|---|
| 50 | 10 | 10% off your Profile Process |
| 100 | 25 | 25% off your Profile Process |
| 150 | 50 | 50% off your Profile Process |

Admin panel gets a new **"Game Rewards"** section where you can:
- Edit existing tier rows (threshold / percent / label / active toggle)
- Add additional tiers
- Delete tiers

This makes the tiers a "variable action item" you can tune without code changes.

### Pop-up trigger logic (player side)

- The game tracks `player_points` (already implied by your "if the player has achieved X pts" wording — if a points field doesn't yet exist on the player record we'll add `points int default 0` to the player/game-session table).
- When `player_points` crosses a tier threshold, a celebratory pop-up appears once: "🎉 You've unlocked {percent}% off your Profile Process!" with a CTA button to the Robin tier checkout, carrying a Stripe coupon code.
- Each unlocked tier is recorded in `player_discount_unlocks (player_id, tier_id, unlocked_at, redeemed_at)` so the same pop-up doesn't fire twice and Stripe can validate redemption.
- The highest unlocked tier is shown as a persistent badge on the dashboard until used.

### Stripe wiring

For each tier row, on save we call Stripe (existing `STRIPE_SECRET_KEY` is already configured) to create/update a matching coupon (`GAME10`, `GAME25`, `GAME50` — or auto-generated codes) and store the `stripe_coupon_id` on the tier row. The checkout flow then applies the user's highest unredeemed coupon.

## 5. What I'd like you to confirm before I code

- **Where does the card game live today?** I couldn't find a "game" surface in the current project — is the B Creators card game (a) a separate app that will read from this DB, (b) something I should scaffold inside this app at `/game`, or (c) something you'll wire later and for now just need the DB + admin + pop-up components ready?
- **Player points source of truth** — does a `player_points` field exist somewhere I haven't seen, or should I add one? (Affects whether the discount pop-up listens to a DB column or to in-memory game state.)
- **Famous-person images** — happy for me to leave them blank for you to upload via the new admin uploader, or do you want me to generate placeholder silhouettes?

Once you answer those three, I'll ship: migration → admin editors (Creator Cards + Game Rewards) → card pop-out component → discount pop-up + Stripe coupon sync.
