export type IconName =
  | 'menu'
  | 'home'
  | 'users'
  | 'calendar'
  | 'clock'
  | 'folder'
  | 'bell'
  | 'activity'
  | 'chart'
  | 'file'
  | 'settings'
  | 'edit'
  | 'warning'
  | 'wifiOff'
  | 'logOut';

const PATHS: Record<IconName, string> = {
  menu: 'M4 7h16M4 12h16M4 17h16',
  home: 'M3 10.6 12 3.5l9 7.1V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM9.5 21v-6h5v6',
  users:
    'M9 11.5a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5M2.5 20.5c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5M16 5.6a3 3 0 0 1 0 5.9M18 14.6c2.1.7 3.5 2.4 3.5 4.9',
  calendar:
    'M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v12a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5zM4 10h16M8.5 3v4M15.5 3v4',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M12 7.5V12l3.2 2',
  folder: 'M3 7.5A1.5 1.5 0 0 1 4.5 6h4l2 2.5h9A1.5 1.5 0 0 1 21 10v8.5A1.5 1.5 0 0 1 19.5 20h-15A1.5 1.5 0 0 1 3 18.5z',
  bell: 'M18 15.5V11a6 6 0 0 0-12 0v4.5L4.5 18h15zM10 20.5a2 2 0 0 0 4 0',
  activity: 'M2.5 12.5h4l2.5-7 4.5 14 2.5-7h5.5',
  chart: 'M4 20.5h16M7 20.5v-6M11.5 20.5V6M16 20.5v-9M20 20.5V9',
  file: 'M14 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8zM14 3.5V8h4.5M9 13h6M9 16.5h4',
  settings:
    'M12 15.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5M19.2 14.4a1.4 1.4 0 0 0 .3 1.6l.1.1a1.7 1.7 0 1 1-2.4 2.4l-.1-.1a1.4 1.4 0 0 0-1.6-.3 1.4 1.4 0 0 0-.9 1.3v.2a1.7 1.7 0 1 1-3.4 0v-.1a1.4 1.4 0 0 0-.9-1.3 1.4 1.4 0 0 0-1.6.3l-.1.1a1.7 1.7 0 1 1-2.4-2.4l.1-.1a1.4 1.4 0 0 0 .3-1.6 1.4 1.4 0 0 0-1.3-.9h-.2a1.7 1.7 0 1 1 0-3.4h.1a1.4 1.4 0 0 0 1.3-.9 1.4 1.4 0 0 0-.3-1.6l-.1-.1a1.7 1.7 0 1 1 2.4-2.4l.1.1a1.4 1.4 0 0 0 1.6.3h.1a1.4 1.4 0 0 0 .9-1.3v-.2a1.7 1.7 0 1 1 3.4 0v.1a1.4 1.4 0 0 0 .9 1.3 1.4 1.4 0 0 0 1.6-.3l.1-.1a1.7 1.7 0 1 1 2.4 2.4l-.1.1a1.4 1.4 0 0 0-.3 1.6v.1a1.4 1.4 0 0 0 1.3.9h.2a1.7 1.7 0 1 1 0 3.4h-.1a1.4 1.4 0 0 0-1.3.9',
  edit: 'M16.4 3.9a2 2 0 0 1 2.8 2.8L8.5 17.4l-3.6.8.8-3.6zM14.5 5.8l2.8 2.8',
  logOut: 'M14 7.5V5.5A1.5 1.5 0 0 0 12.5 4h-7A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20h7a1.5 1.5 0 0 0 1.5-1.5v-2M10 12h10M17 8.5l3.5 3.5-3.5 3.5',
  warning:
    'M12 4.5 2.9 20.2a1 1 0 0 0 .9 1.5h16.4a1 1 0 0 0 .9-1.5L12 4.5M12 10v4M12 17.5v.01',
  wifiOff:
    'M3 3l18 18M8.5 13.5a5 5 0 0 1 5.2-1.1M2 9.5a14 14 0 0 1 4-2.3M22 9.5a14 14 0 0 0-9-3.4M5.5 6.8A14 14 0 0 1 16 5.6M12 19.5v.01',
};

export interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export const Icon = ({ name, size = 20, className }: IconProps) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.75}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d={PATHS[name]} />
  </svg>
);