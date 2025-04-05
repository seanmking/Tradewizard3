# HS Code Classification Components

This directory contains components for the enhanced HS Code classification system in TradeWizard 3.0.

## Components

### EnhancedHSCodeClassification

The main classification component that offers both guided selection and smart search for HS codes.

```tsx
<EnhancedHSCodeClassification
  productName="Wireless Bluetooth Headphones"
  productDescription="Over-ear noise cancelling wireless headphones with Bluetooth 5.0"
  onClassificationComplete={(hsCode, confidence) => console.log(hsCode, confidence)}
/>
```

Props:
- `productName`: Name of the product to classify
- `productDescription`: Description of the product for AI-powered classification
- `onClassificationComplete`: Callback function that receives the selected HS code and confidence score

### ConfidenceIndicator

A visual indicator for confidence scores.

```tsx
<ConfidenceIndicator 
  score={85}
  size="md"
  showLabel={true}
  showIcon={true}
  showTooltip={true}
/>
```

Props:
- `score`: Confidence score (0-100)
- `size`: Size of the indicator ('sm', 'md', 'lg')
- `showLabel`: Whether to show the confidence level label
- `showIcon`: Whether to show the confidence icon
- `showTooltip`: Whether to show the tooltip with additional information

### ProductExamples

Displays product examples for a selected HS code.

```tsx
<ProductExamples
  examples={examples}
  title="Heading Examples"
  initiallyExpanded={false}
  maxDisplay={5}
/>
```

Props:
- `examples`: Array of ProductExample objects
- `title`: Title for the examples section
- `initiallyExpanded`: Whether the examples are expanded by default
- `maxDisplay`: Maximum number of examples to display

### ClassificationDemo

A demonstration component that shows how to use the EnhancedHSCodeClassification component.

```tsx
<ClassificationDemo />
```

## Integration

To use these components:

1. Import them from the components/classification directory:
```tsx
import { 
  EnhancedHSCodeClassification, 
  ConfidenceIndicator, 
  ProductExamples 
} from '@/components/classification';
```

2. Implement the onClassificationComplete callback to handle the classification result:
```tsx
const handleClassificationComplete = (hsCode: string, confidence: number) => {
  // Store the classification result
  // Update UI
  // Navigate to next step
};
```

3. Add the component to your page:
```tsx
<EnhancedHSCodeClassification
  productName={product.name}
  productDescription={product.description}
  onClassificationComplete={handleClassificationComplete}
/>
``` 