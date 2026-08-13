import React from 'react';
import * as Icons from 'lucide-react';

interface IconProps {
  name: string;
  className?: string;
  size?: number;
  color?: string;
}

export const DynamicIcon: React.FC<IconProps> = ({ name, className = 'w-5 h-5', size = 20, color }) => {
  // @ts-expect-error Dynamic icon lookup
  const IconComponent = Icons[name] || Icons.Tag;
  return <IconComponent className={className} size={size} style={{ color }} />;
};
