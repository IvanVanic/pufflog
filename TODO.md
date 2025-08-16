# PuffLog TODO

## UI/UX Improvements

### Navigation

- [x] ~~Fix navbar positioning to stay fixed during scroll~~ (BottomNav already uses fixed positioning)
- [x] ~~Ensure proper spacing between fixed navbar and content~~ (Added pb-24 to all main containers)
- [ ] Add smooth transitions for navbar interactions

### Stats & Calculations

- [x] ~~Fix time of day usage calculation logic~~
- [x] ~~Improve change percentage calculation with better edge case handling~~
- [x] ~~Fix average per day calculation to only count days with data~~
- [x] ~~Improve taper adherence calculation~~
- [ ] Add data validation for entry inputs
- [ ] Add export functionality for stats data

### Performance

- [ ] Optimize chart rendering for large datasets
- [ ] Add loading states for data processing
- [ ] Implement virtual scrolling for long entry lists

### Features

- [ ] Add data backup/restore functionality
- [ ] Add dark/light theme toggle
- [ ] Add customizable time periods for stats
- [ ] Add goal setting and tracking
- [ ] Add reminder notifications

### Bug Fixes

- [x] ~~Fix any remaining calculation edge cases~~
- [x] ~~Ensure consistent date handling across timezones~~
- [ ] Fix potential memory leaks in chart components

## Technical Debt

- [x] ~~Improve TypeScript type safety~~ (Fixed `any` types and improved type safety)
- [x] ~~Add error boundaries for better error handling~~ (Improved localStorage error handling)
- [ ] Add comprehensive unit tests
- [ ] Add integration tests for calculation logic

## Issues Found & Fixed

### ✅ Fixed Issues:

1. **TypeScript Issues**:

   - Replaced `any` types with proper types in ChartTooltip and taper calculations
   - Fixed type casting issues in TaperProvider

2. **Error Handling**:

   - Added proper error handling for localStorage operations
   - Added data validation for localStorage entries
   - Added error logging for debugging

3. **Layout Issues**:

   - Fixed bottom navigation spacing by adding `pb-24` to all main containers
   - Ensured proper spacing between content and fixed navigation

4. **Calculation Logic**:
   - Fixed time of day usage calculation to properly sort by usage amount
   - Improved change percentage calculation with better edge case handling
   - Fixed average per day calculation to only count days with data
   - Improved taper adherence calculation to handle zero targets

### 🔍 Code Quality:

- No console.log statements in source code
- Proper aria-labels for accessibility
- No dangerouslySetInnerHTML usage
- Proper date handling throughout
- Secure crypto.randomUUID() usage for IDs
- PWA configuration is properly set up

### 📱 Mobile Optimization:

- Fixed navigation stays in place during scroll
- Proper touch targets and spacing
- Responsive design with max-width containers
- PWA manifest properly configured
- **Fixed horizontal scrolling issues** - Added overflow-x-hidden to prevent sideways scrolling
- **Improved navbar responsiveness** - Made navigation items flex properly on small screens
- **Enhanced modal overlays** - Added overflow-hidden to prevent modal-related scrolling issues
- **Better mobile layout** - Improved flex layout structure for mobile devices
- **Enhanced navbar design** - Made navbar items bigger and better aligned with improved spacing
- **Fixed UI borders** - Aligned usage/timeframe controls with card borders for consistency
- **Consistent graph display** - Graph now shows 7 data points regardless of timeframe for better UX
- **Improved mobile responsiveness** - Fixed change percentage overflow on smaller screens
- **Simplified timeframe selection** - Cleaner selected state with just green text color
