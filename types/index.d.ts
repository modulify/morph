export type Extractor = <
  Source = unknown,
  Value = unknown
>(source: Source) => Value

export type Injector = <Destination = unknown>(
  destination: Destination,
  path: string,
  value: unknown
) => void

export type Processor = <
  Raw = unknown,
  Processed = unknown
>(value: Raw) => Processed