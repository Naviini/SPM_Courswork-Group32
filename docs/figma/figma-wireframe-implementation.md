# Figma Wireframe Implementation Package

Date: 2026-04-20
Status: In progress

## Goal
Build a functional Figma prototype for the Nexium e-commerce web and mobile experience using the exact flows and interaction behavior represented in this repository.

## Source Files
The wireframe behavior should follow these screens and scripts:
- index.html
- all-cell-phones.html
- product-details.html
- compare-products.html
- cart.html
- saved-items.html
- customization-studio.html
- store-locator.html
- mobile-app.html
- script.js
- all-cell-phones.js
- product-details.js
- compare-products.js

## Output Files In This Package
- figma-click-map.csv: full target-by-target interaction map
- figma-prototype-variables.json: prototype variables and defaults
- figma-wireframe-qa-checklist.md: validation checklist

## Figma Setup
1. Create pages:
- Web Wireframes
- Mobile Wireframes
- Components
- Prototype QA

2. Create frame IDs exactly as listed below.
3. Create variables using figma-prototype-variables.json.
4. Wire interactions using figma-click-map.csv.
5. Run QA using figma-wireframe-qa-checklist.md.

## Frame Inventory

### Web
- WEB_01_Home
- WEB_02_AllPhones
- WEB_03_ProductDetails
- WEB_04_Compare
- WEB_04_Compare_Empty
- WEB_05_Cart
- WEB_05_Cart_Empty
- WEB_06_SavedItems
- WEB_07_CustomizationStudio
- WEB_08_StoreLocator

### Mobile
- MOB_01_Home
- MOB_02_Browse
- MOB_03_Product
- MOB_04_Account
- MOB_05_Customization
- MOB_06_Saved
- MOB_07_Cart

## Interaction Model Rules
1. Compare flow:
- CompareCount min is 0, max is 4.
- Show compare-limit modal if user tries to add a 5th item.
- Compare action is enabled only when CompareCount >= 2.
- If CompareCount < 2 on compare page, route to WEB_04_Compare_Empty.

2. Cart and saved flow:
- Add to cart increments CartCount.
- Save toggles SavedCount.
- Save for later moves item cart -> saved.
- Add from saved moves item saved -> cart.

3. Customization flow:
- Max stickers per design is 6.
- Submit customization increments CustomOrderCount.
- Optional post-submit route to cart.

4. Promo flow:
- PromoApplied is visual state for customization subtotal discounts.
- Promo visuals affect customization subtotal block only.

5. Store selection:
- SelectedBranch updates from store card or map pin selection.
- Header branch label always reflects SelectedBranch.

## Component Naming Convention
Use these component prefixes in Figma for consistency:
- CMP_: reusable component
- FRM_: top-level frame
- BTN_: button
- LNK_: text link
- CHK_: checkbox/toggle
- SEL_: select/dropdown
- INP_: input
- MODAL_: modal/overlay
- TRAY_: tray/drawer
- TAB_: bottom tab item

Examples:
- CMP_Header_Web
- CMP_Footer_Web
- CMP_ProductCard_PLP
- TRAY_Compare
- MODAL_CompareLimit
- CMP_TabBar_Mobile

## Recommended Wiring Order
1. Wire global web header and side menu links.
2. Wire WEB_01_Home to WEB_03_ProductDetails and WEB_02_AllPhones.
3. Wire compare tray and WEB_04_Compare guards.
4. Wire cart and saved state transitions.
5. Wire customization studio submit and custom order count updates.
6. Wire store locator branch selection bindings.
7. Wire mobile bottom tabs and mobile product/cart/customization links.
8. Execute QA checklist.

## Implementation Log
- 2026-04-20: Created initial implementation package in docs/figma.
- Next: Build Figma file using figma-click-map.csv and confirm all QA checks.
