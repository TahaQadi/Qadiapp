# Workflows Changelog

All notable changes to workflows and business processes will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [2025-01-23]

### Fixed
- Fixed currency display in order history to use actual order currency instead of hardcoded 'SAR'
- Fixed item counter in order history to show total quantity instead of unique item count
- Fixed feedback analytics date comparison causing 500 errors (changed from ISO strings to Date objects)
- Fixed order details dialog in ordering page to show details inline instead of navigating away

### Added
- Price request details view dialog in admin price management
- Direct "Create Offer" action from price request cards
- Improved history tab UI with three compact action buttons (Details, Report Issue, Feedback)
- Enhanced request status filtering (all, pending, completed)

### Changed
- Order history cards now show accurate total item quantities
- Price requests now distinguish between pending and completed states
- Streamlined workflow from price request to offer creation

### Known Issues
- Issue report migration (0007_split_feedback_issues.sql) needs to be run via `npm run db:push`
- JSON parsing warnings in console for some order data
- Dialog accessibility warnings (missing descriptions and titles)

## [2025-01-21]

### Added
- Comprehensive workflow documentation system
- Security audit implementation
- Performance monitoring capabilities
- PWA (Progressive Web App) functionality

### Changed
- Enhanced mobile experience across all pages
- Improved error handling and logging
- Updated admin analytics dashboard

---

**Last Updated**: 2025-01-23  
**Next Review**: Phase 2 Planning (February 2025)  
**Changelog Version**: 2.0.0