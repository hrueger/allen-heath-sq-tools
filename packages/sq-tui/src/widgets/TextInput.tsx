import React, { useRef, useEffect, useState } from 'react';
import { Text, useInput } from 'ink';

interface Props {
  value: string | null;
  label: string;
  maxLen?: number;
  isFocused: boolean;
  isEditing: boolean;
  onCommit: (v: string) => void;
  onEditEnd: () => void;
}

export const TextInput: React.FC<Props> = ({ value, label, maxLen = 6, isFocused, isEditing, onCommit, onEditEnd }) => {
  const bufRef = useRef<string>(value ?? '');
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    if (isEditing) bufRef.current = value ?? '';
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) return;
    const id = setInterval(() => setCursor(v => !v), 500);
    return () => clearInterval(id);
  }, [isEditing]);

  const [, forceRender] = useState(0);

  useInput((input, key) => {
    if (key.escape) { onEditEnd(); return; }
    if (key.return) { onCommit(bufRef.current.trim()); onEditEnd(); return; }
    if (key.backspace || key.delete) {
      bufRef.current = bufRef.current.slice(0, -1);
      forceRender(v => v + 1);
      return;
    }
    if (input && !key.ctrl && bufRef.current.length < maxLen) {
      bufRef.current += input;
      forceRender(v => v + 1);
    }
  }, { isActive: isEditing });

  const displayed = bufRef.current.padEnd(maxLen, ' ');
  const bg = isEditing ? 'blue' : isFocused ? 'gray' : undefined;
  const labelPad = label.padEnd(8);
  const cursorChar = isEditing && cursor ? '|' : ' ';

  return (
    <Text backgroundColor={bg}>
      {`  ${labelPad}[${displayed}${cursorChar}]`}
    </Text>
  );
};
