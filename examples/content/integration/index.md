# Integration

CuraOS is event-led: durable messaging is primary, versioned sync APIs are
secondary. Integrate via published extension points and data contracts.

- Events: durable, versioned schemas; stable topic naming; outbox pattern.
- APIs: versioned with deprecation sunset dates.
- Contracts: captured request/response pairs are the source of truth.
