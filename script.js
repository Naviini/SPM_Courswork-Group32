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
const MAX_STICKERS_PER_DESIGN = 6;
const MIN_STICKER_SIZE = 24;
const MAX_STICKER_SIZE = 56;
const MIN_CUSTOM_TEXT_SIZE = 22;
const MAX_CUSTOM_TEXT_SIZE = 54;
const DEFAULT_CUSTOM_TEXT_SIZE = 32;
const MAX_CUSTOM_ITEM_QUANTITY = 20;
let lastMeasuredHeaderHeight = 0;

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
  if (headerHeight === lastMeasuredHeaderHeight) {
    return;
  }

  lastMeasuredHeaderHeight = headerHeight;
  document.documentElement.style.setProperty("--side-menu-top", `${headerHeight}px`);
  document.documentElement.style.setProperty("--sticky-header-height", `${headerHeight}px`);
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
    { label: "Mobile Phones", href: "index.html#catalog" },
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
    { thumb: "thumb-mobile-phone-deals", label: "Mobile Phones" },
    { thumb: "thumb-mobile-phone-accessories-image", label: "Mobile Phone Accessories" },
    { thumb: "thumb-tablets-ereaders-image", label: "Tablets, E-Readers & Accessories" },
    { thumb: "thumb-refurbished-preowned-image", label: "Refurbished & Pre-owned Phones" },
    { thumb: "thumb-samsung-image", label: "Samsung" },
    { thumb: "thumb-apple-image", label: "Apple" },
    { thumb: "thumb-charger-case-image", label: "Charger, Case" },
    { thumb: "thumb-mobile-phones-image", label: "Mobile Phones Deals" },
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

        return `
          <article class="deals-category-item${isLastVisible ? " deals-category-item-last" : ""}">
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
  const totalValue = document.querySelector("[data-cart-total]");

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
  const totalAmount = Math.max(0, subtotalAmount - discountAmount);

  if (subtotalValue) {
    subtotalValue.textContent = formatUsdCurrency(subtotalAmount);
  }

  if (totalValue) {
    totalValue.textContent = formatUsdCurrency(totalAmount);
  }

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
attachCartCustomizationActions();
renderCustomizationOrdersInCart();
