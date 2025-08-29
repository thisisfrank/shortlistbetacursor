export interface StripeProduct {
  id: string;
  priceId: string;
  name: string;
  description: string;
  mode: 'payment' | 'subscription';
  price: number;
}

export const stripeProducts: StripeProduct[] = [
  {
    id: 'prod_SgO9JAsJtILfdq',
    priceId: 'price_1Rl1NJFPYYAarockbgLtNiKk',
    name: 'Top Shelf',
    description: 'Premium tier with unlimited access and priority support',
    mode: 'subscription',
    price: 199.00
  },
  {
    id: 'prod_SgO9Ov8KJgqfXd',
    priceId: 'price_1Rl1N5FPYYAarock0dFT7x9Q',
    name: 'Premium',
    description: 'Enhanced features with professional support',
    mode: 'subscription',
    price: 49.00
  },
  {
    id: 'prod_SgO9o092ze8mBs',
    priceId: 'price_1Rl1MuFPYYAarocke0oZgczA',
    name: 'Basic',
    description: 'Essential features to get you started',
    mode: 'subscription',
    price: 35.00
  }
];

export const getProductByPriceId = (priceId: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.priceId === priceId);
};

export const getProductById = (id: string): StripeProduct | undefined => {
  return stripeProducts.find(product => product.id === id);
};