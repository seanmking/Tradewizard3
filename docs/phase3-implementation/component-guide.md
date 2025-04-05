# HS Code Classification Components: Technical Guide

## Component Overview

The HS Code Classification system consists of four main React components that work together to provide a hierarchical selection experience for Harmonized System (HS) codes. This guide provides technical details on each component, their props, state management, and usage.

## HSCodeNavigator

`HSCodeNavigator` is the primary container component that orchestrates the navigation through the HS code hierarchy.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `initialHsCode` | `string` (optional) | Pre-selected HS code to initialize the component with |
| `productName` | `string` (optional) | Name of the product being classified |
| `productCategory` | `string` (optional) | Category of the product being classified |
| `onHsCodeSelected` | `(hsCode: string, description: string) => void` | Callback when a 6-digit subheading is selected |
| `suggestedCodes` | `Array<{code: string, description: string, confidence: number}>` (optional) | Pre-calculated suggestions with confidence scores |

### State Management

The component maintains several key state variables:

```typescript
// Current view state (which selector is visible)
const [view, setView] = useState<'chapter' | 'heading' | 'subheading'>('chapter');

// Selected codes at each level
const [selection, setSelection] = useState<HSCodeSelection>({
  chapter: { code: null, description: '' },
  heading: { code: null, description: '' },
  subheading: { code: null, description: '' }
});

// Filtered suggestions for each level
const [suggestedChapters, setSuggestedChapters] = useState<Array<{code: string, description: string, confidence?: number}>>([]);
const [suggestedHeadings, setSuggestedHeadings] = useState<Array<{code: string, description: string, confidence?: number}>>([]);
const [suggestedSubheadings, setSuggestedSubheadings] = useState<Array<{code: string, description: string, confidence?: number}>>([]);
```

### Key Methods

- `handleChapterSelected`: Updates selection state and navigates to heading view
- `handleHeadingSelected`: Updates selection state and navigates to subheading view
- `handleSubheadingSelected`: Updates selection state and triggers the `onHsCodeSelected` callback
- `handleBackToChapters` and `handleBackToHeadings`: Navigation between levels

### Usage Example

```jsx
<HSCodeNavigator
  productName="Corn Dogs"
  productCategory="Food Products"
  initialHsCode="160100"
  onHsCodeSelected={(code, description) => {
    console.log(`Selected HS code: ${code} - ${description}`);
    updateProduct({ hsCode: code, hsCodeDescription: description });
  }}
  suggestedCodes={[
    { code: "160100", description: "Sausages and similar products", confidence: 0.95 },
    { code: "190590", description: "Bread, pastry, cakes, biscuits", confidence: 0.75 }
  ]}
/>
```

## ChapterSelector

`ChapterSelector` handles the selection of 2-digit HS chapters, which represent broad product categories.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `selectedChapter` | `string` \| `null` | Currently selected chapter code |
| `onChapterSelected` | `(chapter: string, description: string) => void` | Callback when a chapter is selected |
| `suggestedChapters` | `Array<{code: string, description: string, confidence?: number}>` (optional) | Suggested chapters with confidence scores |
| `productCategory` | `string` (optional) | Product category to prioritize relevant chapters |

### State Management

```typescript
const [chapters, setChapters] = useState<Chapter[]>([]);
const [filteredChapters, setFilteredChapters] = useState<Chapter[]>([]);
const [searchQuery, setSearchQuery] = useState('');
const [recentlyUsed, setRecentlyUsed] = useState<string[]>([]);
const [loading, setLoading] = useState(false);
```

### Key Features

- Search functionality to filter chapters
- Recently used chapters are remembered for quick access
- Visual confidence indicators for suggested chapters
- Responsive grid layout for chapter selection

## HeadingSelector

`HeadingSelector` manages the selection of 4-digit HS headings, which are more specific product categories within a chapter.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `selectedHeading` | `string` \| `null` | Currently selected heading code |
| `selectedChapter` | `string` | The selected chapter code (parent of headings) |
| `chapterDescription` | `string` | Description of the selected chapter |
| `onHeadingSelected` | `(heading: string, description: string) => void` | Callback when a heading is selected |
| `onBack` | `() => void` | Callback to navigate back to chapter selection |
| `suggestedHeadings` | `Array<{code: string, description: string, confidence?: number}>` (optional) | Suggested headings with confidence scores |

### State Management

```typescript
const [headings, setHeadings] = useState<Heading[]>([]);
const [filteredHeadings, setFilteredHeadings] = useState<Heading[]>([]);
const [searchQuery, setSearchQuery] = useState('');
const [recentlyUsed, setRecentlyUsed] = useState<string[]>([]);
const [loading, setLoading] = useState(false);
```

### Key Features

- Breadcrumb navigation to show hierarchy
- Search functionality to filter headings
- Recently used headings are remembered (per chapter)
- Visual confidence indicators for suggested headings

## SubheadingSelector

`SubheadingSelector` enables selection of 6-digit HS subheadings, which represent specific product classifications.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `selectedSubheading` | `string` \| `null` | Currently selected subheading code |
| `selectedHeading` | `string` | The selected heading code (parent of subheadings) |
| `headingDescription` | `string` | Description of the selected heading |
| `selectedChapter` | `string` | The selected chapter code (grandparent of subheadings) |
| `chapterDescription` | `string` | Description of the selected chapter |
| `onSubheadingSelected` | `(subheading: string, description: string) => void` | Callback when a subheading is selected |
| `onBackToHeadings` | `() => void` | Callback to navigate back to heading selection |
| `onBackToChapters` | `() => void` | Callback to navigate back to chapter selection |
| `suggestedSubheadings` | `Array<{code: string, description: string, confidence?: number}>` (optional) | Suggested subheadings with confidence scores |

### State Management

```typescript
const [subheadings, setSubheadings] = useState<Subheading[]>([]);
const [filteredSubheadings, setFilteredSubheadings] = useState<Subheading[]>([]);
const [searchQuery, setSearchQuery] = useState('');
const [recentlyUsed, setRecentlyUsed] = useState<string[]>([]);
const [loading, setLoading] = useState(false);
const [selectedSubheadingDetails, setSelectedSubheadingDetails] = useState<Subheading | null>(null);
```

### Key Features

- Detailed view for selected subheading with notes and description
- Breadcrumb navigation through the full hierarchy
- Search functionality to filter subheadings
- Recently used subheadings are remembered (per heading)
- Clear confidence score indicators with percentage

## Styling

All components use MUI (Material UI) for styling with the following patterns:

1. **Responsive Grids**: Components adapt to different screen sizes using MUI Grid
2. **Typography Hierarchy**: Consistent use of MUI Typography with appropriate variants
3. **Color Coding**: Confidence scores use color indicators (success, warning, error)
4. **Interactive Elements**: Cards, chips, and buttons with hover and selection states
5. **Utility Styles**: MUI's `sx` prop for component-specific styling

### Style Example

```jsx
<Box sx={{ flexGrow: 1, mt: 1 }}>
  <Grid container spacing={2}>
    {filteredChapters.map((chapter) => (
      <Grid item xs={6} sm={4} md={3} key={chapter.code}>
        <Paper
          elevation={selectedChapter === chapter.code ? 3 : 1}
          sx={{
            p: 2,
            textAlign: 'center',
            cursor: 'pointer',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderColor: selectedChapter === chapter.code ? 'primary.main' : 'transparent',
            borderWidth: 2,
            borderStyle: 'solid',
            bgcolor: chapter.confidence && chapter.confidence >= 0.8 
              ? 'rgba(76, 175, 80, 0.1)' 
              : 'background.paper'
          }}
          onClick={() => handleChapterClick(chapter)}
        >
          {/* Component content */}
        </Paper>
      </Grid>
    ))}
  </Grid>
</Box>
```

## Integration with HSCodeHierarchyService

The components are designed to work with the `HSCodeHierarchyService`, which provides:

1. **HS Code Suggestions**: Based on product details
2. **Confidence Scoring**: For ranking suggestions
3. **Caching**: To improve performance
4. **Hierarchy Management**: To navigate between levels

### Service Connection

```typescript
// In a parent component:
const [suggestedCodes, setSuggestedCodes] = useState([]);

useEffect(() => {
  const fetchSuggestions = async () => {
    const hsCodeService = new HSCodeHierarchyService();
    
    try {
      const suggestions = await hsCodeService.getSuggestions({
        productName,
        productCategory,
        productDescription
      });
      
      setSuggestedCodes(suggestions);
    } catch (error) {
      console.error('Error fetching HS code suggestions:', error);
    }
  };
  
  fetchSuggestions();
}, [productName, productCategory, productDescription]);
```

## Best Practices

1. **Performance**: Load only necessary data at each level
2. **Accessibility**: Ensure keyboard navigation and proper ARIA attributes
3. **Error Handling**: Provide fallbacks when suggestions fail to load
4. **State Management**: Keep state localized to components when possible
5. **Prop Validation**: Use TypeScript for strong typing of props
6. **Consistent Styling**: Follow MUI design patterns throughout

## Known Issues and Workarounds

1. **Grid Component Errors**: Use explicit import from '@mui/material/Grid' instead of destructuring
2. **Mobile Layout**: Add specific xs breakpoints for better mobile rendering
3. **Performance with Large Datasets**: Implement virtualization for large lists
4. **Search Performance**: Debounce search input for better performance

## Testing

Components can be tested using:

1. **Unit Tests**: Test component rendering and state changes
2. **Integration Tests**: Test component interactions
3. **Snapshot Tests**: Verify UI consistency

### Example Test

```typescript
describe('HSCodeNavigator', () => {
  it('renders chapter selector initially', () => {
    const { getByText } = render(
      <HSCodeNavigator 
        onHsCodeSelected={() => {}} 
        productCategory="Food Products" 
      />
    );
    
    expect(getByText('Select Chapter (2-digit Tariff Heading)')).toBeInTheDocument();
  });
  
  it('navigates to heading selector when chapter is selected', () => {
    const { getByText } = render(
      <HSCodeNavigator 
        onHsCodeSelected={() => {}} 
        productCategory="Food Products" 
      />
    );
    
    // Find and click a chapter
    fireEvent.click(getByText('02'));
    
    // Should now show heading selector
    expect(getByText('Select Heading (4-digit)')).toBeInTheDocument();
  });
}); 