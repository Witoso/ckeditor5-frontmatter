export type FrontmatterConfig = Map<string, FrontmatterConfigValue>;

type FrontmatterConfigValue = '$currentDate' | string;
