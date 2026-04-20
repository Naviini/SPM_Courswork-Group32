const filterButtons = document.querySelectorAll(".filter-pill");
const productCards = document.querySelectorAll(".product-card");
const catalogSortSelect = document.getElementById("catalogSort");
const catalogCategorySelect = document.getElementById("catalogCategory");
const catalogCarrierSelect = document.getElementById("catalogCarrier");
const catalogModelSelect = document.getElementById("catalogModel");
const catalogBrandSelect = document.getElementById("catalogBrand");
const retailProductGrid = document.querySelector(".retail-product-grid");
const compareButtons = document.querySelectorAll(".compare-toggle");
const compareStatus = document.getElementById("compareStatus");
const selectedProducts = new Set();
const BRANCH_STORAGE_KEY = "selectedBranchName";
const DEFAULT_BRANCH_NAME = "Colombo - Main Branch";
const CUSTOMIZATION_ORDER_STORAGE_KEY = "nexiumCustomizationOrders";
const CUSTOMIZATION_PROMO_STORAGE_KEY = "nexiumCustomizationPromo";
const SAVED_ITEMS_STORAGE_KEY = "nexiumSavedItems";
const CART_ITEMS_STORAGE_KEY = "nexiumCartItems";
const SHOPPING_STATE_EVENT = "nexium:shopping-state-updated";
const AUTH_USERS_STORAGE_KEY = "nexiumAuthUsers";
const AUTH_SESSION_STORAGE_KEY = "nexiumAuthSession";
const AUTH_STATE_EVENT = "nexium:auth-state-updated";
const MAX_STICKERS_PER_DESIGN = 6;
const MIN_STICKER_SIZE = 24;
const MAX_STICKER_SIZE = 56;
const MIN_CUSTOM_TEXT_SIZE = 22;
const MAX_CUSTOM_TEXT_SIZE = 54;
const DEFAULT_CUSTOM_TEXT_SIZE = 32;
const MAX_CUSTOM_ITEM_QUANTITY = 20;
const MAX_CART_ITEM_QUANTITY = 20;
let lastMeasuredHeaderHeight = 0;
let maxMeasuredHeaderHeight = 0;

const sanitizeProductText = (value, fallback = "") =>
  String(value ?? fallback)
    .replace(/\s+/g, " ")
    .trim();

const slugifyProductId = (value) => {
  const normalized = sanitizeProductText(value, "item")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "item";
};

const parseProductPrice = (value, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, value);
  }

  const numericValue = String(value || "").replace(/[^\d.]/g, "");
  const parsedValue = Number.parseFloat(numericValue);
  return Number.isFinite(parsedValue) ? Math.max(0, parsedValue) : fallback;
};

const clampCartQuantity = (quantityValue) => {
  const parsedQuantity = Number(quantityValue);
  if (!Number.isFinite(parsedQuantity)) {
    return 1;
  }

  return Math.min(MAX_CART_ITEM_QUANTITY, Math.max(1, Math.round(parsedQuantity)));
};

const normalizeProductImage = (imageValue) => {
  const normalizedImage = sanitizeProductText(imageValue, "");
  if (!normalizedImage) {
    return "";
  }

  if (/^(https?:|data:image\/|blob:|\/)/i.test(normalizedImage)) {
    return normalizedImage;
  }

  try {
    return new URL(normalizedImage, window.location.href).toString();
  } catch {
    return normalizedImage;
  }
};

const normalizeStoredProduct = (rawProduct, defaultQuantity = 1) => {
  const name = sanitizeProductText(rawProduct?.name, "Nexium Device");
  const subtitle = sanitizeProductText(rawProduct?.subtitle, "");
  const idSeed = sanitizeProductText(rawProduct?.id, "") || `${name}-${subtitle || "default"}`;

  return {
    id: slugifyProductId(idSeed),
    name,
    subtitle,
    brand: sanitizeProductText(rawProduct?.brand, sanitizeProductText(name.split("-")[0], "Nexium")),
    tag: sanitizeProductText(rawProduct?.tag, "Featured deal"),
    price: parseProductPrice(rawProduct?.price, 0),
    image: normalizeProductImage(rawProduct?.image),
    quantity: clampCartQuantity(rawProduct?.quantity ?? defaultQuantity),
  };
};

const readStoredProducts = (storageKey) => {
  try {
    const rawValue = localStorage.getItem(storageKey);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
};

const writeStoredProducts = (storageKey, products) => {
  try {
    localStorage.setItem(storageKey, JSON.stringify(products));
  } catch {
    // Ignore storage errors in restricted contexts.
  }
};

const dedupeSavedProducts = (products) => {
  const deduped = [];
  const seenIds = new Set();

  products.forEach((product) => {
    const normalized = normalizeStoredProduct(product, 1);
    if (seenIds.has(normalized.id)) {
      return;
    }

    seenIds.add(normalized.id);
    deduped.push({ ...normalized, quantity: 1 });
  });

  return deduped;
};

const mergeCartProducts = (products) => {
  const cartMap = new Map();

  products.forEach((product) => {
    const normalized = normalizeStoredProduct(product, 1);
    const existing = cartMap.get(normalized.id);

    if (!existing) {
      cartMap.set(normalized.id, normalized);
      return;
    }

    existing.quantity = clampCartQuantity(existing.quantity + clampCartQuantity(product?.quantity ?? 1));

    if (!existing.image && normalized.image) {
      existing.image = normalized.image;
    }

    if (!existing.subtitle && normalized.subtitle) {
      existing.subtitle = normalized.subtitle;
    }
  });

  return Array.from(cartMap.values());
};

const getSavedProducts = () => dedupeSavedProducts(readStoredProducts(SAVED_ITEMS_STORAGE_KEY));

const getCartProducts = () => mergeCartProducts(readStoredProducts(CART_ITEMS_STORAGE_KEY));

const emitShoppingStateChanged = () => {
  window.dispatchEvent(
    new CustomEvent(SHOPPING_STATE_EVENT, {
      detail: {
        savedItems: getSavedProducts(),
        cartItems: getCartProducts(),
      },
    })
  );
};

const persistSavedProducts = (products, shouldEmit = true) => {
  const normalizedProducts = dedupeSavedProducts(products);
  writeStoredProducts(SAVED_ITEMS_STORAGE_KEY, normalizedProducts);

  if (shouldEmit) {
    emitShoppingStateChanged();
  }

  return normalizedProducts;
};

const persistCartProducts = (products, shouldEmit = true) => {
  const normalizedProducts = mergeCartProducts(products);
  writeStoredProducts(CART_ITEMS_STORAGE_KEY, normalizedProducts);

  if (shouldEmit) {
    emitShoppingStateChanged();
  }

  return normalizedProducts;
};

const isSavedProductId = (productId) => {
  const normalizedId = slugifyProductId(productId);
  return getSavedProducts().some((product) => product.id === normalizedId);
};

const toggleSavedProduct = (rawProduct) => {
  const normalizedProduct = normalizeStoredProduct(rawProduct, 1);
  const savedProducts = getSavedProducts();
  const existingIndex = savedProducts.findIndex((product) => product.id === normalizedProduct.id);

  let isSaved = false;

  if (existingIndex >= 0) {
    savedProducts.splice(existingIndex, 1);
  } else {
    savedProducts.unshift({ ...normalizedProduct, quantity: 1 });
    isSaved = true;
  }

  persistSavedProducts(savedProducts);

  return {
    isSaved,
    item: normalizedProduct,
  };
};

const addProductToCart = (rawProduct, quantity = 1) => {
  const normalizedProduct = normalizeStoredProduct({ ...rawProduct, quantity }, quantity);
  const cartProducts = getCartProducts();
  const existingProduct = cartProducts.find((product) => product.id === normalizedProduct.id);

  if (existingProduct) {
    existingProduct.quantity = clampCartQuantity(existingProduct.quantity + normalizedProduct.quantity);
  } else {
    cartProducts.unshift(normalizedProduct);
  }

  persistCartProducts(cartProducts);
  return normalizedProduct;
};

const removeProductFromSaved = (productId) => {
  const normalizedId = slugifyProductId(productId);
  const nextProducts = getSavedProducts().filter((product) => product.id !== normalizedId);
  persistSavedProducts(nextProducts);
};

const removeProductFromCart = (productId) => {
  const normalizedId = slugifyProductId(productId);
  const nextProducts = getCartProducts().filter((product) => product.id !== normalizedId);
  persistCartProducts(nextProducts);
};

const updateProductCartQuantity = (productId, quantityValue) => {
  const normalizedId = slugifyProductId(productId);
  const nextQuantity = clampCartQuantity(quantityValue);
  const nextProducts = getCartProducts().map((product) => {
    if (product.id !== normalizedId) {
      return product;
    }

    return {
      ...product,
      quantity: nextQuantity,
    };
  });

  persistCartProducts(nextProducts);
};

const moveSavedProductToCart = (productId) => {
  const normalizedId = slugifyProductId(productId);
  const savedProduct = getSavedProducts().find((product) => product.id === normalizedId);
  if (!savedProduct) {
    return;
  }

  addProductToCart(savedProduct, 1);
  removeProductFromSaved(normalizedId);
};

window.NexiumShopState = {
  eventName: SHOPPING_STATE_EVENT,
  normalizeProduct: normalizeStoredProduct,
  getSavedItems: getSavedProducts,
  getCartItems: getCartProducts,
  isSavedItem: isSavedProductId,
  toggleSavedItem: toggleSavedProduct,
  addItemToCart: addProductToCart,
  removeSavedItem: removeProductFromSaved,
  removeCartItem: removeProductFromCart,
  updateCartItemQuantity: updateProductCartQuantity,
  moveSavedItemToCart: moveSavedProductToCart,
  emitStateChanged: emitShoppingStateChanged,
};

const getSavedBranchName = () => {
  try {
    const savedBranch = localStorage.getItem(BRANCH_STORAGE_KEY);
    return savedBranch || DEFAULT_BRANCH_NAME;
  } catch {
    return DEFAULT_BRANCH_NAME;
  }
};

const saveBranchName = (branchName) => {
  try {
    localStorage.setItem(BRANCH_STORAGE_KEY, branchName);
  } catch {
    // Ignore storage errors in restricted contexts.
  }
};

const renderSelectedBranch = (branchName) => {
  document.querySelectorAll("[data-selected-branch]").forEach((element) => {
    element.textContent = branchName;
  });
};

let selectedBranchName = getSavedBranchName();
renderSelectedBranch(selectedBranchName);

const getGlobalZoomProfileClass = () => {
  const deviceZoom = window.devicePixelRatio || 1;

  if (deviceZoom >= 1.38) {
    return "zoom-150";
  }

  if (deviceZoom >= 1.18) {
    return "zoom-125";
  }

  return "zoom-100";
};

const applyGlobalZoomProfile = () => {
  const zoomClass = getGlobalZoomProfileClass();
  document.body.classList.remove("zoom-100", "zoom-125", "zoom-150");
  document.body.classList.add(zoomClass);
  document.body.setAttribute("data-zoom-profile", zoomClass);
};

applyGlobalZoomProfile();
window.addEventListener("resize", applyGlobalZoomProfile);

const syncStickyHeaderOffset = () => {
  const pageHeader = document.querySelector(".home-header");
  if (!pageHeader) {
    return;
  }

  const headerHeight = Math.round(pageHeader.getBoundingClientRect().height);
  if (headerHeight !== lastMeasuredHeaderHeight) {
    lastMeasuredHeaderHeight = headerHeight;
    document.documentElement.style.setProperty("--side-menu-top", `${headerHeight}px`);
  }

  if (headerHeight > maxMeasuredHeaderHeight) {
    maxMeasuredHeaderHeight = headerHeight;
    document.documentElement.style.setProperty("--sticky-header-height", `${maxMeasuredHeaderHeight}px`);
  }
};

const initializeCollapsibleHeader = () => {
  const pageHeader = document.querySelector(".home-header");
  if (!pageHeader) {
    return;
  }

  const primaryInner = pageHeader.querySelector(".primary-inner");
  const collapseEnterThreshold = 96;
  const collapseExitThreshold = 58;
  let isCollapsed = false;
  let isManuallyExpanded = false;
  let isBeyondThresholdState = false;
  let isNavExpandedState = false;
  let isScrollFramePending = false;

  const renderNavToggleIcon = (button, isExpanded) => {
    if (!button) {
      return;
    }

    button.innerHTML = isExpanded
      ? '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 14.5 12 8.5 18 14.5"></path></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M6 9.5 12 15.5 18 9.5"></path></svg>';
  };

  let navToggleButton = null;
  if (primaryInner) {
    navToggleButton = document.createElement("button");
    navToggleButton.type = "button";
    navToggleButton.className = "header-nav-toggle";
    navToggleButton.setAttribute("aria-expanded", "false");
    navToggleButton.setAttribute("aria-label", "Show full header navigation");
    renderNavToggleIcon(navToggleButton, false);
    primaryInner.append(navToggleButton);
  }

  const updateNavToggleButton = (isBeyondThreshold) => {
    if (!navToggleButton) {
      return;
    }

    document.body.classList.toggle("header-toggle-visible", isBeyondThreshold);

    const isExpanded = isBeyondThreshold && isManuallyExpanded;
    navToggleButton.setAttribute("aria-expanded", String(isExpanded));
    navToggleButton.setAttribute(
      "aria-label",
      isExpanded ? "Collapse full header navigation" : "Show full header navigation"
    );
    renderNavToggleIcon(navToggleButton, isExpanded);
  };

  const applyHeaderState = () => {
    const currentScrollY = window.scrollY;
    const isBeyondThreshold = isBeyondThresholdState
      ? currentScrollY > collapseExitThreshold
      : currentScrollY > collapseEnterThreshold;

    if (!isBeyondThreshold && isManuallyExpanded) {
      isManuallyExpanded = false;
    }

    const shouldCollapse = isBeyondThreshold && !isManuallyExpanded;
    const shouldShowExpandedNav = isBeyondThreshold && isManuallyExpanded;

    if (isBeyondThreshold !== isBeyondThresholdState) {
      isBeyondThresholdState = isBeyondThreshold;
      syncStickyHeaderOffset();
    }

    if (shouldShowExpandedNav !== isNavExpandedState) {
      isNavExpandedState = shouldShowExpandedNav;
      document.body.classList.toggle("header-nav-expanded", shouldShowExpandedNav);
      syncStickyHeaderOffset();
    }

    updateNavToggleButton(isBeyondThreshold);

    if (shouldCollapse !== isCollapsed) {
      isCollapsed = shouldCollapse;
      document.body.classList.toggle("header-collapsed", shouldCollapse);
      syncStickyHeaderOffset();
    }
  };

  syncStickyHeaderOffset();
  applyHeaderState();

  navToggleButton?.addEventListener("click", () => {
    isManuallyExpanded = !isManuallyExpanded;
    applyHeaderState();
  });

  window.addEventListener("scroll", () => {
    if (isScrollFramePending) {
      return;
    }

    isScrollFramePending = true;
    window.requestAnimationFrame(() => {
      isScrollFramePending = false;
      applyHeaderState();
    });
  }, { passive: true });

  window.addEventListener("resize", () => {
    syncStickyHeaderOffset();
    applyHeaderState();
  });
};

initializeCollapsibleHeader();

const initializeSideMenu = () => {
  const pageHeader = document.querySelector(".home-header");
  const menuTrigger = document.querySelector(".menu-trigger");

  if (!pageHeader || !menuTrigger || document.querySelector(".side-menu")) {
    return;
  }

  const mainMenuLinks = [
    { label: "Deals", href: "index.html#featured-offers" },
    { label: "Support & Services", href: "index.html#support" },
    { label: "Brands", href: "index.html#preowned" },
    { label: "Discover", href: "index.html#advice" },
  ];

  const departmentLinks = [
    { label: "Mobile Phones", href: "all-cell-phones.html" },
    { label: "Headphones", href: "index.html#accessories" },
    { label: "Tableats", href: "index.html#catalog" },
    { label: "Chagers", href: "index.html#accessories" },
    { label: "Cabels", href: "index.html#accessories" },
    { label: "Cases", href: "index.html#accessories" },
    { label: "Screen Protection", href: "index.html#accessories" },
    { label: "Car & Travel Accessories", href: "index.html#accessories" },
    { label: "Grips", href: "index.html#accessories" },
    { label: "Gimbels", href: "index.html#accessories" },
    { label: "Stands", href: "index.html#accessories" },
    { label: "Powerbanks", href: "index.html#accessories" },
    { label: "Other Accessories", href: "index.html#accessories" },
  ];

  const sideMenu = document.createElement("aside");
  sideMenu.className = "side-menu";
  sideMenu.setAttribute("aria-hidden", "true");
  sideMenu.setAttribute("aria-label", "Main menu");

  sideMenu.innerHTML = `
    <div class="side-menu-body">
      <nav class="side-menu-links" aria-label="Main menu links">
        ${mainMenuLinks
          .map(
            (item) => `<a class="side-menu-link" href="${item.href}"><span>${item.label}</span><span aria-hidden="true">›</span></a>`
          )
          .join("")}
      </nav>

      <div class="side-menu-divider" aria-hidden="true"></div>

      <section class="side-menu-group">
        <h2>Catogaries</h2>
        <nav class="side-menu-links" aria-label="Department links">
          ${departmentLinks
            .map(
              (item) => `<a class="side-menu-link" href="${item.href}"><span>${item.label}</span><span aria-hidden="true">›</span></a>`
            )
            .join("")}
        </nav>
      </section>
    </div>
  `;

  document.body.append(sideMenu);

  menuTrigger.setAttribute("aria-haspopup", "dialog");
  menuTrigger.setAttribute("aria-expanded", "false");

  const syncMenuOffset = () => {
    syncStickyHeaderOffset();
    const menuWidth = Math.round(sideMenu.getBoundingClientRect().width);
    document.documentElement.style.setProperty("--side-menu-width", `${menuWidth}px`);
  };

  syncMenuOffset();

  const closeMenu = () => {
    document.body.classList.remove("side-menu-open");
    menuTrigger.setAttribute("aria-expanded", "false");
    sideMenu.setAttribute("aria-hidden", "true");
  };

  const openMenu = () => {
    document.body.classList.add("side-menu-open");
    menuTrigger.setAttribute("aria-expanded", "true");
    sideMenu.setAttribute("aria-hidden", "false");
  };

  menuTrigger.addEventListener("click", () => {
    syncMenuOffset();

    if (document.body.classList.contains("side-menu-open")) {
      closeMenu();
      return;
    }

    openMenu();
  });

  sideMenu.querySelectorAll(".side-menu-link").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("click", (event) => {
    if (!document.body.classList.contains("side-menu-open")) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    if (sideMenu.contains(target) || menuTrigger.contains(target)) {
      return;
    }

    closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  window.addEventListener("resize", syncMenuOffset);
};

initializeSideMenu();

const parseCardPrice = (card) => {
  const priceText = card.querySelector(".price-big")?.textContent || "";
  const numeric = priceText.replace(/[^\d.]/g, "");
  return numeric ? Number.parseFloat(numeric) : Number.POSITIVE_INFINITY;
};

const getCardBrand = (card) => {
  const title = (card.querySelector("h3")?.textContent || "").toLowerCase();

  if (title.includes("samsung")) {
    return "samsung";
  }

  if (title.includes("apple") || title.includes("iphone")) {
    return "apple";
  }

  if (title.includes("google") || title.includes("pixel")) {
    return "google";
  }

  if (title.includes("motorola") || title.includes("moto")) {
    return "motorola";
  }

  return "other";
};

const getCardModelFamily = (card) => {
  const title = (card.querySelector("h3")?.textContent || "").toLowerCase();

  if (title.includes("galaxy")) {
    return "galaxy";
  }

  if (title.includes("iphone")) {
    return "iphone";
  }

  if (title.includes("pixel")) {
    return "pixel";
  }

  if (title.includes("motorola") || title.includes("moto")) {
    return "motorola";
  }

  return "other";
};

const isUnlockedCard = (card) => {
  const subtitle = (card.querySelector("p")?.textContent || "").toLowerCase();
  return subtitle.includes("unlocked");
};

const applyCatalogControls = () => {
  if (!retailProductGrid || !productCards.length) {
    return;
  }

  const sortValue = catalogSortSelect?.value || "featured";
  const categoryValue = catalogCategorySelect?.value || "all";
  const carrierValue = catalogCarrierSelect?.value || "all";
  const modelValue = catalogModelSelect?.value || "all";
  const brandValue = catalogBrandSelect?.value || "all";

  const cards = Array.from(productCards).filter((card) => {
    const categoryMatch = categoryValue === "all" || card.dataset.category === categoryValue;
    const carrierMatch =
      carrierValue === "all" ||
      (carrierValue === "unlocked" && isUnlockedCard(card)) ||
      (carrierValue === "carrier" && !isUnlockedCard(card));
    const modelMatch = modelValue === "all" || getCardModelFamily(card) === modelValue;
    const brandMatch = brandValue === "all" || getCardBrand(card) === brandValue;

    return categoryMatch && carrierMatch && modelMatch && brandMatch;
  });

  cards.sort((a, b) => {
    if (sortValue === "price-low") {
      return parseCardPrice(a) - parseCardPrice(b);
    }

    if (sortValue === "price-high") {
      return parseCardPrice(b) - parseCardPrice(a);
    }

    if (sortValue === "name") {
      const titleA = (a.querySelector("h3")?.textContent || "").toLowerCase();
      const titleB = (b.querySelector("h3")?.textContent || "").toLowerCase();
      return titleA.localeCompare(titleB);
    }

    return Number(a.dataset.originalOrder || 0) - Number(b.dataset.originalOrder || 0);
  });

  productCards.forEach((card) => {
    card.style.display = "none";
  });

  cards.forEach((card) => {
    card.style.display = "grid";
    retailProductGrid.append(card);
  });
};

if (retailProductGrid && productCards.length) {
  Array.from(productCards).forEach((card, index) => {
    card.dataset.originalOrder = String(index);
  });

  [catalogSortSelect, catalogCategorySelect, catalogCarrierSelect, catalogModelSelect, catalogBrandSelect]
    .filter(Boolean)
    .forEach((control) => {
      control.addEventListener("change", applyCatalogControls);
    });

  if (catalogSortSelect || catalogCategorySelect || catalogCarrierSelect || catalogModelSelect || catalogBrandSelect) {
    applyCatalogControls();
  }
}

if (filterButtons.length && !catalogCategorySelect) {
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const { filter } = button.dataset;

      filterButtons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");

      productCards.forEach((card) => {
        const match = filter === "all" || card.dataset.category === filter;
        card.style.display = match ? "grid" : "none";
      });
    });
  });
}

const featuredProductRow = document.querySelector(".featured-product-row");
const featuredPrevButton = document.querySelector(".featured-carousel-prev");
const featuredNextButton = document.querySelector(".featured-carousel-next");

if (featuredProductRow && featuredPrevButton && featuredNextButton) {
  const getFeaturedScrollAmount = () => {
    const firstItem = featuredProductRow.querySelector(".featured-item");
    if (!firstItem) {
      return 260;
    }

    const styles = window.getComputedStyle(featuredProductRow);
    const columnGap = Number.parseFloat(styles.columnGap || "0") || 0;
    return firstItem.getBoundingClientRect().width + columnGap;
  };

  featuredPrevButton.addEventListener("click", () => {
    featuredProductRow.scrollBy({
      left: -getFeaturedScrollAmount(),
      behavior: "smooth",
    });
  });

  featuredNextButton.addEventListener("click", () => {
    featuredProductRow.scrollBy({
      left: getFeaturedScrollAmount(),
      behavior: "smooth",
    });
  });
}

const parseNumericValue = (text) => {
  const numeric = String(text || "").replace(/[^\d.]/g, "");
  if (!numeric) {
    return null;
  }

  const parsed = Number.parseFloat(numeric);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseReviewCountFromText = (text) => {
  const match = String(text || "").match(/\((\d[\d,]*)/);
  if (!match) {
    return null;
  }

  const parsed = Number.parseInt(match[1].replace(/,/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const extractBackgroundImageUrl = (element) => {
  if (!element) {
    return "";
  }

  const backgroundImage = window.getComputedStyle(element).backgroundImage;
  if (!backgroundImage || backgroundImage === "none") {
    return "";
  }

  const match = backgroundImage.match(/url\(["']?(.*?)["']?\)/);
  return match?.[1] || "";
};

const inferBrandFromTitle = (title) => {
  const normalized = String(title || "").toLowerCase();

  if (normalized.includes("samsung")) {
    return "Samsung";
  }

  if (normalized.includes("apple") || normalized.includes("iphone")) {
    return "Apple";
  }

  if (normalized.includes("google") || normalized.includes("pixel")) {
    return "Google";
  }

  if (normalized.includes("motorola") || normalized.includes("moto")) {
    return "Motorola";
  }

  return "Nexium";
};

const buildProductDetailsHref = (card) => {
  if (!card) {
    return "product-details.html";
  }

  const title = (
    card.querySelector("h3")?.textContent ||
    card.querySelector(".mini-product-link")?.textContent ||
    card.querySelector(".product-title")?.textContent ||
    card.dataset.productName ||
    "Nexium Smart Phone"
  )
    .replace(/\s+/g, " ")
    .trim();

  const subtitle = (
    card.querySelector(".retail-subtitle")?.textContent ||
    card.querySelector(".product-subtitle")?.textContent ||
    card.querySelector("p")?.textContent ||
    card.dataset.productSubtitle ||
    "Unlocked"
  )
    .replace(/\s+/g, " ")
    .trim();

  const ratingText =
    card.querySelector(".rating-line")?.textContent ||
    card.querySelector(".product-rating")?.textContent ||
    card.querySelector(".mini-product-rating")?.textContent ||
    "";

  const rating = parseNumericValue(ratingText);
  const reviews = parseReviewCountFromText(ratingText);

  const priceText =
    card.querySelector(".price-big")?.textContent ||
    card.querySelector(".product-price")?.textContent ||
    card.querySelector(".mini-product-pricing strong")?.textContent ||
    card.querySelector("strong")?.textContent ||
    card.dataset.productPrice ||
    "";

  const price = parseNumericValue(priceText);

  const imageElement = card.querySelector("img");
  const image =
    card.dataset.productImage ||
    imageElement?.getAttribute("src") ||
    extractBackgroundImageUrl(card.querySelector(".retail-art")) ||
    extractBackgroundImageUrl(card.querySelector(".featured-art")) ||
    extractBackgroundImageUrl(card.querySelector(".mini-product-art")) ||
    extractBackgroundImageUrl(card.querySelector(".offer-art")) ||
    "";

  const tag = (
    card.querySelector(".deal-tag")?.textContent ||
    card.querySelector(".card-pill")?.textContent ||
    card.dataset.productTag ||
    "Featured deal"
  )
    .replace(/\s+/g, " ")
    .trim();

  const params = new URLSearchParams();
  params.set("name", title);

  if (subtitle) {
    params.set("subtitle", subtitle);
  }

  if (price !== null) {
    params.set("price", price.toFixed(2));
  }

  if (rating !== null) {
    params.set("rating", rating.toFixed(1));
  }

  if (reviews !== null) {
    params.set("reviews", String(reviews));
  }

  params.set("brand", inferBrandFromTitle(title));

  if (image) {
    params.set("image", image);
  }

  if (tag) {
    params.set("tag", tag);
  }

  return `product-details.html?${params.toString()}`;
};

const getStoredProductFromCard = (card) => {
  if (!card) {
    return null;
  }

  const name = sanitizeProductText(
    card.querySelector("h3")?.textContent ||
      card.querySelector(".product-title")?.textContent ||
      card.dataset.productName ||
      ""
  );

  if (!name) {
    return null;
  }

  const subtitle = sanitizeProductText(
    card.querySelector(".retail-subtitle")?.textContent ||
      card.querySelector(".product-subtitle")?.textContent ||
      card.querySelector("p")?.textContent ||
      card.dataset.productSubtitle ||
      ""
  );

  const price = parseProductPrice(
    card.querySelector(".price-big")?.textContent ||
      card.querySelector(".product-price")?.textContent ||
      card.dataset.productPrice ||
      "0",
    0
  );

  const image =
    card.querySelector("img")?.getAttribute("src") ||
    extractBackgroundImageUrl(card.querySelector(".retail-art")) ||
    extractBackgroundImageUrl(card.querySelector(".product-art")) ||
    extractBackgroundImageUrl(card.querySelector(".featured-art")) ||
    extractBackgroundImageUrl(card.querySelector(".mini-product-art")) ||
    "";

  const tag = sanitizeProductText(
    card.querySelector(".deal-tag")?.textContent ||
      card.querySelector(".card-pill")?.textContent ||
      card.dataset.productTag ||
      "Featured deal"
  );

  const idSeed = card.dataset.productId || card.dataset.product || `${name}-${subtitle || "default"}`;

  return normalizeStoredProduct({
    id: idSeed,
    name,
    subtitle,
    price,
    image,
    brand: sanitizeProductText(card.dataset.productBrand || inferBrandFromTitle(name), "Nexium"),
    tag,
  });
};

const setHeartButtonState = (button, isSaved) => {
  if (!button) {
    return;
  }

  button.classList.toggle("is-saved", isSaved);
  button.setAttribute("aria-pressed", String(isSaved));
  button.textContent = isSaved ? "♥" : "♡";
};

const setTextSaveButtonState = (button, isSaved) => {
  if (!button) {
    return;
  }

  button.classList.toggle("is-saved", isSaved);
  button.setAttribute("aria-pressed", String(isSaved));
  button.textContent = isSaved ? "Saved" : "Save";
};

const showCartButtonFeedback = (button, addedText = "Added") => {
  if (!button || button.dataset.feedbackState === "locked") {
    return;
  }

  const originalText = button.dataset.originalText || button.textContent;
  button.dataset.originalText = originalText;
  button.dataset.feedbackState = "locked";
  button.textContent = addedText;

  window.setTimeout(() => {
    button.textContent = button.dataset.originalText || originalText;
    button.dataset.feedbackState = "";
  }, 1100);
};

const initializeRetailWishlistButtons = () => {
  document.querySelectorAll(".retail-product-card .heart-button").forEach((button) => {
    const productCard = button.closest(".retail-product-card");
    const product = getStoredProductFromCard(productCard);

    if (!product) {
      return;
    }

    setHeartButtonState(button, isSavedProductId(product.id));

    if (button.dataset.savedBound === "true") {
      return;
    }

    button.dataset.savedBound = "true";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const result = toggleSavedProduct(product);
      setHeartButtonState(button, result.isSaved);
    });
  });
};

const getStoredProductFromDetailsPage = () => {
  const detailParams = new URLSearchParams(window.location.search);

  const title = sanitizeProductText(
    detailParams.get("name") || document.getElementById("detailTitle")?.textContent || ""
  );
  if (!title) {
    return null;
  }

  const subtitle = sanitizeProductText(
    detailParams.get("subtitle") ||
      document.querySelector(".detail-subtitle")?.textContent ||
      document.querySelector(".detail-description")?.textContent ||
      ""
  );

  const price = parseProductPrice(
    detailParams.get("price") || document.getElementById("detailPrice")?.textContent || "0",
    0
  );
  const image =
    detailParams.get("image") ||
    document.getElementById("detailMainImage")?.getAttribute("src") ||
    document.getElementById("detailStickyImage")?.getAttribute("src") ||
    "";

  const brand = sanitizeProductText(
    detailParams.get("brand") || document.getElementById("detailBrand")?.textContent || inferBrandFromTitle(title),
    "Nexium"
  );

  const tag = sanitizeProductText(
    detailParams.get("tag") || document.getElementById("detailTag")?.textContent || "Featured deal"
  );

  return normalizeStoredProduct({
    id: `${title}-${subtitle || brand}`,
    name: title,
    subtitle,
    price,
    image,
    brand,
    tag,
  });
};

const getStoredProductFromAsideCard = (card) => {
  if (!card) {
    return null;
  }

  const name = sanitizeProductText(card.querySelector("p")?.textContent || "");
  if (!name) {
    return null;
  }

  return normalizeStoredProduct({
    id: name,
    name,
    subtitle: "Accessory",
    price: parseProductPrice(card.querySelector("strong")?.textContent || "0", 0),
    image: card.querySelector("img")?.getAttribute("src") || "",
    brand: inferBrandFromTitle(name),
    tag: "Accessory",
  });
};

const getStoredProductFromCartRecommendation = (card) => {
  if (!card) {
    return null;
  }

  const name = sanitizeProductText(card.querySelector("p")?.textContent || "");
  if (!name) {
    return null;
  }

  return normalizeStoredProduct({
    id: name,
    name,
    subtitle: "Recommended item",
    price: parseProductPrice(card.dataset.productPrice || card.querySelector("strong")?.textContent || "0", 0),
    image:
      card.querySelector("img")?.getAttribute("src") ||
      extractBackgroundImageUrl(card.querySelector(".cart-product-art")) ||
      "",
    brand: inferBrandFromTitle(name),
    tag: "Recommended",
  });
};

const initializeProductDetailsActions = () => {
  const detailSaveButton = document.querySelector(".detail-save-button");
  const detailAddButtons = document.querySelectorAll(".detail-cart-button, .detail-sticky-add-button");
  const detailAccessoryButtons = document.querySelectorAll(".aside-product-card button, .aside-related-card button");
  const detailProduct = getStoredProductFromDetailsPage();

  if (detailSaveButton && detailProduct) {
    setTextSaveButtonState(detailSaveButton, isSavedProductId(detailProduct.id));

    if (detailSaveButton.dataset.savedBound !== "true") {
      detailSaveButton.dataset.savedBound = "true";
      detailSaveButton.addEventListener("click", (event) => {
        event.preventDefault();
        const result = toggleSavedProduct(detailProduct);
        setTextSaveButtonState(detailSaveButton, result.isSaved);
      });
    }
  }

  detailAddButtons.forEach((button) => {
    if (!detailProduct) {
      return;
    }

    if (button.dataset.cartBound === "true") {
      return;
    }

    button.dataset.cartBound = "true";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      addProductToCart(detailProduct, 1);
      showCartButtonFeedback(button);
    });
  });

  detailAccessoryButtons.forEach((button) => {
    if (button.dataset.cartBound === "true") {
      return;
    }

    const card = button.closest(".aside-product-card");
    const accessoryProduct = getStoredProductFromAsideCard(card);
    if (!accessoryProduct) {
      return;
    }

    button.dataset.cartBound = "true";
    button.addEventListener("click", (event) => {
      event.preventDefault();
      addProductToCart(accessoryProduct, 1);
      showCartButtonFeedback(button);
    });
  });
};

const CART_RECOMMENDATIONS_PER_PAGE = 4;
const cartRecommendations = [
  {
    id: "airpods-pro-3",
    name: "Apple - AirPods Pro 3, Wireless Active Noise Cancelling Earbuds",
    price: 199.99,
    comparePrice: 249.99,
    rating: 4.9,
    reviews: 7906,
    tag: "Ultimate Deal",
    image: "assets/assets2/Headphones.jpeg",
    inStock: true,
  },
  {
    id: "airpods-4",
    name: "Apple - AirPods 4 - White",
    price: 121,
    comparePrice: 129.99,
    rating: 4.8,
    reviews: 9320,
    tag: "",
    image: "assets/assets2/Apple.png",
    inStock: false,
  },
  {
    id: "airpods-4-anc",
    name: "Apple - AirPods 4 with Active Noise Cancellation - White",
    price: 164.7,
    comparePrice: 179.99,
    rating: 4.7,
    reviews: 6049,
    tag: "",
    image: "assets/assets2/Headphones.jpeg",
    inStock: false,
  },
  {
    id: "jbl-tune-245nc",
    name: "JBL - Tune 245NC True Wireless Noise Cancelling Earbud",
    price: 59.95,
    comparePrice: 109.95,
    rating: 4.6,
    reviews: 723,
    tag: "Ultimate Deal",
    image: "assets/assets2/Headphones.jpeg",
    inStock: true,
  },
  {
    id: "samsung-buds-pro",
    name: "Samsung - Galaxy Buds Pro Wireless Earbuds",
    price: 149.99,
    comparePrice: 199.99,
    rating: 4.7,
    reviews: 4412,
    tag: "Member Offer",
    image: "assets/assets2/Headphones.jpeg",
    inStock: true,
  },
  {
    id: "pixel-buds-pro",
    name: "Google - Pixel Buds Pro 2",
    price: 179.99,
    comparePrice: 229.99,
    rating: 4.5,
    reviews: 2619,
    tag: "Limited Time",
    image: "assets/assets2/google-pixel-c2.jpg",
    inStock: true,
  },
  {
    id: "beats-studio-buds",
    name: "Beats - Studio Buds +",
    price: 139.99,
    comparePrice: 169.99,
    rating: 4.4,
    reviews: 1872,
    tag: "Top Rated",
    image: "assets/assets2/Headphones.jpeg",
    inStock: true,
  },
  {
    id: "anker-soundcore-p40i",
    name: "Anker - Soundcore P40i Noise Cancelling Earbuds",
    price: 79.99,
    comparePrice: 99.99,
    rating: 4.3,
    reviews: 935,
    tag: "Budget Pick",
    image: "assets/assets2/Headphones.jpeg",
    inStock: true,
  },
];

let cartRecommendationPageIndex = 0;

const escapeRecommendationHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character] || character;
  });

const formatRecommendationPrice = (value) => `$${parseProductPrice(value, 0).toFixed(2)}`;

const buildRecommendationStars = (ratingValue) => {
  const rounded = Math.max(0, Math.min(5, Math.round(Number(ratingValue) || 0)));
  return `${"★".repeat(rounded)}${"☆".repeat(Math.max(0, 5 - rounded))}`;
};

const renderCartRecommendations = (row) => {
  if (!row) {
    return;
  }

  if (!cartRecommendations.length) {
    row.innerHTML = '<p class="cart-recommend-empty">No recommendations available right now.</p>';
    return;
  }

  const pageCount = Math.max(1, Math.ceil(cartRecommendations.length / CART_RECOMMENDATIONS_PER_PAGE));
  cartRecommendationPageIndex = ((cartRecommendationPageIndex % pageCount) + pageCount) % pageCount;

  const startIndex = cartRecommendationPageIndex * CART_RECOMMENDATIONS_PER_PAGE;
  const visibleRecommendations = cartRecommendations.slice(startIndex, startIndex + CART_RECOMMENDATIONS_PER_PAGE);

  row.innerHTML = visibleRecommendations
    .map((item, index) => {
      const tagMarkup = item.tag ? `<small>${escapeRecommendationHtml(item.tag)}</small>` : "";
      const comparePriceMarkup = item.comparePrice
        ? `<span>${formatRecommendationPrice(item.comparePrice)}</span>`
        : "";
      const actionMarkup = item.inStock
        ? `<button type="button" data-recommend-action="add-to-cart">Add to cart</button>`
        : '<div class="cart-sold">Sold Out</div>';
      const nextButtonMarkup =
        index === visibleRecommendations.length - 1 && pageCount > 1
          ? '<button class="cart-next" type="button" data-recommend-action="next-page" aria-label="View more recommendations">›</button>'
          : "";

      return `
        <article class="cart-product-card" data-product-id="${escapeRecommendationHtml(item.id)}" data-product-price="${parseProductPrice(item.price, 0).toFixed(2)}">
          <div class="cart-product-art">
            <img src="${escapeRecommendationHtml(item.image)}" alt="${escapeRecommendationHtml(item.name)}">
          </div>
          <p>${escapeRecommendationHtml(item.name)}</p>
          <div class="cart-rating">${buildRecommendationStars(item.rating)} <span>(${Number(item.reviews || 0).toLocaleString("en-US")})</span></div>
          ${tagMarkup}
          <strong>${formatRecommendationPrice(item.price)} ${comparePriceMarkup}</strong>
          ${actionMarkup}
          ${nextButtonMarkup}
        </article>
      `;
    })
    .join("");
};

const initializeCartRecommendationButtons = () => {
  const recommendationRow = document.querySelector("[data-cart-recommendations-row]");
  if (!recommendationRow) {
    return;
  }

  if (recommendationRow.dataset.recommendationsBound !== "true") {
    recommendationRow.dataset.recommendationsBound = "true";
    recommendationRow.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const actionButton = target.closest("[data-recommend-action]");
      if (!actionButton) {
        return;
      }

      const action = actionButton.getAttribute("data-recommend-action");
      if (!action) {
        return;
      }

      event.preventDefault();

      if (action === "next-page") {
        cartRecommendationPageIndex += 1;
        renderCartRecommendations(recommendationRow);
        return;
      }

      if (action !== "add-to-cart") {
        return;
      }

      const card = actionButton.closest(".cart-product-card");
      const product = getStoredProductFromCartRecommendation(card);
      if (!product) {
        return;
      }

      addProductToCart(product, 1);
      showCartButtonFeedback(actionButton);
    });
  }

  renderCartRecommendations(recommendationRow);
};

const AUTH_TRIGGER_SELECTOR = ".signin-link, .signin-promo-btn, [data-cart-empty-copy] a, [data-auth-quick-link]";
let authModalMode = "signin";

const normalizeAuthSession = (rawSession) => {
  const email = sanitizeProductText(rawSession?.email, "").toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return null;
  }

  const fallbackName = email.split("@")[0] || "Nexium Member";
  const name = sanitizeProductText(rawSession?.name, fallbackName);
  const signedInAt = sanitizeProductText(rawSession?.signedInAt, new Date().toISOString());

  return {
    name,
    email,
    signedInAt,
  };
};

const AUTH_EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const encodeAuthPassword = (passwordValue) => {
  const normalizedPassword = String(passwordValue || "").trim();

  try {
    return btoa(unescape(encodeURIComponent(normalizedPassword)));
  } catch {
    return normalizedPassword;
  }
};

const normalizeAuthUser = (rawUser) => {
  const email = sanitizeProductText(rawUser?.email, "").toLowerCase();
  if (!AUTH_EMAIL_PATTERN.test(email)) {
    return null;
  }

  const passwordHash = sanitizeProductText(rawUser?.passwordHash, "");
  if (!passwordHash) {
    return null;
  }

  const fallbackName = email.split("@")[0] || "Nexium Member";
  const name = sanitizeProductText(rawUser?.name, fallbackName);

  return {
    id: sanitizeProductText(rawUser?.id, slugifyProductId(`${email}-auth-user`)),
    name,
    email,
    passwordHash,
    createdAt: sanitizeProductText(rawUser?.createdAt, new Date().toISOString()),
  };
};

const readAuthUsers = () => {
  try {
    const rawValue = localStorage.getItem(AUTH_USERS_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsedUsers = JSON.parse(rawValue);
    if (!Array.isArray(parsedUsers)) {
      return [];
    }

    return parsedUsers
      .map((user) => normalizeAuthUser(user))
      .filter(Boolean);
  } catch {
    return [];
  }
};

const writeAuthUsers = (users) => {
  try {
    const normalizedUsers = users
      .map((user) => normalizeAuthUser(user))
      .filter(Boolean);

    localStorage.setItem(AUTH_USERS_STORAGE_KEY, JSON.stringify(normalizedUsers));
  } catch {
    // Ignore storage errors in restricted contexts.
  }
};

const registerAuthUser = ({ name, email, password }) => {
  const normalizedName = sanitizeProductText(name, "");
  const normalizedEmail = sanitizeProductText(email, "").toLowerCase();
  const normalizedPassword = String(password || "").trim();

  if (!normalizedName) {
    return {
      ok: false,
      message: "Enter your full name to create an account.",
    };
  }

  if (!AUTH_EMAIL_PATTERN.test(normalizedEmail)) {
    return {
      ok: false,
      message: "Enter a valid email address.",
    };
  }

  if (normalizedPassword.length < 6) {
    return {
      ok: false,
      message: "Password must be at least 6 characters.",
    };
  }

  const existingUsers = readAuthUsers();
  if (existingUsers.some((user) => user.email === normalizedEmail)) {
    return {
      ok: false,
      message: "An account already exists with this email. Please sign in.",
    };
  }

  const registeredUser = normalizeAuthUser({
    id: slugifyProductId(`${normalizedEmail}-${Date.now()}`),
    name: normalizedName,
    email: normalizedEmail,
    passwordHash: encodeAuthPassword(normalizedPassword),
    createdAt: new Date().toISOString(),
  });

  if (!registeredUser) {
    return {
      ok: false,
      message: "Unable to register this account right now.",
    };
  }

  existingUsers.unshift(registeredUser);
  writeAuthUsers(existingUsers);

  return {
    ok: true,
    user: {
      id: registeredUser.id,
      name: registeredUser.name,
      email: registeredUser.email,
      createdAt: registeredUser.createdAt,
    },
  };
};

const authenticateAuthUser = ({ email, password }) => {
  const normalizedEmail = sanitizeProductText(email, "").toLowerCase();
  const normalizedPassword = String(password || "").trim();

  if (!AUTH_EMAIL_PATTERN.test(normalizedEmail)) {
    return {
      ok: false,
      message: "Enter a valid email address.",
    };
  }

  if (!normalizedPassword) {
    return {
      ok: false,
      message: "Enter your password to sign in.",
    };
  }

  const existingUser = readAuthUsers().find((user) => user.email === normalizedEmail);
  if (!existingUser) {
    return {
      ok: false,
      message: "No account found for this email. Create an account first.",
    };
  }

  if (existingUser.passwordHash !== encodeAuthPassword(normalizedPassword)) {
    return {
      ok: false,
      message: "Incorrect password. Please try again.",
    };
  }

  return {
    ok: true,
    user: {
      id: existingUser.id,
      name: existingUser.name,
      email: existingUser.email,
      createdAt: existingUser.createdAt,
    },
  };
};

const readAuthSession = () => {
  try {
    const rawValue = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }

    return normalizeAuthSession(JSON.parse(rawValue));
  } catch {
    return null;
  }
};

const writeAuthSession = (session) => {
  try {
    if (!session) {
      localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
      return;
    }

    localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Ignore storage errors in restricted contexts.
  }
};

const getAuthSession = () => readAuthSession();

const getAuthDisplayName = (session) => sanitizeProductText(session?.name, "Nexium Member");

const emitAuthStateChanged = () => {
  window.dispatchEvent(
    new CustomEvent(AUTH_STATE_EVENT, {
      detail: {
        session: getAuthSession(),
      },
    })
  );
};

const signInAuthSession = ({ name, email }) => {
  const normalizedSession = normalizeAuthSession({
    name,
    email,
    signedInAt: new Date().toISOString(),
  });

  if (!normalizedSession) {
    return null;
  }

  writeAuthSession(normalizedSession);
  emitAuthStateChanged();
  return normalizedSession;
};

const signOutAuthSession = () => {
  writeAuthSession(null);
  emitAuthStateChanged();
};

window.NexiumAuthState = {
  eventName: AUTH_STATE_EVENT,
  getSession: getAuthSession,
  isSignedIn: () => Boolean(getAuthSession()),
  registerUser: registerAuthUser,
  authenticateUser: authenticateAuthUser,
  signIn: signInAuthSession,
  signOut: signOutAuthSession,
};

const ensureAuthQuickActionLinks = () => {
  document.querySelectorAll(".quick-actions").forEach((quickActionsContainer) => {
    if (quickActionsContainer.querySelector("[data-auth-quick-link]")) {
      return;
    }

    const quickAuthLink = document.createElement("a");
    quickAuthLink.href = "#";
    quickAuthLink.className = "quick-action-link auth-quick-link";
    quickAuthLink.setAttribute("aria-label", "Open account dialog");
    quickAuthLink.setAttribute("data-auth-quick-link", "true");
    quickAuthLink.innerHTML = `
      <span class="quick-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" role="img" focusable="false">
          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"></path>
          <path d="M4.5 20a7.5 7.5 0 0 1 15 0"></path>
        </svg>
      </span>
      <span class="quick-action-copy">
        <span data-auth-quick-label>Sign in</span>
        <small data-auth-quick-subcopy>Sign in / Sign out</small>
      </span>
    `;

    quickActionsContainer.append(quickAuthLink);
  });
};

const ensureAuthModal = () => {
  if (document.querySelector("[data-auth-modal-overlay]")) {
    return;
  }

  const authOverlay = document.createElement("div");
  authOverlay.className = "auth-modal-overlay is-hidden";
  authOverlay.setAttribute("data-auth-modal-overlay", "true");
  authOverlay.innerHTML = `
    <div class="auth-modal-card" role="dialog" aria-modal="true" aria-labelledby="authModalTitle">
      <button type="button" class="auth-modal-close" data-auth-close aria-label="Close account dialog">×</button>
      <h2 id="authModalTitle" class="auth-modal-title" data-auth-modal-title>Sign in to Nexium</h2>
      <p class="auth-modal-copy" data-auth-modal-copy>Sign in to save items, track your orders, and check out faster.</p>
      <form class="auth-form" data-auth-form novalidate>
        <label class="auth-field" data-auth-name-field>
          <span>Name</span>
          <input type="text" name="name" autocomplete="name" maxlength="50" required>
        </label>
        <label class="auth-field">
          <span>Email</span>
          <input type="email" name="email" autocomplete="email" required>
        </label>
        <label class="auth-field">
          <span>Password</span>
          <input type="password" name="password" autocomplete="current-password" minlength="6" required>
        </label>
        <button type="submit" class="auth-modal-submit" data-auth-submit>Sign in</button>
      </form>
      <p class="auth-modal-switch-row" data-auth-switch-row>
        <button type="button" class="auth-mode-switch" data-auth-switch-mode>Need an account? Create one</button>
      </p>
      <section class="auth-account-panel" data-auth-account-panel hidden>
        <p class="auth-account-name" data-auth-account-name></p>
        <p class="auth-account-email" data-auth-account-email></p>
        <button type="button" class="auth-modal-signout" data-auth-signout>Sign out</button>
      </section>
      <p class="auth-modal-feedback" data-auth-feedback aria-live="polite"></p>
    </div>
  `;

  document.body.append(authOverlay);
};

const setAuthModalFeedback = (message, tone = "") => {
  const feedbackElement = document.querySelector("[data-auth-feedback]");
  if (!feedbackElement) {
    return;
  }

  feedbackElement.textContent = message;
  feedbackElement.classList.remove("is-error", "is-success");

  if (tone === "error") {
    feedbackElement.classList.add("is-error");
  }

  if (tone === "success") {
    feedbackElement.classList.add("is-success");
  }
};

const closeAuthModal = () => {
  const authOverlay = document.querySelector("[data-auth-modal-overlay]");
  if (!authOverlay) {
    return;
  }

  authOverlay.classList.add("is-hidden");
  document.body.classList.remove("auth-modal-open");
  setAuthModalFeedback("");
};

const renderAuthModal = () => {
  const authOverlay = document.querySelector("[data-auth-modal-overlay]");
  if (!authOverlay) {
    return;
  }

  const authSession = getAuthSession();
  const titleElement = authOverlay.querySelector("[data-auth-modal-title]");
  const copyElement = authOverlay.querySelector("[data-auth-modal-copy]");
  const authForm = authOverlay.querySelector("[data-auth-form]");
  const submitButton = authOverlay.querySelector("[data-auth-submit]");
  const accountPanel = authOverlay.querySelector("[data-auth-account-panel]");
  const accountName = authOverlay.querySelector("[data-auth-account-name]");
  const accountEmail = authOverlay.querySelector("[data-auth-account-email]");
  const nameField = authOverlay.querySelector("[data-auth-name-field]");
  const nameInput = authOverlay.querySelector("input[name='name']");
  const emailInput = authOverlay.querySelector("input[name='email']");
  const passwordInput = authOverlay.querySelector("input[name='password']");
  const switchRow = authOverlay.querySelector("[data-auth-switch-row]");
  const switchModeButton = authOverlay.querySelector("[data-auth-switch-mode]");

  if (!titleElement || !copyElement || !authForm || !submitButton || !accountPanel || !accountName || !accountEmail) {
    return;
  }

  if (authSession) {
    titleElement.textContent = "Account";
    copyElement.textContent = "You are currently signed in.";
    accountName.textContent = getAuthDisplayName(authSession);
    accountEmail.textContent = authSession.email;
    authForm.hidden = true;
    accountPanel.hidden = false;

    if (switchRow instanceof HTMLElement) {
      switchRow.hidden = true;
    }

    return;
  }

  const isSignUp = authModalMode === "signup";

  titleElement.textContent = isSignUp ? "Create account" : "Sign in to Nexium";
  copyElement.textContent =
    isSignUp
      ? "Create your Nexium account to save favorites and track every order."
      : "Sign in to save items, track your orders, and check out faster.";
  submitButton.textContent = isSignUp ? "Create account" : "Sign in";
  authForm.hidden = false;
  accountPanel.hidden = true;

  if (nameField instanceof HTMLElement) {
    nameField.hidden = !isSignUp;
  }

  if (nameInput instanceof HTMLInputElement) {
    nameInput.required = isSignUp;
    if (!isSignUp) {
      nameInput.value = "";
    }
  }

  if (emailInput instanceof HTMLInputElement) {
    emailInput.autocomplete = "email";
  }

  if (passwordInput instanceof HTMLInputElement) {
    passwordInput.autocomplete = isSignUp ? "new-password" : "current-password";
  }

  if (switchRow instanceof HTMLElement) {
    switchRow.hidden = false;
  }

  if (switchModeButton instanceof HTMLElement) {
    switchModeButton.textContent = isSignUp
      ? "Already have an account? Sign in"
      : "Need an account? Create one";
  }
};

const openAuthModal = (mode = "signin") => {
  authModalMode = mode === "signup" ? "signup" : "signin";
  ensureAuthModal();
  renderAuthModal();

  const authOverlay = document.querySelector("[data-auth-modal-overlay]");
  if (!authOverlay) {
    return;
  }

  authOverlay.classList.remove("is-hidden");
  document.body.classList.add("auth-modal-open");
  setAuthModalFeedback("");

  const authSession = getAuthSession();
  const focusTarget = authSession
    ? authOverlay.querySelector("[data-auth-signout]")
    : authOverlay.querySelector(authModalMode === "signup" ? "input[name='name']" : "input[name='email']");

  window.requestAnimationFrame(() => {
    if (focusTarget instanceof HTMLElement) {
      focusTarget.focus();
    }
  });
};

const renderAuthUi = () => {
  ensureAuthQuickActionLinks();

  const authSession = getAuthSession();
  const displayName = getAuthDisplayName(authSession);
  const firstName = displayName.split(" ")[0] || displayName;

  document.querySelectorAll(".signin-link").forEach((authLink) => {
    if (!authLink.dataset.defaultAuthText) {
      authLink.dataset.defaultAuthText = authLink.textContent?.trim() || "Sign in or Create Account";
    }

    authLink.textContent = authSession ? `My account (${firstName})` : authLink.dataset.defaultAuthText;
    authLink.dataset.authIntent = authSession ? "account" : "signin";
  });

  document.querySelectorAll(".signin-promo-btn-primary").forEach((button) => {
    if (!button.dataset.defaultAuthText) {
      button.dataset.defaultAuthText = button.textContent?.trim() || "Sign in";
    }

    button.textContent = authSession ? `My account (${firstName})` : button.dataset.defaultAuthText;
    button.dataset.authIntent = authSession ? "account" : "signin";
  });

  document.querySelectorAll(".signin-promo-btn-secondary").forEach((button) => {
    if (!button.dataset.defaultAuthText) {
      button.dataset.defaultAuthText = button.textContent?.trim() || "Create an account";
    }

    button.textContent = authSession ? "Sign out" : button.dataset.defaultAuthText;
    button.dataset.authIntent = authSession ? "signout" : "signup";
  });

  document.querySelectorAll("[data-cart-empty-copy] a").forEach((authLink) => {
    if (!authLink.dataset.defaultAuthText) {
      authLink.dataset.defaultAuthText = authLink.textContent?.trim() || "Sign in to see your cart";
    }

    authLink.textContent = authSession ? `Signed in as ${authSession.email}` : authLink.dataset.defaultAuthText;
    authLink.dataset.authIntent = authSession ? "account" : "signin";
  });

  document.querySelectorAll("[data-auth-quick-link]").forEach((authQuickLink) => {
    const quickLabel = authQuickLink.querySelector("[data-auth-quick-label]");
    const quickSubCopy = authQuickLink.querySelector("[data-auth-quick-subcopy]");

    if (quickLabel) {
      quickLabel.textContent = authSession ? "Account" : "Sign in";
    }

    if (quickSubCopy) {
      quickSubCopy.textContent = authSession ? `Hi, ${firstName}` : "Sign in / Sign out";
    }

    authQuickLink.dataset.authIntent = authSession ? "account" : "signin";
  });

  renderAuthModal();
};

const initializeAuthProcess = () => {
  ensureAuthQuickActionLinks();
  ensureAuthModal();

  const authOverlay = document.querySelector("[data-auth-modal-overlay]");
  if (authOverlay && authOverlay.dataset.authBound !== "true") {
    authOverlay.dataset.authBound = "true";

    authOverlay.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      if (target === authOverlay || target.closest("[data-auth-close]")) {
        closeAuthModal();
      }
    });

    const authForm = authOverlay.querySelector("[data-auth-form]");
    authForm?.addEventListener("submit", (event) => {
      event.preventDefault();

      const formData = new FormData(authForm);
      const name = sanitizeProductText(formData.get("name"), "");
      const email = sanitizeProductText(formData.get("email"), "");
      const password = String(formData.get("password") || "").trim();

      if (!email || !password) {
        setAuthModalFeedback("Please enter your email and password.", "error");
        return;
      }

      if (!AUTH_EMAIL_PATTERN.test(email.toLowerCase())) {
        setAuthModalFeedback("Enter a valid email address.", "error");
        return;
      }

      if (password.length < 6) {
        setAuthModalFeedback("Password must be at least 6 characters.", "error");
        return;
      }

      if (authModalMode === "signup") {
        const registerResult = registerAuthUser({
          name,
          email,
          password,
        });

        if (!registerResult.ok || !registerResult.user) {
          setAuthModalFeedback(registerResult.message || "Unable to create account.", "error");
          return;
        }

        const signedInSession = signInAuthSession({
          name: registerResult.user.name,
          email: registerResult.user.email,
        });

        if (!signedInSession) {
          setAuthModalFeedback("Account created, but sign in failed. Please try again.", "error");
          return;
        }

        setAuthModalFeedback("Account created. You are now signed in.", "success");
      } else {
        const authResult = authenticateAuthUser({
          email,
          password,
        });

        if (!authResult.ok || !authResult.user) {
          setAuthModalFeedback(authResult.message || "Unable to sign in.", "error");
          return;
        }

        const signedInSession = signInAuthSession({
          name: authResult.user.name,
          email: authResult.user.email,
        });

        if (!signedInSession) {
          setAuthModalFeedback("Unable to sign in right now. Please try again.", "error");
          return;
        }

        setAuthModalFeedback("Signed in successfully.", "success");
      }

      renderAuthUi();
      authForm.reset();

      window.setTimeout(() => {
        closeAuthModal();
      }, 240);
    });

    const switchModeButton = authOverlay.querySelector("[data-auth-switch-mode]");
    switchModeButton?.addEventListener("click", () => {
      authModalMode = authModalMode === "signup" ? "signin" : "signup";
      setAuthModalFeedback("");
      renderAuthModal();

      const focusTarget = authOverlay.querySelector(
        authModalMode === "signup" ? "input[name='name']" : "input[name='email']"
      );

      if (focusTarget instanceof HTMLElement) {
        focusTarget.focus();
      }
    });

    const signOutButton = authOverlay.querySelector("[data-auth-signout]");
    signOutButton?.addEventListener("click", () => {
      signOutAuthSession();
      closeAuthModal();
    });
  }

  if (document.body.dataset.authTriggersBound !== "true") {
    document.body.dataset.authTriggersBound = "true";

    document.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const authTrigger = target.closest(AUTH_TRIGGER_SELECTOR);
      if (!authTrigger) {
        return;
      }

      event.preventDefault();
      const intent = authTrigger.getAttribute("data-auth-intent") || "signin";

      if (intent === "signout") {
        signOutAuthSession();
        return;
      }

      openAuthModal(intent === "signup" ? "signup" : "signin");
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") {
        return;
      }

      const visibleOverlay = document.querySelector("[data-auth-modal-overlay]:not(.is-hidden)");
      if (!visibleOverlay) {
        return;
      }

      closeAuthModal();
    });
  }

  renderAuthUi();
};

const initializeHomepageProductNavigation = () => {
  const cards = document.querySelectorAll(".retail-product-card, .featured-item, .mini-product, .offer-card");

  cards.forEach((card) => {
    if (card.dataset.detailBound === "true") {
      return;
    }

    card.dataset.detailBound = "true";
    card.classList.add("clickable-product-card");

    if (!card.hasAttribute("tabindex")) {
      card.tabIndex = 0;
    }

    if (!card.hasAttribute("role")) {
      card.setAttribute("role", "link");
    }

    const navigateToDetails = () => {
      window.location.href = buildProductDetailsHref(card);
    };

    card.addEventListener("click", (event) => {
      const ignoredTarget = event.target.closest("button, input, select, textarea, label");
      if (ignoredTarget) {
        return;
      }

      event.preventDefault();
      navigateToDetails();
    });

    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      navigateToDetails();
    });

    card.querySelectorAll("a").forEach((link) => {
      link.href = buildProductDetailsHref(card);
    });

    const retailCtaButton = card.querySelector(".retail-cta");
    if (retailCtaButton) {
      retailCtaButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        const product = getStoredProductFromCard(card);
        if (!product) {
          navigateToDetails();
          return;
        }

        addProductToCart(product, 1);
        showCartButtonFeedback(retailCtaButton);
      });
    }

    const offerButton = card.querySelector(".offer-button");
    if (offerButton) {
      offerButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        navigateToDetails();
      });
    }
  });
};

initializeHomepageProductNavigation();
initializeRetailWishlistButtons();
initializeProductDetailsActions();
initializeCartRecommendationButtons();
initializeAuthProcess();

window.addEventListener(SHOPPING_STATE_EVENT, () => {
  initializeRetailWishlistButtons();
  initializeProductDetailsActions();
  renderAuthUi();
});

window.addEventListener(AUTH_STATE_EVENT, () => {
  renderAuthUi();
});

window.addEventListener("storage", (event) => {
  if (event.key === AUTH_SESSION_STORAGE_KEY) {
    renderAuthUi();
  }
});

compareButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const { product } = button.dataset;

    if (selectedProducts.has(product)) {
      selectedProducts.delete(product);
      button.classList.remove("active");
      button.textContent = "Add to compare";
    } else if (selectedProducts.size < 4) {
      selectedProducts.add(product);
      button.classList.add("active");
      button.textContent = "Selected";
    }

    if (compareStatus) {
      compareStatus.textContent = selectedProducts.size
        ? `Selected: ${Array.from(selectedProducts).join(" / ")}`
        : "No devices selected";
    }
  });
});

const dealsCategoryGrid = document.querySelector(".deals-category-grid");

if (dealsCategoryGrid) {
  const dealsCategories = [
    { thumb: "thumb-top-100-deals-image", label: "Top 100 Deals" },
    { thumb: "thumb-mobile-phone-deals", label: "Mobile Phones", href: "all-cell-phones.html" },
    { thumb: "thumb-mobile-phone-accessories-image", label: "Mobile Phone Accessories" },
    { thumb: "thumb-tablets-ereaders-image", label: "Tablets, E-Readers & Accessories" },
    { thumb: "thumb-refurbished-preowned-image", label: "Refurbished & Pre-owned Phones" },
    { thumb: "thumb-samsung-image", label: "Samsung" },
    { thumb: "thumb-apple-image", label: "Apple" },
    { thumb: "thumb-charger-case-image", label: "Charger, Case" },
    { thumb: "thumb-mobile-phones-image", label: "Mobile Phones Deals", href: "all-cell-phones.html" },
    { thumb: "thumb-headphones-image", label: "Headphones" },
    { thumb: "thumb-screen-protection-image", label: "Screen Protcection" },
    { thumb: "thumb-google-pixel-image", label: "Google Pixel" },
    { thumb: "thumb-android-phones-image", label: "Android Phones" },
    { thumb: "thumb-lively-image", label: "Lively" },
    { thumb: "thumb-motorola-image", label: "Motorola" },
    { thumb: "thumb-verizon-image", label: "Verizon" },
  ];

  const pageSize = 8;
  const totalPages = Math.ceil(dealsCategories.length / pageSize);
  let currentPage = 0;

  const attachDealsNavigationHandlers = () => {
    const prevButton = dealsCategoryGrid.querySelector(".deals-prev");
    const nextButton = dealsCategoryGrid.querySelector(".deals-next");
    const categoryLinks = dealsCategoryGrid.querySelectorAll(".deals-category-item[data-target-href]");

    categoryLinks.forEach((categoryItem) => {
      const targetHref = categoryItem.getAttribute("data-target-href");

      if (!targetHref) {
        return;
      }

      categoryItem.addEventListener("click", (event) => {
        const target = event.target;

        if (target instanceof Element && target.closest(".deals-prev, .deals-next")) {
          return;
        }

        window.location.href = targetHref;
      });

      categoryItem.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") {
          return;
        }

        event.preventDefault();
        window.location.href = targetHref;
      });
    });

    if (prevButton) {
      prevButton.addEventListener("click", () => {
        currentPage = (currentPage - 1 + totalPages) % totalPages;
        renderDealsCategoryPage();
      });
    }

    if (!nextButton) {
      return;
    }

    nextButton.addEventListener("click", () => {
      currentPage = (currentPage + 1) % totalPages;
      renderDealsCategoryPage();
    });
  };

  const renderDealsCategoryPage = () => {
    const start = currentPage * pageSize;
    const pageItems = dealsCategories.slice(start, start + pageSize);

    dealsCategoryGrid.innerHTML = pageItems
      .map((item, index) => {
        const isFirstVisible = index === 0;
        const showPrevButton = currentPage > 0;
        const isLastVisible = index === pageItems.length - 1;
        const linkAttributes = item.href
          ? ` data-target-href="${item.href}" role="link" tabindex="0"`
          : "";

        return `
          <article class="deals-category-item${isLastVisible ? " deals-category-item-last" : ""}"${linkAttributes}>
            <div class="deals-thumb ${item.thumb}"></div>
            <p>${item.label}</p>
            ${
              isFirstVisible && showPrevButton
                ? '<button class="deals-prev" type="button" aria-label="View previous categories">‹</button>'
                : ""
            }
            ${
              isLastVisible
                ? '<button class="deals-next" type="button" aria-label="View more categories">›</button>'
                : ""
            }
          </article>
        `;
      })
      .join("");

    attachDealsNavigationHandlers();
  };

  renderDealsCategoryPage();
}

const locatorZipForm = document.getElementById("locatorZipForm");
const locatorZipInput = document.getElementById("locatorZipInput");
const locatorStoreCards = document.querySelectorAll(".locator-store-card");
const locatorSelectButtons = document.querySelectorAll(".store-select-button");

const branchCoordinatesByCity = {
  colombo: [6.9271, 79.8612],
  gampaha: [7.0917, 79.9999],
  kaluthara: [6.5854, 79.9607],
  kandy: [7.2906, 80.6337],
  galle: [6.0535, 80.221],
  kurunagala: [7.4863, 80.3647],
  anuradhapura: [8.3114, 80.4037],
  jaffna: [9.6615, 80.0255],
};

if (locatorStoreCards.length) {
  const locatorMapElement = document.getElementById("locatorMap");
  const locateButton = document.querySelector(".map-control-locate");
  const zoomInButton = document.querySelector(".map-control-zoom-in");
  const zoomOutButton = document.querySelector(".map-control-zoom-out");

  let locatorMap = null;
  let locatorBranchMarkers = [];
  let userLocationMarker = null;

  const getCityKey = (card) => (card.dataset.city || "").trim().toLowerCase();

  const getCoordsForCard = (card) => {
    const cityKey = getCityKey(card);
    return branchCoordinatesByCity[cityKey] || null;
  };

  const getBranchNameFromCard = (card) => {
    const branchName = card.dataset.branch?.trim();
    if (branchName) {
      return branchName;
    }

    const heading = card.querySelector("h3");
    return heading ? heading.textContent.replace(/^\s*\d+\s*/, "").trim() : DEFAULT_BRANCH_NAME;
  };

  const createBranchIcon = (number, isActive) => {
    if (typeof L === "undefined") {
      return null;
    }

    return L.divIcon({
      className: `locator-marker-icon${isActive ? " is-active" : ""}`,
      html: `<span>${number}</span>`,
      iconSize: [34, 42],
      iconAnchor: [17, 38],
      tooltipAnchor: [0, -30],
    });
  };

  const updateMarkerStates = (activeIndex) => {
    locatorBranchMarkers.forEach((markerEntry, markerIndex) => {
      if (!markerEntry || !markerEntry.marker) {
        return;
      }

      const nextIcon = createBranchIcon(markerIndex + 1, markerIndex === activeIndex);
      if (nextIcon) {
        markerEntry.marker.setIcon(nextIcon);
      }
    });
  };

  const initializeLocatorMap = () => {
    if (!locatorMapElement || typeof L === "undefined") {
      return;
    }

    locatorMap = L.map(locatorMapElement, {
      zoomControl: false,
      preferCanvas: true,
    }).setView([7.8731, 80.7718], 7);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(locatorMap);

    const branchBounds = [];

    locatorBranchMarkers = Array.from(locatorStoreCards).map((card, index) => {
      const coords = getCoordsForCard(card);
      if (!coords) {
        return null;
      }

      const marker = L.marker(coords, {
        icon: createBranchIcon(index + 1, false),
      }).addTo(locatorMap);

      marker.bindTooltip(getBranchNameFromCard(card), {
        direction: "top",
        offset: [0, -24],
      });

      marker.on("click", () => {
        setActiveStore(index, true);
      });

      branchBounds.push(coords);

      return { marker, coords };
    });

    if (branchBounds.length) {
      locatorMap.fitBounds(branchBounds, { padding: [24, 24] });
    }
  };

  const setActiveStore = (index, persistSelection) => {
    if (index < 0 || index >= locatorStoreCards.length) {
      return;
    }

    locatorStoreCards.forEach((card, cardIndex) => {
      card.classList.toggle("locator-store-card-active", cardIndex === index);
    });

    if (locatorMap) {
      updateMarkerStates(index);

      const activeMarkerEntry = locatorBranchMarkers[index];
      if (activeMarkerEntry && activeMarkerEntry.coords) {
        const currentZoom = locatorMap.getZoom();
        const nextZoom = Math.max(currentZoom, 8);

        locatorMap.flyTo(activeMarkerEntry.coords, nextZoom, {
          animate: true,
          duration: 0.45,
        });
      }
    }

    locatorSelectButtons.forEach((button, buttonIndex) => {
      const isActive = buttonIndex === index;

      button.classList.toggle("store-select-button-active", isActive);
      button.textContent = isActive ? "Selected Branch" : "Select Branch";
    });

    if (persistSelection) {
      const activeCard = locatorStoreCards[index];
      const branchName = getBranchNameFromCard(activeCard);
      const cityName = activeCard.dataset.city?.trim();

      selectedBranchName = branchName;
      saveBranchName(branchName);
      renderSelectedBranch(branchName);

      if (locatorZipInput && cityName) {
        locatorZipInput.value = cityName;
      }
    }
  };

  const findStoreIndexByQuery = (query) => {
    const normalizedQuery = query.toLowerCase();

    return Array.from(locatorStoreCards).findIndex((card) => {
      const city = (card.dataset.city || "").toLowerCase();
      const branch = (card.dataset.branch || "").toLowerCase();

      return city.includes(normalizedQuery) || branch.includes(normalizedQuery);
    });
  };

  const getActiveStoreIndex = () =>
    Array.from(locatorStoreCards).findIndex((card) =>
      card.classList.contains("locator-store-card-active")
    );

  locatorStoreCards.forEach((card, index) => {
    card.addEventListener("click", (event) => {
      const ignoredTarget = event.target.closest("a, button");

      if (!ignoredTarget) {
        setActiveStore(index, true);
      }
    });

    const selectButton = card.querySelector(".store-select-button");

    if (selectButton) {
      selectButton.addEventListener("click", () => {
        setActiveStore(index, true);
      });
    }
  });

  if (zoomInButton) {
    zoomInButton.addEventListener("click", () => {
      if (locatorMap) {
        locatorMap.zoomIn();
      }
    });
  }

  if (zoomOutButton) {
    zoomOutButton.addEventListener("click", () => {
      if (locatorMap) {
        locatorMap.zoomOut();
      }
    });
  }

  if (locateButton) {
    locateButton.addEventListener("click", () => {
      if (!locatorMap) {
        return;
      }

      if (!navigator.geolocation) {
        const activeIndex = getActiveStoreIndex();
        if (activeIndex >= 0) {
          setActiveStore(activeIndex, false);
        }
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords = [position.coords.latitude, position.coords.longitude];

          locatorMap.flyTo(userCoords, 11, {
            animate: true,
            duration: 0.45,
          });

          if (userLocationMarker) {
            userLocationMarker.setLatLng(userCoords);
          } else if (typeof L !== "undefined") {
            userLocationMarker = L.circleMarker(userCoords, {
              radius: 8,
              color: "#0f4db8",
              fillColor: "#2a84ff",
              fillOpacity: 0.78,
              weight: 2,
            }).addTo(locatorMap);
          }
        },
        () => {
          const activeIndex = getActiveStoreIndex();
          if (activeIndex >= 0) {
            setActiveStore(activeIndex, false);
          }
        },
        {
          enableHighAccuracy: true,
          maximumAge: 60000,
          timeout: 8000,
        }
      );
    });
  }

  if (locatorZipForm && locatorZipInput) {
    locatorZipForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const query = locatorZipInput.value.trim();
      if (!query) {
        return;
      }

      const matchedIndex = findStoreIndexByQuery(query);
      if (matchedIndex === -1) {
        return;
      }

      setActiveStore(matchedIndex, true);
      locatorStoreCards[matchedIndex].scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
  }

  initializeLocatorMap();

  const savedBranchIndex = Array.from(locatorStoreCards).findIndex(
    (card) => getBranchNameFromCard(card).toLowerCase() === selectedBranchName.toLowerCase()
  );

  setActiveStore(savedBranchIndex >= 0 ? savedBranchIndex : 0, true);
}

const customizationTemplates = {
  "neon-wave": {
    label: "Neon Wave",
    colors: ["#10205d", "#1fc0d2", "#6bffd4"],
    pattern: "wave",
  },
  "sunset-pop": {
    label: "Sunset Pop",
    colors: ["#7430b8", "#ff6a4a", "#ffd375"],
    pattern: "sunburst",
  },
  "minimal-grid": {
    label: "Minimal Grid",
    colors: ["#233043", "#526071", "#cad5df"],
    pattern: "grid",
  },
  "sport-stripe": {
    label: "Sport Stripe",
    colors: ["#111a23", "#0958c8", "#35b3f7"],
    pattern: "stripe",
  },
};

const customizationProducts = {
  "mobile-back-cover": {
    label: "Mobile Back Cover",
    price: 24.99,
  },
  "airpods-case": {
    label: "AirPods Case",
    price: 19.99,
  },
};

const accentLabels = {
  none: "No visual effect",
  burst: "Starburst Overlay",
  ribbons: "Ribbon Weave",
  orbit: "Orbit Ring",
};

const textPlacementLabels = {
  auto: "Auto",
  top: "Top",
  center: "Center",
  bottom: "Bottom",
};

const textFontOptions = {
  "space-grotesk": {
    label: "Space Grotesk",
    canvasStack: '"Space Grotesk", "Manrope", sans-serif',
  },
  manrope: {
    label: "Manrope",
    canvasStack: '"Manrope", "Space Grotesk", sans-serif',
  },
  "serif-display": {
    label: "Serif Display",
    canvasStack: '"Times New Roman", "Georgia", serif',
  },
  "mono-tech": {
    label: "Mono Tech",
    canvasStack: '"Courier New", "Lucida Console", monospace',
  },
};

const customPromoCodes = {
  NEXIUM10: {
    type: "percent",
    value: 10,
    minimumSubtotal: 0,
    label: "10% off customization items",
  },
  STUDIO5: {
    type: "fixed",
    value: 5,
    minimumSubtotal: 30,
    label: "$5 off orders over $30",
  },
  CASE20: {
    type: "percent",
    value: 20,
    minimumSubtotal: 80,
    label: "20% off orders over $80",
  },
};

const formatUsdCurrency = (amount) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => {
    const htmlEntities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return htmlEntities[character] || character;
  });

const getCartProductsSubtotal = () =>
  getCartProducts().reduce(
    (runningTotal, product) => runningTotal + parseProductPrice(product.price, 0) * clampCartQuantity(product.quantity),
    0
  );

const updateCartSummaryTotals = ({ customizationSubtotal, discountAmount } = {}) => {
  const productsSubtotal = getCartProductsSubtotal();
  const productsSubtotalElement = document.querySelector("[data-products-subtotal]");
  const cartTotalElement = document.querySelector("[data-cart-total]");

  if (productsSubtotalElement) {
    productsSubtotalElement.textContent = formatUsdCurrency(productsSubtotal);
  }

  if (!cartTotalElement) {
    return;
  }

  const customizationAmount =
    typeof customizationSubtotal === "number"
      ? customizationSubtotal
      : parseProductPrice(document.querySelector("[data-customization-subtotal]")?.textContent || "0", 0);

  const discountValue =
    typeof discountAmount === "number"
      ? discountAmount
      : parseProductPrice(document.querySelector("[data-promo-discount]")?.textContent || "0", 0);

  const totalAmount = Math.max(0, productsSubtotal + customizationAmount - discountValue);
  cartTotalElement.textContent = formatUsdCurrency(totalAmount);
};

const renderCartAndSavedItemsInCartPage = () => {
  const cartItemsList = document.querySelector("[data-cart-items-list]");
  const cartItemsEmptyState = document.querySelector("[data-cart-items-empty]");
  const cartItemsCount = document.querySelector("[data-cart-items-count]");
  const savedItemsList = document.querySelector("[data-saved-items-list]");
  const savedItemsEmptyState = document.querySelector("[data-saved-items-empty]");
  const savedItemsCount = document.querySelector("[data-saved-items-count]");
  const cartHeading = document.querySelector("[data-cart-empty-heading]");
  const cartCopy = document.querySelector("[data-cart-empty-copy]");

  if (!cartItemsList && !savedItemsList) {
    updateCartSummaryTotals();
    return;
  }

  const cartItems = getCartProducts();
  const savedItems = getSavedProducts();
  const cartUnitCount = cartItems.reduce((runningTotal, product) => runningTotal + clampCartQuantity(product.quantity), 0);

  if (cartItemsCount) {
    cartItemsCount.textContent = `(${cartUnitCount})`;
  }

  if (savedItemsCount) {
    savedItemsCount.textContent = `(${savedItems.length})`;
  }

  if (cartHeading instanceof HTMLElement) {
    if (!cartHeading.dataset.defaultText) {
      cartHeading.dataset.defaultText = cartHeading.textContent || "Your cart is empty";
    }

    cartHeading.textContent = cartUnitCount
      ? `Items in your cart (${cartUnitCount})`
      : cartHeading.dataset.defaultText;
  }

  if (cartCopy instanceof HTMLElement) {
    if (!cartCopy.dataset.defaultHtml) {
      cartCopy.dataset.defaultHtml = cartCopy.innerHTML;
    }

    cartCopy.innerHTML = cartUnitCount
      ? "Review your cart items and continue to checkout when ready."
      : cartCopy.dataset.defaultHtml;
  }

  if (cartItemsList) {
    if (!cartItems.length) {
      cartItemsList.innerHTML = "";
      if (cartItemsEmptyState) {
        cartItemsEmptyState.hidden = false;
      }
    } else {
      if (cartItemsEmptyState) {
        cartItemsEmptyState.hidden = true;
      }

      cartItemsList.innerHTML = cartItems
        .map((product) => {
          const productId = escapeHtml(product.id);
          const productName = escapeHtml(product.name);
          const productSubtitle = escapeHtml(product.subtitle || "");
          const imageUrl = escapeHtml(product.image || "");
          const quantity = clampCartQuantity(product.quantity);
          const lineTotal = product.price * quantity;

          return `
            <article class="cart-line-item">
              <div class="cart-line-media">
                ${imageUrl ? `<img src="${imageUrl}" alt="${productName}">` : "<span>No image</span>"}
              </div>
              <div class="cart-line-details">
                <strong class="cart-line-title">${productName}</strong>
                ${productSubtitle ? `<p class="cart-line-subtitle">${productSubtitle}</p>` : ""}
                <div class="cart-line-price-row">
                  <span>${formatUsdCurrency(product.price)} each</span>
                  <strong>${formatUsdCurrency(lineTotal)}</strong>
                </div>
                <div class="cart-line-actions">
                  <div class="cart-line-qty" aria-label="Quantity controls for ${productName}">
                    <button type="button" data-cart-action="decrease" data-product-id="${productId}" aria-label="Decrease quantity for ${productName}">-</button>
                    <span>${quantity}</span>
                    <button type="button" data-cart-action="increase" data-product-id="${productId}" aria-label="Increase quantity for ${productName}">+</button>
                  </div>
                  <button type="button" class="cart-line-link" data-cart-action="move-to-saved" data-product-id="${productId}">Save for later</button>
                  <button type="button" class="cart-line-link" data-cart-action="remove" data-product-id="${productId}">Remove</button>
                </div>
              </div>
            </article>
          `;
        })
        .join("");
    }
  }

  if (savedItemsList) {
    if (!savedItems.length) {
      savedItemsList.innerHTML = "";
      if (savedItemsEmptyState) {
        savedItemsEmptyState.hidden = false;
      }
    } else {
      if (savedItemsEmptyState) {
        savedItemsEmptyState.hidden = true;
      }

      savedItemsList.innerHTML = savedItems
        .map((product) => {
          const productId = escapeHtml(product.id);
          const productName = escapeHtml(product.name);
          const productSubtitle = escapeHtml(product.subtitle || "");
          const imageUrl = escapeHtml(product.image || "");

          return `
            <article class="cart-line-item">
              <div class="cart-line-media">
                ${imageUrl ? `<img src="${imageUrl}" alt="${productName}">` : "<span>No image</span>"}
              </div>
              <div class="cart-line-details">
                <strong class="cart-line-title">${productName}</strong>
                ${productSubtitle ? `<p class="cart-line-subtitle">${productSubtitle}</p>` : ""}
                <div class="cart-line-price-row">
                  <span>Saved item</span>
                  <strong>${formatUsdCurrency(product.price)}</strong>
                </div>
                <div class="cart-line-actions">
                  <button type="button" class="cart-line-primary" data-saved-action="move-to-cart" data-product-id="${productId}">Add to cart</button>
                  <button type="button" class="cart-line-link" data-saved-action="remove" data-product-id="${productId}">Remove</button>
                </div>
              </div>
            </article>
          `;
        })
        .join("");
    }
  }

  updateCartSummaryTotals();
};

const renderCheckoutSummary = () => {
  const summaryItems = document.querySelector("[data-checkout-items]");
  const emptyState = document.querySelector("[data-checkout-empty]");
  const subtotalElement = document.querySelector("[data-checkout-subtotal]");
  const totalElement = document.querySelector("[data-checkout-total]");
  const payButton = document.querySelector("[data-checkout-pay]");

  if (!summaryItems && !subtotalElement && !totalElement) {
    return;
  }

  const cartItems = getCartProducts();
  const cartSubtotal = getCartProductsSubtotal();

  if (subtotalElement) {
    subtotalElement.textContent = formatUsdCurrency(cartSubtotal);
  }

  if (totalElement) {
    totalElement.textContent = formatUsdCurrency(cartSubtotal);
  }

  if (summaryItems) {
    if (!cartItems.length) {
      summaryItems.innerHTML = "";
      if (emptyState) {
        emptyState.hidden = false;
      }
    } else {
      if (emptyState) {
        emptyState.hidden = true;
      }

      summaryItems.innerHTML = cartItems
        .map((product) => {
          const productName = escapeHtml(product.name);
          const productSubtitle = escapeHtml(product.subtitle || "");
          const imageUrl = escapeHtml(product.image || "");
          const quantity = clampCartQuantity(product.quantity);
          const lineTotal = parseProductPrice(product.price, 0) * quantity;
          const subtitleLine = productSubtitle ? `${productSubtitle} · Qty ${quantity}` : `Qty ${quantity}`;
          const thumbStyle = imageUrl
            ? ` style="background-image: url('${imageUrl}');"`
            : "";

          return `
            <div class="checkout-item">
              <div class="checkout-item-thumb"${thumbStyle}></div>
              <div>
                <strong>${productName}</strong>
                <small>${escapeHtml(subtitleLine)}</small>
              </div>
              <span>${formatUsdCurrency(lineTotal)}</span>
            </div>
          `;
        })
        .join("");
    }
  }

  if (payButton instanceof HTMLButtonElement) {
    payButton.disabled = !cartItems.length;
  }
};

const attachCartSavedItemsActions = () => {
  const cartItemsList = document.querySelector("[data-cart-items-list]");
  const savedItemsList = document.querySelector("[data-saved-items-list]");

  if (cartItemsList && cartItemsList.dataset.cartActionsBound !== "true") {
    cartItemsList.dataset.cartActionsBound = "true";
    cartItemsList.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const actionButton = target.closest("[data-cart-action]");
      if (!actionButton) {
        return;
      }

      const action = actionButton.getAttribute("data-cart-action");
      const productId = actionButton.getAttribute("data-product-id");
      if (!action || !productId) {
        return;
      }

      const product = getCartProducts().find((item) => item.id === productId);
      if (!product) {
        return;
      }

      if (action === "increase") {
        updateProductCartQuantity(productId, product.quantity + 1);
        return;
      }

      if (action === "decrease") {
        if (product.quantity <= 1) {
          removeProductFromCart(productId);
        } else {
          updateProductCartQuantity(productId, product.quantity - 1);
        }
        return;
      }

      if (action === "remove") {
        removeProductFromCart(productId);
        return;
      }

      if (action === "move-to-saved") {
        const currentSavedProducts = getSavedProducts();
        if (!currentSavedProducts.some((savedProduct) => savedProduct.id === productId)) {
          currentSavedProducts.unshift({ ...product, quantity: 1 });
          persistSavedProducts(currentSavedProducts, false);
        }

        removeProductFromCart(productId);
      }
    });
  }

  if (savedItemsList && savedItemsList.dataset.savedActionsBound !== "true") {
    savedItemsList.dataset.savedActionsBound = "true";
    savedItemsList.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const actionButton = target.closest("[data-saved-action]");
      if (!actionButton) {
        return;
      }

      const action = actionButton.getAttribute("data-saved-action");
      const productId = actionButton.getAttribute("data-product-id");
      if (!action || !productId) {
        return;
      }

      if (action === "move-to-cart") {
        moveSavedProductToCart(productId);
        return;
      }

      if (action === "remove") {
        removeProductFromSaved(productId);
      }
    });
  }
};

renderCheckoutSummary();
window.addEventListener(SHOPPING_STATE_EVENT, renderCheckoutSummary);

const normalizeHexColor = (value, fallback = "#ffffff") => {
  const normalizedValue = typeof value === "string" ? value.trim() : "";
  return /^#[0-9a-fA-F]{6}$/.test(normalizedValue) ? normalizedValue.toLowerCase() : fallback;
};

const clampCustomizationTextSize = (sizeValue) => {
  const parsedSize = Number(sizeValue);
  if (!Number.isFinite(parsedSize)) {
    return DEFAULT_CUSTOM_TEXT_SIZE;
  }

  return Math.min(MAX_CUSTOM_TEXT_SIZE, Math.max(MIN_CUSTOM_TEXT_SIZE, Math.round(parsedSize)));
};

const normalizeTextPlacement = (placementValue) => {
  const normalizedValue = typeof placementValue === "string" ? placementValue.trim().toLowerCase() : "auto";
  return textPlacementLabels[normalizedValue] ? normalizedValue : "auto";
};

const getTextStrokeColor = (hexColor) => {
  const normalizedColor = normalizeHexColor(hexColor, "#ffffff");
  const red = Number.parseInt(normalizedColor.slice(1, 3), 16);
  const green = Number.parseInt(normalizedColor.slice(3, 5), 16);
  const blue = Number.parseInt(normalizedColor.slice(5, 7), 16);
  const luminance = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;

  return luminance > 0.62 ? "rgba(8, 20, 34, 0.46)" : "rgba(255, 255, 255, 0.42)";
};

const readCustomizationOrders = () => {
  try {
    const rawOrders = localStorage.getItem(CUSTOMIZATION_ORDER_STORAGE_KEY);
    if (!rawOrders) {
      return [];
    }

    const parsedOrders = JSON.parse(rawOrders);
    return Array.isArray(parsedOrders) ? parsedOrders : [];
  } catch {
    return [];
  }
};

const writeCustomizationOrders = (orders) => {
  try {
    localStorage.setItem(CUSTOMIZATION_ORDER_STORAGE_KEY, JSON.stringify(orders));
  } catch {
    // Ignore write errors in restricted contexts.
  }
};

const clampCustomizationQuantity = (quantity) => {
  const parsedQuantity = Number(quantity);
  if (!Number.isFinite(parsedQuantity)) {
    return 1;
  }

  return Math.min(MAX_CUSTOM_ITEM_QUANTITY, Math.max(1, Math.round(parsedQuantity)));
};

const normalizeCustomizationOrders = (orders) =>
  orders.map((order) => ({
    ...order,
    quantity: clampCustomizationQuantity(order.quantity),
  }));

const readCustomizationPromo = () => {
  try {
    const rawPromo = localStorage.getItem(CUSTOMIZATION_PROMO_STORAGE_KEY);
    if (!rawPromo) {
      return { code: "" };
    }

    const parsedPromo = JSON.parse(rawPromo);
    if (!parsedPromo || typeof parsedPromo !== "object") {
      return { code: "" };
    }

    const code = typeof parsedPromo.code === "string" ? parsedPromo.code.trim().toUpperCase() : "";
    return { code };
  } catch {
    return { code: "" };
  }
};

const writeCustomizationPromo = (promo) => {
  try {
    localStorage.setItem(CUSTOMIZATION_PROMO_STORAGE_KEY, JSON.stringify(promo));
  } catch {
    // Ignore write errors in restricted contexts.
  }
};

const clearCustomizationPromo = () => {
  try {
    localStorage.removeItem(CUSTOMIZATION_PROMO_STORAGE_KEY);
  } catch {
    // Ignore write errors in restricted contexts.
  }
};

const calculateCustomizationPromo = (promoCode, subtotalAmount) => {
  const normalizedCode = promoCode.trim().toUpperCase();
  const promoConfig = customPromoCodes[normalizedCode];

  if (!promoConfig) {
    return {
      isValid: false,
      code: normalizedCode,
      discountAmount: 0,
      label: "",
      message: "Promo code is not recognized.",
    };
  }

  if (subtotalAmount < promoConfig.minimumSubtotal) {
    return {
      isValid: false,
      code: normalizedCode,
      discountAmount: 0,
      label: promoConfig.label,
      message: `This promo requires at least ${formatUsdCurrency(promoConfig.minimumSubtotal)} in customization items.`,
    };
  }

  const rawDiscount =
    promoConfig.type === "percent"
      ? (subtotalAmount * promoConfig.value) / 100
      : promoConfig.value;

  const discountAmount = Math.min(subtotalAmount, Math.round(rawDiscount * 100) / 100);

  return {
    isValid: true,
    code: normalizedCode,
    discountAmount,
    label: promoConfig.label,
    message: `${normalizedCode} applied: ${promoConfig.label}.`,
  };
};

const renderPromoHelpDrawer = () => {
  const promoHelpList = document.querySelector("[data-promo-help-list]");
  if (!(promoHelpList instanceof HTMLElement)) {
    return;
  }

  const promoEntries = Object.entries(customPromoCodes);
  if (!promoEntries.length) {
    promoHelpList.innerHTML = "<li><strong>No active promo codes.</strong><span>Please check again later.</span></li>";
    return;
  }

  promoHelpList.innerHTML = promoEntries
    .map(([promoCode, promoConfig]) => {
      const discountLabel =
        promoConfig.type === "percent"
          ? `${promoConfig.value}% off`
          : `${formatUsdCurrency(promoConfig.value)} off`;
      const thresholdLabel =
        promoConfig.minimumSubtotal > 0
          ? `Min spend ${formatUsdCurrency(promoConfig.minimumSubtotal)}.`
          : "No minimum spend.";

      return `<li><strong>${escapeHtml(promoCode)}</strong><span>${escapeHtml(`${discountLabel} - ${promoConfig.label}. ${thresholdLabel}`)}</span></li>`;
    })
    .join("");
};

const roundRectPath = (context, x, y, width, height, radius) => {
  const normalizedRadius = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + normalizedRadius, y);
  context.arcTo(x + width, y, x + width, y + height, normalizedRadius);
  context.arcTo(x + width, y + height, x, y + height, normalizedRadius);
  context.arcTo(x, y + height, x, y, normalizedRadius);
  context.arcTo(x, y, x + width, y, normalizedRadius);
  context.closePath();
};

const drawTemplatePattern = (context, template, width, height) => {
  context.save();
  context.globalAlpha = 0.24;
  context.strokeStyle = "rgba(255, 255, 255, 0.72)";
  context.fillStyle = "rgba(255, 255, 255, 0.8)";

  if (template.pattern === "wave") {
    context.lineWidth = 4;
    for (let y = 56; y < height; y += 52) {
      context.beginPath();
      context.moveTo(20, y);
      context.bezierCurveTo(width * 0.25, y - 30, width * 0.75, y + 30, width - 20, y);
      context.stroke();
    }
  }

  if (template.pattern === "sunburst") {
    const centerX = width / 2;
    const centerY = height / 2;

    for (let index = 0; index < 16; index += 1) {
      const angle = (Math.PI * 2 * index) / 16;
      const innerRadius = 54;
      const outerRadius = 240;

      context.beginPath();
      context.moveTo(centerX + Math.cos(angle) * innerRadius, centerY + Math.sin(angle) * innerRadius);
      context.lineTo(centerX + Math.cos(angle) * outerRadius, centerY + Math.sin(angle) * outerRadius);
      context.lineWidth = index % 2 ? 2 : 5;
      context.stroke();
    }
  }

  if (template.pattern === "grid") {
    context.lineWidth = 1.8;

    for (let x = 32; x <= width; x += 40) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }

    for (let y = 24; y <= height; y += 40) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
  }

  if (template.pattern === "stripe") {
    context.globalAlpha = 0.28;

    for (let x = -height; x < width + height; x += 52) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x + 82, 0);
      context.lineTo(x + height + 82, height);
      context.lineTo(x + height, height);
      context.closePath();
      context.fill();
    }
  }

  context.restore();
};

const drawAccentLayer = (context, accent, width, height) => {
  context.save();

  if (accent === "burst") {
    const centerX = width / 2;
    const centerY = height / 2;

    context.strokeStyle = "rgba(255, 255, 255, 0.86)";
    for (let index = 0; index < 14; index += 1) {
      const angle = (Math.PI * 2 * index) / 14;
      context.beginPath();
      context.moveTo(centerX + Math.cos(angle) * 22, centerY + Math.sin(angle) * 22);
      context.lineTo(centerX + Math.cos(angle) * 88, centerY + Math.sin(angle) * 88);
      context.lineWidth = index % 2 ? 2 : 4;
      context.stroke();
    }
  }

  if (accent === "ribbons") {
    context.globalAlpha = 0.45;
    context.fillStyle = "rgba(255, 255, 255, 0.94)";

    for (let index = 0; index < 3; index += 1) {
      const bandY = 90 + index * 110;

      context.beginPath();
      context.moveTo(20, bandY);
      context.bezierCurveTo(width * 0.28, bandY - 34, width * 0.58, bandY + 34, width - 20, bandY - 12);
      context.lineTo(width - 20, bandY + 26);
      context.bezierCurveTo(width * 0.62, bandY + 60, width * 0.3, bandY + 12, 20, bandY + 38);
      context.closePath();
      context.fill();
    }
  }

  if (accent === "orbit") {
    context.globalAlpha = 0.6;
    context.strokeStyle = "rgba(255, 255, 255, 0.94)";
    context.lineWidth = 5;

    context.beginPath();
    context.ellipse(width * 0.52, height * 0.52, 130, 76, Math.PI / 8, 0, Math.PI * 2);
    context.stroke();

    context.beginPath();
    context.ellipse(width * 0.52, height * 0.52, 88, 52, -Math.PI / 8, 0, Math.PI * 2);
    context.lineWidth = 3;
    context.stroke();
  }

  context.restore();
};

const getStickerAnchorPoints = (productType) => {
  if (productType === "airpods-case") {
    return [
      { x: 126, y: 176 },
      { x: 206, y: 150 },
      { x: 292, y: 176 },
      { x: 146, y: 246 },
      { x: 212, y: 228 },
      { x: 280, y: 246 },
    ];
  }

  return [
    { x: 124, y: 110 },
    { x: 216, y: 92 },
    { x: 300, y: 136 },
    { x: 146, y: 220 },
    { x: 236, y: 244 },
    { x: 294, y: 304 },
  ];
};

const drawProductMask = (context, productType, width, height) => {
  if (productType === "airpods-case") {
    roundRectPath(context, 68, 104, width - 136, 212, 96);
    return;
  }

  roundRectPath(context, 94, 20, width - 188, height - 40, 54);
};

const drawDeviceDetailLines = (context, productType, width, height) => {
  context.save();

  if (productType === "airpods-case") {
    roundRectPath(context, 68, 104, width - 136, 212, 96);
    context.lineWidth = 5;
    context.strokeStyle = "rgba(255, 255, 255, 0.7)";
    context.stroke();

    context.beginPath();
    context.moveTo(96, 178);
    context.lineTo(width - 96, 178);
    context.lineWidth = 2;
    context.strokeStyle = "rgba(8, 22, 39, 0.32)";
    context.stroke();

    context.beginPath();
    context.arc(width / 2, 230, 6, 0, Math.PI * 2);
    context.fillStyle = "rgba(255, 255, 255, 0.85)";
    context.fill();
  } else {
    roundRectPath(context, 94, 20, width - 188, height - 40, 54);
    context.lineWidth = 5;
    context.strokeStyle = "rgba(255, 255, 255, 0.72)";
    context.stroke();

    context.fillStyle = "rgba(15, 27, 41, 0.44)";
    context.beginPath();
    context.arc(width - 150, 78, 26, 0, Math.PI * 2);
    context.fill();

    context.fillStyle = "rgba(255, 255, 255, 0.85)";
    context.beginPath();
    context.arc(width - 150, 78, 11, 0, Math.PI * 2);
    context.fill();
  }

  context.restore();
};

const getCustomizationTextYPosition = (productType, textPlacement) => {
  const normalizedPlacement = normalizeTextPlacement(textPlacement);

  if (productType === "airpods-case") {
    if (normalizedPlacement === "top") {
      return 184;
    }

    if (normalizedPlacement === "center") {
      return 228;
    }

    if (normalizedPlacement === "bottom") {
      return 276;
    }

    return 270;
  }

  if (normalizedPlacement === "top") {
    return 136;
  }

  if (normalizedPlacement === "center") {
    return 234;
  }

  if (normalizedPlacement === "bottom") {
    return 318;
  }

  return 318;
};

const renderCustomizationCanvas = (state) => {
  const { canvas, context } = state;
  const width = canvas.width;
  const height = canvas.height;
  const template = customizationTemplates[state.templateKey] || customizationTemplates["neon-wave"];

  context.clearRect(0, 0, width, height);

  context.save();
  drawProductMask(context, state.productType, width, height);
  context.clip();

  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, template.colors[0]);
  gradient.addColorStop(0.52, template.colors[1]);
  gradient.addColorStop(1, template.colors[2]);

  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  drawTemplatePattern(context, template, width, height);
  drawAccentLayer(context, state.accent, width, height);

  if (state.customText) {
    const selectedFont = textFontOptions[state.textFont] || textFontOptions["space-grotesk"];
    const selectedColor = normalizeHexColor(state.textColor, "#ffffff");
    const textSize = clampCustomizationTextSize(state.textSize);
    const textY = getCustomizationTextYPosition(state.productType, state.textPlacement);

    context.fillStyle = selectedColor;
    context.strokeStyle = getTextStrokeColor(selectedColor);
    context.lineWidth = Math.max(3.2, textSize * 0.18);
    context.font = `700 ${textSize}px ${selectedFont.canvasStack}`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.shadowColor = "rgba(4, 10, 18, 0.38)";
    context.shadowBlur = Math.max(6, textSize * 0.24);

    context.strokeText(state.customText, width / 2, textY, width - 96);
    context.fillText(state.customText, width / 2, textY, width - 96);
    context.shadowBlur = 0;
  }

  state.stickers.forEach((sticker, index) => {
    if (index === state.selectedStickerIndex) {
      context.save();
      context.beginPath();
      context.arc(sticker.x, sticker.y, sticker.size * 0.62, 0, Math.PI * 2);
      context.fillStyle = "rgba(255, 255, 255, 0.18)";
      context.fill();
      context.lineWidth = 2.5;
      context.strokeStyle = "rgba(255, 255, 255, 0.92)";
      context.stroke();
      context.restore();
    }

    context.save();
    context.translate(sticker.x, sticker.y);
    context.rotate(sticker.rotation);
    context.font = `${sticker.size}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(sticker.value, 0, 0);
    context.restore();
  });

  context.restore();
  drawDeviceDetailLines(context, state.productType, width, height);
};

const formatSubmissionDate = (isoString) => {
  const parsedDate = new Date(isoString);

  if (Number.isNaN(parsedDate.getTime())) {
    return "just now";
  }

  return parsedDate.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const renderCustomizationOrdersInCart = (options = {}) => {
  const { promoMessage = "", promoTone = "info" } = options;
  const orderList = document.querySelector("[data-custom-orders-list]");
  const emptyState = document.querySelector("[data-custom-orders-empty]");
  const clearButton = document.querySelector("[data-clear-custom-orders]");
  const subtotalValue = document.querySelector("[data-customization-subtotal]");
  const promoInput = document.querySelector("[data-custom-promo-input]");
  const promoStatus = document.querySelector("[data-custom-promo-status]");
  const promoDiscountRow = document.querySelector("[data-promo-discount-row]");
  const promoDiscountValue = document.querySelector("[data-promo-discount]");
  const removePromoButton = document.querySelector("[data-remove-custom-promo]");

  if (!orderList) {
    return;
  }

  const orders = normalizeCustomizationOrders(readCustomizationOrders());
  writeCustomizationOrders(orders);

  const promoState = readCustomizationPromo();
  const promoCode = (promoState.code || "").trim().toUpperCase();
  const subtotalAmount = orders.reduce(
    (runningTotal, order) => runningTotal + (Number(order.price) || 0) * clampCustomizationQuantity(order.quantity),
    0
  );

  const promoResult = promoCode
    ? calculateCustomizationPromo(promoCode, subtotalAmount)
    : {
        isValid: false,
        code: "",
        discountAmount: 0,
        label: "",
        message: "",
      };

  const discountAmount = promoResult.isValid ? promoResult.discountAmount : 0;

  if (subtotalValue) {
    subtotalValue.textContent = formatUsdCurrency(subtotalAmount);
  }

  updateCartSummaryTotals({
    customizationSubtotal: subtotalAmount,
    discountAmount,
  });

  if (promoInput instanceof HTMLInputElement) {
    promoInput.value = promoCode;
  }

  if (promoDiscountValue) {
    promoDiscountValue.textContent = `-${formatUsdCurrency(discountAmount)}`;
  }

  if (promoDiscountRow) {
    promoDiscountRow.hidden = discountAmount <= 0;
  }

  if (removePromoButton) {
    removePromoButton.hidden = !promoCode;
  }

  if (promoStatus instanceof HTMLElement) {
    if (promoMessage) {
      promoStatus.textContent = promoMessage;
      promoStatus.setAttribute("data-tone", promoTone);
    } else if (promoCode && promoResult.isValid) {
      promoStatus.textContent = promoResult.message;
      promoStatus.setAttribute("data-tone", "success");
    } else if (promoCode) {
      promoStatus.textContent = promoResult.message;
      promoStatus.setAttribute("data-tone", "warning");
    } else {
      promoStatus.textContent = "";
      promoStatus.setAttribute("data-tone", "info");
    }
  }

  if (clearButton) {
    clearButton.hidden = orders.length === 0;
  }

  if (!orders.length) {
    if (emptyState) {
      emptyState.hidden = false;
    }

    orderList.innerHTML = "";
    return;
  }

  if (emptyState) {
    emptyState.hidden = true;
  }

  orderList.innerHTML = orders
    .map((order) => {
      const safeOrderId = escapeHtml(order.id || "");
      const safeProduct = escapeHtml(order.productLabel || "Customized Product");
      const safeTemplate = escapeHtml(order.templateLabel || "Custom Template");
      const safeAccent = escapeHtml(accentLabels[order.accent] || "No visual effect");
      const safeText = escapeHtml(order.customText?.trim() || "No custom text");
      const textFontKey = textFontOptions[order.textFont] ? order.textFont : "space-grotesk";
      const safeTextFont = escapeHtml(textFontOptions[textFontKey].label);
      const safeTextColor = escapeHtml(normalizeHexColor(order.textColor, "#ffffff"));
      const safeTextSize = clampCustomizationTextSize(order.textSize);
      const safeTextPlacement = escapeHtml(
        textPlacementLabels[normalizeTextPlacement(order.textPlacement)] || textPlacementLabels.auto
      );
      const quantity = clampCustomizationQuantity(order.quantity);
      const unitPriceAmount = Number(order.price) || 0;
      const unitPriceText = formatUsdCurrency(unitPriceAmount);
      const lineTotalText = formatUsdCurrency(unitPriceAmount * quantity);
      const submittedAt = escapeHtml(formatSubmissionDate(order.createdAt));
      const previewImage =
        typeof order.previewImage === "string" && order.previewImage.startsWith("data:image/")
          ? order.previewImage
          : "";

      return `
        <article class="cart-custom-item">
          <div class="cart-custom-preview">
            ${
              previewImage
                ? `<img src="${previewImage}" alt="${safeProduct} design preview">`
                : '<span class="cart-custom-placeholder">Preview unavailable</span>'
            }
          </div>
          <div class="cart-custom-meta">
            <strong>${safeProduct}</strong>
            <small>${safeTemplate} • ${safeAccent}</small>
            <p>Text: ${safeText}</p>
            <small>Text style: ${safeTextFont} • ${safeTextColor} • ${safeTextSize}px • ${safeTextPlacement}</small>
            <small>Submitted ${submittedAt}</small>
            <div class="cart-custom-qty">
              <span>Qty</span>
              <div class="cart-custom-qty-controls" aria-label="Quantity controls for ${safeProduct}">
                <button type="button" data-qty-action="decrease" data-order-id="${safeOrderId}" aria-label="Decrease quantity">-</button>
                <strong>${quantity}</strong>
                <button type="button" data-qty-action="increase" data-order-id="${safeOrderId}" aria-label="Increase quantity">+</button>
              </div>
            </div>
            <div class="cart-custom-price">
              <span>${unitPriceText} each</span>
              <strong>${lineTotalText}</strong>
            </div>
            <button type="button" class="cart-custom-remove" data-remove-custom-order="${safeOrderId}">Remove</button>
          </div>
        </article>
      `;
    })
    .join("");
};

const initializeCustomizationStudios = () => {
  const studioElements = document.querySelectorAll("[data-customization-studio]");

  if (!studioElements.length) {
    return;
  }

  studioElements.forEach((studio) => {
    const canvas = studio.querySelector("[data-customization-canvas]");
    if (!(canvas instanceof HTMLCanvasElement)) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const productSelect = studio.querySelector("[data-customization-product]");
    const textInput = studio.querySelector("[data-customization-text]");
    const textColorInput = studio.querySelector("[data-customization-text-color]");
    const textFontSelect = studio.querySelector("[data-customization-text-font]");
    const textSizeInput = studio.querySelector("[data-customization-text-size]");
    const textSizeLabel = studio.querySelector("[data-customization-text-size-label]");
    const textPlacementSelect = studio.querySelector("[data-customization-text-placement]");
    const accentSelect = studio.querySelector("[data-customization-accent]");
    const resetButton = studio.querySelector("[data-customization-reset]");
    const submitButton = studio.querySelector("[data-customization-submit]");
    const statusText = studio.querySelector("[data-customization-status]");
    const templateButtons = studio.querySelectorAll("[data-template-key]");
    const stickerButtons = studio.querySelectorAll("[data-sticker]");
    const stickerActionButtons = studio.querySelectorAll("[data-sticker-action]");
    const textPresetButtons = studio.querySelectorAll("[data-customization-text-preset]");
    const selectedStickerCopy = studio.querySelector("[data-selected-sticker-copy]");
    const randomizeButton = studio.querySelector("[data-customization-randomize]");
    const previewDownloadButton = studio.querySelector("[data-customization-download]");
    const previewCopySummaryButton = studio.querySelector("[data-customization-copy-summary]");
    const productLabel = studio.querySelector("[data-preview-product-label]");
    const templateLabel = studio.querySelector("[data-preview-template-label]");
    const stickerCount = studio.querySelector("[data-sticker-count]");
    const textInsight = studio.querySelector("[data-customization-insight-text]");
    const fontInsight = studio.querySelector("[data-customization-insight-font]");
    const accentInsight = studio.querySelector("[data-customization-insight-accent]");

    const initialTemplateKey =
      studio.querySelector(".template-button.is-active")?.getAttribute("data-template-key") || "neon-wave";

    const state = {
      canvas,
      context,
      productType: productSelect instanceof HTMLSelectElement ? productSelect.value : "mobile-back-cover",
      templateKey: initialTemplateKey,
      customText: textInput instanceof HTMLInputElement ? textInput.value.trim() : "",
      textColor: textColorInput instanceof HTMLInputElement ? normalizeHexColor(textColorInput.value) : "#ffffff",
      textFont: textFontSelect instanceof HTMLSelectElement ? textFontSelect.value : "space-grotesk",
      textSize: textSizeInput instanceof HTMLInputElement ? clampCustomizationTextSize(textSizeInput.value) : DEFAULT_CUSTOM_TEXT_SIZE,
      textPlacement:
        textPlacementSelect instanceof HTMLSelectElement ? normalizeTextPlacement(textPlacementSelect.value) : "auto",
      accent: accentSelect instanceof HTMLSelectElement ? accentSelect.value : "none",
      stickers: [],
      selectedStickerIndex: -1,
    };

    const defaultTextColor = state.textColor;
    const defaultTextFont = textFontOptions[state.textFont] ? state.textFont : "space-grotesk";
    const defaultTextSize = clampCustomizationTextSize(state.textSize);
    const defaultTextPlacement = normalizeTextPlacement(state.textPlacement);
    state.textFont = defaultTextFont;
    state.textSize = defaultTextSize;
    state.textPlacement = defaultTextPlacement;

    const dragState = {
      stickerIndex: -1,
      pointerId: null,
      offsetX: 0,
      offsetY: 0,
    };

    canvas.style.touchAction = "none";
    canvas.style.cursor = "grab";
    canvas.tabIndex = 0;

    const setStatus = (message, tone = "info") => {
      if (!(statusText instanceof HTMLElement)) {
        return;
      }

      statusText.textContent = message;
      statusText.setAttribute("data-tone", tone);
    };

    const normalizeSelectedSticker = () => {
      if (!state.stickers.length) {
        state.selectedStickerIndex = -1;
        return;
      }

      if (state.selectedStickerIndex < 0 || state.selectedStickerIndex >= state.stickers.length) {
        state.selectedStickerIndex = state.stickers.length - 1;
      }
    };

    const syncStickerEditorUi = () => {
      const hasSelectedSticker =
        state.selectedStickerIndex >= 0 && state.selectedStickerIndex < state.stickers.length;
      const selectedSticker = hasSelectedSticker ? state.stickers[state.selectedStickerIndex] : null;

      if (selectedStickerCopy instanceof HTMLElement) {
        selectedStickerCopy.textContent = hasSelectedSticker
          ? `Selected sticker #${state.selectedStickerIndex + 1} ${selectedSticker?.value || ""}`.trim()
          : "No sticker selected";
      }

      stickerActionButtons.forEach((button) => {
        const action = button.getAttribute("data-sticker-action");
        let shouldDisable = !hasSelectedSticker;

        if (action === "undo") {
          shouldDisable = state.stickers.length === 0;
        } else if (action === "duplicate") {
          shouldDisable = !hasSelectedSticker || state.stickers.length >= MAX_STICKERS_PER_DESIGN;
        }

        button.disabled = shouldDisable;
      });
    };

    const syncStudio = () => {
      const currentProduct = customizationProducts[state.productType] || customizationProducts["mobile-back-cover"];
      const currentTemplate = customizationTemplates[state.templateKey] || customizationTemplates["neon-wave"];
      const currentFont = textFontOptions[state.textFont] || textFontOptions["space-grotesk"];
      const currentAccentLabel = accentLabels[state.accent] || accentLabels.none;
      const currentPlacement = normalizeTextPlacement(state.textPlacement);

      if (!textFontOptions[state.textFont]) {
        state.textFont = "space-grotesk";
      }

      state.textSize = clampCustomizationTextSize(state.textSize);
      state.textPlacement = currentPlacement;

      normalizeSelectedSticker();

      templateButtons.forEach((button) => {
        const isActive = button.getAttribute("data-template-key") === state.templateKey;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
      });

      if (productLabel) {
        productLabel.textContent = `${currentProduct.label} • ${formatUsdCurrency(currentProduct.price)}`;
      }

      if (templateLabel) {
        templateLabel.textContent = `Template: ${currentTemplate.label}`;
      }

      if (textColorInput instanceof HTMLInputElement) {
        textColorInput.value = normalizeHexColor(state.textColor);
      }

      if (textFontSelect instanceof HTMLSelectElement) {
        textFontSelect.value = state.textFont;
      }

      if (textSizeInput instanceof HTMLInputElement) {
        textSizeInput.value = String(state.textSize);
      }

      if (textSizeLabel instanceof HTMLElement) {
        textSizeLabel.textContent = `${state.textSize} px`;
      }

      if (textPlacementSelect instanceof HTMLSelectElement) {
        textPlacementSelect.value = state.textPlacement;
      }

      if (stickerCount) {
        stickerCount.textContent = String(state.stickers.length);
      }

      if (textInsight instanceof HTMLElement) {
        textInsight.textContent = state.customText
          ? `Text: ${state.customText.length}/28 chars`
          : "Text: none";
      }

      if (fontInsight instanceof HTMLElement) {
        fontInsight.textContent = `Font: ${currentFont.label} • ${state.textSize}px`;
      }

      if (accentInsight instanceof HTMLElement) {
        accentInsight.textContent = `${currentAccentLabel} • ${textPlacementLabels[state.textPlacement] || textPlacementLabels.auto}`;
      }

      syncStickerEditorUi();

      renderCustomizationCanvas(state);
    };

    const buildDesignSummary = () => {
      const product = customizationProducts[state.productType] || customizationProducts["mobile-back-cover"];
      const template = customizationTemplates[state.templateKey] || customizationTemplates["neon-wave"];
      const fontLabel = textFontOptions[state.textFont]?.label || textFontOptions["space-grotesk"].label;
      const accentLabel = accentLabels[state.accent] || accentLabels.none;
      const textValue = state.customText || "No custom text";

      return [
        "Nexium Design Summary",
        `Product: ${product.label}`,
        `Template: ${template.label}`,
        `Text: ${textValue}`,
        `Text style: ${fontLabel}, ${state.textSize}px, ${textPlacementLabels[state.textPlacement] || textPlacementLabels.auto}, ${normalizeHexColor(state.textColor, "#ffffff")}`,
        `Accent: ${accentLabel}`,
        `Stickers: ${state.stickers.length}`,
      ].join("\n");
    };

    const downloadStudioPreview = () => {
      syncStudio();

      try {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const downloadLink = document.createElement("a");
        downloadLink.href = canvas.toDataURL("image/png");
        downloadLink.download = `nexium-${state.productType}-${timestamp}.png`;
        document.body.append(downloadLink);
        downloadLink.click();
        downloadLink.remove();
        setStatus("Preview downloaded as PNG.", "success");
      } catch {
        setStatus("Could not download preview in this browser context.", "warning");
      }
    };

    const copySummaryWithFallback = async () => {
      const summary = buildDesignSummary();

      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        try {
          await navigator.clipboard.writeText(summary);
          setStatus("Design summary copied to clipboard.", "success");
          return;
        } catch {
          // Continue to fallback copy if clipboard API is blocked.
        }
      }

      const fallbackCopyField = document.createElement("textarea");
      fallbackCopyField.value = summary;
      fallbackCopyField.setAttribute("readonly", "");
      fallbackCopyField.style.position = "fixed";
      fallbackCopyField.style.top = "-9999px";
      fallbackCopyField.style.left = "-9999px";

      document.body.append(fallbackCopyField);
      fallbackCopyField.select();

      let copied = false;
      try {
        copied = document.execCommand("copy");
      } catch {
        copied = false;
      }

      fallbackCopyField.remove();

      if (copied) {
        setStatus("Design summary copied to clipboard.", "success");
      } else {
        setStatus("Copy failed in this browser context.", "warning");
      }
    };

    const addSticker = (stickerValue) => {
      if (state.stickers.length >= MAX_STICKERS_PER_DESIGN) {
        setStatus("Maximum of 6 stickers reached. Submit or reset to continue.", "warning");
        return;
      }

      const anchorPoints = getStickerAnchorPoints(state.productType);
      const anchor = anchorPoints[state.stickers.length % anchorPoints.length];

      state.stickers.push({
        value: stickerValue,
        x: anchor.x + Math.round((Math.random() - 0.5) * 14),
        y: anchor.y + Math.round((Math.random() - 0.5) * 14),
        size: state.productType === "airpods-case" ? 36 : 38,
        rotation: (Math.random() - 0.5) * 0.4,
      });

      state.selectedStickerIndex = state.stickers.length - 1;

      if (typeof canvas.focus === "function") {
        canvas.focus();
      }

      setStatus("Sticker added. Keep customizing or submit your design.");
      syncStudio();
    };

    const resetStudio = () => {
      endDrag();
      state.stickers = [];
      state.selectedStickerIndex = -1;
      state.customText = "";
      state.textColor = defaultTextColor;
      state.textFont = defaultTextFont;
      state.textSize = defaultTextSize;
      state.textPlacement = defaultTextPlacement;

      if (textInput instanceof HTMLInputElement) {
        textInput.value = "";
      }

      if (textColorInput instanceof HTMLInputElement) {
        textColorInput.value = defaultTextColor;
      }

      if (textFontSelect instanceof HTMLSelectElement) {
        textFontSelect.value = defaultTextFont;
      }

      if (textSizeInput instanceof HTMLInputElement) {
        textSizeInput.value = String(defaultTextSize);
      }

      if (textPlacementSelect instanceof HTMLSelectElement) {
        textPlacementSelect.value = defaultTextPlacement;
      }

      setStatus("Design reset. Start a fresh concept.");
      syncStudio();
    };

    const submitStudio = () => {
      const product = customizationProducts[state.productType] || customizationProducts["mobile-back-cover"];
      const template = customizationTemplates[state.templateKey] || customizationTemplates["neon-wave"];
      const rawText =
        textInput instanceof HTMLInputElement ? textInput.value.trim().slice(0, 28) : state.customText;

      state.customText = rawText;
      syncStudio();

      const order = {
        id: `cust-${Date.now()}-${Math.floor(Math.random() * 90000 + 10000)}`,
        channel: studio.getAttribute("data-customization-studio") || "web",
        createdAt: new Date().toISOString(),
        productType: state.productType,
        productLabel: product.label,
        templateKey: state.templateKey,
        templateLabel: template.label,
        customText: rawText,
        textColor: normalizeHexColor(state.textColor, "#ffffff"),
        textFont: state.textFont,
        textSize: clampCustomizationTextSize(state.textSize),
        textPlacement: normalizeTextPlacement(state.textPlacement),
        stickerCount: state.stickers.length,
        accent: state.accent,
        price: product.price,
        quantity: 1,
        previewImage: canvas.toDataURL("image/png"),
      };

      const existingOrders = readCustomizationOrders();
      writeCustomizationOrders([order, ...existingOrders].slice(0, 30));

      setStatus(`Design submitted for processing. ${product.label} added to your cart queue.`, "success");
      renderCustomizationOrdersInCart();
    };

    const randomizeStudio = () => {
      endDrag();

      const productOptions = Object.keys(customizationProducts);
      const templateOptions = Object.keys(customizationTemplates);
      const accentOptions = Object.keys(accentLabels);
      const fontOptions = Object.keys(textFontOptions);
      const textPlacements = Object.keys(textPlacementLabels);
      const textColors = ["#ffffff", "#ffe16b", "#c6f6ff", "#f8c2ff", "#212935"];
      const textLibrary = [
        "Tech in style",
        "My audio vibe",
        "Nexium Core",
        "Signal mode",
        "Glow edition",
        "Future ready",
      ];

      if (productOptions.length) {
        state.productType = productOptions[Math.floor(Math.random() * productOptions.length)];
        if (productSelect instanceof HTMLSelectElement) {
          productSelect.value = state.productType;
        }
      }

      if (fontOptions.length) {
        state.textFont = fontOptions[Math.floor(Math.random() * fontOptions.length)];
        if (textFontSelect instanceof HTMLSelectElement) {
          textFontSelect.value = state.textFont;
        }
      }

      state.textSize = clampCustomizationTextSize(
        MIN_CUSTOM_TEXT_SIZE + Math.floor(Math.random() * (MAX_CUSTOM_TEXT_SIZE - MIN_CUSTOM_TEXT_SIZE + 1))
      );
      if (textSizeInput instanceof HTMLInputElement) {
        textSizeInput.value = String(state.textSize);
      }

      if (textPlacements.length) {
        state.textPlacement = normalizeTextPlacement(
          textPlacements[Math.floor(Math.random() * textPlacements.length)]
        );
        if (textPlacementSelect instanceof HTMLSelectElement) {
          textPlacementSelect.value = state.textPlacement;
        }
      }

      state.textColor = textColors[Math.floor(Math.random() * textColors.length)];
      if (textColorInput instanceof HTMLInputElement) {
        textColorInput.value = state.textColor;
      }

      if (templateOptions.length) {
        state.templateKey = templateOptions[Math.floor(Math.random() * templateOptions.length)];
      }

      if (accentOptions.length) {
        state.accent = accentOptions[Math.floor(Math.random() * accentOptions.length)];
        if (accentSelect instanceof HTMLSelectElement) {
          accentSelect.value = state.accent;
        }
      }

      const nextText = textLibrary[Math.floor(Math.random() * textLibrary.length)];
      state.customText = nextText;
      if (textInput instanceof HTMLInputElement) {
        textInput.value = nextText;
      }

      state.stickers = [];
      const stickerPool = Array.from(stickerButtons)
        .map((button) => button.getAttribute("data-sticker"))
        .filter(Boolean);
      const stickerTotal = Math.min(2 + Math.floor(Math.random() * 3), MAX_STICKERS_PER_DESIGN);

      for (let index = 0; index < stickerTotal; index += 1) {
        const anchorPoints = getStickerAnchorPoints(state.productType);
        const anchor = anchorPoints[index % anchorPoints.length];
        const stickerValue = stickerPool[Math.floor(Math.random() * stickerPool.length)] || "⭐";

        state.stickers.push({
          value: stickerValue,
          x: anchor.x + Math.round((Math.random() - 0.5) * 20),
          y: anchor.y + Math.round((Math.random() - 0.5) * 20),
          size: state.productType === "airpods-case" ? 34 + Math.floor(Math.random() * 8) : 36 + Math.floor(Math.random() * 10),
          rotation: (Math.random() - 0.5) * 0.8,
        });
      }

      state.selectedStickerIndex = state.stickers.length - 1;
      syncStudio();
      setStatus("Generated a fresh concept. Drag stickers and fine-tune before submitting.");
    };

    const applyStickerAction = (action) => {
      if (action === "undo") {
        if (!state.stickers.length) {
          setStatus("Nothing to undo yet.", "warning");
          return;
        }

        state.stickers.pop();
        state.selectedStickerIndex = state.stickers.length - 1;
        syncStudio();
        setStatus("Last sticker removed.");
        return;
      }

      normalizeSelectedSticker();

      if (state.selectedStickerIndex < 0 || state.selectedStickerIndex >= state.stickers.length) {
        setStatus("Select a sticker on the preview first.", "warning");
        return;
      }

      const sticker = state.stickers[state.selectedStickerIndex];
      const nudgeSticker = (deltaX, deltaY) => {
        const limits = getStickerBounds(state.productType, sticker.size);
        sticker.x = Math.min(limits.maxX, Math.max(limits.minX, sticker.x + deltaX));
        sticker.y = Math.min(limits.maxY, Math.max(limits.minY, sticker.y + deltaY));
      };

      if (action === "rotate-left") {
        sticker.rotation -= Math.PI / 10;
        setStatus("Sticker rotated left.");
      } else if (action === "rotate-right") {
        sticker.rotation += Math.PI / 10;
        setStatus("Sticker rotated right.");
      } else if (action === "size-down") {
        sticker.size = Math.max(MIN_STICKER_SIZE, sticker.size - 4);
        setStatus("Sticker size decreased.");
      } else if (action === "size-up") {
        sticker.size = Math.min(MAX_STICKER_SIZE, sticker.size + 4);
        setStatus("Sticker size increased.");
      } else if (action === "move-up") {
        nudgeSticker(0, -8);
        setStatus("Sticker moved up.");
      } else if (action === "move-down") {
        nudgeSticker(0, 8);
        setStatus("Sticker moved down.");
      } else if (action === "move-left") {
        nudgeSticker(-8, 0);
        setStatus("Sticker moved left.");
      } else if (action === "move-right") {
        nudgeSticker(8, 0);
        setStatus("Sticker moved right.");
      } else if (action === "duplicate") {
        if (state.stickers.length >= MAX_STICKERS_PER_DESIGN) {
          setStatus("Maximum of 6 stickers reached. Remove one before duplicating.", "warning");
          return;
        }

        const limits = getStickerBounds(state.productType, sticker.size);
        const duplicateSticker = {
          ...sticker,
          x: Math.min(limits.maxX, Math.max(limits.minX, sticker.x + 12)),
          y: Math.min(limits.maxY, Math.max(limits.minY, sticker.y + 12)),
          rotation: sticker.rotation + 0.08,
        };

        state.stickers.push(duplicateSticker);
        state.selectedStickerIndex = state.stickers.length - 1;
        setStatus("Sticker duplicated.");
      } else if (action === "remove") {
        state.stickers.splice(state.selectedStickerIndex, 1);
        state.selectedStickerIndex = Math.min(state.selectedStickerIndex, state.stickers.length - 1);
        setStatus("Selected sticker removed.");
      }

      syncStudio();
    };

    const getCanvasPoint = (event) => {
      const bounds = canvas.getBoundingClientRect();
      const scaleX = canvas.width / bounds.width;
      const scaleY = canvas.height / bounds.height;

      return {
        x: (event.clientX - bounds.left) * scaleX,
        y: (event.clientY - bounds.top) * scaleY,
      };
    };

    const getStickerBounds = (productType, size) => {
      if (productType === "airpods-case") {
        return {
          minX: 68 + size * 0.5,
          maxX: canvas.width - 68 - size * 0.5,
          minY: 104 + size * 0.5,
          maxY: 316 - size * 0.5,
        };
      }

      return {
        minX: 94 + size * 0.5,
        maxX: canvas.width - 94 - size * 0.5,
        minY: 20 + size * 0.5,
        maxY: canvas.height - 20 - size * 0.5,
      };
    };

    const nudgeSelectedSticker = (deltaX, deltaY) => {
      normalizeSelectedSticker();

      if (state.selectedStickerIndex < 0 || state.selectedStickerIndex >= state.stickers.length) {
        return false;
      }

      const sticker = state.stickers[state.selectedStickerIndex];
      const limits = getStickerBounds(state.productType, sticker.size);

      sticker.x = Math.min(limits.maxX, Math.max(limits.minX, sticker.x + deltaX));
      sticker.y = Math.min(limits.maxY, Math.max(limits.minY, sticker.y + deltaY));

      return true;
    };

    const getStickerHitIndex = (x, y) => {
      for (let index = state.stickers.length - 1; index >= 0; index -= 1) {
        const sticker = state.stickers[index];
        const maxDistance = sticker.size * 0.55;
        const deltaX = x - sticker.x;
        const deltaY = y - sticker.y;

        if (Math.hypot(deltaX, deltaY) <= maxDistance) {
          return index;
        }
      }

      return -1;
    };

    const endDrag = () => {
      dragState.stickerIndex = -1;
      dragState.pointerId = null;
      dragState.offsetX = 0;
      dragState.offsetY = 0;
      canvas.style.cursor = "grab";
    };

    const onPointerDown = (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      const point = getCanvasPoint(event);
      const hitIndex = getStickerHitIndex(point.x, point.y);

      if (hitIndex < 0) {
        if (state.selectedStickerIndex !== -1) {
          state.selectedStickerIndex = -1;
          syncStudio();
          setStatus("Sticker deselected.");
        }
        return;
      }

      const selectedSticker = state.stickers[hitIndex];
      state.stickers.splice(hitIndex, 1);
      state.stickers.push(selectedSticker);
      state.selectedStickerIndex = state.stickers.length - 1;

      dragState.stickerIndex = state.stickers.length - 1;
      dragState.pointerId = event.pointerId;
      dragState.offsetX = point.x - selectedSticker.x;
      dragState.offsetY = point.y - selectedSticker.y;

      if (typeof canvas.setPointerCapture === "function") {
        canvas.setPointerCapture(event.pointerId);
      }

      if (typeof canvas.focus === "function") {
        canvas.focus();
      }

      canvas.style.cursor = "grabbing";
      setStatus("Dragging sticker. Release to place it.");
      syncStudio();
      event.preventDefault();
    };

    const onPointerMove = (event) => {
      if (dragState.stickerIndex < 0 || dragState.pointerId !== event.pointerId) {
        return;
      }

      const point = getCanvasPoint(event);
      const sticker = state.stickers[dragState.stickerIndex];
      if (!sticker) {
        endDrag();
        return;
      }

      const nextX = point.x - dragState.offsetX;
      const nextY = point.y - dragState.offsetY;
      const limits = getStickerBounds(state.productType, sticker.size);

      sticker.x = Math.min(limits.maxX, Math.max(limits.minX, nextX));
      sticker.y = Math.min(limits.maxY, Math.max(limits.minY, nextY));

      syncStudio();
      event.preventDefault();
    };

    const onPointerUp = (event) => {
      if (dragState.stickerIndex < 0 || dragState.pointerId !== event.pointerId) {
        return;
      }

      setStatus("Sticker position updated. You can drag again or submit.");

      if (typeof canvas.releasePointerCapture === "function") {
        canvas.releasePointerCapture(event.pointerId);
      }

      endDrag();
      event.preventDefault();
    };

    const onCanvasKeyDown = (event) => {
      const moveStep = event.shiftKey ? 14 : 7;
      let handled = false;

      if (event.key === "ArrowUp") {
        handled = nudgeSelectedSticker(0, -moveStep);
      } else if (event.key === "ArrowDown") {
        handled = nudgeSelectedSticker(0, moveStep);
      } else if (event.key === "ArrowLeft") {
        handled = nudgeSelectedSticker(-moveStep, 0);
      } else if (event.key === "ArrowRight") {
        handled = nudgeSelectedSticker(moveStep, 0);
      } else if (event.key === "Delete" || event.key === "Backspace") {
        normalizeSelectedSticker();
        if (state.selectedStickerIndex >= 0 && state.selectedStickerIndex < state.stickers.length) {
          state.stickers.splice(state.selectedStickerIndex, 1);
          state.selectedStickerIndex = Math.min(state.selectedStickerIndex, state.stickers.length - 1);
          handled = true;
          setStatus("Selected sticker removed.");
        }
      }

      if (!handled) {
        return;
      }

      syncStudio();

      if (event.key.startsWith("Arrow")) {
        setStatus("Sticker moved with keyboard controls.");
      }

      event.preventDefault();
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", endDrag);
    canvas.addEventListener("lostpointercapture", endDrag);
    canvas.addEventListener("keydown", onCanvasKeyDown);

    if (productSelect instanceof HTMLSelectElement) {
      productSelect.addEventListener("change", () => {
        endDrag();
        state.productType = productSelect.value;
        state.stickers = [];
        state.selectedStickerIndex = -1;
        syncStudio();
        setStatus("Product type updated and sticker layout refreshed.");
      });
    }

    if (textInput instanceof HTMLInputElement) {
      textInput.addEventListener("input", () => {
        state.customText = textInput.value.trim().slice(0, 28);
        syncStudio();
      });
    }

    if (textColorInput instanceof HTMLInputElement) {
      textColorInput.addEventListener("input", () => {
        state.textColor = normalizeHexColor(textColorInput.value, "#ffffff");
        syncStudio();
      });
    }

    if (textFontSelect instanceof HTMLSelectElement) {
      textFontSelect.addEventListener("change", () => {
        state.textFont = textFontSelect.value;
        syncStudio();
      });
    }

    if (textSizeInput instanceof HTMLInputElement) {
      textSizeInput.addEventListener("input", () => {
        state.textSize = clampCustomizationTextSize(textSizeInput.value);
        syncStudio();
      });
    }

    if (textPlacementSelect instanceof HTMLSelectElement) {
      textPlacementSelect.addEventListener("change", () => {
        state.textPlacement = normalizeTextPlacement(textPlacementSelect.value);
        syncStudio();
      });
    }

    if (accentSelect instanceof HTMLSelectElement) {
      accentSelect.addEventListener("change", () => {
        state.accent = accentSelect.value;
        syncStudio();
      });
    }

    textPresetButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const presetText = button.getAttribute("data-customization-text-preset");
        if (!presetText) {
          return;
        }

        const normalizedPreset = presetText.trim().slice(0, 28);
        state.customText = normalizedPreset;

        if (textInput instanceof HTMLInputElement) {
          textInput.value = normalizedPreset;
        }

        syncStudio();
        setStatus("Preset text applied. You can edit it before submitting.");
      });
    });

    templateButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const nextTemplateKey = button.getAttribute("data-template-key");
        if (!nextTemplateKey) {
          return;
        }

        state.templateKey = nextTemplateKey;
        syncStudio();
        setStatus("Template applied. Continue customizing your design.");
      });
    });

    stickerButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const stickerValue = button.getAttribute("data-sticker");
        if (!stickerValue) {
          return;
        }

        addSticker(stickerValue);
      });
    });

    stickerActionButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.getAttribute("data-sticker-action");
        if (!action) {
          return;
        }

        applyStickerAction(action);
      });
    });

    if (randomizeButton) {
      randomizeButton.addEventListener("click", randomizeStudio);
    }

    if (resetButton) {
      resetButton.addEventListener("click", resetStudio);
    }

    if (submitButton) {
      submitButton.addEventListener("click", submitStudio);
    }

    if (previewDownloadButton) {
      previewDownloadButton.addEventListener("click", downloadStudioPreview);
    }

    if (previewCopySummaryButton) {
      previewCopySummaryButton.addEventListener("click", () => {
        copySummaryWithFallback();
      });
    }

    syncStudio();
  });
};

const attachCartCustomizationActions = () => {
  const orderList = document.querySelector("[data-custom-orders-list]");
  const clearButton = document.querySelector("[data-clear-custom-orders]");
  const promoInput = document.querySelector("[data-custom-promo-input]");
  const applyPromoButton = document.querySelector("[data-apply-custom-promo]");
  const removePromoButton = document.querySelector("[data-remove-custom-promo]");
  const promoHelpToggleButton = document.querySelector("[data-promo-help-toggle]");
  const promoHelpDrawer = document.querySelector("[data-promo-help-drawer]");

  renderPromoHelpDrawer();

  const getCustomizationSubtotal = () =>
    normalizeCustomizationOrders(readCustomizationOrders()).reduce(
      (runningTotal, order) =>
        runningTotal + (Number(order.price) || 0) * clampCustomizationQuantity(order.quantity),
      0
    );

  const applyPromoFromInput = () => {
    if (!(promoInput instanceof HTMLInputElement)) {
      return;
    }

    const nextCode = promoInput.value.trim().toUpperCase();
    if (!nextCode) {
      renderCustomizationOrdersInCart({
        promoMessage: "Enter a promo code before applying.",
        promoTone: "warning",
      });
      return;
    }

    const promoResult = calculateCustomizationPromo(nextCode, getCustomizationSubtotal());

    if (!promoResult.isValid) {
      renderCustomizationOrdersInCart({
        promoMessage: promoResult.message,
        promoTone: "warning",
      });
      if (promoInput instanceof HTMLInputElement) {
        promoInput.value = nextCode;
      }
      return;
    }

    writeCustomizationPromo({ code: promoResult.code });
    renderCustomizationOrdersInCart({
      promoMessage: promoResult.message,
      promoTone: "success",
    });
  };

  if (orderList) {
    orderList.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const quantityButton = target.closest("[data-qty-action]");
      if (quantityButton) {
        const quantityAction = quantityButton.getAttribute("data-qty-action");
        const orderId = quantityButton.getAttribute("data-order-id");
        if (!orderId || !quantityAction) {
          return;
        }

        const nextOrders = normalizeCustomizationOrders(readCustomizationOrders()).map((order) => {
          if (order.id !== orderId) {
            return order;
          }

          const nextQuantity =
            quantityAction === "increase"
              ? clampCustomizationQuantity(order.quantity + 1)
              : clampCustomizationQuantity(order.quantity - 1);

          return {
            ...order,
            quantity: nextQuantity,
          };
        });

        writeCustomizationOrders(nextOrders);
        renderCustomizationOrdersInCart();
        return;
      }

      const removeButton = target.closest("[data-remove-custom-order]");
      if (!removeButton) {
        return;
      }

      const orderId = removeButton.getAttribute("data-remove-custom-order");
      if (!orderId) {
        return;
      }

      const nextOrders = readCustomizationOrders().filter((order) => order.id !== orderId);
      writeCustomizationOrders(nextOrders);
      renderCustomizationOrdersInCart();
    });
  }

  if (clearButton) {
    clearButton.addEventListener("click", () => {
      writeCustomizationOrders([]);
      renderCustomizationOrdersInCart();
    });
  }

  if (applyPromoButton) {
    applyPromoButton.addEventListener("click", applyPromoFromInput);
  }

  if (promoInput instanceof HTMLInputElement) {
    promoInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        applyPromoFromInput();
      }
    });
  }

  if (removePromoButton) {
    removePromoButton.addEventListener("click", () => {
      clearCustomizationPromo();
      renderCustomizationOrdersInCart({
        promoMessage: "Promo code removed.",
        promoTone: "info",
      });
    });
  }

  if (promoHelpToggleButton && promoHelpDrawer) {
    promoHelpToggleButton.addEventListener("click", () => {
      const isOpen = !promoHelpDrawer.hasAttribute("hidden");

      if (isOpen) {
        promoHelpDrawer.setAttribute("hidden", "");
        promoHelpToggleButton.setAttribute("aria-expanded", "false");
      } else {
        promoHelpDrawer.removeAttribute("hidden");
        promoHelpToggleButton.setAttribute("aria-expanded", "true");
      }
    });
  }
};

initializeCustomizationStudios();
attachCartSavedItemsActions();
attachCartCustomizationActions();
renderCartAndSavedItemsInCartPage();
renderCustomizationOrdersInCart();

window.addEventListener(SHOPPING_STATE_EVENT, () => {
  renderCartAndSavedItemsInCartPage();
  renderCustomizationOrdersInCart();
});
