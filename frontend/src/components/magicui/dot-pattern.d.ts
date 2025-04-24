import { SVGProps } from 'react';

export interface DotPatternProps extends SVGProps<SVGSVGElement> {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  cx?: number;
  cy?: number;
  cr?: number;
  className?: string;
  glow?: boolean;
}

export declare function DotPattern(props: DotPatternProps): JSX.Element; 