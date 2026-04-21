# Figma Wireframe QA Checklist

Date: 2026-04-20
Scope: Nexium web and mobile wireframe prototype

## A. Setup
- [ ] All required frames exist with exact IDs from the implementation guide.
- [ ] Variables collection is created and defaults match figma-prototype-variables.json.
- [ ] Global components exist: web header, web footer, compare tray, mobile tab bar.

## B. Global Navigation
- [ ] Header logo routes to WEB_01_Home from all web frames.
- [ ] Header store locator routes to WEB_08_StoreLocator from all web frames.
- [ ] Header cart routes to WEB_05_Cart from all web frames.
- [ ] Header saved items routes to WEB_06_SavedItems from all web frames.
- [ ] Header customization studio routes to WEB_07_CustomizationStudio from all web frames.
- [ ] Side menu links route to expected destinations.

## C. Product Discovery Flow
- [ ] WEB_01_Home product cards route to WEB_03_ProductDetails.
- [ ] WEB_01_Home view more routes to WEB_02_AllPhones.
- [ ] WEB_02_AllPhones product cards route to WEB_03_ProductDetails.
- [ ] WEB_03_ProductDetails breadcrumbs return to home and all phones.

## D. Compare Flow
- [ ] CompareCount increments and decrements from PLP compare checkboxes.
- [ ] Compare tray compare action remains disabled when CompareCount < 2.
- [ ] Compare tray compare action routes to WEB_04_Compare when CompareCount >= 2.
- [ ] CompareCount cannot exceed 4.
- [ ] Compare limit modal appears when attempting to add a fifth item.
- [ ] WEB_04_Compare routes to WEB_04_Compare_Empty when CompareCount < 2.

## E. Cart and Saved Flow
- [ ] Add to cart actions increase CartCount across home, PLP, PDP, compare, and recommendations.
- [ ] Save actions update SavedCount across home, PLP, PDP, compare.
- [ ] Save for later moves item cart -> saved and updates counts.
- [ ] Add from saved moves item saved -> cart and updates counts.
- [ ] WEB_05_Cart_Empty appears when CartCount = 0 and CustomOrderCount = 0.

## F. Customization Flow
- [ ] Template, text, font, color, size, placement, and accent controls switch variants correctly.
- [ ] Sticker add and duplicate actions are blocked at 6 stickers.
- [ ] Submit customization increments CustomOrderCount.
- [ ] Optional post-submit route to cart works.
- [ ] Download and copy actions show informational overlays.

## G. Promo and Totals
- [ ] Promo apply sets PromoApplied = true only on valid promo path.
- [ ] Promo remove sets PromoApplied = false.
- [ ] Promo visual discount applies only to customization subtotal area.

## H. Store Locator
- [ ] Selecting store card sets SelectedBranch and active card state.
- [ ] Selecting map pin sets SelectedBranch and active card state.
- [ ] Header branch label reflects SelectedBranch on all web screens.

## I. Mobile Flows
- [ ] Mobile tab bar routes correctly between all mobile frames.
- [ ] Mobile home/browse product cards route to MOB_03_Product.
- [ ] Mobile add to cart increments CartCount and routes to MOB_07_Cart where intended.
- [ ] Mobile customization submit increments CustomOrderCount and routes to MOB_07_Cart.

## J. Final Sign-off
- [ ] Every non-terminal frame has at least one inbound and one outbound interaction.
- [ ] No dead-end overlays remain open without close action.
- [ ] All count variables remain non-negative during test run.
- [ ] Prototype successfully demonstrates end-to-end browse -> compare -> cart -> customization paths.
