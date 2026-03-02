import type { Product } from '../data/products';
import type { ProductResponse, ProductType } from '../services';

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&h=800&fit=crop&auto=format&dpr=2';

const toNumber = (value?: string | number | null) => {
  if (value === undefined || value === null) return undefined;
  const parsed = typeof value === 'number' ? value : Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseDimensions = (raw?: string | null) => {
  if (!raw) return {};
  const matches = raw.match(/[\d.,]+/g);
  if (!matches) return {};
  const [length, width, height] = matches.slice(0, 3).map((value) => toNumber(value));
  return {
    length,
    width,
    height,
  };
};

const productTypeToDisplayType = (productType: ProductType): 'physical' | 'digital' => {
  if (productType === 'ebook') return 'digital';
  return 'physical';
};

export const mapProductResponseToProduct = (response: ProductResponse): Product => {
  const displayType = productTypeToDisplayType(response.product_type);
  const price = Number(response.price ?? 0);
  let originalPrice: number | undefined = response.original_price;

  if (!originalPrice && response.discount_percent) {
    const discountFactor = 1 - response.discount_percent / 100;
    if (discountFactor > 0) {
      originalPrice = Number((price / discountFactor).toFixed(2));
    }
  }

  const { length, width, height } = parseDimensions(response.dimensions);

  return {
    id: String(response.id),
    title: response.title,
    author: response.author ?? 'Autor desconhecido',
    price,
    originalPrice,
    category: response.category ?? response.product_type ?? 'Outros',
    type: displayType,
    description: response.description,
    image: response.image ?? response.image_url ?? response.cover_url ?? PLACEHOLDER_IMAGE,
    stock: response.stock ?? 0,
    pages: response.num_pages,
    isbn: response.isbn,
    tags: response.tags ?? [],
    featured: response.featured ?? false,
    weight: toNumber(response.weight),
    length,
    width,
    height,
    dimensions: response.dimensions ?? undefined,
    insuranceValue: response.price,
  };
};
