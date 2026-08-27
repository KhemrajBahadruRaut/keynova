export interface HomeValuationContent {
  image: string;
  imageAlt: string;
  title: string;
  addressPlaceholder: string;
  zipPlaceholder: string;
  propertyTypeLabel: string;
  propertyTypePlaceholder: string;
  propertyTypes: string[];
  bedroomsLabel: string;
  bathroomsLabel: string;
  roomOptions: string[];
  namePlaceholder: string;
  emailPlaceholder: string;
  phonePlaceholder: string;
  consentText: string;
  privacyText: string;
  submitButtonLabel: string;
  footerDisclosure: string;
  privacyPolicyLabel: string;
  privacyPolicyHref: string;
  successTitle: string;
  successText: string;
}

export const DEFAULT_HOME_VALUATION_CONTENT: HomeValuationContent = {
  image:
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1400&auto=format&fit=crop",
  imageAlt: "Person reviewing home valuation on a laptop",
  title: "Request a Home Valuation",
  addressPlaceholder: "Address *",
  zipPlaceholder: "Zip *",
  propertyTypeLabel: "Property type",
  propertyTypePlaceholder: "Choose One Property type",
  propertyTypes: [
    "Single Family Home",
    "Condo / Townhouse",
    "Multi-Family",
    "Land",
    "Commercial",
  ],
  bedroomsLabel: "Bedrooms",
  bathroomsLabel: "Bathrooms",
  roomOptions: ["1", "2", "3", ">3"],
  namePlaceholder: "Name *",
  emailPlaceholder: "Email *",
  phonePlaceholder: "Phone *",
  consentText:
    "By selecting this checkbox and entering your mobile number, you agree to receive marketing text messages and calls from Brendan Conley, including messages about real estate listings, property recommendations, and related services. Message and data rates may apply. Message frequency varies. Reply HELP for help or STOP to cancel.",
  privacyText:
    "Your personal information is strictly confidential and will not be shared with any outside organizations. By submitting this form with your telephone number you are consenting for Brendan Conley and authorized representatives to contact you even if your name is on the Federal “Do-not-call List.”",
  submitButtonLabel: "Submit Request",
  footerDisclosure:
    "I agree to be contacted by KeyNova Group via call, email, and text for real estate services. To opt out, you can reply ‘stop’ at any time or reply ‘help’ for assistance. You can also click the unsubscribe link in the emails. Message and data rates may apply. Message frequency may vary.",
  privacyPolicyLabel: "Privacy Policy",
  privacyPolicyHref: "#",
  successTitle: "Request received",
  successText:
    "Thank you. A KeyNova Group representative will contact you about your home valuation.",
};

export function cloneHomeValuationContent(): HomeValuationContent {
  return {
    ...DEFAULT_HOME_VALUATION_CONTENT,
    propertyTypes: [...DEFAULT_HOME_VALUATION_CONTENT.propertyTypes],
    roomOptions: [...DEFAULT_HOME_VALUATION_CONTENT.roomOptions],
  };
}
