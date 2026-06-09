import React, { useRef, useEffect } from 'react';
import { useInput } from 'ink';
import { FaderBar } from './FaderBar';
import { clamp } from '../utils';

interface Props {
  value: number | null;
  min: number;
  max: number;
  step: number;
  label: string;
  format: (v: number) => string;
  normalize?: (v: number) => number; // defaults to linear
  isFocused: boolean;
  isEditing: boolean;
  onChange: (v: number) => void;
  onEditEnd: () => void;
}

export const NumberInput: React.FC<Props> = ({
  value, min, max, step, label, format, normalize, isFocused, isEditing, onChange, onEditEnd,
}) => {
  const bufRef = useRef<number>(value ?? min);

  useEffect(() => {
    if (isEditing) bufRef.current = value ?? ((min + max) / 2);
  }, [isEditing]);

  useInput((input, key) => {
    if (key.escape || key.return) { onEditEnd(); return; }
    const dir = key.upArrow ? 1 : key.downArrow ? -1 : 0;
    if (dir !== 0) {
      bufRef.current = clamp(bufRef.current + dir * step, min, max);
      onChange(bufRef.current);
    }
  }, { isActive: isEditing });

  const displayed = value !== null ? value : (isEditing ? bufRef.current : null);
  const norm = normalize
    ? (displayed !== null ? normalize(displayed) : 0)
    : (displayed !== null ? Math.max(0, Math.min(1, (displayed - min) / (max - min))) : 0);

  return (
    <FaderBar
      normalized={displayed !== null ? norm : null}
      label={label}
      display={displayed !== null ? format(displayed) : '--'}
      isFocused={isFocused}
      isEditing={isEditing}
    />
  );
};
