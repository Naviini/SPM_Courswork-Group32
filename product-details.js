(() => {
  const parseNumber = (value, fallback = 0) => {
    const cleaned = String(value || "").replace(/[^\d.]/g, "");
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const formatPrice = (value) => `$${value.toFixed(2)}`;

  const toTitleCase = (value) =>
    String(value || "")
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");

  const params = new URLSearchParams(window.location.search);

  const defaultProduct = {
    name: "Samsung - Galaxy S26 Ultra 256GB (Unlocked) - Black",
    subtitle: "Unlocked - Black",
    price: 1299.99,
    rating: 4.9,
    reviews: 157,
    brand: "Samsung",
    image: "assets/Samsung/THUMB_007-galaxy-s26ultra-cobaltviolet-back-right-30-spen.jpg",
    tag: "Trade-in offer",
  };

  const product = {
    name: params.get("name") || defaultProduct.name,
    subtitle: params.get("subtitle") || defaultProduct.subtitle,
    price: parseNumber(params.get("price"), defaultProduct.price),
    rating: parseNumber(params.get("rating"), defaultProduct.rating),
    reviews: Math.max(0, Math.round(parseNumber(params.get("reviews"), defaultProduct.reviews))),
    brand: params.get("brand") || defaultProduct.brand,
    image: params.get("image") || defaultProduct.image,
    tag: params.get("tag") || defaultProduct.tag,
  };

  const normalizedBrand = product.brand || product.name.split("-")[0] || defaultProduct.brand;
  const titleText = product.name;
  const breadcrumbTitle = `${toTitleCase(normalizedBrand)} Galaxy Series`;
  const modelCode = `Model: NX-${Math.round(product.price * 10)}-${product.reviews}`;
  const skuCode = `SKU: ${6600000 + (product.reviews % 10000)}`;

  const detailTitle = document.getElementById("detailTitle");
  const detailBreadcrumbTitle = document.getElementById("detailBreadcrumbTitle");
  const detailBrand = document.getElementById("detailBrand");
  const detailTag = document.getElementById("detailTag");
  const detailModelLine = document.getElementById("detailModelLine");
  const detailPrice = document.getElementById("detailPrice");
  const detailPriceOptionOne = document.getElementById("detailPriceOptionOne");
  const detailPriceOptionTwo = document.getElementById("detailPriceOptionTwo");
  const detailCompareValue = document.getElementById("detailCompareValue");
  const detailMonthlyPrice = document.getElementById("detailMonthlyPrice");
  const detailRatingValue = document.getElementById("detailRatingValue");
  const detailReviewCount = document.getElementById("detailReviewCount");
  const detailStars = document.getElementById("detailStars");
  const detailMainImage = document.getElementById("detailMainImage");
  const detailStickyImage = document.getElementById("detailStickyImage");
  const detailStickyTitle = document.getElementById("detailStickyTitle");
  const detailStickyPrice = document.getElementById("detailStickyPrice");
  const detailStickyRating = document.getElementById("detailStickyRating");
  const detailStickyReviews = document.getElementById("detailStickyReviews");
  const detailStickyStars = document.getElementById("detailStickyStars");
  const detailSummaryRating = document.getElementById("detailSummaryRating");
  const detailSummaryReviews = document.getElementById("detailSummaryReviews");
  const detailAiSummary = document.getElementById("detailAiSummary");

  if (detailTitle) {
    detailTitle.textContent = titleText;
  }

  if (detailBreadcrumbTitle) {
    detailBreadcrumbTitle.textContent = breadcrumbTitle;
  }

  if (detailBrand) {
    detailBrand.textContent = toTitleCase(normalizedBrand);
  }

  if (detailTag) {
    detailTag.textContent = product.tag;
  }

  if (detailModelLine) {
    detailModelLine.textContent = `${modelCode} · ${skuCode}`;
  }

  if (detailPrice) {
    detailPrice.textContent = formatPrice(product.price);
  }

  if (detailPriceOptionOne) {
    detailPriceOptionOne.textContent = formatPrice(product.price);
  }

  if (detailPriceOptionTwo) {
    detailPriceOptionTwo.textContent = formatPrice(Math.max(0, product.price - 100));
  }

  if (detailCompareValue) {
    detailCompareValue.textContent = `Comp. value: ${formatPrice(product.price + 100)}`;
  }

  if (detailMonthlyPrice) {
    detailMonthlyPrice.textContent = `${formatPrice(product.price / 24)}/mo.`;
  }

  if (detailRatingValue) {
    detailRatingValue.textContent = product.rating.toFixed(1);
  }

  if (detailReviewCount) {
    detailReviewCount.textContent = `(${product.reviews} reviews)`;
  }

  const roundedStars = Math.max(0, Math.min(5, Math.round(product.rating)));
  const starText = `${"★".repeat(roundedStars)}${"☆".repeat(5 - roundedStars)}`;

  if (detailStars) {
    detailStars.textContent = starText;
  }

  if (detailStickyStars) {
    detailStickyStars.textContent = starText;
  }

  if (detailSummaryRating) {
    detailSummaryRating.textContent = product.rating.toFixed(1);
  }

  if (detailSummaryReviews) {
    detailSummaryReviews.textContent = `${product.reviews} reviews`;
  }

  if (detailStickyTitle) {
    detailStickyTitle.textContent = titleText;
  }

  if (detailStickyPrice) {
    detailStickyPrice.textContent = formatPrice(product.price);
  }

  if (detailStickyRating) {
    detailStickyRating.textContent = product.rating.toFixed(1);
  }

  if (detailStickyReviews) {
    detailStickyReviews.textContent = `(${product.reviews} reviews)`;
  }

  if (detailAiSummary) {
    detailAiSummary.textContent = `${toTitleCase(normalizedBrand)} users describe this model as reliable and refined, with strong daily performance and camera results that stay consistent in low light and daylight.`;
  }

  const applyImageToTargets = (imageUrl) => {
    if (!imageUrl) {
      return;
    }

    if (detailMainImage) {
      detailMainImage.src = imageUrl;
      detailMainImage.alt = titleText;
    }

    if (detailStickyImage) {
      detailStickyImage.src = imageUrl;
      detailStickyImage.alt = titleText;
    }
  };

  applyImageToTargets(product.image);

  document.title = `${titleText} | Nexium`;

  const updateActiveInGroup = (groupRoot, clickedButton) => {
    if (!groupRoot || !clickedButton) {
      return;
    }

    groupRoot.querySelectorAll(".is-active").forEach((item) => {
      item.classList.remove("is-active");
    });

    clickedButton.classList.add("is-active");
  };

  const setupButtonSelectionGroup = (groupId) => {
    const groupRoot = document.getElementById(groupId);
    if (!groupRoot) {
      return;
    }

    groupRoot.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        updateActiveInGroup(groupRoot, button);
      });
    });
  };

  ["carrierOptions", "storageOptions", "pricingOptions", "protectionPlans", "availabilityOptions", "specTabs"].forEach(
    setupButtonSelectionGroup
  );

  const thumbnailColumn = document.getElementById("detailThumbnailColumn");
  if (thumbnailColumn) {
    thumbnailColumn.querySelectorAll(".detail-thumb[data-gallery-image]").forEach((thumbButton) => {
      thumbButton.addEventListener("click", () => {
        const nextImage = thumbButton.dataset.galleryImage;
        updateActiveInGroup(thumbnailColumn, thumbButton);
        applyImageToTargets(nextImage);
      });
    });
  }

  const colorSwatches = document.getElementById("colorSwatches");
  if (colorSwatches) {
    colorSwatches.querySelectorAll(".color-swatch[data-gallery-image]").forEach((swatchButton) => {
      swatchButton.addEventListener("click", () => {
        const nextImage = swatchButton.dataset.galleryImage;
        updateActiveInGroup(colorSwatches, swatchButton);
        applyImageToTargets(nextImage);
      });
    });
  }
})();
