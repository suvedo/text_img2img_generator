import { HTMLAttributes } from 'react';

export interface RetroGridProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  angle?: number;
  cellSize?: number;
  opacity?: number;
  lightLineColor?: string;
  darkLineColor?: string;
}

export declare function RetroGrid(props: RetroGridProps): JSX.Element; 