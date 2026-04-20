(() => {
  const COMPARE_IDS_STORAGE_KEY = "nexiumCompareIds";
  const COMPARE_SELECTION_STORAGE_KEY = "nexiumCompareSelection";

  const compareProductsGrid = document.getElementById("compareProductsGrid");
  const specRows = document.getElementById("specRows");
  const ratingsGrid = document.getElementById("ratingsGrid");
  const imagesGrid = document.getElementById("imagesGrid");
  const prosGrid = document.getElementById("prosGrid");
  const consGrid = document.getElementById("consGrid");
  const availabilityGrid = document.getElementById("availabilityGrid");
  const highlightDifferences = document.getElementById("highlightDifferences");
  const toggleMoreSpecsButton = document.getElementById("toggleMoreSpecsButton");
  const printCompareButton = document.getElementById("printCompareButton");
  const compareContent = document.getElementById("compareContent");
  const comparePageEmptyState = document.getElementById("comparePageEmptyState");
  const compareHeader = document.querySelector(".home-header") || document.querySelector(".compare-header");
  const compactBreakpoint = window.matchMedia("(min-width: 981px)");
  const shopState = window.NexiumShopState || null;

  const BASE_SPEC_ROWS = [
    "Screen Size",
    "Carrier Compatibility",
    "Built-in Storage",
    "Processor Model",
    "Rear-Facing Camera",
    "Phone Memory (RAM)",
  ];

  const EXTRA_SPEC_ROWS = [
    "Front-Facing Camera",
    "Operating System",
    "Battery Capacity",
    "Wireless Connectivity",
    "Security",
    "Weight",
  ];

  const CARRIER_LABELS = {
    "t-mobile": "T-Mobile",
    "google-fi": "Google Fi",
    "us-cellular": "US Cellular",
    "us-mobile": "US Mobile",
    metro: "Metro by T-Mobile",
    verizon: "Verizon",
    visible: "Visible",
    cricket: "Cricket",
    mint: "Mint Mobile",
    att: "AT&T",
    tracfone: "Tracfone",
    unlocked: "Unlocked",
  };

  const REVIEW_IMAGES = [
    "assets/assets2/google-pixel-c2.jpg",
    "assets/assets2/offer-samsung.jpg",
    "assets/assets2/offer-pixel.jpg",
    "assets/assets2/offer-accessories.jpg",
    "assets/assets2/Verizon%20Prepaid%20-%20Samsung%20Galaxy%20A16%20128GB.jpeg",
    "assets/assets2/Motorola%20-%20moto%20g%20power%202026%20128GB%20%28Unlocked%29.jpeg",
  ];

  const DETAIL_OVERRIDES = {
    "samsung-galaxy-a16-unlocked": {
      model: "SM-A166UZKAXAA",
      sku: "6607858",
      specs: {
        "Screen Size": "6.7 inches",
        "Built-in Storage": "128 gigabytes",
        "Processor Model": "Exynos 1330",
        "Rear-Facing Camera": "50 megapixels",
        "Phone Memory (RAM)": "4 gigabytes",
      },
      prosQuote: "\"the overall performance and quality of phone is considerable\"",
      prosTags: ["Overall Performance", "Camera Quality", "Battery Life"],
      consQuote: "\"Processor speed not the greatest\"",
      consTags: ["Processor Speed", "RAM", "Heat Dissipation"],
      customerImages: [
        "assets/assets2/Verizon%20Prepaid%20-%20Samsung%20Galaxy%20A16%20128GB.jpeg",
        "assets/assets2/offer-samsung.jpg",
        "assets/assets2/google-pixel-c2.jpg",
      ],
    },
    "moto-g-power-unlocked": {
      model: "PB000007US",
      sku: "6572573",
      specs: {
        "Screen Size": "6.7 inches",
        "Built-in Storage": "128 gigabytes",
        "Processor Model": "Dimensity 7020 octa-core",
        "Rear-Facing Camera": "50 megapixels",
        "Phone Memory (RAM)": "8 gigabytes",
      },
      prosQuote: "\"So far it's been great!\"",
      prosTags: ["Overall Performance", "Battery Life", "Camera Quality"],
      consQuote: "\"Hearing aid connectivity is poor.\"",
      consTags: ["Connectivity", "Notifications", "Bluetooth Pairing"],
      customerImages: [
        "assets/assets2/Motorola%20-%20moto%20g%20power%202026%20128GB%20%28Unlocked%29.jpeg",
        "assets/assets2/offer-pixel.jpg",
        "assets/assets2/offer-accessories.jpg",
      ],
    },
    "iphone-air-256": {
      model: "MD0W4LL/A",
      sku: "6507524",
      specs: {
        "Screen Size": "6.1 inches",
        "Built-in Storage": "256 gigabytes",
        "Processor Model": "A18 chip",
        "Rear-Facing Camera": "48 megapixels",
        "Phone Memory (RAM)": "8 gigabytes",
      },
      prosQuote: "\"The iPhone works very smooth and camera quality is excellent.\"",
      prosTags: ["Camera Quality", "Battery Life", "Face ID"],
      consQuote: "\"It tends to get hot after gaming.\"",
      consTags: ["Heat Dissipation", "Charging Speed", "Price"],
      customerImages: [
        "assets/assets2/Apple%20iPhone%20Air.jpeg",
        "assets/assets2/google-pixel-c2.jpg",
        "assets/assets2/offer-pixel.jpg",
      ],
    },
    "samsung-s26-ultra": {
      model: "SM-S948UZKAXAA",
      sku: "6669733",
      specs: {
        "Screen Size": "6.9 inches",
        "Built-in Storage": "256 gigabytes",
        "Processor Model": "Snapdragon 8 Elite Gen 5 for Galaxy",
        "Rear-Facing Camera": "200 megapixels",
        "Phone Memory (RAM)": "12 gigabytes",
      },
      prosQuote: "\"Great phone with incredible display and battery life.\"",
      prosTags: ["Overall Performance", "Camera Quality", "Display"],
      consQuote: "Not enough negative mentions yet.",
      consTags: [],
      customerImages: [
        "assets/Samsung/THUMB_007-galaxy-s26ultra-cobaltviolet-back-right-30-spen.jpg",
        "assets/assets2/offer-samsung.jpg",
        "assets/assets2/offer-accessories.jpg",
      ],
    },
  };

  const parseStoredValue = (key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const sanitizeStoredProduct = (product) => {
    if (!product || typeof product !== "object") {
      return null;
    }

    if (typeof product.id !== "string" || typeof product.name !== "string") {
      return null;
    }

    return {
      id: product.id,
      name: product.name,
      subtitle: typeof product.subtitle === "string" ? product.subtitle : "",
      brand: typeof product.brand === "string" ? product.brand : "",
      modelFamily: typeof product.modelFamily === "string" ? product.modelFamily : "",
      carriers: Array.isArray(product.carriers) ? product.carriers : [],
      unlocked: Boolean(product.unlocked),
      condition: typeof product.condition === "string" ? product.condition : "",
      os: typeof product.os === "string" ? product.os : "",
      price: Number.isFinite(product.price) ? product.price : 0,
      compareValue: Number.isFinite(product.compareValue) ? product.compareValue : 0,
      rating: Number.isFinite(product.rating) ? product.rating : 0,
      reviews: Number.isFinite(product.reviews) ? product.reviews : 0,
      image: typeof product.image === "string" ? product.image : "",
      variants: Array.isArray(product.variants) ? product.variants : [],
    };
  };

  const normalizeCompareSelection = () => {
    const selection = parseStoredValue(COMPARE_SELECTION_STORAGE_KEY)
      .map((product) => sanitizeStoredProduct(product))
      .filter(Boolean)
      .slice(0, 4);

    if (selection.length) {
      return selection;
    }

    return [];
  };

  let compareProducts = normalizeCompareSelection();
  let showExtraSpecs = false;
  let syncCompactCompareState = () => {};

  const syncHeaderOffset = () => {
    if (!compareHeader) {
      return;
    }

    const headerHeight = Math.round(compareHeader.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--compare-header-offset", `${headerHeight}px`);
  };

  const getZoomProfileClass = () => {
    const deviceZoom = window.devicePixelRatio || 1;

    if (deviceZoom >= 1.38) {
      return "zoom-150";
    }

    if (deviceZoom >= 1.18) {
      return "zoom-125";
    }

    return "zoom-100";
  };

  const applyZoomProfile = () => {
    const zoomClass = getZoomProfileClass();
    document.body.classList.remove("zoom-100", "zoom-125", "zoom-150");
    document.body.classList.add(zoomClass);
    document.body.setAttribute("data-zoom-profile", zoomClass);
    syncHeaderOffset();
    syncCompactCompareState();
  };

  const saveCompareState = () => {
    try {
      localStorage.setItem(COMPARE_IDS_STORAGE_KEY, JSON.stringify(compareProducts.map((product) => product.id)));
      localStorage.setItem(COMPARE_SELECTION_STORAGE_KEY, JSON.stringify(compareProducts));
    } catch {
      // Ignore storage errors in restricted contexts.
    }
  };

  compareProducts = compareProducts
    .filter((product, index, allProducts) => allProducts.findIndex((entry) => entry.id === product.id) === index)
    .slice(0, 4);
  saveCompareState();

  const escapeHtml = (value) =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");

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

  const formatPrice = (value) => `$${Number(value || 0).toFixed(2)}`;

  const buildStars = (rating) => {
    const rounded = Math.round(Number(rating) || 0);
    return `${"★".repeat(Math.max(0, rounded))}${"☆".repeat(Math.max(0, 5 - rounded))}`;
  };

  const titleCase = (value) =>
    value
      .split(" ")
      .filter(Boolean)
      .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
      .join(" ");

  const formatCarrier = (carrier) => {
    const normalized = String(carrier || "").toLowerCase();
    if (CARRIER_LABELS[normalized]) {
      return CARRIER_LABELS[normalized];
    }

    return titleCase(normalized.replaceAll("-", " "));
  };

  const pickStorageGb = (product) => {
    const nameMatch = product.name.match(/(\d+)\s*GB/i);
    if (nameMatch) {
      return `${nameMatch[1]} gigabytes`;
    }

    return "128 gigabytes";
  };

  const pickColor = (product) => {
    const parts = (product.subtitle || "").split("-");
    const color = parts[parts.length - 1]?.trim();
    return color || "Black";
  };

  const hashCode = (value) => {
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = (hash << 5) - hash + value.charCodeAt(index);
      hash |= 0;
    }

    return Math.abs(hash);
  };

  const makeFallbackDetails = (product, index) => {
    const modelFamily = (product.modelFamily || "").toLowerCase();

    let screenSize = "6.6 inches";
    let processor = "Octa-core processor";
    let rearCamera = "50 megapixels";
    let ram = "8 gigabytes";
    let battery = "5000 mAh";
    let security = "Fingerprint sensor";

    if (modelFamily.includes("iphone")) {
      screenSize = "6.1 inches";
      processor = "A18 chip";
      rearCamera = "48 megapixels";
      ram = "8 gigabytes";
      battery = "3561 mAh";
      security = "Face ID";
    } else if (modelFamily.includes("galaxy-s26")) {
      screenSize = "6.9 inches";
      processor = "Snapdragon 8 Elite Gen 5 for Galaxy";
      rearCamera = "200 megapixels";
      ram = "12 gigabytes";
      battery = "5200 mAh";
      security = "Ultrasonic fingerprint sensor";
    } else if (modelFamily.includes("galaxy-a16")) {
      screenSize = "6.7 inches";
      processor = "Exynos 1330";
      rearCamera = "50 megapixels";
      ram = "4 gigabytes";
      battery = "5000 mAh";
      security = "Side fingerprint sensor";
    } else if (modelFamily.includes("moto")) {
      screenSize = "6.7 inches";
      processor = "Dimensity 7020 octa-core";
      rearCamera = "50 megapixels";
      ram = "8 gigabytes";
      battery = "5000 mAh";
      security = "Fingerprint reader";
    }

    const idHash = String(hashCode(product.id)).padStart(10, "0");
    const modelCode = `MD${idHash.slice(0, 6)}`;
    const sku = idHash.slice(1, 8);

    const recommendation = Math.max(82, Math.min(99, Math.round((Number(product.rating) || 4) * 20 + 2)));

    return {
      model: modelCode,
      sku,
      color: pickColor(product),
      specs: {
        "Screen Size": screenSize,
        "Carrier Compatibility": product.carriers.length
          ? product.carriers.map((carrier) => formatCarrier(carrier)).join(", ")
          : "Unlocked",
        "Built-in Storage": pickStorageGb(product),
        "Processor Model": processor,
        "Rear-Facing Camera": rearCamera,
        "Phone Memory (RAM)": ram,
        "Front-Facing Camera": "12 megapixels",
        "Operating System": product.os ? titleCase(product.os.replaceAll("-", " ")) : "Android",
        "Battery Capacity": battery,
        "Wireless Connectivity": "5G, Wi-Fi 6E, Bluetooth 5.3",
        Security: security,
        Weight: `${(0.39 + index * 0.02).toFixed(2)} pounds`,
      },
      recommendation,
      prosQuote: "\"Overall performance and value for the price are excellent.\"",
      prosTags: ["Overall Performance", "Camera Quality", "Battery Life"],
      consQuote: "\"A few users mention heat and charging speed concerns.\"",
      consTags: ["Heat Dissipation", "Charging Speed", "Software Updates"],
      customerImages: REVIEW_IMAGES.slice(index, index + 3),
      availability: {
        status: product.unlocked ? "Get it in 8 days" : "Get it today",
        pickup: product.unlocked
          ? "Order now for pickup on Mon, Apr 27 at North Anchorage"
          : "Ready in 1 hour at North Anchorage",
        shipping: product.unlocked ? "Unavailable in your area" : "Available in select markets",
      },
    };
  };

  const buildDetails = (product, index) => {
    const fallback = makeFallbackDetails(product, index);
    const override = DETAIL_OVERRIDES[product.id] || {};

    return {
      ...fallback,
      ...override,
      specs: {
        ...fallback.specs,
        ...(override.specs || {}),
      },
      prosTags: override.prosTags || fallback.prosTags,
      consTags: override.consTags || fallback.consTags,
      customerImages: override.customerImages || fallback.customerImages,
      availability: {
        ...fallback.availability,
        ...(override.availability || {}),
      },
    };
  };

  const setColumnCount = () => {
    const columnCount = Math.max(1, Math.min(4, compareProducts.length || 1));
    document.documentElement.style.setProperty("--compare-columns", String(columnCount));
  };

  const renderCompareCards = (hydratedProducts) => {
    compareProductsGrid.innerHTML = hydratedProducts
      .map((item, index) => {
        const swatchImages = (item.product.variants.length ? item.product.variants : [item.product.image])
          .filter(Boolean)
          .slice(0, 4);

        const swatchesMarkup = swatchImages.length
          ? swatchImages
              .map(
                (image, imageIndex) =>
                  `<button type="button" aria-label="${escapeHtml(item.product.name)} color option ${imageIndex + 1}"><img src="${escapeHtml(
                    image
                  )}" alt="${escapeHtml(item.product.name)} color option"></button>`
              )
              .join("")
          : '<button type="button" aria-label="Default color"><img src="assets/assets2/Mobile%20Phones.jpeg" alt="Default color option"></button>';

        const cardImage = item.product.image || "assets/assets2/Mobile%20Phones.jpeg";

        return `
          <article class="compare-product-card" data-compare-product="${escapeHtml(item.product.id)}">
            <div class="card-control-row">
              <span aria-hidden="true">↔</span>
              ${index === 1 ? '<span class="drag-hint">drag to move</span>' : "<span></span>"}
              <button class="remove-compare-button" type="button" data-remove-id="${escapeHtml(item.product.id)}" aria-label="Remove ${escapeHtml(
                item.product.name
              )}">×</button>
            </div>
            <div class="compare-art">
              <img src="${escapeHtml(cardImage)}" alt="${escapeHtml(item.product.name)}">
            </div>
            <a href="#" class="more-images-link">See more images</a>
            <h3 class="compare-name">${escapeHtml(item.product.name)}</h3>
            <p class="model-meta"><strong>Model:</strong> ${escapeHtml(item.details.model)}</p>
            <p class="model-meta"><strong>SKU:</strong> ${escapeHtml(item.details.sku)}</p>
            <p class="rating-line">${buildStars(item.product.rating)}<span>(${Number(item.product.reviews || 0).toLocaleString()})</span></p>
            <p class="deal-line">Ultimate Deal</p>
            <p class="price-line">${formatPrice(item.product.price)}</p>
            <button type="button" class="details-button" data-add-cart-id="${escapeHtml(item.product.id)}">Add to cart</button>
            <button type="button" class="favorite-button" aria-label="Save ${escapeHtml(item.product.name)}">♡</button>
            <p class="color-line"><strong>Color:</strong> ${escapeHtml(item.details.color)}</p>
            <div class="color-swatches">${swatchesMarkup}</div>
          </article>
        `;
      })
      .join("");

    compareProductsGrid.querySelectorAll("[data-remove-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const removeId = button.getAttribute("data-remove-id");
        if (!removeId) {
          return;
        }

        compareProducts = compareProducts.filter((product) => product.id !== removeId);
        saveCompareState();
        renderPage();
      });
    });

    compareProductsGrid.querySelectorAll("[data-add-cart-id]").forEach((button) => {
      button.addEventListener("click", () => {
        const productId = button.getAttribute("data-add-cart-id");
        if (!productId || !shopState?.addItemToCart) {
          return;
        }

        const product = hydratedProducts.find((item) => item.product.id === productId)?.product;
        if (!product) {
          return;
        }

        shopState.addItemToCart(
          {
            id: product.id,
            name: product.name,
            subtitle: product.subtitle,
            price: product.price,
            image: product.image,
            brand: product.brand,
            tag: "Compared product",
          },
          1
        );

        showAddedFeedback(button);
      });
    });
  };

  const renderSpecs = (hydratedProducts) => {
    const rowKeys = showExtraSpecs ? [...BASE_SPEC_ROWS, ...EXTRA_SPEC_ROWS] : BASE_SPEC_ROWS;

    specRows.innerHTML = rowKeys
      .map((rowKey) => {
        const values = hydratedProducts.map((item) => item.details.specs[rowKey] || "-");
        const distinct = new Set(values.map((value) => String(value).trim().toLowerCase()));
        const rowClass = distinct.size > 1 ? "spec-row is-different" : "spec-row";

        return `
          <div class="${rowClass}">
            <div class="spec-name">${escapeHtml(rowKey)}</div>
            <div class="spec-values">
              ${values
                .map((value) => `<div class="spec-value">${escapeHtml(value)}</div>`)
                .join("")}
            </div>
          </div>
        `;
      })
      .join("");

    toggleMoreSpecsButton.textContent = showExtraSpecs ? "Show Fewer Specs" : "Show More Specs";
  };

  const renderRatings = (hydratedProducts) => {
    ratingsGrid.innerHTML = hydratedProducts
      .map((item) => {
        const reviewCount = Number(item.product.reviews || 0).toLocaleString();

        return `
          <article class="metric-column">
            <p class="rating-score"><strong>${buildStars(item.product.rating)}</strong> ${Number(item.product.rating || 0).toFixed(1)} (${reviewCount} Reviews)</p>
            <p class="rating-note"><strong>${item.details.recommendation}%</strong> would recommend to a friend</p>
          </article>
        `;
      })
      .join("");
  };

  const renderCustomerImages = (hydratedProducts) => {
    imagesGrid.innerHTML = hydratedProducts
      .map((item, index) => {
        const gallery = item.details.customerImages.length ? item.details.customerImages : REVIEW_IMAGES.slice(index, index + 3);

        return `
          <article class="metric-column">
            <div class="customer-images">
              <div class="customer-image"><img src="${escapeHtml(gallery[0] || REVIEW_IMAGES[0])}" alt="${escapeHtml(
                item.product.name
              )} customer image"></div>
              <div class="customer-image"><img src="${escapeHtml(gallery[1] || REVIEW_IMAGES[1])}" alt="${escapeHtml(
                item.product.name
              )} customer image"></div>
              <div class="customer-image more"><img src="${escapeHtml(gallery[2] || REVIEW_IMAGES[2])}" alt="${escapeHtml(
                item.product.name
              )} customer image"><span>+${17 + index * 7} images</span></div>
            </div>
          </article>
        `;
      })
      .join("");
  };

  const renderPros = (hydratedProducts) => {
    prosGrid.innerHTML = hydratedProducts
      .map((item) => {
        const tags = item.details.prosTags
          .map((tag, index) => `<p class="tag-line"><strong>${escapeHtml(tag)}</strong> (${56 + index * 20} Mentions)</p>`)
          .join("");

        return `
          <article class="metric-column">
            <p class="quote-box">${escapeHtml(item.details.prosQuote)}</p>
            ${tags}
          </article>
        `;
      })
      .join("");
  };

  const renderCons = (hydratedProducts) => {
    consGrid.innerHTML = hydratedProducts
      .map((item) => {
        if (!item.details.consTags.length) {
          return `
            <article class="metric-column">
              <p class="empty-cons">${escapeHtml(item.details.consQuote)}</p>
            </article>
          `;
        }

        const tags = item.details.consTags
          .map((tag, index) => `<p class="tag-line"><strong>${escapeHtml(tag)}</strong> (${3 + index * 7} Mentions)</p>`)
          .join("");

        return `
          <article class="metric-column">
            <p class="quote-box">${escapeHtml(item.details.consQuote)}</p>
            ${tags}
          </article>
        `;
      })
      .join("");
  };

  const renderAvailability = (hydratedProducts) => {
    availabilityGrid.innerHTML = hydratedProducts
      .map((item) => `
        <article class="metric-column">
          <p class="availability-status">${escapeHtml(item.details.availability.status)}</p>
          <p class="availability-line"><strong>Pickup:</strong> ${escapeHtml(item.details.availability.pickup)}</p>
          <p class="availability-line"><strong>Shipping:</strong> ${escapeHtml(item.details.availability.shipping)}</p>
          <p class="availability-link">See all pickup locations</p>
        </article>
      `)
      .join("");
  };

  const renderPage = () => {
    setColumnCount();

    if (compareProducts.length < 2) {
      comparePageEmptyState.classList.remove("is-hidden");
      compareContent.classList.add("is-hidden");
      syncCompactCompareState();
      return;
    }

    comparePageEmptyState.classList.add("is-hidden");
    compareContent.classList.remove("is-hidden");

    const hydratedProducts = compareProducts.map((product, index) => ({
      product,
      details: buildDetails(product, index),
    }));

    renderCompareCards(hydratedProducts);
    renderSpecs(hydratedProducts);
    renderRatings(hydratedProducts);
    renderCustomerImages(hydratedProducts);
    renderPros(hydratedProducts);
    renderCons(hydratedProducts);
    renderAvailability(hydratedProducts);
    syncCompactCompareState();
  };

  const setupCompactCompareStrip = () => {
    const updateCompactState = () => {
      syncHeaderOffset();

      if (!compactBreakpoint.matches || compareProducts.length < 2) {
        document.body.classList.remove("compact-compare");
        return;
      }

      const shouldCompact = window.scrollY > 330;
      document.body.classList.toggle("compact-compare", shouldCompact);
    };

    syncCompactCompareState = updateCompactState;
    syncHeaderOffset();
    updateCompactState();

    window.addEventListener("scroll", updateCompactState, { passive: true });
    window.addEventListener("resize", () => {
      syncHeaderOffset();
      applyZoomProfile();
      updateCompactState();
    });
    compactBreakpoint.addEventListener("change", updateCompactState);
  };

  const setupSectionToggles = () => {
    document.querySelectorAll("[data-toggle-section]").forEach((button) => {
      button.addEventListener("click", () => {
        const panelId = button.getAttribute("data-toggle-section");
        const panel = panelId ? document.getElementById(panelId) : null;
        if (!panel) {
          return;
        }

        const expanded = button.getAttribute("aria-expanded") === "true";
        button.setAttribute("aria-expanded", String(!expanded));
        panel.classList.toggle("is-hidden", expanded);
      });
    });
  };

  const setupInteractions = () => {
    highlightDifferences?.addEventListener("change", () => {
      document.body.classList.toggle("highlight-differences", highlightDifferences.checked);
    });

    toggleMoreSpecsButton?.addEventListener("click", () => {
      showExtraSpecs = !showExtraSpecs;
      renderPage();
    });

    printCompareButton?.addEventListener("click", () => {
      window.print();
    });
  };

  setupCompactCompareStrip();
  applyZoomProfile();
  setupSectionToggles();
  setupInteractions();
  renderPage();
})();
