import type { SVGProps } from 'react'

export type IconName =
  | 'alert'
  | 'arrow-down'
  | 'arrow-left'
  | 'arrow-right'
  | 'arrow-up'
  | 'book'
  | 'check'
  | 'chevron-right'
  | 'clock'
  | 'file'
  | 'flame'
  | 'gamepad'
  | 'home'
  | 'lock'
  | 'podium'
  | 'refresh'
  | 'spark'
  | 'trophy'
  | 'user'
  | 'wallet'
  | 'x'

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName
  size?: number
}

const PATHS: Record<IconName, string> = {
  alert: 'M12 8v4m0 4h.01M10.3 3.7 2.8 17a1 1 0 0 0 .9 1.5h16.6a1 1 0 0 0 .9-1.5L13.7 3.7a2 2 0 0 0-3.4 0Z',
  'arrow-down': 'M12 5v14m-6-6 6 6 6-6',
  'arrow-left': 'M19 12H5m7-7-7 7 7 7',
  'arrow-right': 'M5 12h14m-7-7 7 7-7 7',
  'arrow-up': 'M12 19V5m-6 6 6-6 6 6',
  book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16ZM4 5.5v16M8 7h8m-8 4h6',
  check: 'm5 12 4.2 4.2L19 6.5',
  'chevron-right': 'm9 5 7 7-7 7',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-14v5l3 2',
  file: 'M6 3h7l5 5v13H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm7 0v5h5M8 13h8m-8 4h6',
  flame: 'M12 22c4.4 0 7-2.7 7-6.7 0-3.2-1.8-5.5-4.2-7.8.1 2.1-1.1 3.5-2.5 4.2.2-3.5-1.5-6.7-5.1-9.7.3 3.4-2.2 5.7-2.2 9.1C5 18.2 7.7 22 12 22Z',
  gamepad: 'M7 8h10a4 4 0 0 1 3.8 5.2l-1.3 4A2.5 2.5 0 0 1 17.1 19l-2.4-2H9.3l-2.4 2a2.5 2.5 0 0 1-2.4-1.8l-1.3-4A4 4 0 0 1 7 8Zm1 3v4m-2-2h4m6-1h.01m2 2h.01',
  home: 'm3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9Zm6 11v-6h6v6',
  lock: 'M7 10V7a5 5 0 0 1 10 0v3m-12 0h14v10H5V10Zm7 4v2',
  podium: 'M4 20h16M5 20v-5h4v5m3 0V8h4v12m3 0v-9h1v9',
  refresh: 'M20 11a8 8 0 0 0-14.9-3M4 5v4h4m-4 2a8 8 0 0 0 14.9 3M20 19v-4h-4',
  spark: 'm12 2 1.4 6.6L20 10l-6.6 1.4L12 18l-1.4-6.6L4 10l6.6-1.4L12 2Zm6 14 .6 2.4L21 19l-2.4.6L18 22l-.6-2.4L15 19l2.4-.6L18 16Z',
  trophy: 'm8 4 1 3h6l1-3m-8 3H5v2a4 4 0 0 0 4 4m6-6h3v2a4 4 0 0 1-4 4m-2 0v4m-4 3h8M7 20h10',
  user: 'M19 21a7 7 0 0 0-14 0m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  wallet: 'M4 6h15a1 1 0 0 1 1 1v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h13m2 7h-5a2 2 0 0 0 0 4h5m-5-2h.01',
  x: 'm6 6 12 12M18 6 6 18',
}

export function Icon({ name, size = 20, strokeWidth = 1.8, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      {...props}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
