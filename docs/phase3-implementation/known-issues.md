# HS Code Classification System: Known Issues & Areas Needing Attention

## Critical Issues

### 1. MCP Integration Failures

The most critical issue is the systematic failure of both Compliance and Market Intelligence MCPs, with AggregateErrors for all products:

```
Error enriching product Melty Adventure Corn Dogs with Compliance MCP: AggregateError
Error enriching product Awesome Original Corn Dogs with Compliance MCP: AggregateError
Error enriching product Melty Adventure Corn Dogs with Market Intelligence MCP: AggregateError
```

#### Potential Causes:

- **API Connection Issues**: Missing or incorrect API keys, invalid endpoints, or network connectivity problems
- **Data Format Incompatibility**: Mismatch between the data structure expected by MCPs and what's being sent
- **Authentication Failures**: OAuth tokens or API keys not being properly passed or expired
- **Service Rate Limiting**: Exceeding allowed API request rates
- **Missing Required Fields**: The MCPs may require specific fields that aren't being provided

#### Investigation Plan:

1. Check API connection configuration in environment variables
2. Examine network requests to identify payload format issues
3. Verify authentication mechanisms for both MCPs
4. Implement detailed logging for request/response cycles
5. Test direct API calls outside the application to isolate the issue

### 2. Missing UI Integration

The HS Code classification UI components are not being integrated into the product selection screens. Products remain "Uncategorized" without proper classification.

#### Needed Actions:

1. Import the `HSCodeNavigator` component into the product editing flows
2. Connect the component to product data sources
3. Implement handler functions for HS code selection events
4. Update product models to store HS code and description data
5. Ensure proper styling and layout integration

### 3. Component Linter Errors

The MUI v5 Grid implementation is causing linter errors in the selector components:

```
No overload matches this call.
  Overload 1 of 2, '(props: { component: ElementType<any, keyof IntrinsicElements>; } & GridBaseProps & { sx?: SxProps<Theme> | undefined; } & SystemProps<...> & Omit<...>): Element | null', gave the following error.
    Property 'component' is missing in type...
```

#### Resolution Approach:

1. Update Grid implementation to use the correct MUI v5 patterns
2. Ensure proper typing for Grid props
3. Replace deprecated prop patterns with sx prop styles

## Secondary Issues

### 1. Performance Concerns

Large datasets of HS codes (especially at the subheading level) may cause performance issues:

- **Rendering Optimization**: Need virtualization for large lists
- **Search Performance**: Current filtering may be inefficient for large datasets
- **API Load**: Requests for suggestions may be too frequent or inefficiently cached

### 2. Mobile Responsiveness

While components are designed to be responsive, some areas need improvement:

- **ChapterSelector**: Grid display may be too cramped on small screens
- **HeadingSelector**: Long descriptions can overflow on mobile
- **SubheadingSelector**: Details panel needs better mobile layout

### 3. Error Handling & User Feedback

Current error handling is minimal and does not provide actionable feedback to users:

- **Missing Error States**: UI does not clearly show when API calls fail
- **Recovery Options**: Limited options for users when classification fails
- **Feedback Mechanisms**: No way for users to report incorrect classifications

## Implementation Gaps

### 1. Incomplete HSCodeHierarchyService

The service is implemented but has several gaps:

- **Confidence Scoring Algorithm**: Needs refinement for better accuracy
- **Caching Mechanism**: Current implementation needs optimization
- **Error Fallback Strategies**: Missing fallback when API requests fail
- **Concurrent Request Handling**: May not properly limit or queue requests

### 2. Missing Tests

Test coverage is insufficient:

- **Unit Tests**: Limited coverage of component functionality
- **Integration Tests**: Missing tests for service interactions
- **UI Tests**: No end-to-end tests for user flows

### 3. Documentation Gaps

Documentation needs expansion in several areas:

- **API Contract**: Detailed documentation of expected request/response formats
- **Configuration Options**: Complete guide to available configuration options
- **Troubleshooting Guide**: Common issues and resolution steps
- **Performance Tuning**: Guidance for optimizing performance

## Next Steps Priority

1. **Fix MCP Integration Errors**: This is the most critical issue blocking functionality
2. **Complete UI Integration**: Connect the components to the product selection flow
3. **Resolve Component Linter Errors**: Fix Grid implementation issues
4. **Enhance Error Handling**: Implement better error feedback for users
5. **Complete Test Coverage**: Add comprehensive tests for reliability
6. **Documentation**: Complete technical documentation for maintenance 