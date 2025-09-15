export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
  price: number;
  paymentLink?: string; // Static Stripe Payment Link URL
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_SgO9JAsJtILfdq',
    priceId: 'price_1S7TPaHb6LdHADWYhMgRw3YY',
    name: 'Top Shelf',
    description: 'Premium tier with unlimited access and priority support',
    mode: 'subscription',
    price: 199.00,
    paymentLink: 'https://buy.stripe.com/test_4gMdR90OacxZ7Nf0fv9R602' // Tier Three
  },
  {
    id: 'prod_SgO9Ov8KJgqfXd',
    priceId: 'price_1S7TOGHb6LdHADWYAu8g3h3f',
    name: 'Premium',
    description: 'Enhanced features with professional support',
    mode: 'subscription',
    price: 49.00,
    paymentLink: 'https://buy.stripe.com/test_eVq14n1SegOf8Rj3rH9R601' // Tier Two
  },
  {
    id: 'prod_SgO9o092ze8mBs',
    priceId: 'price_1S7TO3Hb6LdHADWYvWMTutrj',
    name: 'Basic',
    description: 'Essential features to get you started',
    mode: 'subscription',
    price: 35.00,
    paymentLink: 'https://buy.stripe.com/test_fZu7sLaoK9lN1oRfap9R600' // Tier One
  }
];

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.priceId === priceId);
};

export const getProductById = (id: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.id === id);
};