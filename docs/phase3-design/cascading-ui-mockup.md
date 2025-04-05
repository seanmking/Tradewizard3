# Cascading HS Code Selector UI Design

This document presents the design mockup for the Cascading HS Code Selector component, to be implemented in Phase 3 of the TradeWizard 3.0 project.

## Table of Contents
1. [Overview](#overview)
2. [Component Design](#component-design)
3. [Desktop Interface](#desktop-interface)
4. [Mobile Interface](#mobile-interface)
5. [User Interaction Patterns](#user-interaction-patterns)
6. [State Management](#state-management)
7. [Loading States](#loading-states)
8. [Error Handling](#error-handling)
9. [Integration Points](#integration-points)
10. [Accessibility Considerations](#accessibility-considerations)

## Overview

The Cascading HS Code Selector is a user interface component that enables users to navigate the Harmonized System (HS) code hierarchy from 2-digit chapters to 6-digit subheadings. It integrates with the HSCodeHierarchyService to provide intelligent suggestions based on product categories and descriptions.

### Key Features

1. **Hierarchical Navigation**: Navigate from chapters (2-digit) to headings (4-digit) to subheadings (6-digit)
2. **Intelligent Suggestions**: Display suggested HS codes with confidence indicators
3. **Product Variant Toggle**: Assign different HS codes to different product variants
4. **Search Functionality**: Search within the hierarchy at any level
5. **Visual Confidence Indicators**: Clear visual cues for suggestion confidence
6. **Responsive Design**: Optimized for both desktop and mobile interfaces

## Component Design

### Core Components

1. **HSCodeNavigator**: Master component that orchestrates the cascading selection process
2. **ChapterSelector**: UI for selecting 2-digit chapter codes
3. **HeadingSelector**: UI for selecting 4-digit heading codes within a chapter
4. **SubheadingSelector**: UI for selecting 6-digit subheading codes within a heading
5. **HSCodeSuggestionList**: Displays suggested HS codes with confidence indicators
6. **HSCodeDetail**: Shows detailed information about a selected HS code
7. **ProductVariantToggle**: UI for associating product variants with selected HS codes
8. **HSCodeSearch**: Search functionality for finding specific HS codes

## Desktop Interface

### Main Layout

```
+-----------------------------------------------------+
|                   HSCodeNavigator                   |
+-----------------------------------------------------+
|                                                     |
|  +-------------------+  +----------------------+    |
|  |                   |  |                      |    |
|  |  ChapterSelector  |  |   HeadingSelector   |    |
|  |                   |  |                      |    |
|  +-------------------+  +----------------------+    |
|                                                     |
|  +-------------------+  +----------------------+    |
|  |                   |  |                      |    |
|  | SubheadingSelector|  |    HSCodeDetail     |    |
|  |                   |  |                      |    |
|  +-------------------+  +----------------------+    |
|                                                     |
|  +-------------------+  +----------------------+    |
|  |                   |  |                      |    |
|  | HSCodeSuggestions |  | ProductVariantToggle |    |
|  |                   |  |                      |    |
|  +-------------------+  +----------------------+    |
|                                                     |
+-----------------------------------------------------+
```

### ChapterSelector Component

The ChapterSelector displays a grid of 2-digit HS code chapters with visual categories:

```
+---------------------------------------------------+
|  Search: [                    ]   Filter: [    ]  |
+---------------------------------------------------+
|                                                   |
|  +-------+  +-------+  +-------+  +-------+      |
|  |  01   |  |  02   |  |  03   |  |  04   |      |
|  | Live  |  |Meat & |  | Fish  |  | Dairy |      |
|  |Animals|  |Edible |  |       |  |Products|      |
|  +-------+  +-------+  +-------+  +-------+      |
|                                                   |
|  +-------+  +-------+  +-------+  +-------+      |
|  |  22   |  |  61   |  |  62   |  |  85   |      |
|  |Beverage|  |Knitted|  | Non-  |  |Electric|     |
|  |       |  |Apparel|  |Knitted |  |Machinery|    |
|  +-------+  +-------+  +-------+  +-------+      |
|                                                   |
|           ... more chapters ...                   |
|                                                   |
+---------------------------------------------------+
|         Recently Used:  22 | 61 | 85              |
+---------------------------------------------------+
```

### HeadingSelector Component

When a chapter is selected, the HeadingSelector displays 4-digit headings within that chapter:

```
+----------------------------------------------------+
|  Chapter 22: Beverages, spirits and vinegar        |
|  Search: [                    ]                    |
+----------------------------------------------------+
|                                                    |
|  +-------------------------------------------+     |
|  | 2201: Waters, including natural or        |     |
|  | artificial mineral waters                  |     |
|  +-------------------------------------------+     |
|                                                    |
|  +-------------------------------------------+     |
|  | 2204: Wine of fresh grapes, including     | ★   |
|  | fortified wines                           |     |
|  +-------------------------------------------+     |
|                                                    |
|  +-------------------------------------------+     |
|  | 2208: Undenatured ethyl alcohol; spirits, |     |
|  | liqueurs and other spirituous beverages   |     |
|  +-------------------------------------------+     |
|                                                    |
|           ... more headings ...                    |
|                                                    |
+----------------------------------------------------+
|  ← Back to Chapters         Confidence: [ ▮▮▮▮▯ ]  |
+----------------------------------------------------+
```

### SubheadingSelector Component

When a heading is selected, the SubheadingSelector displays 6-digit subheadings:

```
+----------------------------------------------------+
|  Heading 2204: Wine of fresh grapes                |
|  Search: [                    ]                    |
+----------------------------------------------------+
|                                                    |
|  +-------------------------------------------+     |
|  | 220410: Sparkling wine                    |     |
|  +-------------------------------------------+     |
|                                                    |
|  +-------------------------------------------+     |
|  | 220421: Other wine in containers of 2L    | ★   |
|  | or less                                   |     |
|  +-------------------------------------------+     |
|                                                    |
|  +-------------------------------------------+     |
|  | 220422: Other wine in containers of       |     |
|  | more than 2L but not more than 10L        |     |
|  +-------------------------------------------+     |
|                                                    |
|           ... more subheadings ...                 |
|                                                    |
+----------------------------------------------------+
|  ← Back to Headings         Confidence: [ ▮▮▮▮▮ ]  |
+----------------------------------------------------+
```

### HSCodeDetail Component

When a specific HS code is selected, the HSCodeDetail component shows comprehensive information:

```
+----------------------------------------------------+
|  HS Code: 220421                                   |
+----------------------------------------------------+
|                                                    |
|  Description: Other wine; in containers of 2L or   |
|               less                                 |
|                                                    |
|  Path: Beverages (22) > Wine (2204) > Bottled      |
|        Wine (220421)                               |
|                                                    |
|  Notes:                                            |
|  - Includes all still wine in bottles, whether     |
|    for immediate consumption or aging              |
|  - Excludes sparkling wine (220410)                |
|                                                    |
|  Confidence: 96% [▮▮▮▮▮]                           |
|                                                    |
|  Examples:                                         |
|  - Bottled red wine                                |
|  - Boxed white wine under 2L                       |
|  - Wine in cans                                    |
|                                                    |
|  Restrictions: None                                |
|                                                    |
+----------------------------------------------------+
|  [  Apply This Code  ]    [ Find Alternatives ]    |
+----------------------------------------------------+
```

### HSCodeSuggestions Component

The HSCodeSuggestions component displays AI-powered suggestions based on product details:

```
+----------------------------------------------------+
|  Suggested HS Codes for Your Product               |
+----------------------------------------------------+
|                                                    |
|  Based on: Red Wine, Premium Cabernet Sauvignon    |
|                                                    |
|  +-------------------------------------------+     |
|  | 220421: Other wine in containers of 2L    |     |
|  | or less                                   |     |
|  | Confidence: 96% [▮▮▮▮▮]                  |     |
|  +-------------------------------------------+     |
|                                                    |
|  +-------------------------------------------+     |
|  | 220422: Wine in containers > 2L but ≤10L  |     |
|  | Confidence: 85% [▮▮▮▮▯]                  |     |
|  +-------------------------------------------+     |
|                                                    |
|  +-------------------------------------------+     |
|  | 220429: Other wine in other containers    |     |
|  | Confidence: 77% [▮▮▮▯▯]                  |     |
|  +-------------------------------------------+     |
|                                                    |
+----------------------------------------------------+
|  [Refresh Suggestions]   [Customize Parameters]    |
+----------------------------------------------------+
```

### ProductVariantToggle Component

The ProductVariantToggle allows associating different product variants with HS codes:

```
+----------------------------------------------------+
|  Apply HS Code to Product Variants                 |
+----------------------------------------------------+
|                                                    |
|  Selected HS Code: 220421 - Bottled Wine           |
|                                                    |
|  [✓] Apply to all variants                         |
|                                                    |
|  Or select specific variants:                      |
|                                                    |
|  [✓] Premium Red Wine - 750ml                      |
|  [✓] Reserve Red Wine - 750ml                      |
|  [ ] Wine Gift Box (contains multiple items)       |
|  [ ] Wine Tasting Set (contains multiple items)    |
|                                                    |
|  [      Apply to Selected Variants      ]          |
|                                                    |
+----------------------------------------------------+
|  ℹ️ Complex products may require multiple HS codes |
+----------------------------------------------------+
```

## Mobile Interface

The mobile interface uses an accordion-style layout for progressive disclosure:

```
+---------------------------------------------+
|  HS Code Selection                      ≡   |
+---------------------------------------------+
|                                             |
|  🔍 Search: [                         ]     |
|                                             |
|  ▼ 1. Select Chapter                        |
|  +----------------------------------------+ |
|  | • Live Animals (01)                    | |
|  | • Meat Products (02)                   | |
|  | • Beverages (22)                     ✓ | |
|  | • Apparel, Knitted (61)                | |
|  +----------------------------------------+ |
|                                             |
|  ▼ 2. Select Heading                        |
|  +----------------------------------------+ |
|  | • Waters (2201)                        | |
|  | • Wine (2204)                        ✓ | |
|  | • Beer (2203)                          | |
|  | • Spirits (2208)                       | |
|  +----------------------------------------+ |
|                                             |
|  ▼ 3. Select Subheading                     |
|  +----------------------------------------+ |
|  | • Sparkling wine (220410)              | |
|  | • Bottled wine ≤2L (220421)          ✓ | |
|  | • Boxed wine 2-10L (220422)            | |
|  +----------------------------------------+ |
|                                             |
|  ▼ Suggested HS Codes                       |
|  +----------------------------------------+ |
|  | 220421: Bottled wine                   | |
|  | Confidence: 96% [▮▮▮▮▮]                | |
|  | 220422: Boxed wine                     | |
|  | Confidence: 85% [▮▮▮▮▯]                | |
|  +----------------------------------------+ |
|                                             |
|  [         Apply Selected Code         ]    |
|                                             |
+---------------------------------------------+
```

## User Interaction Patterns

### Primary Flow

1. **Initial Load**:
   - User arrives at product classification screen
   - System loads product details and category
   - HSCodeSuggestions component displays initial suggestions based on category and product details
   - ChapterSelector highlights suggested chapters with confidence indicators

2. **Manual Selection**:
   - User selects a chapter from ChapterSelector
   - HeadingSelector loads and displays headings for selected chapter
   - User selects a heading
   - SubheadingSelector loads and displays subheadings for selected heading
   - User selects a subheading
   - HSCodeDetail displays comprehensive information about selected code

3. **Suggestion-Based Selection**:
   - User views suggested HS codes in HSCodeSuggestions
   - User selects a suggestion
   - UI automatically navigates to appropriate chapter → heading → subheading
   - HSCodeDetail displays comprehensive information about selected code

4. **Search-Based Selection**:
   - User enters search term in HSCodeSearch
   - System displays matching HS codes at all levels
   - User selects a search result
   - UI navigates to appropriate chapter → heading → subheading

5. **Assignment**:
   - User reviews selected HS code in HSCodeDetail
   - User configures product variant assignments in ProductVariantToggle
   - User clicks "Apply" to assign the selected HS code to products

### Alternative Flows

1. **Multiple HS Code Assignment**:
   - User assigns different HS codes to different product variants
   - System tracks multiple assignments and displays summary

2. **Ambiguous Product Resolution**:
   - System detects ambiguous product that could map to multiple HS chapters
   - HSCodeSuggestions displays multiple high-confidence suggestions from different chapters
   - User reviews alternatives and selects most appropriate code

3. **Low Confidence Resolution**:
   - All suggestions have low confidence scores
   - System displays warning and suggests additional product details
   - User provides additional information to improve suggestions

## Visual Confidence Indicators

Confidence scores are represented visually with consistent color coding:

1. **High Confidence (90-100%)**:
   - Color: Green
   - Icon: ★★★★★ or [▮▮▮▮▮]
   - Background: Subtle green highlight

2. **Medium-High Confidence (75-89%)**:
   - Color: Light Green
   - Icon: ★★★★☆ or [▮▮▮▮▯]
   - Background: Neutral

3. **Medium Confidence (60-74%)**:
   - Color: Amber
   - Icon: ★★★☆☆ or [▮▮▮▯▯]
   - Background: Neutral

4. **Low-Medium Confidence (40-59%)**:
   - Color: Orange
   - Icon: ★★☆☆☆ or [▮▮▯▯▯]
   - Background: Subtle warning highlight

5. **Low Confidence (<40%)**:
   - Color: Red
   - Icon: ★☆☆☆☆ or [▮▯▯▯▯]
   - Background: Subtle warning highlight
   - Additional flag icon to indicate caution

## State Management

The component uses a hierarchical state model:

```typescript
interface HSCodeSelectorState {
  // Current selection state
  selectedChapter?: string;
  selectedHeading?: string;
  selectedSubheading?: string;
  
  // Navigation history for breadcrumbs
  navigationPath: {
    code: string;
    description: string;
    level: 'chapter' | 'heading' | 'subheading';
  }[];
  
  // Suggestions state
  suggestions: HSCodeSuggestion[];
  suggestionsLoading: boolean;
  suggestionsError?: string;
  
  // Product variants state
  productVariants: ProductVariant[];
  variantAssignments: Map<string, string>; // variantId -> hsCode
  
  // UI state
  activeView: 'chapter' | 'heading' | 'subheading' | 'detail';
  searchQuery: string;
  isSearchActive: boolean;
  searchResults: HSCodeSearchResult[];
  
  // Loading states
  loadingChapters: boolean;
  loadingHeadings: boolean;
  loadingSubheadings: boolean;
  loadingDetails: boolean;
  
  // Error states
  error?: {
    type: 'api' | 'selection' | 'assignment';
    message: string;
  };
}
```

## Loading States

The component implements progressive loading with optimized UX:

1. **Initial Load**:
   - Show skeleton loaders for chapter grid
   - Display loading indicator for suggestions
   - Pre-fetch most common chapters

2. **Chapter Selection**:
   - Show skeleton loaders for headings
   - Lazy-load heading details
   - Display progress indicator

3. **Heading Selection**:
   - Show skeleton loaders for subheadings
   - Lazy-load subheading details
   - Display progress indicator

4. **Background Loading**:
   - Proactively load likely next selections
   - Show subtle loading indicators
   - Cache results for improved performance

## Error Handling

The component implements robust error handling:

1. **API Errors**:
   - Display error message with retry option
   - Fall back to cached data when available
   - Provide manual entry option for critical failures

2. **Selection Errors**:
   - Display helpful messages for invalid selections
   - Suggest alternatives when appropriate
   - Provide clear recovery paths

3. **Assignment Errors**:
   - Validate assignments before submission
   - Provide clear error messages
   - Allow partial assignments when appropriate

## Integration Points

The component integrates with several TradeWizard 3.0 systems:

1. **HSCodeHierarchyService**:
   - Fetch HS code hierarchy
   - Get intelligent suggestions
   - Navigate hierarchy structure

2. **CategoryBasedConsolidationService**:
   - Receive product category information
   - Use category hints for improved suggestions

3. **Product Assessment Flow**:
   - Receive product details
   - Return assigned HS codes
   - Update product classification status

4. **User Preferences**:
   - Store and retrieve recently used HS codes
   - Remember user selection patterns
   - Customize display preferences

## Accessibility Considerations

The component implements full accessibility support:

1. **Keyboard Navigation**:
   - Full keyboard support for all interactions
   - Logical tab order
   - Keyboard shortcuts for common actions

2. **Screen Reader Support**:
   - ARIA labels and descriptions
   - Announcements for dynamic content changes
   - Semantic HTML structure

3. **Visual Accessibility**:
   - High contrast mode
   - Configurable text size
   - Non-color dependent indicators (alongside color) 