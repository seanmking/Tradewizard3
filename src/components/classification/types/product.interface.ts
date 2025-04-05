import { HSCodeSelection } from './classification.interface';

export interface ProductVariant {
  id: string;
  name: string;
  description?: string;
  selected?: boolean;
}

export interface ProductGroup {
  id: string;
  name: string;
  description?: string;
  variants: ProductVariant[];
  isExpanded?: boolean;
  isSelected?: boolean;
  hsCodeSelection?: HSCodeSelection;
  classificationStep?: number;
}

export interface ClassifiedProduct extends ProductVariant {
  hsCode?: string;
  hsCodeDescription?: string;
} 