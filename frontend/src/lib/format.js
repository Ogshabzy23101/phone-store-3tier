const gbpFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
});

export function formatPrice(value) {
  return gbpFormatter.format(Number(value) || 0);
}

export function sentenceCaseCategory(category) {
  if (!category) {
    return "All";
  }

  return category.charAt(0).toUpperCase() + category.slice(1);
}
