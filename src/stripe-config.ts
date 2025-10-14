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
    priceId: 'price_1SALDtHb6LdHADWYY5NBNKj5l',
    name: 'Beast Mode',
    description: 'Unlimited access for enterprise teams',
    mode: 'subscription',
    price: 699.00,
    paymentLink: 'https://buy.stripe.com/test_14AaEX40m0PhgjL1jz9R605' // Beast Mode
  },
  {
    id: 'prod_SgO9Ov8KJgqfXd',
    priceId: 'price_1SALDYHb6LdHADWYwZ8almdN',
    name: 'Super Recruiter',
    description: 'Advanced features for scaling businesses',
    mode: 'subscription',
    price: 99.00,
    paymentLink: 'https://buy.stripe.com/test_6oU7sLgN89lNaZr8M19R604' // Super Recruiter (Pro)
  },
  {
    id: 'prod_SgO9o092ze8mBs',
    priceId: 'price_1SALD5Hb6LdHADWYbyDzUv7a',
    name: 'Average Recruiter',
    description: 'Perfect for getting started',
    mode: 'subscription',
    price: 29.00,
    paymentLink: 'https://buy.stripe.com/test_00w14neF09lNgjLd2h9R603' // Average Recruiter (Starter)
  }
];

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.priceId === priceId);
};

export const getProductById = (id: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.id === id);
};