import type { HeroContent } from "./hero-content";
import type { HomepageActionContent } from "./homepage-action-content";
import type { HomeValuationContent } from "./home-valuation-content";
import { PAGE_ICON_OPTIONS, type ServicePageContent } from "./page-content";
import { validateEmail, validateText } from "./validation";

function isHttpUrl(value: string) {
  if (!/^https?:\/\//i.test(value) || /[\s\\\u0000-\u001f\u007f]/u.test(value)) return false;
  try {
    const url = new URL(value);
    return Boolean(url.hostname);
  } catch {
    return false;
  }
}

export function validateImagePath(value: string, label = "Image") {
  const error = validateText(value, label, { required: true, max: 2048 });
  if (error) return error;
  const path = value.trim();
  const local = /^\/(?!\/).+/.test(path) && !/[\s\\\u0000-\u001f\u007f]/u.test(path);
  const uploaded = /^(?:\/?uploads\/)?page_content_[a-z0-9_-]+\.(?:jpe?g|png|webp|gif)$/i.test(path);
  return local || uploaded || isHttpUrl(path)
    ? ""
    : `${label} must be an http(s) URL or a site-relative image path.`;
}

export function validateSitePath(value: string, label = "Link", max = 255) {
  const error = validateText(value, label, { required: true, max });
  if (error) return error;
  return /^\/(?!\/)[A-Za-z0-9/_?=&%.-]*$/.test(value.trim())
    ? ""
    : `${label} must be a site path beginning with /, such as /contact.`;
}

export function validatePageLink(value: string, label = "Link") {
  const error = validateText(value, label, { required: true, max: 2048 });
  if (error) return error;
  const link = value.trim();
  return link === "#" || !validateSitePath(link, label, 2048) || isHttpUrl(link)
    ? ""
    : `${label} must be #, a site path, or a valid http(s) URL.`;
}

export function validateOptionList(value: string, label: string, maxItems: number, maxLength: number) {
  const items = value.replace(/\r/g, "").split("\n").map((item) => item.trim());
  if (items.some((item) => !item)) return `${label} cannot contain blank lines.`;
  if (items.length > maxItems) return `${label} must contain between 1 and ${maxItems} options.`;
  if (items.some((item) => item.length > maxLength)) {
    return `Each ${label.toLowerCase()} option must be ${maxLength} characters or fewer.`;
  }
  if (new Set(items.map((item) => item.toLowerCase())).size !== items.length) {
    return `${label} cannot contain duplicate options.`;
  }
  return "";
}

export function validateImageUpload(file: Pick<File, "size" | "type" | "name">) {
  if (
    !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type) ||
    !/\.(?:jpe?g|png|webp|gif)$/i.test(file.name)
  ) return "Choose a JPG, PNG, WebP, or GIF image.";
  if (file.size === 0) return "Choose an image that is not empty.";
  return file.size > 4 * 1024 * 1024 ? "Images must be 4 MB or smaller." : "";
}

export function validateRecipientEmail(value: string, recipients: string[], index: number) {
  const error = validateEmail(value);
  if (error) return error;
  const normalized = value.trim().toLowerCase();
  return recipients.some((email, otherIndex) =>
    otherIndex !== index && email.trim().toLowerCase() === normalized,
  ) ? "This email address is already in this recipient list." : "";
}

type FieldValidation = {
  values: Record<string, string>;
  validators: Record<string, (value: string) => string>;
};

function createFields() {
  const validation: FieldValidation = { values: {}, validators: {} };
  function add(key: string, value: string, label: string, max: number) {
    validation.values[key] = value;
    validation.validators[key] = (input) => validateText(input, label, { required: true, max });
  }
  function image(key: string, value: string, label: string) {
    validation.values[key] = value;
    validation.validators[key] = (input) => validateImagePath(input, label);
  }
  return { validation, add, image };
}

export function serviceContentValidation(content: ServicePageContent) {
  const { validation, add, image } = createFields();
  add("eyebrow", content.eyebrow, "Sidebar heading", 80);
  add("contactTitle", content.contactTitle, "Contact card title", 150);
  add("contactText", content.contactText, "Contact card text", 500);
  add("contactButtonLabel", content.contactButtonLabel, "Contact button label", 80);
  add("contactButtonHref", content.contactButtonHref, "Contact button link", 255);
  validation.validators.contactButtonHref = (value) => validateSitePath(value, "Contact button link");
  for (const step of content.steps) {
    const prefix = `step.${step.id}`;
    add(`${prefix}.navLabel`, step.navLabel, "Navigation label", 80);
    add(`${prefix}.stepLabel`, step.stepLabel, "Progress label", 80);
    add(`${prefix}.title`, step.title, "Step title", 180);
    add(`${prefix}.body`, step.body, "Body content", 30000);
    image(`${prefix}.image`, step.image, "Step image");
    validation.values[`${prefix}.icon`] = step.icon;
    validation.validators[`${prefix}.icon`] = (value) =>
      PAGE_ICON_OPTIONS.some((option) => option.value === value) ? "" : "Choose a valid sidebar icon.";
  }
  return validation;
}

export function heroContentValidation(content: HeroContent) {
  const { validation, add, image } = createFields();
  content.slides.forEach((slide, index) => {
    image(`slide.${index}.image`, slide.image, "Image");
    add(`slide.${index}.alt`, slide.alt, "Image description", 250);
    add(`slide.${index}.location`, slide.location, "Location label", 120);
  });
  return validation;
}

export function homepageCardsValidation(content: HomepageActionContent) {
  const { validation, image } = createFields();
  content.cards.forEach((card) => image(`card.${card.id}.image`, card.image, "Card image"));
  return validation;
}

export function homeValuationContentValidation(content: HomeValuationContent) {
  const { validation, add, image } = createFields();
  const fields = [
    ["title", "Page title", 180],
    ["imageAlt", "Image description", 250],
    ["addressPlaceholder", "Address placeholder", 100],
    ["zipPlaceholder", "ZIP placeholder", 100],
    ["propertyTypeLabel", "Property type label", 100],
    ["propertyTypePlaceholder", "Property type placeholder", 120],
    ["bedroomsLabel", "Bedrooms label", 100],
    ["bathroomsLabel", "Bathrooms label", 100],
    ["namePlaceholder", "Name placeholder", 100],
    ["emailPlaceholder", "Email placeholder", 100],
    ["phonePlaceholder", "Phone placeholder", 100],
    ["submitButtonLabel", "Submit button label", 100],
    ["successTitle", "Success title", 180],
    ["privacyPolicyLabel", "Privacy policy label", 100],
    ["privacyPolicyHref", "Privacy policy link", 2048],
    ["consentText", "Consent text", 3000],
    ["privacyText", "Privacy note", 3000],
    ["footerDisclosure", "Footer disclosure", 3000],
    ["successText", "Success message", 1000],
  ] as const;
  for (const [key, label, max] of fields) add(key, content[key], label, max);
  image("image", content.image, "Page image");
  validation.validators.privacyPolicyHref = (value) => validatePageLink(value, "Privacy policy link");
  validation.values.propertyTypes = content.propertyTypes.join("\n");
  validation.validators.propertyTypes = (value) => validateOptionList(value, "Property types", 20, 100);
  validation.values.roomOptions = content.roomOptions.join("\n");
  validation.validators.roomOptions = (value) => validateOptionList(value, "Room options", 10, 20);
  return validation;
}
