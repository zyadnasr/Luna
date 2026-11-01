# Phase 6 QA Checklist

Use real Owner, Inventory, Manager, Cashier, and Kitchen accounts. Do not insert fixture data into production.

- [ ] Arabic RTL desktop and mobile
- [ ] English LTR desktop and mobile
- [ ] Italian LTR desktop and mobile
- [ ] Owner can create inventory items and receive batches
- [ ] Inventory role can manage inventory
- [ ] Manager can view inventory and alerts only
- [ ] Cashier and Kitchen cannot mutate inventory
- [ ] Home and Black Ball warehouse filtering
- [ ] Batch receiving validates positive quantity and expiry
- [ ] Movement history is read-only
- [ ] Transfer draft, submit, complete, and cancel
- [ ] Completed transfer creates both movement directions
- [ ] Stock count variance requires a reason
- [ ] Count completion creates adjustment movement
- [ ] Waste validates available quantity
- [ ] Recipe creation and variant recipe override
- [ ] Missing recipe blocks order confirmation
- [ ] Insufficient stock blocks order confirmation
- [ ] Expired batches are not consumed
- [ ] Confirmed order consumes once
- [ ] Cancelled consumed order restores exact batches once
- [ ] Public menu keeps unavailable products visible as Out of Stock
- [ ] Low-stock and expiry alerts use real data
- [ ] Telegram unavailable does not fail inventory operations
- [ ] No horizontal overflow
- [ ] Keyboard navigation and focus states work
