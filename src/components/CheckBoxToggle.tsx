import React, { useState } from 'react';

export type CheckBoxToggleProps = {
  onToggle: (enabled: boolean) => void;
  initialCheckedState: boolean;
  label?: string;
};

export function CheckBoxToggle({
  onToggle,
  initialCheckedState,
  label
}: CheckBoxToggleProps): JSX.Element {
  const [value, setValue] = useState<boolean>(initialCheckedState);
  const handleChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    setValue(ev.target.checked);
    onToggle(ev.target.checked);
  };
  return (
    <div>
      <input
        id={'auto-refresh'}
        type={'checkbox'}
        checked={value}
        onChange={handleChange}
      />
      {label && <label htmlFor={'auto-refresh'}>{label}</label>}
    </div>
  );
}
