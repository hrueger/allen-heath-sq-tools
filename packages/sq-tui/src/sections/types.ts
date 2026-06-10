import { Channel } from '@allen-heath-sq-tools/api';

export interface SectionProps {
  channel: Channel;
  isFocused: boolean;
  selectedRow: number;
  editMode: boolean;
  onEditModeStart: () => void;
  onEditModeEnd: () => void;
  addEvent: (text: string) => void;
}
