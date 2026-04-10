import { getCategoryListingTemplate } from "../constants/productListing";
import { Product, ProductListingOption, ProductSpecification } from "../types";

const trimLine = (value: string) =>
  value
    .replace(/^[\s\-*•]+/, "")
    .replace(/\s+/g, " ")
    .trim();

const dedupeValues = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

export const parseMultilineList = (value: string) =>
  dedupeValues(
    value
      .split(/\r?\n/)
      .map(trimLine)
      .filter(Boolean)
  );

export const parseCommaList = (value: string) =>
  dedupeValues(
    value
      .split(",")
      .map(trimLine)
      .filter(Boolean)
  );

export const serializeMultilineList = (values?: string[]) => (values || []).join("\n");

export const optionGroupsToInputMap = (groups?: ProductListingOption[]) =>
  (groups || []).reduce<Record<string, string>>((accumulator, group) => {
    if (!group?.name) {
      return accumulator;
    }

    accumulator[group.name] = (group.values || []).join(", ");
    return accumulator;
  }, {});

export const specificationsToInputMap = (specifications?: ProductSpecification[]) =>
  (specifications || []).reduce<Record<string, string>>((accumulator, specification) => {
    if (!specification?.label) {
      return accumulator;
    }

    accumulator[specification.label] = specification.value || "";
    return accumulator;
  }, {});

export const buildOptionGroupsFromInputs = (values: Record<string, string>) =>
  Object.entries(values)
    .map(([name, rawValue]) => ({
      name: trimLine(name),
      values: parseCommaList(rawValue),
    }))
    .filter((group) => group.name && group.values.length > 0);

export const buildSpecificationsFromInputs = (values: Record<string, string>) =>
  Object.entries(values)
    .map(([label, rawValue]) => ({
      label: trimLine(label),
      value: trimLine(rawValue),
    }))
    .filter((specification) => specification.label && specification.value);

const splitDescriptionIntoHighlights = (description: string) =>
  dedupeValues(
    description
      .split(/\r?\n|[.!?]/)
      .map(trimLine)
      .filter(Boolean)
  );

export const getResolvedProductListing = (product: Product) => {
  const template = getCategoryListingTemplate(product.category);

  const highlights = dedupeValues([
    ...(product.highlights || []),
    ...splitDescriptionIntoHighlights(product.description).slice(0, 4),
    ...(product.discount > 0 ? [`Save ${product.discount}% compared with the listed price.`] : []),
    product.stock > 0
      ? `${product.stock} unit${product.stock === 1 ? "" : "s"} currently available.`
      : "Currently out of stock.",
  ]).slice(0, 6);

  const specifications =
    product.specifications && product.specifications.length > 0
      ? product.specifications
      : [
          ...(product.brand ? [{ label: "Brand", value: product.brand }] : []),
          { label: "Category", value: product.category },
          { label: "Seller", value: product.sellerName },
          {
            label: "Availability",
            value: product.stock > 0 ? `In stock (${product.stock})` : "Out of stock",
          },
        ];

  return {
    template,
    brand: product.brand?.trim() || product.sellerName,
    subtitle:
      product.subtitle?.trim() ||
      `${product.category} listing from ${product.sellerName}`,
    highlights,
    specifications,
    options: product.options || [],
    deliveryInfo:
      product.deliveryInfo && product.deliveryInfo.length > 0
        ? product.deliveryInfo
        : template.deliverySuggestions,
    returnPolicy: product.returnPolicy?.trim() || template.returnPolicyHint,
    warranty: product.warranty?.trim() || template.warrantyHint,
  };
};
