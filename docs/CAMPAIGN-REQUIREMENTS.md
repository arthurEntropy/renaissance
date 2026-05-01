# Campaign & GM Tools — Feature Requirements

> Status: Draft for discussion. All decisions marked **[DECIDE]** need resolution before implementation begins.

---

## Overview

This document defines requirements for the campaign system — a set of features that allow a Game Master to create and manage a persistent campaign, invite players, curate game content, control NPCs and beast instances, and generate in-world economy content. Players within a campaign experience a filtered, GM-curated view of the app.

The app is a **companion tool**, not a VTT. Combat and live gameplay are assumed to run on an external platform (e.g., Roll20). This app manages persistent data _between_ sessions.

---

## Table of Contents

1. [Data Model](#1-data-model)
2. [Campaign Lifecycle](#2-campaign-lifecycle)
3. [Membership & Roles](#3-membership--roles)
4. [Campaign Mode (Player Experience)](#4-campaign-mode-player-experience)
5. [Concept Curation](#5-concept-curation)
6. [GM Dashboard](#6-gm-dashboard)
7. [NPCs](#7-npcs)
8. [Beast Instances](#8-beast-instances)
9. [Shop Generator](#9-shop-generator)
10. [Invitation Flow](#10-invitation-flow)
11. [Authentication & Authorization](#11-authentication--authorization)
12. [Open Questions](#12-open-questions)

---

## 1. Data Model

### 1.1 Campaign entity

A new top-level entity stored in its own collection (`/campaigns`).

```
Campaign {
  id: string                          // UUID
  name: string                        // Display name
  description: string                 // Optional rich text description (for session notes, premise, etc.)
  coverImageUrl: string | null        // Optional background image URL for the campaign badge
  createdAt: string                   // ISO 8601
  lastModified: string                // ISO 8601
  isDeleted: boolean                  // Soft delete

  foundingGmUserId: string            // UID of the user who created the campaign (protected status)

  members: CampaignMember[]           // All members including GMs

  includedConceptIds: string[]        // IDs of ancestries, cultures, mestieri, world elements included in campaign
                                      // Empty = none; "all" is not a special value — must be explicitly listed

  shops: CampaignShop[]               // Generated shops (see §9)

  sessionNotes: string                // GM-only rich text field for cross-session notes (same editor as elsewhere in app)
}
```

### 1.2 CampaignMember (embedded in Campaign)

```
CampaignMember {
  userId: string                      // Firebase UID of the member
  role: 'gm' | 'player'
  status: 'pending' | 'accepted' | 'declined'
  characterIds: string[]              // Character IDs this player has added to the campaign
  joinedAt: string                    // ISO 8601, set on acceptance
  invitedAt: string                   // ISO 8601
  invitedByUserId: string             // UID of the inviting GM
}
```

### 1.3 Character entity changes

Three new discriminating fields added to the existing `Character` type:

```
Character {
  ...existing fields...

  // Campaign context (mutually exclusive — at most one will be set)
  campaignId: string | null           // If set, this character belongs to a campaign; it is an NPC or beast instance
  isNPC: boolean                      // True for GM-controlled humanoid characters (campaign-owned)

  // Beast type — replaces or elaborates isBeast
  // (see Beast Template requirements doc for full changes)
  beastType: null | 'template' | 'instance'
                                      // null = player character or NPC (not a beast)
                                      // 'template' = bestiary entry with ranges (isBeast = true)
                                      // 'instance' = generated creature with rolled stats (campaign-owned)
  templateId: string | null           // For beastType='instance', references the template
}
```

> **Note:** `isBeast` remains for backward compatibility during migration but `beastType` is the canonical discriminant going forward.

### 1.4 Active campaign state (User)

A new field on the `User` entity tracks which campaign a user is currently "in":

```
User {
  ...existing fields...
  activeCampaignId: string | null     // ID of the campaign the user is currently viewing in campaign mode
                                      // null = not in any campaign (default/standalone app experience)
}
```

This is server-persisted so it survives page reloads.

---

## 2. Campaign Lifecycle

### 2.1 Creating a campaign

- Any user with `status: 'approved'` can create a campaign.
- Creating a campaign:
  - Generates a new `Campaign` document.
  - Adds the creator as a `CampaignMember` with `role: 'gm'`, `status: 'accepted'`, and sets `foundingGmUserId`.
  - Sets `includedConceptIds: []` (empty by default — GM must explicitly add concepts).

### 2.2 Campaign list page (`/campaigns`)

- A new top-level page visible to all approved users.
- Lists all campaigns the signed-in user is a member of (any status), grouped:
  - **Active campaigns** — accepted memberships
  - **Pending invitations** — memberships with `status: 'pending'`
  - **Declined** — memberships with `status: 'declined'` (shown with option to re-accept if a GM re-invites them; see §10.2)
- Each campaign card shows: name, GM names, member count, last modified.
- A "Create Campaign" button is visible to all approved users.

### 2.3 Entering and exiting a campaign

- From the campaign list, clicking "Enter" on an active campaign sets `activeCampaignId` on the user profile.
- While in campaign mode, a **campaign badge** appears at the left end of the global nav bar — symmetrical with the user dropdown at the right end. The badge displays the campaign name and can use the campaign `coverImageUrl`.
- Clicking the campaign badge provides an "Exit Campaign" control (and potentially a quick link to the GM Dashboard for GMs).
- Exiting sets `activeCampaignId` to `null` and returns the user to the unfiltered app experience.
- Switching to a different campaign exits the current one and enters the new one atomically.
- Easy, low-friction access in and out of campaigns is a design priority — the badge must always be visible and one click away from exiting.

### 2.4 Deleting a campaign

- Only the founding GM can delete a campaign (soft delete: `isDeleted: true`).
- Deletion removes the campaign from all members' active/pending views.
- NPC and beast instance characters with `campaignId` matching the deleted campaign should also be soft-deleted.

---

## 3. Membership & Roles

### 3.1 GM powers within a campaign

All GMs (everyone with `role: 'gm'`) share equal powers except founding GM protections:

| Action                   | Any GM              | Founding GM only |
| ------------------------ | ------------------- | ---------------- |
| Invite users to campaign | ✓                   | ✓                |
| Promote player → GM      | ✓                   | ✓                |
| Demote GM → player       | ✓ (not founding GM) | ✓                |
| Remove a player          | ✓                   | ✓                |
| Remove another GM        | ✓ (not founding GM) | ✓                |
| Delete the campaign      | ✗                   | ✓                |

- There must always be at least one GM. The system prevents the last GM from being demoted or removed by another GM. The last GM's only recourse is to delete the campaign.
- The founding GM cannot be demoted or removed by other GMs.

### 3.2 Role management UI (part of GM Dashboard)

- A member list shows all members with their role and status.
- GMs can:
  - Promote a player to GM (confirmation required).
  - Demote a GM to player (disabled for founding GM).
  - Remove a member (confirmation required; removing a member removes their characters from the campaign roster).
  - Resend an invitation to a pending member.
  - Cancel a pending invitation.

### 3.3 Player powers within a campaign

- Players can:
  - Accept or decline invitations.
  - Add one of their own characters to the campaign.
  - Remove one of their own characters from the campaign.
  - Exit campaign mode at any time.
- Players cannot modify GM settings, concept curation, other players' data, or NPCs.

---

## 4. Campaign Mode (Player Experience)

### 4.1 Characters page in campaign mode

- **A character may only belong to one campaign at a time.** Accepting an invitation to a campaign does not move characters — the player explicitly adds them.
- **Default view:** shows only characters the player has added to this campaign (`characterIds` for their membership).
- A "Add to Campaign" control is available:
  - From within the campaign characters view: opens a picker of the user's characters not currently in any campaign.
  - From the standalone characters page (outside campaign mode): each character card offers an "Add to campaign" action for any campaign the user is an accepted member of, provided the character is not already in a campaign.
- Characters can be removed from the campaign by the owning player (or by a GM). Removing a character from a campaign does not delete it — it returns to the player's standalone characters.
- **Character duplication:** Players can duplicate any of their own characters. This produces a full copy with a new ID and no campaign association, making it easy to create a variant for a different campaign.

### 4.2 Character creation in campaign mode

- When a player creates a new character while in campaign mode, that character is automatically added to the campaign.
- Character creation pickers (ancestry, culture, mestiere dropdowns) filter to campaign-included concepts.

### 4.3 Concept pages in campaign mode

- When in campaign mode, **all concept pages filter to show only campaign-included concepts** (Ancestries, Cultures, Mestieri, World Elements, Abilities, Equipment).
- A visible indicator — the campaign badge in the nav bar — makes it clear that filtering is active.
- To view concepts outside the campaign, the user exits campaign mode via the campaign badge. Re-entering is equally fast. The ease of this round-trip is a design requirement.
- GMs see only campaign-selected concepts on concept pages, but should be able to toggle to view all concepts (those included and excluded from the campaign) and add/remove concepts from the campaign.

### 4.4 Bestiary in campaign mode

- The bestiary always shows all beast templates (they are world reference material).
- Beast instances generated by the GM for this campaign are not visible to players unless explicitly shared.

### 4.5 GM-visible content in campaign mode

- GMs see an expanded version of the campaign characters view that includes all members' characters.
- GMs also see NPC characters and beast instances belonging to the campaign.

---

## 5. Concept Curation

### 5.1 Included concepts

- `Campaign.includedConceptIds` is a flat array of concept IDs spanning all concept types.
- The GM Dashboard provides a concept curation UI (see §6.3).
- Concepts can be added or removed from the campaign at any time.
- If a concept is removed from a campaign while a player's character still uses it (e.g., their mestiere is removed), no data is lost and no blocking error occurs — the character is unaffected and the concept simply no longer appears in the campaign-filtered views.

### 5.2 Concept filtering in pickers

When campaign mode is active, pickers that let a player choose ancestry, culture, or mestiere:

- Show only `includedConceptIds` matching the relevant concept type.
- Show a "Campaign concepts only" notice.
- GMs always see all concepts in these pickers (they are not filtered for GMs).

### 5.3 World Elements

- World Elements are available for curation but their inclusion does not currently filter any UI behavior (they are lore reference only).

---

## 6. GM Dashboard

Route: `/campaigns/:id/dashboard` (redirected from `/campaigns/:id` for GM members).

### 6.1 Dashboard structure (tabs or sections)

1. **Overview** — campaign name/description, session notes, quick stats (# players, # concepts, # NPCs, # beast instances)
2. **Members** — invite management and role management (§3.2)
3. **Concepts** — curation UI (§6.3)
4. **Characters** — read-only view of all player characters in the campaign (§6.4)
5. **NPCs** — create and manage GM-controlled characters (§7)
6. **Beasts** — create and manage beast instances (§8)
7. **Shops** — generate and manage shops (§9)

### 6.2 Overview

- Editable campaign name and description.
- Session notes field (GM-only, not visible to players).
- Quick stats summary.

### 6.3 Concept curation UI

- Four sections, one per concept type (Ancestries, Cultures, Mestieri, World Elements).
- Each section shows all available concepts as a searchable, filterable list.
- Each concept has a toggle: "Included in campaign" / "Not included."
- Batch operations: "Include all," "Exclude all."
- Visual indicator (e.g., count badge) shows how many of each type are included.

### 6.4 Player characters view

- Read-only list of all characters added to the campaign by players.
- Each entry shows: character name, player name, ancestry, culture, mestiere, level/XP summary.
- Clicking a character opens a read-only version of the character sheet.
- GMs cannot edit player characters

---

## 7. NPCs

NPCs are characters with `campaignId` set and `isNPC: true`. They are not owned by any player.

### 7.1 NPC creation

- GMs create NPCs from the GM Dashboard > NPCs tab.
- NPCs use the same `createDefaultCharacter()` factory with `isNPC: true` and `campaignId` set.
- NPCs do not have `isBeast: true` — they are humanoid GM characters.
- NPCs are GM-only by default — see §7.3 for visibility options.

### 7.2 NPC editing

- Any GM in the campaign can edit any NPC (no individual ownership within a campaign).
- The full character sheet is available for NPC editing, with mestieri-specific sections (Witch, Summoner, etc.) visible as appropriate.

### 7.3 NPC character sheet visibility

- **[DECIDE]** Should NPCs ever be visible to players? Options:
  - Never (GM-only, background reference).
  - On GM reveal (GM can "share" an NPC to the campaign, making it visible to all players in read-only mode). Recommended for v1.

---

## 8. Beast Instances

Beast instances are characters with `beastType: 'instance'`, `campaignId` set, and `templateId` pointing to a beast template.

> **Prerequisite:** Beast template work (ranges, Challenge score) must be completed before instance generation is meaningful. See the separate beast/bestiary requirements document.

### 8.1 Generating beast instances

- GMs generate instances from the GM Dashboard > Beasts tab.
- A "Generate from template" action:
  1. GM selects a beast template from the bestiary.
  2. GM optionally sets: instance name (defaults to template name), quantity (generate N instances at once).
  3. The system rolls stats within each range defined by the template (body, heart, wits, skill ranks, engagement dice count).
  4. Each generated instance is saved as a character document with `beastType: 'instance'`, `campaignId`, and `templateId`.

### 8.2 Instance editing

- Generated instances can be manually adjusted (the GM can override any rolled value).
- Full character sheet is available for instances, with beast-appropriate sections only (no mestiere, no pronouns/ancestry/culture).
- Instances can be added to and removed from combat groups.

### 8.3 Instance lifecycle

- Instances persist across sessions (they retain HP, conditions, friendship scores if captured by a Summoner).
- GMs can "archive" or delete instances after an encounter is resolved, as well as whole combat groups of instances.

### 8.4 Summoner integration

- A Summoner's `SummonerVessel.beastId` can point to either:
  - A beast template document (current behavior — "this vessel holds something of this type").
  - A beast instance document (future preferred — "this vessel holds _this specific_ creature with its own stats and friendship history").
- The `availableBeasts` picker in `VesselModal` should eventually show campaign beast instances in addition to (or instead of) templates, when the player's character is in a campaign **[DECIDE: migration strategy]**.

---

## 9. Shop Generator

Shops are generated by GMs and persist as campaign data.

### 9.1 Shop data structure

```
CampaignShop {
  id: string                          // UUID
  name: string                        // E.g. "The Black Barrel — Session 4"
  generatedAt: string                 // ISO 8601
  primaryCultureId: string            // The culture this shop is nominally associated with
  generationParams: ShopGenerationParams  // Persisted parameters used to generate this shop
  items: ShopItem[]                   // Snapshot of generated items (see §9.4)
}

ShopGenerationParams {
  cultureMix: Array<{ cultureId: string, weight: number }>
              // Cultures to draw from and their relative weights (weights should sum to 1.0)
  keepingMix: Array<{ keepingId: string, weight: number }>
              // Keeping tiers to draw from and their relative weights
  itemCount: number                   // Target total number of items in the shop
}

ShopItem {
  equipmentId: string                 // Reference to the equipment item (immutable ID)
  // Snapshot fields — copied at generation time to protect against future edits to the source item
  name: string
  description: string
  keeping: string                     // Keeping tier name (snapshot)
  sourceId: string                    // Culture/ancestry/mestiere origin (snapshot)
  cost: number                        // **[DECIDE]** Does this game have explicit costs?
}
```

> **Why snapshots?** If a source equipment item is later edited or deleted, shop contents should remain stable. Storing a snapshot of important display fields alongside the ID achieves this. The ID still allows linking back to the full item detail if it still exists.

### 9.2 Generating a shop

- From the GM Dashboard > Shops tab, a "Generate Shop" button opens the generation panel.
- The GM configures:
  - **Shop name** (free text).
  - **Primary culture** (dropdown of campaign-included cultures — this is the shop's "identity").
  - **Culture mix** — a list of cultures (from campaign-included cultures) each with a percentage weight. Weights must sum to 100%. UI: adjustable sliders or percentage inputs.
  - **Keeping mix** — checkboxes or sliders for each keeping tier (Wretched, Modest, Comfortable, Prosperous, Opulent), with weights.
  - **Item count** — how many items to generate (default: 12; range: 5–30 **[DECIDE]**).
- On "Generate," the backend:
  1. Collects eligible items: equipment with `sourceId` in the selected cultures and `keeping` in the selected tiers.
  2. Randomly samples from the weighted pools to reach `itemCount`.
  3. Returns the generated shop (not yet saved).
- The GM can **re-roll** (regenerate with same params) or **save** the shop to the campaign.

### 9.3 Shop management

- Saved shops are listed in the GM Dashboard > Shops tab.
- Each shop can be:
  - Viewed (full item list with details).
  - Re-generated (new random selection with same params, replacing the current items — confirmation required).
  - Renamed.
  - Deleted.
- Shops are GM-only for now. In a future campaign lobby feature, GMs will be able to publish shops to players.

### 9.4 Shop display

- Shops are displayed in the GM Dashboard > Shops tab only.
- A future campaign lobby feature may expose published shops to players; this is out of scope for the current phase.

---

## 10. Invitation Flow

### 10.1 Sending invitations

- From the GM Dashboard > Members tab, a GM can invite a user by searching by name or email.
- Only users with `status: 'approved'` can be invited.
- The invitation creates a `CampaignMember` entry on the campaign document with `status: 'pending'`.
- On invitation send, the invited user's pending count increments immediately (the backend updates their pending state; the frontend reflects it on next data fetch or via polling/websocket).

### 10.2 In-app invite notification

- Pending invitations are surfaced in the **user dropdown menu** in the top-right of the nav bar.
- When one or more invites are pending, a small **alert icon** (e.g., a dot or badge) appears on the user's display name/avatar in the nav bar.
- The user dropdown includes an **"Invites"** option that opens an **Invites modal** listing all pending campaign invitations.
- Each invitation in the modal shows: campaign name, inviting GM's name, date invited, and Accept / Decline buttons.
- Accepting sets membership `status: 'accepted'` and `joinedAt`; the campaign immediately appears in the user's `/campaigns` list.
- Declining sets `status: 'declined'`. Declined invitations are hidden from the Invites modal but remain visible on the `/campaigns` page as a separate "Declined" group, with an option to re-accept if a GM re-invites them.
- A GM may re-invite a user who has declined. This resets `status` to `'pending'` and triggers the alert icon again.

### 10.3 Notification on acceptance

- There is no automated notification to the GM when a player accepts or declines. GMs can check the Members tab of their GM Dashboard to see current membership statuses.

---

## 11. Authentication & Authorization

### 11.1 Existing roles (unchanged)

| Role                      | Where used | What it means                                                  |
| ------------------------- | ---------- | -------------------------------------------------------------- |
| `user.role: 'admin'`      | App-wide   | Can access `/admin`, `/art`, `/tabletop`; can manage all users |
| `user.role: 'user'`       | App-wide   | Standard user                                                  |
| `user.status: 'approved'` | App-wide   | Can access the app beyond the pending screen                   |

### 11.2 New campaign-scoped roles

| Role                            | Where used   | What it means                           |
| ------------------------------- | ------------ | --------------------------------------- |
| `campaignMember.role: 'gm'`     | Per campaign | Can manage the campaign and its content |
| `campaignMember.role: 'player'` | Per campaign | Can participate in the campaign         |

These roles are **completely separate** from `user.role`. A `user.role: 'user'` can be a GM in a campaign.

### 11.3 Backend middleware requirements

New middleware functions needed:

- `requireCampaignMember(campaignId)` — verifies the requesting user is an accepted member of the given campaign (any role).
- `requireCampaignGM(campaignId)` — verifies the requesting user has `role: 'gm'` in the given campaign.
- `requireCampaignFoundingGM(campaignId)` — verifies the requesting user is the founding GM.

### 11.4 Data access rules

| Resource            | Read                    | Write                                                              |
| ------------------- | ----------------------- | ------------------------------------------------------------------ |
| Campaign document   | Any accepted member     | Any GM (limited fields); founding GM (all fields including delete) |
| CampaignMember list | Any accepted member     | Any GM (non-founding members); founding GM                         |
| NPC characters      | Any GM                  | Any GM                                                             |
| Beast instances     | Any GM                  | Any GM                                                             |
| Player characters   | Owning player + all GMs | Owning player only                                                 |
| Shops               | Any GM                  | Any GM                                                             |

---

## 12. Open Questions

These are explicitly unresolved decisions that need answers before implementation of the relevant section.

| #   | Question                                                                                                      | Section | Options                                                          |
| --- | ------------------------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------- |
| 1   | What happens if a concept is removed from a campaign that a character is already using?                       | §5.1    | Resolved: silent, no blocking                                    |
| 2   | Can GMs edit player characters?                                                                               | §6.4    | (a) Never; (b) Yes, with audit log; (c) Only with player consent |
| 3   | Are NPCs ever visible to players?                                                                             | §7.3    | (a) Never; (b) GM-publishable (recommended); (c) Always          |
| 4   | Are beast instances visible to players?                                                                       | §8      | Deferred — revisit after beast template work                     |
| 5   | Summoner vessel migration: when in a campaign, show instances only, templates only, or both in vessel picker? | §8.4    | Deferred — revisit after beast template work                     |
| 6   | Item count range for shop generation                                                                          | §9.2    | Default 12, range 5–30 — confirm or adjust                       |

---

## Appendix: Implementation Order (Suggested)

This is a rough phasing suggestion, not a commitment.

**Phase 1 — Foundation**

- `Campaign` data model and backend CRUD
- `/campaigns` page (list, create, enter/exit)
- Campaign nav badge (left end of nav bar, theme color + image)
- Campaign membership management (invite, accept/decline, roles)
- Active campaign state on user profile
- In-app invite notifications (alert icon on user dropdown, Invites modal)

**Phase 2 — Concept Curation & Campaign Mode**

- `includedConceptIds` on campaign
- GM Dashboard: Overview + Members + Concepts tabs
- Campaign mode: all concept pages filter to included concepts
- Campaign mode: character creation picker filtering
- Character duplication feature

**Phase 3 — GM Content**

- NPC creation and management (GM Dashboard > NPCs)
- GM Dashboard: Characters tab (read-only player character view)

**Phase 4 — Shop Generator**

- Shop generation backend (weighted random selection)
- GM Dashboard: Shops tab

**Beast work (separate track, after campaign foundation is in place)**

- Beast template restructuring (ranges, Challenge score, player-only field removal)
- Beast instance generation in the GM Dashboard
- Summoner vessel integration with instances
