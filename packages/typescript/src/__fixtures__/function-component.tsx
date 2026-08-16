type Props = {
  /** Text shown inside the button. */
  label: string;
  /** Prevents interaction. */
  disabled?: boolean;
};

/** Renders a button. */
export function Button({ label, disabled = false }: Props) {
  return <button disabled={disabled}>{label}</button>;
}
