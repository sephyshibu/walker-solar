/* ------------------------------------------------------------------ */
/*  Shared policy content — edit the text below freely.                */
/*  Used by both the footer links and the policy pages.                */
/*  Suggested location: src/data/policies.ts                           */
/* ------------------------------------------------------------------ */

export type PolicyKey = 'shipping' | 'returns' | 'terms' | 'privacy';

export interface PolicySection {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface Policy {
  key: PolicyKey;
  title: string;
  path: string;
  sections: PolicySection[];
}

export const POLICY_LAST_UPDATED = 'July 2026';
export const CONTACT_PHONE = '+91 62380 93603';
export const CONTACT_EMAIL = 'walkersgroup@gmail.com';

export const POLICIES: Record<PolicyKey, Policy> = {
  shipping: {
    key: 'shipping',
    title: 'Shipping Policy',
    path: '/shipping',
    sections: [
      {
        heading: 'Order Processing',
        paragraphs: [
          'Orders are processed within 1–2 business days after payment confirmation. Orders placed on weekends or public holidays are processed on the next business day.',
        ],
      },
      {
        heading: 'Delivery Timelines',
        paragraphs: [
          'Once dispatched, delivery typically takes 3–7 business days depending on your location. Remote or non-serviceable pin codes may take longer.',
        ],
      },
      {
        heading: 'Shipping Charges',
        paragraphs: [
          'Shipping charges (if any) are calculated and shown at checkout based on the delivery address, weight, and dimensions of the products ordered.',
        ],
      },
      {
        heading: 'Tracking',
        paragraphs: [
          'Once your order ships, we share the courier name and AWB/tracking number so you can track the shipment from your Orders page.',
        ],
      },
      {
        heading: 'Delays',
        paragraphs: [
          'Delivery estimates are not guaranteed and may be affected by courier operations, weather, or events beyond our control. We are not liable for delays caused by the courier partner.',
        ],
      },
      {
        heading: 'Need Help?',
        paragraphs: [
          `For any shipping query, contact us at ${CONTACT_PHONE} or ${CONTACT_EMAIL}.`,
        ],
      },
    ],
  },

  returns: {
    key: 'returns',
    title: 'Return & Refund Policy',
    path: '/returns',
    sections: [
      {
        heading: 'Return Window',
        paragraphs: [
          'You may request a return within 7 days of delivery, provided the product is unused, in its original condition, and in the original packaging with all accessories, manuals, and tags.',
        ],
      },
      {
        heading: 'Non-Returnable Items',
        paragraphs: ['The following are not eligible for return:'],
        bullets: [
          'Products that have been installed, used, or physically altered',
          'Items damaged due to misuse, mishandling, or improper installation',
          'Custom or specially ordered items',
          'Products returned without original packaging or proof of purchase',
        ],
      },
      {
        heading: 'Damaged or Defective on Arrival',
        paragraphs: [
          'If a product arrives damaged or defective, notify us within 48 hours of delivery with photos of the item and packaging so we can arrange a replacement or refund.',
        ],
      },
      {
        heading: 'How to Request a Return',
        paragraphs: [
          `Contact us at ${CONTACT_EMAIL} or ${CONTACT_PHONE} with your order number and reason for return. Our team will guide you through the pickup or drop-off process.`,
        ],
      },
      {
        heading: 'Refunds',
        paragraphs: [
          'Once the returned item is received and inspected, approved refunds are processed to the original payment method within 5–7 business days. Shipping charges are non-refundable unless the return is due to our error.',
        ],
      },
    ],
  },

  terms: {
    key: 'terms',
    title: 'Terms & Conditions',
    path: '/terms',
    sections: [
      {
        heading: 'Acceptance of Terms',
        paragraphs: [
          'By accessing this website and placing an order, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use the site.',
        ],
      },
      {
        heading: 'Products & Pricing',
        paragraphs: [
          'All prices are listed in Indian Rupees (INR) and are inclusive or exclusive of GST as indicated at checkout. Prices, product descriptions, and availability may change without prior notice. We make every effort to display product details accurately but do not warrant that all information is error-free.',
        ],
      },
      {
        heading: 'Orders',
        paragraphs: [
          'Placing an order is an offer to purchase. We reserve the right to accept or decline any order, including for reasons such as stock unavailability, pricing errors, or suspected fraud.',
        ],
      },
      {
        heading: 'Payments',
        paragraphs: [
          'Payments must be completed through the payment options provided. Orders are processed only after payment is successfully confirmed.',
        ],
      },
      {
        heading: 'Warranty',
        paragraphs: [
          'Products are covered by the respective manufacturer’s warranty, where applicable. Warranty claims are subject to the manufacturer’s terms and conditions.',
        ],
      },
      {
        heading: 'Limitation of Liability',
        paragraphs: [
          'To the maximum extent permitted by law, we are not liable for any indirect, incidental, or consequential damages arising from the use of our products or website.',
        ],
      },
      {
        heading: 'Governing Law',
        paragraphs: [
          'These terms are governed by the laws of India, and any disputes are subject to the jurisdiction of the courts at our registered place of business.',
        ],
      },
      {
        heading: 'Contact',
        paragraphs: [`For questions about these terms, reach us at ${CONTACT_EMAIL}.`],
      },
    ],
  },

  privacy: {
    key: 'privacy',
    title: 'Privacy Policy',
    path: '/privacy',
    sections: [
      {
        heading: 'Information We Collect',
        paragraphs: [
          'We collect information you provide when creating an account or placing an order, including your name, email, phone number, and shipping address, along with order details.',
        ],
      },
      {
        heading: 'How We Use Your Information',
        paragraphs: ['Your information is used to:'],
        bullets: [
          'Process and deliver your orders',
          'Provide customer support and respond to enquiries',
          'Send order updates and important service communications',
          'Improve our products and website experience',
        ],
      },
      {
        heading: 'Sharing of Information',
        paragraphs: [
          'We share information only as needed to fulfil your order — for example, with courier partners for delivery and payment processors for transactions. We do not sell your personal data to third parties.',
        ],
      },
      {
        heading: 'Data Security',
        paragraphs: [
          'We take reasonable measures to protect your information. However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security.',
        ],
      },
      {
        heading: 'Your Rights',
        paragraphs: [
          `You may request access to, correction of, or deletion of your personal data by contacting us at ${CONTACT_EMAIL}.`,
        ],
      },
    ],
  },
};

// Order used for footer links and the "related policies" list
export const POLICY_ORDER: PolicyKey[] = ['shipping', 'returns', 'terms', 'privacy'];