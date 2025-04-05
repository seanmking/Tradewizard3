# UI Components

This directory contains reusable UI components used throughout the TradeWizard application.

## InfoBox

A styled information box component for displaying helpful content to users.

### Usage

```tsx
import { InfoBox } from '@/components/ui/InfoBox';

function MyComponent() {
  return (
    <InfoBox 
      title="Important Information" 
      tooltipText="This explains why this information matters"
    >
      <Typography variant="body1">
        Here is some important information for the user.
      </Typography>
      
      <ul>
        <li>List item one</li>
        <li>List item two</li>
      </ul>
    </InfoBox>
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | string | "Why this matters" | The title of the info box |
| `tooltipText` | string | undefined | Optional tooltip text shown on hover |
| `children` | ReactNode | required | Content to display within the info box |
| `bgColor` | string | "#f0f9ff" | Background color |
| `borderColor` | string | "#bae6fd" | Border color |
| `textColor` | string | "#0369a1" | Text color |

### Notes

- The component properly handles nested content, allowing any valid HTML elements inside.
- The content is displayed within a `Box` component rather than a Typography component to avoid HTML nesting issues.

## MockDataBanner

A notification banner that alerts users when the application is using mock data instead of real API data.

### Usage

```tsx
import { MockDataBanner } from '@/components/ui/MockDataBanner';
import { useMockData } from '@/contexts/mock-data-context';

function MyComponent() {
  const { isMockDataActive, mockDataDetails } = useMockData();
  
  return (
    <div>
      {isMockDataActive && (
        <MockDataBanner 
          message="Using simulated data for development purposes"
        />
      )}
      
      {/* Rest of component */}
    </div>
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isVisible` | boolean | true | Controls whether the banner is visible |
| `message` | string | "Using simulated HS code data for development. Real API keys not configured." | The message to display in the banner |

### Features

- Dismissible by the user (state is maintained during the session)
- Sticky position to ensure visibility
- Warning color scheme for clear visual distinction
- Handles visibility changes via props

## Integration with Mock Data Context

The `MockDataBanner` component works best with the `MockDataContext` which provides application-wide tracking of mock data usage.

### Context Provider Setup

```tsx
// In your application's provider hierarchy
import { MockDataProvider } from '@/contexts/mock-data-context';

function AppProviders({ children }) {
  return (
    <MockDataProvider>
      {/* Other providers */}
      {children}
    </MockDataProvider>
  );
}
```

### Using the Context

```tsx
import { useMockData } from '@/contexts/mock-data-context';

function MyComponent() {
  const { 
    isMockDataActive,       // Boolean indicating if any mock data is active
    mockDataDetails,        // Object with details about which services use mock data
    updateMockDataDetails   // Function to update mock data state
  } = useMockData();
  
  // Example: Check specific mock data usage
  const isUsingMockHsCode = mockDataDetails.hsCode;
  
  return (
    <div>
      {isUsingMockHsCode && (
        <p>Note: Using simulated HS code data</p>
      )}
    </div>
  );
}
``` 