(() => {
const products = [
  {
    id: "samsung-a16-verizon",
    name: "Verizon Prepaid - Samsung Galaxy A16 128GB 5G",
    subtitle: "Prepaid - Black",
    brand: "samsung",
    modelFamily: "galaxy-a16",
    category: "prepaid",
    carriers: ["verizon"],
    unlocked: false,
    condition: "new",
    os: "android",
    price: 49.99,
    compareValue: 89.99,
    save: 40,
    rating: 4.1,
    reviews: 23,
    rank: 1,
    newestRank: 7,
    inStock: true,
    pickupReady: true,
    sponsored: true,
    tag: "Best Selling",
    offerCount: 1,
    moreBuyingFrom: 39.99,
    image: "assets/assets2/Verizon%20Prepaid%20-%20Samsung%20Galaxy%20A16%20128GB.jpeg",
    variants: [
      "assets/assets2/Verizon%20Prepaid%20-%20Samsung%20Galaxy%20A16%20128GB.jpeg",
      "assets/assets2/Samsung%20Galaxy%20S26%20Ultra.jpeg",
    ],
    cta: "add",
  },
  {
    id: "moto-g-power-unlocked",
    name: "Motorola - moto g power 2024 5G 128GB",
    subtitle: "Unlocked - Midnight Blue",
    brand: "motorola",
    modelFamily: "moto-g",
    category: "unlocked",
    carriers: ["unlocked", "t-mobile", "verizon"],
    unlocked: true,
    condition: "new",
    os: "android",
    price: 126.99,
    compareValue: 299.99,
    save: 173,
    rating: 4.5,
    reviews: 740,
    rank: 2,
    newestRank: 8,
    inStock: true,
    pickupReady: true,
    sponsored: false,
    tag: "Bundle and save",
    offerCount: 2,
    moreBuyingFrom: 108.99,
    image: "assets/assets2/Motorola%20-%20moto%20g%20power%202026%20128GB%20%28Unlocked%29.jpeg",
    variants: [],
    cta: "details",
  },
  {
    id: "samsung-galaxy-a16-unlocked",
    name: "Samsung - Galaxy A16 5G 128GB",
    subtitle: "Unlocked - Blue Black",
    brand: "samsung",
    modelFamily: "galaxy-a16",
    category: "unlocked",
    carriers: ["unlocked", "t-mobile", "google-fi", "cricket"],
    unlocked: true,
    condition: "new",
    os: "android",
    price: 159.99,
    compareValue: 169.99,
    save: 10,
    rating: 4.4,
    reviews: 1665,
    rank: 3,
    newestRank: 9,
    inStock: true,
    pickupReady: false,
    sponsored: false,
    tag: "Trending Deal",
    offerCount: 2,
    moreBuyingFrom: 137.99,
    image: "assets/assets2/Verizon%20Prepaid%20-%20Samsung%20Galaxy%20A16%20128GB.jpeg",
    variants: [
      "assets/assets2/Verizon%20Prepaid%20-%20Samsung%20Galaxy%20A16%20128GB.jpeg",
      "assets/assets2/google-pixel-c2.jpg",
    ],
    cta: "details",
  },
  {
    id: "moto-g-prepaid-2025",
    name: "Verizon Prepaid - Motorola moto g 5G 2025 64GB",
    subtitle: "Prepaid - Blue",
    brand: "motorola",
    modelFamily: "moto-g",
    category: "prepaid",
    carriers: ["verizon"],
    unlocked: false,
    condition: "new",
    os: "android",
    price: 39.99,
    compareValue: 49.99,
    save: 10,
    rating: 4.6,
    reviews: 19,
    rank: 4,
    newestRank: 10,
    inStock: true,
    pickupReady: true,
    sponsored: true,
    tag: "Best Selling",
    offerCount: 0,
    moreBuyingFrom: null,
    image: "assets/assets2/Verizon%20Prepaid%20-%20Motorola%20moto%20g%205G%202025.jpeg",
    variants: [],
    cta: "add",
  },
  {
    id: "samsung-a17-unlocked",
    name: "Samsung - Galaxy A17 5G 128GB",
    subtitle: "Unlocked - Black",
    brand: "samsung",
    modelFamily: "galaxy-a16",
    category: "unlocked",
    carriers: ["unlocked", "metro", "t-mobile"],
    unlocked: true,
    condition: "new",
    os: "android",
    price: 199.99,
    compareValue: 229.99,
    save: 30,
    rating: 4.4,
    reviews: 170,
    rank: 5,
    newestRank: 6,
    inStock: true,
    pickupReady: false,
    sponsored: false,
    tag: "Best Selling",
    offerCount: 2,
    moreBuyingFrom: 171.99,
    image: "assets/assets2/Motorola%20-%20moto%20g%20power%202026%20128GB%20%28Unlocked%29.jpeg",
    variants: [
      "assets/assets2/Verizon%20Prepaid%20-%20Samsung%20Galaxy%20A16%20128GB.jpeg",
      "assets/assets2/google-pixel-c2.jpg",
    ],
    cta: "details",
  },
  {
    id: "pixel-10-pro-xl",
    name: "Google - Pixel 10 Pro XL 256GB",
    subtitle: "Unlocked - Obsidian",
    brand: "google",
    modelFamily: "pixel-10",
    category: "unlocked",
    carriers: ["unlocked", "google-fi", "verizon", "t-mobile"],
    unlocked: true,
    condition: "new",
    os: "android",
    price: 899,
    compareValue: 1199,
    save: 300,
    rating: 4.7,
    reviews: 330,
    rank: 6,
    newestRank: 5,
    inStock: true,
    pickupReady: true,
    sponsored: false,
    tag: "Trade-in offer",
    offerCount: 2,
    moreBuyingFrom: 673.99,
    image: "assets/assets2/Google%20Pixel.jpeg",
    variants: [
      "assets/assets2/Google%20Pixel.jpeg",
      "assets/assets2/google-pixel-c2.jpg",
      "assets/assets2/Apple%20iPhone%20Air.jpeg",
    ],
    cta: "details",
  },
  {
    id: "samsung-s26-ultra",
    name: "Samsung - Galaxy S26 Ultra 256GB",
    subtitle: "Unlocked - Black",
    brand: "samsung",
    modelFamily: "galaxy-s26",
    category: "unlocked",
    carriers: ["unlocked", "t-mobile", "verizon", "metro"],
    unlocked: true,
    condition: "new",
    os: "android",
    price: 1099.99,
    compareValue: 1299.99,
    save: 200,
    rating: 4.9,
    reviews: 157,
    rank: 7,
    newestRank: 4,
    inStock: true,
    pickupReady: true,
    sponsored: false,
    tag: "Trade-in offer",
    offerCount: 1,
    moreBuyingFrom: 945.99,
    image: "assets/assets2/Samsung%20Galaxy%20S26%20Ultra.jpeg",
    variants: [
      "assets/Samsung/THUMB_007-galaxy-s26ultra-cobaltviolet-back-right-30-spen.jpg",
      "assets/assets2/google-pixel-c2.jpg",
      "assets/assets2/Apple%20iPhone%20Air.jpeg",
      "assets/assets2/Motorola%20-%20moto%20g%20power%202026%20128GB%20%28Unlocked%29.jpeg",
    ],
    cta: "details",
  },
  {
    id: "iphone-air-256",
    name: "Apple - iPhone Air 256GB",
    subtitle: "Unlocked - Space Black",
    brand: "apple",
    modelFamily: "iphone-17",
    category: "unlocked",
    carriers: ["unlocked", "verizon", "t-mobile", "att"],
    unlocked: true,
    condition: "new",
    os: "ios",
    price: 849.99,
    compareValue: 999.99,
    save: 150,
    rating: 4.9,
    reviews: 11,
    rank: 8,
    newestRank: 3,
    inStock: true,
    pickupReady: true,
    sponsored: false,
    tag: "New Limited Time Deal",
    offerCount: 6,
    moreBuyingFrom: 806.99,
    image: "assets/assets2/Apple%20iPhone%20Air.jpeg",
    variants: [
      "assets/assets2/Apple%20iPhone%20Air.jpeg",
      "assets/assets2/iPhone%2017%20Pro%20Max%20%28Cosmic%20Orange%29.jpeg",
      "assets/assets2/Samsung%20Galaxy%20S26%20Ultra.jpeg",
      "assets/assets2/google-pixel-c2.jpg",
    ],
    cta: "details",
  },
  {
    id: "mint-sim-kit",
    name: "Mint Mobile - Prepaid SIM Card Starter Kit",
    subtitle: "Gold",
    brand: "lively",
    modelFamily: "jitterbug",
    category: "plans",
    carriers: ["mint"],
    unlocked: false,
    condition: "new",
    os: "android",
    price: 2,
    compareValue: 7,
    save: 5,
    rating: 4.4,
    reviews: 922,
    rank: 9,
    newestRank: 11,
    inStock: true,
    pickupReady: true,
    sponsored: true,
    tag: "Top Pick",
    offerCount: 0,
    moreBuyingFrom: null,
    image: "assets/assets2/Visible%20-%20$25mo%20plan%20%20eSIM%20pSIM%20Kit.jpeg",
    variants: [],
    cta: "add",
  },
  {
    id: "moto-stylus-2024",
    name: "Motorola - moto g stylus 5G 2024 256GB",
    subtitle: "Unlocked - Caramel Latte",
    brand: "motorola",
    modelFamily: "moto-g",
    category: "unlocked",
    carriers: ["unlocked", "visible", "cricket"],
    unlocked: true,
    condition: "open-box",
    os: "android",
    price: 199.99,
    compareValue: 399.99,
    save: 200,
    rating: 4.6,
    reviews: 727,
    rank: 10,
    newestRank: 12,
    inStock: true,
    pickupReady: false,
    sponsored: false,
    tag: "Bundle and save",
    offerCount: 2,
    moreBuyingFrom: 169.99,
    image: "assets/assets2/Motorola%20Moto%20G%20Stylus%205G.jpeg",
    variants: [],
    cta: "add",
  },
  {
    id: "iphone-17-pro-max",
    name: "Apple - iPhone 17 Pro Max 256GB",
    subtitle: "Unlocked - Cosmic Orange",
    brand: "apple",
    modelFamily: "iphone-17-pro-max",
    category: "unlocked",
    carriers: ["unlocked", "verizon", "t-mobile", "att"],
    unlocked: true,
    condition: "new",
    os: "ios",
    price: 1249.99,
    compareValue: 1349.99,
    save: 100,
    rating: 4.8,
    reviews: 310,
    rank: 11,
    newestRank: 2,
    inStock: true,
    pickupReady: true,
    sponsored: false,
    tag: "Trade-in offer",
    offerCount: 1,
    moreBuyingFrom: 1179.99,
    image: "assets/assets2/iPhone%2017%20Pro%20Max%20%28Cosmic%20Orange%29.jpeg",
    variants: [
      "assets/assets2/iPhone%2017%20Pro%20Max%20%28Cosmic%20Orange%29.jpeg",
      "assets/assets2/Apple%20iPhone%20Air.jpeg",
    ],
    cta: "details",
  },
  {
    id: "lively-jitterbug-smart4",
    name: "Lively - Jitterbug Smart4 (Smartphone for Seniors)",
    subtitle: "Lively plan required",
    brand: "lively",
    modelFamily: "jitterbug",
    category: "plans",
    carriers: ["lively", "verizon"],
    unlocked: false,
    condition: "refurbished",
    os: "lively-os",
    price: 79.99,
    compareValue: 119.99,
    save: 40,
    rating: 4.2,
    reviews: 88,
    rank: 12,
    newestRank: 13,
    inStock: false,
    pickupReady: false,
    sponsored: false,
    tag: "Senior Friendly",
    offerCount: 0,
    moreBuyingFrom: null,
    image: "assets/assets2/Lively%20-%20Jitterbug%20Smart4%20%28Smartphone%20for%20Seniors%29.jpeg",
    variants: [],
    cta: "details",
  },
  {
    id: "oneplus-open-box",
    name: "OnePlus - Open Box 12 256GB",
    subtitle: "Open-Box - Glacier Blue",
    brand: "oneplus",
    modelFamily: "other",
    category: "unlocked",
    carriers: ["unlocked", "t-mobile"],
    unlocked: true,
    condition: "open-box",
    os: "android",
    price: 529.99,
    compareValue: 699.99,
    save: 170,
    rating: 4.3,
    reviews: 66,
    rank: 13,
    newestRank: 1,
    inStock: true,
    pickupReady: false,
    sponsored: false,
    tag: "Open-Box",
    offerCount: 1,
    moreBuyingFrom: 499.99,
    image: "assets/assets2/google-pixel-c2.jpg",
    variants: [],
    cta: "details",
  },
  {
    id: "nokia-kaios",
    name: "Nokia - 2780 Flip",
    subtitle: "Unlocked - Blue",
    brand: "nokia",
    modelFamily: "other",
    category: "unlocked",
    carriers: ["unlocked", "cricket"],
    unlocked: true,
    condition: "new",
    os: "kaios",
    price: 89.99,
    compareValue: 99.99,
    save: 10,
    rating: 4,
    reviews: 44,
    rank: 14,
    newestRank: 14,
    inStock: true,
    pickupReady: true,
    sponsored: false,
    tag: "Budget Pick",
    offerCount: 0,
    moreBuyingFrom: null,
    image: "assets/assets2/Motorola%20Moto%20G%20play.jpeg",
    variants: [],
    cta: "add",
  },
  {
    id: "samsung-z-fold7",
    name: "Samsung Galaxy Z Fold7 512GB",
    subtitle: "Unlocked - Gray",
    brand: "samsung",
    modelFamily: "galaxy-s26",
    category: "unlocked",
    carriers: ["unlocked", "t-mobile", "verizon"],
    unlocked: true,
    condition: "new",
    os: "android",
    price: 1599.99,
    compareValue: 1799.99,
    save: 200,
    rating: 4.8,
    reviews: 140,
    rank: 15,
    newestRank: 15,
    inStock: true,
    pickupReady: false,
    sponsored: false,
    tag: "Premium",
    offerCount: 1,
    moreBuyingFrom: 1519.99,
    image: "assets/assets2/Samsung%20Galaxy%20Z%20Fold7.jpeg",
    variants: ["assets/assets2/Samsung%20Galaxy%20Z%20Fold7.jpeg"],
    cta: "details",
  },
  {
    id: "motorola-play-prepaid",
    name: "Tracfone - Motorola moto g play 2024 64GB",
    subtitle: "Prepaid",
    brand: "motorola",
    modelFamily: "moto-g",
    category: "prepaid",
    carriers: ["verizon", "tracfone"],
    unlocked: false,
    condition: "new",
    os: "android",
    price: 59.99,
    compareValue: 79.99,
    save: 20,
    rating: 4.3,
    reviews: 102,
    rank: 16,
    newestRank: 16,
    inStock: true,
    pickupReady: true,
    sponsored: false,
    tag: "Value",
    offerCount: 0,
    moreBuyingFrom: null,
    image: "assets/assets2/Tracfone%20-%20Motorola%20moto%20g%20play%202024%2064GB%20Prepaid.jpeg",
    variants: [],
    cta: "add",
  },
];

const productGrid = document.getElementById("productGrid");
const resultCount = document.getElementById("resultCount");
const shownCount = document.getElementById("shownCount");
const sortSelect = document.getElementById("sortSelect");
const categoryButtons = document.querySelectorAll("[data-category-filter]");
const chipButtons = document.querySelectorAll("[data-chip-filter]");
const minPriceInput = document.getElementById("minPrice");
const maxPriceInput = document.getElementById("maxPrice");
const applyPriceRangeButton = document.getElementById("applyPriceRange");
const compareTray = document.getElementById("compareTray");
const compareStatus = document.getElementById("compareStatus");
const compareBody = document.getElementById("compareBody");
const compareActionButton = document.getElementById("compareActionButton");
const compareCollapseButton = document.getElementById("compareCollapseButton");
const compareErrorModal = document.getElementById("compareErrorModal");
const compareErrorClose = document.getElementById("compareErrorClose");
const compareErrorConfirm = document.getElementById("compareErrorConfirm");
const newRail = document.getElementById("newRail");
const COMPARE_IDS_STORAGE_KEY = "nexiumCompareIds";
const COMPARE_SELECTION_STORAGE_KEY = "nexiumCompareSelection";

let activeCategory = "all";
let activeChip = "all";
let compareIds = [];
let selectedQuickPrice = "";
const shopState = window.NexiumShopState || null;

const formatPrice = (value) => `$${value.toFixed(2)}`;

const buildStoredProductFromCatalogProduct = (product) => ({
  id: product.id,
  name: product.name,
  subtitle: product.subtitle,
  price: product.price,
  image: product.image,
  brand: product.brand || "Nexium",
  tag: product.tag || "Featured deal",
});

const setSaveButtonState = (button, isSaved) => {
  if (!button) {
    return;
  }

  button.classList.toggle("is-saved", isSaved);
  button.setAttribute("aria-pressed", String(isSaved));
  button.textContent = isSaved ? "♥" : "♡";
};

const showAddedFeedback = (button) => {
  if (!button || button.dataset.feedbackState === "locked") {
    return;
  }

  const originalText = button.dataset.originalText || button.textContent;
  button.dataset.originalText = originalText;
  button.dataset.feedbackState = "locked";
  button.textContent = "Added";

  window.setTimeout(() => {
    button.textContent = button.dataset.originalText || originalText;
    button.dataset.feedbackState = "";
  }, 1100);
};

const syncRenderedSaveButtons = () => {
  if (!productGrid || !shopState?.isSavedItem) {
    return;
  }

  productGrid.querySelectorAll(".product-card").forEach((card) => {
    const saveButton = card.querySelector(".save-button");
    const productId = card.getAttribute("data-product-id") || "";

    if (!saveButton || !productId) {
      return;
    }

    setSaveButtonState(saveButton, shopState.isSavedItem(productId));
  });
};

const buildProductDetailsUrl = (product) => {
  const params = new URLSearchParams();
  params.set("name", product.name);
  params.set("subtitle", product.subtitle || "Unlocked");
  params.set("price", product.price.toFixed(2));
  params.set("rating", product.rating.toFixed(1));
  params.set("reviews", String(product.reviews));
  params.set("brand", product.brand || "Nexium");
  params.set("image", product.image);
  params.set("tag", product.tag || "Featured deal");
  return `product-details.html?${params.toString()}`;
};

const showCompareLimitModal = () => {
  if (!compareErrorModal) {
    return;
  }

  compareErrorModal.classList.remove("is-hidden");
  document.body.style.overflow = "hidden";
  compareErrorConfirm?.focus();
};

const hideCompareLimitModal = () => {
  if (!compareErrorModal) {
    return;
  }

  compareErrorModal.classList.add("is-hidden");
  document.body.style.overflow = "";
};

const buildStars = (rating) => {
  const rounded = Math.round(rating);
  return `${"★".repeat(rounded)}${"☆".repeat(Math.max(0, 5 - rounded))}`;
};

const serializeCompareProduct = (product) => ({
  id: product.id,
  name: product.name,
  subtitle: product.subtitle,
  brand: product.brand,
  modelFamily: product.modelFamily,
  carriers: product.carriers,
  unlocked: product.unlocked,
  condition: product.condition,
  os: product.os,
  price: product.price,
  compareValue: product.compareValue,
  rating: product.rating,
  reviews: product.reviews,
  image: product.image,
  variants: product.variants,
});

const loadStoredCompareIds = () => {
  try {
    const stored = localStorage.getItem(COMPARE_IDS_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((id) => typeof id === "string" && products.some((product) => product.id === id))
      .slice(0, 4);
  } catch {
    return [];
  }
};

const persistCompareSelection = (selectedProducts) => {
  try {
    localStorage.setItem(COMPARE_IDS_STORAGE_KEY, JSON.stringify(compareIds));
    localStorage.setItem(
      COMPARE_SELECTION_STORAGE_KEY,
      JSON.stringify(selectedProducts.map((product) => serializeCompareProduct(product)))
    );
  } catch {
    // Ignore storage errors in restricted contexts.
  }
};

compareIds = loadStoredCompareIds();

const getCheckedValues = (selector) =>
  Array.from(document.querySelectorAll(selector))
    .filter((input) => input.checked)
    .map((input) => input.value);

const matchesCategory = (product) => {
  if (activeCategory === "all") {
    return true;
  }

  if (activeCategory === "unlocked") {
    return product.unlocked;
  }

  return product.category === activeCategory;
};

const matchesChip = (product) => {
  if (activeChip === "all") {
    return true;
  }

  if (activeChip === "unlocked") {
    return product.unlocked;
  }

  if (activeChip === "android") {
    return product.os === "android";
  }

  if (activeChip === "open-box") {
    return product.condition === "open-box";
  }

  if (["samsung", "apple", "motorola", "oneplus"].includes(activeChip)) {
    return product.brand === activeChip;
  }

  return product.carriers.includes(activeChip);
};

const quickPriceMatches = (product) => {
  if (!selectedQuickPrice) {
    return true;
  }

  if (selectedQuickPrice === "under-25") {
    return product.price < 25;
  }

  if (selectedQuickPrice === "25-100") {
    return product.price >= 25 && product.price <= 100;
  }

  if (selectedQuickPrice === "100-500") {
    return product.price > 100 && product.price <= 500;
  }

  if (selectedQuickPrice === "500-plus") {
    return product.price >= 500;
  }

  return true;
};

const applySort = (items) => {
  const sorted = [...items];
  const sortValue = sortSelect?.value || "best-selling";

  sorted.sort((a, b) => {
    if (sortValue === "price-low") {
      return a.price - b.price;
    }

    if (sortValue === "price-high") {
      return b.price - a.price;
    }

    if (sortValue === "rating-high") {
      return b.rating - a.rating;
    }

    if (sortValue === "newest") {
      return a.newestRank - b.newestRank;
    }

    return a.rank - b.rank;
  });

  return sorted;
};

const filterProducts = () => {
  const carrierFilters = getCheckedValues(".carrier-filter");
  const modelFilters = getCheckedValues(".model-filter");
  const brandFilters = getCheckedValues(".brand-filter");
  const conditionFilters = getCheckedValues(".condition-filter");
  const osFilters = getCheckedValues(".os-filter");
  const pickupReadyOnly = document.getElementById("filterPickupReady")?.checked;
  const inStockOnly = document.getElementById("filterInStockOnly")?.checked;
  const minPrice = Number.parseFloat(minPriceInput?.value || "");
  const maxPrice = Number.parseFloat(maxPriceInput?.value || "");

  return products.filter((product) => {
    if (!matchesCategory(product)) {
      return false;
    }

    if (!matchesChip(product)) {
      return false;
    }

    if (pickupReadyOnly && !product.pickupReady) {
      return false;
    }

    if (inStockOnly && !product.inStock) {
      return false;
    }

    if (carrierFilters.length) {
      const carrierMatch = carrierFilters.some((carrier) => {
        if (carrier === "unlocked") {
          return product.unlocked;
        }
        return product.carriers.includes(carrier);
      });

      if (!carrierMatch) {
        return false;
      }
    }

    if (modelFilters.length && !modelFilters.includes(product.modelFamily)) {
      return false;
    }

    if (brandFilters.length && !brandFilters.includes(product.brand)) {
      return false;
    }

    if (conditionFilters.length && !conditionFilters.includes(product.condition)) {
      return false;
    }

    if (osFilters.length && !osFilters.includes(product.os)) {
      return false;
    }

    if (!Number.isNaN(minPrice) && product.price < minPrice) {
      return false;
    }

    if (!Number.isNaN(maxPrice) && product.price > maxPrice) {
      return false;
    }

    if (!quickPriceMatches(product)) {
      return false;
    }

    return true;
  });
};

const renderProducts = () => {
  if (!productGrid) {
    return;
  }

  const filtered = applySort(filterProducts());

  resultCount.textContent = `(${filtered.length})`;
  shownCount.textContent = filtered.length
    ? `Showing ${filtered.length} of ${products.length} items`
    : "Showing 0 items";

  if (!filtered.length) {
    productGrid.innerHTML = '<div class="filter-empty">No phones matched this filter combination.<br>Try clearing a few filters.</div>';
    return;
  }

  productGrid.innerHTML = filtered
    .map((product) => {
      const variantsMarkup = product.variants.length
        ? `<div class="variant-swatches">${product.variants
            .slice(0, 4)
            .map((variant) => `<span><img src="${variant}" alt="${product.name} variant"></span>`)
            .join("")}</div>`
        : "";

      const offerMarkup = product.offerCount
        ? `<div class="product-offer-pill">+ ${product.offerCount} offer${product.offerCount > 1 ? "s" : ""} for you</div>`
        : "";

      const moreBuyingMarkup = product.moreBuyingFrom
        ? `<div class="product-more">More Buying Options <span>from ${formatPrice(product.moreBuyingFrom)}</span></div>`
        : "";

      const compareChecked = compareIds.includes(product.id) ? "checked" : "";
      const isSaved = shopState?.isSavedItem ? shopState.isSavedItem(product.id) : false;

      return `
        <article class="product-card" data-product-id="${product.id}" data-detail-url="${buildProductDetailsUrl(product)}">
          <span class="card-pill">${product.tag}</span>
          <button class="save-button${isSaved ? " is-saved" : ""}" type="button" aria-label="Save ${product.name}" aria-pressed="${isSaved ? "true" : "false"}">${isSaved ? "♥" : "♡"}</button>
          <div class="product-art">
            <img src="${product.image}" alt="${product.name}">
          </div>
          <h3 class="product-title">${product.name}</h3>
          <p class="product-subtitle">${product.subtitle}</p>
          ${variantsMarkup}
          <div class="product-rating">${buildStars(product.rating)} <span>${product.rating.toFixed(1)} (${product.reviews} reviews)</span></div>
          <div class="product-dealline">Ultimate Deal</div>
          <strong class="product-price">${formatPrice(product.price)}</strong>
          <div class="product-save">Save $${product.save}</div>
          <div class="product-compare-value">Comp. Value: ${formatPrice(product.compareValue)}</div>
          ${offerMarkup}
          ${moreBuyingMarkup}
          <p class="product-delivery">${product.pickupReady ? "Pick up in 1 hour" : "Pick up Mon, Apr 27"}</p>
          <p class="product-delivery">${product.inStock ? "Shipping unavailable" : "Out of stock"}</p>
          <div class="product-bottom">
            <button type="button" class="card-cta primary">Add to cart</button>
            <label class="compare-row">
              <input type="checkbox" class="compare-checkbox" data-product-id="${product.id}" ${compareChecked}>
              Compare
            </label>
          </div>
        </article>
      `;
    })
    .join("");

  productGrid.querySelectorAll(".compare-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const productId = checkbox.dataset.productId;
      if (!productId) {
        return;
      }

      if (checkbox.checked) {
        if (compareIds.length >= 4) {
          checkbox.checked = false;
          showCompareLimitModal();
          return;
        }

        if (!compareIds.includes(productId)) {
          compareIds.push(productId);
        }
      } else {
        compareIds = compareIds.filter((id) => id !== productId);
      }

      updateCompareTray();
    });
  });

  productGrid.querySelectorAll(".product-card").forEach((card) => {
    const detailUrl = card.dataset.detailUrl || "product-details.html";
    const productId = card.getAttribute("data-product-id") || "";
    const cardProduct = products.find((product) => product.id === productId) || null;

    card.classList.add("product-card-clickable");
    card.tabIndex = 0;
    card.setAttribute("role", "link");

    const navigateToDetails = () => {
      window.location.href = detailUrl;
    };

    card.addEventListener("click", (event) => {
      const ignoredTarget = event.target.closest(".save-button, .compare-row, .compare-checkbox, label, input");
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

    const ctaButton = card.querySelector(".card-cta");
    if (ctaButton) {
      ctaButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (cardProduct && shopState?.addItemToCart) {
          shopState.addItemToCart(buildStoredProductFromCatalogProduct(cardProduct), 1);
          showAddedFeedback(ctaButton);
          return;
        }

        navigateToDetails();
      });
    }

    const saveButton = card.querySelector(".save-button");
    if (saveButton) {
      if (cardProduct && shopState?.isSavedItem) {
        setSaveButtonState(saveButton, shopState.isSavedItem(cardProduct.id));
      }

      saveButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        if (!cardProduct || !shopState?.toggleSavedItem) {
          return;
        }

        const result = shopState.toggleSavedItem(buildStoredProductFromCatalogProduct(cardProduct));
        setSaveButtonState(saveButton, result.isSaved);
      });
    }
  });
};

const updateCompareTray = () => {
  if (!compareTray || !compareStatus || !compareBody || !compareActionButton) {
    return;
  }

  compareIds = Array.from(new Set(compareIds))
    .filter((id) => products.some((product) => product.id === id))
    .slice(0, 4);

  const selected = compareIds
    .map((id) => products.find((product) => product.id === id))
    .filter(Boolean);

  persistCompareSelection(selected);

  compareStatus.textContent = `Comparing ${selected.length} of 4 items`;

  if (!selected.length) {
    compareTray.classList.add("is-hidden");
    compareBody.innerHTML = "";
    compareActionButton.disabled = true;
    renderProducts();
    return;
  }

  compareTray.classList.remove("is-hidden");
  compareActionButton.disabled = selected.length < 2;

  compareBody.innerHTML = selected
    .map(
      (product) => `
        <article class="compare-item">
          <img src="${product.image}" alt="${product.name}">
          <p>${product.name}</p>
          <button type="button" data-remove-compare="${product.id}" aria-label="Remove ${product.name}">×</button>
        </article>
      `
    )
    .join("");

  compareBody.querySelectorAll("[data-remove-compare]").forEach((button) => {
    button.addEventListener("click", () => {
      const removeId = button.dataset.removeCompare;
      compareIds = compareIds.filter((id) => id !== removeId);
      updateCompareTray();
    });
  });

  renderProducts();
};

const renderNewRail = () => {
  if (!newRail) {
    return;
  }

  newRail.innerHTML = products
    .slice(8)
    .map(
      (product) => `
        <article class="new-rail-card" data-detail-url="${buildProductDetailsUrl(product)}" tabindex="0" role="link">
          <img src="${product.image}" alt="${product.name}">
          <p>${product.name}</p>
          <strong>${formatPrice(product.price)}</strong>
        </article>
      `
    )
    .join("");

  newRail.querySelectorAll(".new-rail-card").forEach((card) => {
    const detailUrl = card.dataset.detailUrl || "product-details.html";

    const navigateToDetails = () => {
      window.location.href = detailUrl;
    };

    card.addEventListener("click", () => {
      navigateToDetails();
    });

    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      navigateToDetails();
    });
  });
};

const setupCategoryButtons = () => {
  categoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.categoryFilter || "all";
      categoryButtons.forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      renderProducts();
    });
  });
};

const setupChipButtons = () => {
  chipButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeChip = button.dataset.chipFilter || "all";
      chipButtons.forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      renderProducts();
    });
  });
};

const setupSearchWithinOptions = () => {
  document.querySelectorAll("[data-option-search]").forEach((input) => {
    input.addEventListener("input", () => {
      const listId = input.getAttribute("data-option-search");
      const list = listId ? document.getElementById(listId) : null;
      if (!list) {
        return;
      }

      const term = input.value.trim().toLowerCase();
      list.querySelectorAll("label").forEach((label) => {
        const text = label.textContent?.trim().toLowerCase() || "";
        label.style.display = text.includes(term) ? "flex" : "none";
      });
    });
  });
};

const setupShowAllButtons = () => {
  document.querySelectorAll("[data-toggle-options]").forEach((button) => {
    button.addEventListener("click", () => {
      const listId = button.getAttribute("data-toggle-options");
      const list = listId ? document.getElementById(listId) : null;
      if (!list) {
        return;
      }

      list.classList.toggle("is-expanded");
      button.textContent = list.classList.contains("is-expanded") ? "Show less" : "Show all";
    });
  });
};

const setupFilterListeners = () => {
  document.querySelectorAll(
    ".carrier-filter, .model-filter, .brand-filter, .condition-filter, .os-filter, #filterPickupReady, #filterInStockOnly"
  ).forEach((input) => {
    input.addEventListener("change", () => {
      renderProducts();
    });
  });

  sortSelect?.addEventListener("change", renderProducts);

  applyPriceRangeButton?.addEventListener("click", renderProducts);

  minPriceInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      renderProducts();
    }
  });

  maxPriceInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      renderProducts();
    }
  });

  document.querySelectorAll(".price-quick-filter").forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) {
        selectedQuickPrice = input.value;
        document.querySelectorAll(".price-quick-filter").forEach((otherInput) => {
          if (otherInput !== input) {
            otherInput.checked = false;
          }
        });
      } else {
        selectedQuickPrice = "";
      }

      renderProducts();
    });
  });
};

const setupCompareBarActions = () => {
  compareCollapseButton?.addEventListener("click", () => {
    if (!compareTray) {
      return;
    }

    compareTray.classList.toggle("is-collapsed");
    const isCollapsed = compareTray.classList.contains("is-collapsed");
    compareCollapseButton.textContent = isCollapsed ? "Expand" : "Collapse";
    compareCollapseButton.setAttribute("aria-expanded", String(!isCollapsed));
  });

  compareActionButton?.addEventListener("click", () => {
    if (compareIds.length < 2) {
      return;
    }

    const selected = compareIds
      .map((id) => products.find((product) => product.id === id))
      .filter(Boolean);

    persistCompareSelection(selected);
    window.location.href = "compare-products.html";
  });

  compareErrorClose?.addEventListener("click", hideCompareLimitModal);
  compareErrorConfirm?.addEventListener("click", hideCompareLimitModal);

  compareErrorModal?.addEventListener("click", (event) => {
    if (event.target === compareErrorModal) {
      hideCompareLimitModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && compareErrorModal && !compareErrorModal.classList.contains("is-hidden")) {
      hideCompareLimitModal();
    }
  });
};

renderNewRail();
setupCategoryButtons();
setupChipButtons();
setupSearchWithinOptions();
setupShowAllButtons();
setupFilterListeners();
setupCompareBarActions();
renderProducts();
updateCompareTray();

if (shopState?.eventName) {
  window.addEventListener(shopState.eventName, () => {
    syncRenderedSaveButtons();
  });
}
})();
