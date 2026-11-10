declare module "robots-parser" {
  export type Robots = {
    isAllowed: (url: string, userAgent?: string) => boolean | undefined;
    isDisallowed: (url: string, userAgent?: string) => boolean | undefined;
    getMatchingLineNumber: (url: string, userAgent?: string) => number;
  };

  export default function robotsParser(url: string, contents: string): Robots;
}
