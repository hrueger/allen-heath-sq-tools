import React, { useRef, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';

const COLORS = [
  { r: 0xff, g: 0, b: 0, label: 'Red ', inkColor: 'red' },
  { r: 0, g: 0xff, b: 0, label: 'Grn ', inkColor: 'green' },
  { r: 0, g: 0, b: 0xff, label: 'Blue', inkColor: 'blue' },
  { r: 0xff, g: 0, b: 0xff, label: 'Pink', inkColor: 'magenta' },
  { r: 0, g: 0xff, b: 0xff, label: 'Tqs ', inkColor: 'cyan' },
  { r: 0xff, g: 0xff, b: 0, label: 'Yel ', inkColor: 'yellow' },
  { r: 0xff, g: 0xff, b: 0xff, label: 'Wht ', inkColor: 'white' },
  { r: 0, g: 0, b: 0, label: 'Blk ', inkColor: 'black' },
] as const;

interface Props {
  isFocused: boolean;
  isEditing: boolean;
  onCommit: (r: number, g: number, b: number) => void;
  onEditEnd: () => void;
}

export const ColorPicker: React.FC<Props> = ({ isFocused, isEditing, onCommit, onEditEnd }) => {
  const idxRef = useRef(0);
  const [, forceRender] = React.useState(0);

  useEffect(() => {
    if (!isEditing) idxRef.current = 0;
  }, [isEditing]);

  useInput((input, key) => {
    if (key.escape) { onEditEnd(); return; }
    if (key.return) {
      const c = COLORS[idxRef.current];
      onCommit(c.r, c.g, c.b);
      onEditEnd();
      return;
    }
    if (key.rightArrow || key.downArrow) {
      idxRef.current = (idxRef.current + 1) % COLORS.length;
      forceRender(v => v + 1);
    }
    if (key.leftArrow || key.upArrow) {
      idxRef.current = (idxRef.current - 1 + COLORS.length) % COLORS.length;
      forceRender(v => v + 1);
    }
  }, { isActive: isEditing });

  const bg = isFocused && !isEditing ? 'gray' : undefined;

  if (!isEditing) {
    return <Text backgroundColor={bg}>  {'Color   '}[Set color…     ]</Text>;
  }

  return (
    <Box flexDirection="column">
      <Box>
        {COLORS.slice(0, 4).map((c, i) => {
          const sel = idxRef.current === i;
          return (
            <Text key={i} backgroundColor={sel ? 'white' : undefined} color={c.inkColor}>
              {sel ? `[■${c.label}]` : ` □${c.label} `}
            </Text>
          );
        })}
      </Box>
      <Box>
        {COLORS.slice(4).map((c, i) => {
          const sel = idxRef.current === i + 4;
          return (
            <Text key={i} backgroundColor={sel ? 'white' : undefined} color={c.inkColor}>
              {sel ? `[■${c.label}]` : ` □${c.label} `}
            </Text>
          );
        })}
      </Box>
    </Box>
  );
};
