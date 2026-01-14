# Bowling League Score Tracker - Design Guidelines

## Design Approach

**Selected Approach**: Design System - Material Design with Sports App Influence

**Justification**: This is a utility-focused, data-intensive application requiring clear information hierarchy, efficient data entry, and instant readability. Drawing from Material Design's strong data display patterns combined with modern sports tracking apps (ESPN, TheScore) ensures professional presentation of complex scoring data.

**Key Principles**:
- Clarity over decoration - scores must be instantly readable
- Efficiency in data entry - streamlined workflows for entering games
- Hierarchical data display - clear distinction between individual, team, scratch, and handicap scores
- Responsive tables - standings must work across all devices

## Typography

**Font System**: 
- Primary: Inter or Roboto (Google Fonts CDN) - clean, modern sans-serif
- Monospace numbers: JetBrains Mono or Roboto Mono - for all scores and statistics to ensure alignment

**Hierarchy**:
- Page Headers: text-4xl md:text-5xl font-bold tracking-tight
- Section Headers: text-2xl md:text-3xl font-semibold
- Data Labels: text-sm font-medium uppercase tracking-wide
- Body Text: text-base
- Score Numbers: text-2xl md:text-3xl font-mono font-bold
- Table Headers: text-xs md:text-sm font-semibold uppercase tracking-wider
- Table Data: text-sm md:text-base font-mono (for numbers)

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, and 8 consistently
- Tight spacing: p-2, gap-2 (within cards, between related elements)
- Standard spacing: p-4, gap-4 (card padding, form fields)
- Section spacing: p-6, gap-6 (between major sections on mobile)
- Large spacing: p-8, gap-8 (desktop sections, major separations)

**Container Strategy**:
- Main content: max-w-7xl mx-auto px-4 md:px-6
- Forms/Entry screens: max-w-4xl mx-auto
- Wide data tables: max-w-screen-xl mx-auto (when needed)

**Grid Patterns**:
- Standings tables: Full-width with horizontal scroll on mobile
- Team cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4
- Score entry: Single column on mobile, strategic multi-column on desktop

## Component Library

### Navigation
- Top navigation bar with league selector dropdown
- Horizontal tabs for main sections (Scores, Standings, Teams, Settings)
- Breadcrumb trail for deep navigation (League > Team > Bowler)
- Mobile: Hamburger menu with drawer

### Score Entry Components
**Bowling Frame Grid**:
- 10 columns representing frames
- Each frame: 2 small boxes for first/second ball, larger box for frame total
- 10th frame: 3 boxes for potential strikes/spares
- Desktop: Full horizontal layout with frame numbers
- Mobile: Scrollable horizontal frame strip

**Quick Entry Row**:
- Input fields aligned in frame grid
- Auto-advance to next input after entry
- Clear visual indication of current frame
- Strike/Spare quick-action buttons

### Data Display

**Standings Table**:
- Sticky header row
- Zebra striping for readability
- Columns: Rank, Team/Name, Games, Scratch Score, Handicap, Total, Points
- Sortable column headers with arrow indicators
- Responsive: horizontal scroll with frozen first column on mobile

**Score Card Component**:
- Card layout with bowler name header
- Frame-by-frame breakdown
- Running total display
- Handicap calculation shown separately
- Border treatment to separate games

**Team Summary Cards**:
- Team name with member count badge
- Current standing position (large number)
- Total points and average score
- Expandable to show individual members
- Grid layout with consistent card heights

### Forms

**League Setup Form**:
- Multi-step wizard layout
- Progress indicator at top
- Grouped sections (Basic Info, Teams, Handicap Settings, Point System)
- Inline help text for handicap calculations

**Bowler Entry Form**:
- Compact horizontal layout for adding multiple bowlers
- Name, starting average, team assignment
- Quick-add with enter key support

### Handicap Display

**Handicap Indicator**:
- Small badge showing handicap value (e.g., "+12")
- Appears next to bowler names in all contexts
- Tooltip on hover explaining calculation
- Visual differentiation from scratch scores

**Score Breakdown**:
- Scratch score (primary display)
- Plus icon with handicap value
- Equals total score (emphasized)
- Layout: `[185] + [12] = [197]` with proper spacing

### Action Components

**Primary Actions**: 
- Large, prominent buttons for "Enter Scores" and "Calculate Standings"
- Fixed position on mobile for quick access
- Icon + label combination

**Secondary Actions**:
- Outlined buttons for "Edit", "View Details"
- Icon-only buttons for delete/remove actions

### Data Visualization

**Simple Bar Charts**: 
- For comparing team/individual performance
- Horizontal bars showing score ranges
- Handicap portion visually distinguished within bar

**Progress Indicators**:
- Show games completed vs total games
- Linear progress bar with count label

## Animations

Use sparingly:
- Smooth transitions on tab switches (200ms)
- Subtle hover lift on cards (2px translate)
- Score entry: Brief highlight flash on auto-calculated totals (300ms fade)
- No scroll animations or decorative motion

## Images

**No hero image** - This is a utility app that should lead with functionality.

**Icon Usage**:
- Use Heroicons via CDN
- Bowling pin icon for league/app branding
- Trophy icon for standings/winners
- User/team icons for navigation
- Edit, trash, plus icons for actions

## Page-Specific Layouts

**Dashboard/Home**:
- Two-column on desktop: Active leagues (left 2/3) + Quick stats (right 1/3)
- Mobile: stacked single column
- Recent activity feed

**Score Entry Screen**:
- Full-width score sheet interface
- Bowler selector dropdown at top
- Frame grid takes center focus
- Summary totals panel on right (desktop) or below (mobile)

**Standings Page**:
- Tabbed interface: Team Standings | Individual Standings
- Filters above table (by team, games played)
- Full-width responsive table
- Export/print actions in top-right

**League Settings**:
- Left sidebar navigation (Handicap, Points, Teams, General)
- Right content area with form sections
- Save bar fixed at bottom on changes

This design creates a professional, data-forward bowling tracker that prioritizes readability and efficient data entry while maintaining visual polish.