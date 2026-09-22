# MEMBERSHIP_COMMUNITY_DESIGN_GUIDE.md

## What this document is

A design brief for **membership / community** sites (paid communities,
clubs, cohort programs, creator memberships, associations) — not a
template. Feed it to a coding agent with a specific description of the
community and its purpose. The agent must derive its own design choices
from the psychology below, write a design thesis first, and avoid repeating
the same choices across different communities.

---

## 1. The underlying psychology

A membership site sells **belonging**, not a feature set. The visitor is
deciding not just "is this useful" but "would I fit in here, and would
being seen as part of this reflect well on me." That's a more emotionally
loaded, identity-linked decision than a typical purchase, and the design
has to work at that level.

The emotional arc:

1. **Identity mirror** — the first screen should let the right visitor
   recognize themselves ("this is for people like me") within seconds.
   This is often done through tone of voice and imagery of real
   members/community moments more than through feature description.
2. **Texture of belonging** — real glimpses of the community in action
   (conversations, events, member work, in-person or virtual gatherings)
   do more work than abstract promises of "connection" or "support."
   Specific texture beats generic warmth language.
3. **Value made concrete** — what a member actually gets (content, access,
   events, network, tools) needs to be as concrete and specific as a SaaS
   feature list, even though the deeper draw is belonging — vague "join
   our amazing community" language undermines credibility.
4. **Social proof as mirror, not billboard** — testimonials and member
   spotlights work best when they show a range of real people the visitor
   could see themselves among, not a single idealized success story
   repeated in different words.
5. **Low-anxiety commitment** — pricing and terms should be transparent and
   the exit path clear (cancel anytime, trial period) since membership
   decisions carry more emotional risk (of not fitting in, of wasting
   money on something social) than a simple purchase.

Design for **warmth with real specificity** — this genre fails most often
by being either coldly transactional (feels like a SaaS site with a
community bolted on) or vaguely aspirational (soft-focus stock photography,
no real detail about what membership actually includes).

---

## 2. Structural anatomy

- **Belonging-forward hero** — a real, specific visual of the community
  (not generic stock people smiling at a laptop) paired with a sharp,
  specific statement of who this is for and what it gives them.
- **What you actually get** — a concrete, specific breakdown of tangible
  membership contents (content library, live events, direct access, tools,
  network, perks) treated with the same clarity as a pricing page, not
  buried in soft language.
- **Community in motion** — a section that shows the community actually
  happening: real conversation snippets, real event photos, real member-
  made work, a live or recent activity feed. This is the single highest-
  leverage trust device in this genre.
- **Member spectrum** — a small, varied set of real member
  stories/testimonials that together suggest a range of people, not one
  idealized persona repeated.
- **Structure and rhythm** — for cohort-based or event-driven memberships,
  a clear sense of cadence (weekly calls, monthly themes, a syllabus-like
  structure) reduces the "what am I actually signing up for" anxiety.
- **Access/tiers** — clear, honest tiers if more than one exists, with the
  actual difference in access spelled out plainly.
- **Low-friction join path** — trial, guarantee, or clear cancellation
  terms stated plainly near the CTA, since anxiety about commitment is
  higher here than in a typical purchase.
- **Leader/host presence** — for creator-led or expert-led communities, a
  section establishing who's actually behind it and why they're credible
  to lead it — this is closer to the personal-portfolio genre's
  credibility devices than to SaaS's feature-first approach.

---

## 3. Typography as a generative system

- Typography should feel more **human and conversational** than a
  typical SaaS or corporate site — warmer type choices, a more relaxed
  voice in headline copy, and generally more personality than restraint.
- Match the type personality to the actual community culture: a
  professional/association-style membership can support a more
  established, institutional feel; a creative or lifestyle community can
  support expressive, higher-personality display type; a
  learning/education-oriented membership can support a clear, calm,
  classroom-adjacent feel that signals structure and reliability.
- Avoid over-using script or "handwritten" fonts as a default shortcut to
  warmth — it's an option, not a rule, and quickly reads as generic
  "community site" cliché if used without a specific reason.
- Give member quotes and voices real typographic presence — pull-quote
  styling that feels like a genuine human statement, not a stock
  testimonial box.

---

## 4. Color and mood

- This genre tolerates and often benefits from warmer, less corporate
  palettes than SaaS or fintech — but warmth should come from color choice
  and photography, not from a lack of specificity in the copy.
- Choose a palette that reflects the actual community's world/subject
  matter (a fitness community, a professional guild, a creative
  collective, and a parenting network should not default to the same
  palette) rather than a generic "friendly community" pastel default.
- One accent color for CTAs and key structural moments, kept consistent
  throughout so the join action always reads clearly.

---

## 5. Imagery and 3D

- Real imagery of real members and real community moments is the most
  important visual asset in this genre — prioritize sourcing or
  representing this authentically over any other visual investment.
- Avoid generic stock photography of unrelated smiling people; it is
  immediately recognizable and undermines the "belonging" promise the
  whole genre depends on.
- 3D is rarely the highest-leverage investment here — this genre's trust
  is built through human specificity, not spectacle. Where 3D or motion
  graphics do add value, it's usually in visualizing structure (a program
  roadmap, a cohort calendar, a network/connection visualization showing
  how members relate to each other) rather than as decorative atmosphere.

---

## 6. Motion

- A single signature motion idea that reinforces "this is alive and
  active" works well here: a live or recently-updated activity feed, a
  gently animated map or network of members, content that reveals as the
  visitor scrolls through "what a week looks like" in the community.
- Keep interactive elements warm and responsive rather than sharply
  mechanical — slightly softer easing than a SaaS or fintech site can
  reinforce the human, social tone.
- Avoid motion that makes the community feel more polished/produced than
  it actually is — a slick, over-produced feel can undercut authenticity,
  which is the core currency of this genre.

---

## 7. Layout

- Favor layouts that feel like they're showing you *into* something (a
  window into ongoing activity) rather than a static brochure — think
  feed-like or magazine-like structures over rigid corporate grids.
- Give real testimonials and community photos generous space rather than
  cramming many small quote-boxes together — a few well-presented real
  voices beat a dense wall of small quotes.
- Keep the join/pricing path easy to reach from anywhere without needing
  to scroll through the entire page again.

---

## 8. Credibility devices specific to membership sites

- Specific member counts, retention/duration signals ("members who've been
  here 2+ years"), or activity-level indicators, if genuinely strong,
  build confidence that this is an active, healthy community rather than
  a ghost town.
- Clear terms (price, cancellation, what's included at each tier) reduce
  the unique anxiety this genre carries around social/financial
  commitment.
- Leader/host credibility (Section 2) matters more here than in most other
  genres, since many memberships are built around trust in a specific
  person or founding team.

---

## 9. Technical requirements

- Mobile-first, since community browsing and casual sharing often happens
  on mobile even if joining happens later on desktop.
- If showing any live/dynamic community content (feed, calendar, member
  count), make sure it degrades gracefully and never displays obviously
  stale or broken data — a visibly dead "recent activity" feed damages
  trust more than not showing one at all.
- Keep the join/checkout flow as simple as the e-commerce genre's
  checkout — this is a purchase decision even though the framing is social.

---

## 10. Forcing variety across runs

At the start of each run, explicitly choose and record:

1. The design thesis — what specific feeling of belonging this community
   offers, and to whom.
2. The community's actual subject/culture and the resulting typographic
   and color choices (not a generic warm-pastel default).
3. What real, specific proof of "this community is alive" will be shown,
   and how.
4. The one signature motion idea reinforcing activity/liveliness.
5. Where, if anywhere, structure-visualization (roadmap, network, calendar)
   earns a design investment for this specific community.

If the agent notices it's defaulting to smiling-stock-photo-plus-pastel-
plus-script-font, it must choose a different point in the option space.
