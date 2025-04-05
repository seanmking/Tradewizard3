import { ProductClassifier } from './ProductClassifier';

export { ProductClassifier };

export { default as HSCodeClassifier } from './HSCodeClassifier';
export { default as ClassificationSuccess } from './ClassificationSuccess';
export { default as HSCodeInfoPopover } from './HSCodeInfoPopover';
export { default as ProductCard } from './ProductCard';
export { default as ProductSelectionPage } from './ProductSelectionPage';
export { default as EditProductHSCodeIntegration } from './EditProductHSCodeIntegration';
export { default as ConfidenceIndicator } from './ConfidenceIndicator';
export { default as ProductExamples } from './ProductExamples';
export { default as EnhancedHSCodeClassification } from './EnhancedHSCodeClassification';
export { default as ProductClassificationPage } from './ProductClassificationPage';
export { default as ClassificationWizard } from './ClassificationWizard';
export { default as FocusAreaHSCodeSelector } from './FocusAreaHSCodeSelector';
export { default as ClassificationDemo } from './ClassificationDemo';

// Export types
export type { HSCodeChapter, HSCodeHeading, HSCodeSubheading, HSCodeSelection } from './types/classification.interface';
export { ClassificationStep } from './types/classification.interface';
export type { ProductGroup, ProductVariant, ClassifiedProduct } from './types/product.interface';